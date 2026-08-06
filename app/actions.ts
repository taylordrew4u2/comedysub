'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  deleteBooking,
  deleteService,
  deleteTeamMember,
  getServices,
  insertBooking,
  insertService,
  insertTeamMember,
  isBookingStatus,
  setBookingNotes,
  setBookingStatus,
  setContent,
  updateService,
  updateTeamMember,
  type BookingStatus,
} from './lib/db';
import { getContent } from './lib/db';
import { CONTENT_FIELDS, isContentKey, toLines } from './lib/content';

// ── Admin auth ─────────────────────────────────────────────────────────────────

/**
 * The dashboard password. `ADMIN_PASSWORD` wins when it is set, so the
 * deployed site can be given a different one without touching the code.
 */
function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'bigdog5';
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === 'true';
}

export interface LoginState {
  error?: string;
}

export async function adminLogin(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = (formData.get('password') as string) ?? '';

  if (password !== adminPassword()) {
    return { error: 'Incorrect password.' };
  }

  const cookieStore = await cookies();
  cookieStore.set('admin_auth', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  redirect('/admin');
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_auth');
  redirect('/admin');
}

/** Every write below starts here — Server Actions are reachable directly. */
async function requireAdmin(): Promise<boolean> {
  return isAdmin();
}

/** The public site reads content, services and team, so it changes with them. */
function revalidateSite(): void {
  revalidatePath('/');
  revalidatePath('/book');
  revalidatePath('/admin');
}

// ── Public booking request ─────────────────────────────────────────────────────

export interface BookingState {
  error?: string;
  success?: boolean;
  refId?: number;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function requestBooking(
  prevState: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const content = await getContent();
  if (content.bookings_open !== 'true') {
    return { error: 'We are not taking bookings at the moment.' };
  }

  const name = ((formData.get('name') as string) ?? '').trim().slice(0, 120);
  const email = ((formData.get('email') as string) ?? '').trim().slice(0, 200);
  const phone = ((formData.get('phone') as string) ?? '').trim().slice(0, 40) || null;
  const preferred_date = ((formData.get('preferred_date') as string) ?? '').trim();
  const notes = ((formData.get('notes') as string) ?? '').trim().slice(0, 1000) || null;

  /*
   * The treatment and the time are re-derived from what the site currently
   * offers rather than trusted: a page left open across an edit should not be
   * able to store a treatment that no longer exists, or a time never offered.
   */
  const wantedService = ((formData.get('service') as string) ?? '').trim();
  const services = await getServices();
  const service =
    services.find((s) => s.is_active && s.name === wantedService)?.name ?? '';

  const wantedTime = ((formData.get('preferred_time') as string) ?? '').trim();
  const slots = toLines(content.booking_slots);
  const preferred_time = slots.find((slot) => slot === wantedTime) ?? '';

  // Named one by one so the form can say what is actually missing.
  const missing: string[] = [];
  if (!name) missing.push('your name');
  if (!email) missing.push('your email');
  if (!service) missing.push('a treatment');
  if (!preferred_date) missing.push('a date');
  if (!preferred_time) missing.push('a time');

  if (missing.length) {
    return {
      error: `Please add ${
        missing.length === 1
          ? missing[0]
          : `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}`
      }.`,
    };
  }

  if (!EMAIL.test(email)) {
    return { error: 'That email address doesn’t look right — please check it.' };
  }
  if (!ISO_DATE.test(preferred_date)) {
    return { error: 'Please pick a date from the calendar.' };
  }

  // Compared as dates, not times: a request for later today is still valid.
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`;
  if (preferred_date < todayIso) {
    return { error: 'That date has already passed — please pick another.' };
  }

  try {
    const id = await insertBooking({
      name,
      email,
      phone,
      service,
      preferred_date,
      preferred_time,
      notes,
    });
    revalidatePath('/admin');
    return { success: true, refId: id };
  } catch (err) {
    console.error('Booking insert failed:', err);
    return { error: 'We couldn’t save your request. Please try again, or call us.' };
  }
}

// ── Admin: bookings ────────────────────────────────────────────────────────────

export interface BookingUpdateState {
  error?: string;
  /** What the server stored, so the caller can settle on it. */
  status?: BookingStatus;
}

/**
 * Accept, decline, or close off a request.
 *
 * Called straight from the client rather than through a form: it is one tap on
 * one row, and a full form round-trip would be heavier than the change it saves.
 */
export async function setBookingStatusAction(
  id: number,
  status: unknown,
): Promise<BookingUpdateState> {
  if (!(await requireAdmin())) return { error: 'Unauthorized' };
  if (!Number.isInteger(id) || !isBookingStatus(status)) {
    return { error: 'Missing booking id or status.' };
  }

  try {
    const saved = await setBookingStatus(id, status);
    if (!saved) return { error: 'That booking no longer exists.' };
    revalidatePath('/admin');
    return { status };
  } catch (err) {
    console.error('Booking status update failed:', err);
    return { error: 'Failed to save. Please try again.' };
  }
}

export interface SaveState {
  error?: string;
  success?: boolean;
  /** Set when a brand-new row was created, so the editor keeps editing that
   *  row instead of creating a second one on the next save. */
  savedId?: number;
}

export async function saveBookingNotesAction(
  prevState: SaveState,
  formData: FormData,
): Promise<SaveState> {
  if (!(await requireAdmin())) return { error: 'Unauthorized' };

  const id = parseInt((formData.get('id') as string) ?? '', 10);
  const notes = ((formData.get('admin_notes') as string) ?? '').slice(0, 2000);
  if (!Number.isInteger(id)) return { error: 'Missing booking id.' };

  try {
    const saved = await setBookingNotes(id, notes);
    if (!saved) return { error: 'That booking no longer exists.' };
    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    console.error('Booking notes save failed:', err);
    return { error: 'Failed to save the note.' };
  }
}

export async function deleteBookingAction(id: number): Promise<SaveState> {
  if (!(await requireAdmin())) return { error: 'Unauthorized' };
  if (!Number.isInteger(id)) return { error: 'Missing booking id.' };

  try {
    const removed = await deleteBooking(id);
    if (!removed) return { error: 'That booking no longer exists.' };
    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    console.error('Booking delete failed:', err);
    return { error: 'Failed to delete the booking.' };
  }
}

// ── Admin: site content ────────────────────────────────────────────────────────

export async function saveContentAction(
  prevState: SaveState,
  formData: FormData,
): Promise<SaveState> {
  if (!(await requireAdmin())) return { error: 'Unauthorized' };

  /*
   * Rebuilt from the known field list rather than from whatever was posted, so
   * an extra field in the request body can't write a key the site never reads.
   * Toggles post nothing when off, hence the explicit false.
   */
  const updates: Record<string, string> = {};
  for (const field of CONTENT_FIELDS) {
    if (field.type === 'toggle') {
      updates[field.key] = formData.get(field.key) === 'true' ? 'true' : 'false';
      continue;
    }
    const raw = formData.get(field.key);
    if (typeof raw !== 'string') continue;
    if (!isContentKey(field.key)) continue;
    updates[field.key] = raw.replace(/\r\n/g, '\n').slice(0, 5000);
  }

  try {
    await setContent(updates);
    revalidateSite();
    return { success: true };
  } catch (err) {
    console.error('Content save failed:', err);
    return { error: 'Failed to save your changes. Please try again.' };
  }
}

// ── Admin: treatments ──────────────────────────────────────────────────────────

function readOrder(formData: FormData): number {
  const order = parseInt((formData.get('sort_order') as string) ?? '', 10);
  return Number.isFinite(order) ? order : 0;
}

export async function saveServiceAction(
  prevState: SaveState,
  formData: FormData,
): Promise<SaveState> {
  if (!(await requireAdmin())) return { error: 'Unauthorized' };

  const rawId = ((formData.get('id') as string) ?? '').trim();
  const id = rawId ? parseInt(rawId, 10) : null;
  if (rawId && !Number.isInteger(id)) return { error: 'That treatment no longer exists.' };

  const data = {
    name: ((formData.get('name') as string) ?? '').trim().slice(0, 120),
    description: ((formData.get('description') as string) ?? '').trim().slice(0, 1000),
    duration: ((formData.get('duration') as string) ?? '').trim().slice(0, 60),
    sort_order: readOrder(formData),
    is_active: formData.get('is_active') === 'true',
  };

  if (!data.name) return { error: 'Give the treatment a name.' };

  try {
    if (id) {
      const updated = await updateService(id, data);
      if (!updated) return { error: 'That treatment no longer exists.' };
      revalidateSite();
      return { success: true, savedId: id };
    }
    const newId = await insertService(data);
    revalidateSite();
    return { success: true, savedId: newId };
  } catch (err) {
    console.error('Service save failed:', err);
    return { error: 'Failed to save the treatment.' };
  }
}

export async function deleteServiceAction(id: number): Promise<SaveState> {
  if (!(await requireAdmin())) return { error: 'Unauthorized' };
  if (!Number.isInteger(id)) return { error: 'Missing treatment id.' };

  try {
    const removed = await deleteService(id);
    if (!removed) return { error: 'That treatment no longer exists.' };
    revalidateSite();
    return { success: true };
  } catch (err) {
    console.error('Service delete failed:', err);
    return { error: 'Failed to delete the treatment.' };
  }
}

// ── Admin: team ────────────────────────────────────────────────────────────────

export async function saveTeamMemberAction(
  prevState: SaveState,
  formData: FormData,
): Promise<SaveState> {
  if (!(await requireAdmin())) return { error: 'Unauthorized' };

  const rawId = ((formData.get('id') as string) ?? '').trim();
  const id = rawId ? parseInt(rawId, 10) : null;
  if (rawId && !Number.isInteger(id)) return { error: 'That person is no longer listed.' };

  const data = {
    name: ((formData.get('name') as string) ?? '').trim().slice(0, 120),
    role: ((formData.get('role') as string) ?? '').trim().slice(0, 120),
    bio: ((formData.get('bio') as string) ?? '').trim().slice(0, 1000),
    photo_url: ((formData.get('photo_url') as string) ?? '').trim().slice(0, 500),
    sort_order: readOrder(formData),
    is_active: formData.get('is_active') === 'true',
  };

  if (!data.name) return { error: 'Give this person a name.' };

  try {
    if (id) {
      const updated = await updateTeamMember(id, data);
      if (!updated) return { error: 'That person is no longer listed.' };
      revalidateSite();
      return { success: true, savedId: id };
    }
    const newId = await insertTeamMember(data);
    revalidateSite();
    return { success: true, savedId: newId };
  } catch (err) {
    console.error('Team save failed:', err);
    return { error: 'Failed to save.' };
  }
}

export async function deleteTeamMemberAction(id: number): Promise<SaveState> {
  if (!(await requireAdmin())) return { error: 'Unauthorized' };
  if (!Number.isInteger(id)) return { error: 'Missing id.' };

  try {
    const removed = await deleteTeamMember(id);
    if (!removed) return { error: 'That person is no longer listed.' };
    revalidateSite();
    return { success: true };
  } catch (err) {
    console.error('Team delete failed:', err);
    return { error: 'Failed to remove them.' };
  }
}
