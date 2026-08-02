'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { del, put } from '@vercel/blob';
import {
  deleteSubmission,
  deleteTemplate,
  getSubmission,
  insertSubmission,
  insertTemplate,
  isSubmissionStatus,
  setAgreement,
  setBookedDates,
  setNotes,
  setStatus,
  updateTemplate,
  type SubmissionStatus,
} from './lib/db';
import { normalizeInstagram, toHttpUrl } from './lib/normalize';

// ── Public Submission ──────────────────────────────────────────────────────────

export interface SubmitState {
  error?: string;
  success?: boolean;
  refId?: number;
}

export async function submitWebForm(
  prevState: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim() || null;
  const rawVideo = (formData.get('video_url') as string)?.trim() || null;
  // Keep the raw text when it isn't a link, so nothing the comedian typed is lost.
  const video_url = toHttpUrl(rawVideo) ?? rawVideo;
  const instagram = normalizeInstagram(formData.get('instagram') as string);
  const location = (formData.get('location') as string)?.trim().slice(0, 100) || null;
  const headshotFile = formData.get('headshot') as File | null;
  const availability = formData.getAll('availability').join(', ') || '';
  const questions = (formData.get('questions') as string)?.trim().slice(0, 1000) || null;

  const tattooAnswer = formData.get('has_tattoos');
  const has_tattoos =
    tattooAnswer === 'yes' ? true : tattooAnswer === 'no' ? false : null;

  // Only asked when more than one date is offered, so only required then.
  const dateCount = formData.getAll('availability').length;
  const multiShowAnswer = formData.get('multiple_shows');
  const multiple_shows =
    multiShowAnswer === 'yes' ? true : multiShowAnswer === 'no' ? false : null;

  /*
   * Everything except `questions` is required. The `required` attributes on the
   * form are a convenience — they're trivially bypassed — so the real check
   * lives here. The headshot is validated on the file being attached rather
   * than on the upload succeeding, so the form still works when blob storage
   * isn't configured.
   */
  const missing: string[] = [];
  if (!name) missing.push('your name');
  if (!email) missing.push('your email');
  if (!video_url) missing.push('a video link');
  if (!instagram) missing.push('your Instagram');
  if (!location) missing.push('where you’re located');
  if (!availability) missing.push('at least one available date');
  if (has_tattoos === null) missing.push('the tattoo question');
  if (dateCount > 1 && multiple_shows === null) missing.push('whether you want multiple shows');
  if (!headshotFile || headshotFile.size === 0) missing.push('a headshot');

  if (missing.length) {
    return {
      error: `Please add ${
        missing.length === 1
          ? missing[0]
          : `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}`
      }.`,
    };
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'That email address doesn’t look right — please check it.' };
  }

  let headshot_url: string | null = null;
  if (headshotFile && headshotFile.size > 0 && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const ext = headshotFile.name.split('.').pop() ?? 'jpg';
      const blob = await put(
        `headshots/${Date.now()}-${name.replace(/\s+/g, '-')}.${ext}`,
        headshotFile,
        { access: 'public' },
      );
      headshot_url = blob.url;
    } catch (err) {
      console.error('Headshot upload failed:', err);
    }
  }

  try {
    const { id } = await insertSubmission({
      name,
      email,
      instagram,
      location,
      availability,
      video_url,
      headshot_url,
      has_tattoos,
      multiple_shows,
      questions,
      source: 'web',
    });
    return { success: true, refId: id };
  } catch (err) {
    console.error('DB error:', err);
    return { error: 'Failed to save your submission. Please try again later.' };
  }
}

export async function recordAgreement(refId: number, agreed: boolean): Promise<void> {
  if (!Number.isInteger(refId) || typeof agreed !== 'boolean') return;
  try {
    await setAgreement(refId, agreed);
  } catch (err) {
    console.error('Agreement update failed:', err);
  }
}

// ── Admin Auth ─────────────────────────────────────────────────────────────────

export interface LoginState {
  error?: string;
}

export async function adminLogin(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get('password') as string;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return { error: 'ADMIN_PASSWORD environment variable is not configured.' };
  }
  if (password !== adminPassword) {
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

// ── Admin Status ───────────────────────────────────────────────────────────────

export interface StatusState {
  error?: string;
  /** What the server stored, so the caller can settle on it. */
  status?: SubmissionStatus;
}

/**
 * Moving someone along the pipeline is a single choice, so it saves on the spot
 * rather than behind a Save button — same direct-call shape as the night chips.
 */
export async function setStatusAction(id: number, status: unknown): Promise<StatusState> {
  if (!(await isAdmin())) {
    return { error: 'Unauthorized' };
  }
  if (!Number.isInteger(id) || !isSubmissionStatus(status)) {
    return { error: 'Missing submission id or status.' };
  }

  try {
    const saved = await setStatus(id, status);
    if (!saved) return { error: 'That submission no longer exists.' };
    revalidatePath('/admin');
    revalidatePath('/admin/lineup');
    return { status };
  } catch (err) {
    console.error('Status update failed:', err);
    return { error: 'Failed to save the status.' };
  }
}

// ── Admin Notes ────────────────────────────────────────────────────────────────

export interface UpdateState {
  error?: string;
  success?: boolean;
}

export async function saveNotesAction(
  prevState: UpdateState,
  formData: FormData,
): Promise<UpdateState> {
  if (!(await isAdmin())) {
    return { error: 'Unauthorized' };
  }

  const id = parseInt(formData.get('id') as string, 10);
  const admin_notes = (formData.get('admin_notes') as string) ?? '';

  if (!Number.isInteger(id)) {
    return { error: 'Missing submission id.' };
  }

  try {
    const saved = await setNotes(id, admin_notes);
    if (!saved) return { error: 'That submission no longer exists.' };
    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    console.error('Notes update failed:', err);
    return { error: 'Failed to save the notes.' };
  }
}

// ── Admin Booked Nights ────────────────────────────────────────────────────────

export interface BookedDatesState {
  error?: string;
  /** What was actually stored, so the caller can settle on the server's answer
   *  rather than on what it optimistically drew. */
  dates?: string[];
}

/**
 * Sets which of a booked comedian's available nights they're on.
 *
 * Called straight from the client rather than through a form: the dates are
 * chips you toggle, and a whole form round-trip per tap would be heavier than
 * the change it saves. The list is re-derived from the stored availability, so
 * nobody ends up booked on a night they never offered.
 */
export async function setBookedDatesAction(
  id: number,
  dates: unknown,
): Promise<BookedDatesState> {
  if (!(await isAdmin())) {
    return { error: 'Unauthorized' };
  }
  if (!Number.isInteger(id) || !Array.isArray(dates)) {
    return { error: 'Missing submission id or dates.' };
  }

  try {
    const sub = await getSubmission(id);
    if (!sub) return { error: 'That submission no longer exists.' };
    if (sub.status !== 'booked') {
      return { error: 'Mark them booked before picking their nights.' };
    }

    const wanted = new Set(dates.filter((d): d is string => typeof d === 'string'));
    // Availability order is the order the form offered the nights in, so
    // rebuilding from it both filters and sorts in one pass.
    const kept = sub.availability
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d && wanted.has(d));

    await setBookedDates(id, kept.join(', '));
    revalidatePath('/admin');
    revalidatePath('/admin/lineup');
    return { dates: kept };
  } catch (err) {
    console.error('Booked dates update failed:', err);
    return { error: 'Failed to save their nights.' };
  }
}

// ── Admin Delete Submission ────────────────────────────────────────────────────

export interface DeleteState {
  error?: string;
  success?: boolean;
}

export async function deleteSubmissionAction(
  prevState: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_auth')?.value !== 'true') {
    return { error: 'Unauthorized' };
  }

  const id = parseInt(formData.get('id') as string, 10);
  if (!Number.isInteger(id)) {
    return { error: 'Missing submission id.' };
  }

  try {
    const removed = await deleteSubmission(id);
    if (!removed) {
      return { error: 'That submission no longer exists.' };
    }

    // Drop the headshot too, or it lingers in blob storage with no row pointing
    // at it. Non-fatal: the submission is already gone either way.
    if (removed.headshot_url && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(removed.headshot_url);
      } catch (err) {
        console.error('Headshot cleanup failed:', err);
      }
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    console.error('Delete error:', err);
    return { error: 'Failed to delete submission.' };
  }
}

// ── Admin Email Templates ──────────────────────────────────────────────────────

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === 'true';
}

export interface TemplateState {
  error?: string;
  success?: boolean;
  /** Set when a brand-new template was created, so the editor can keep
   *  editing that row instead of creating a second one on the next save. */
  savedId?: number;
}

export async function saveTemplateAction(
  prevState: TemplateState,
  formData: FormData,
): Promise<TemplateState> {
  if (!(await isAdmin())) {
    return { error: 'Unauthorized' };
  }

  const rawId = (formData.get('id') as string)?.trim();
  const id = rawId ? parseInt(rawId, 10) : null;
  const name = (formData.get('name') as string)?.trim().slice(0, 80) ?? '';
  const subject = (formData.get('subject') as string)?.trim().slice(0, 200) ?? '';
  const body = (formData.get('body') as string)?.slice(0, 10000) ?? '';

  if (!name) return { error: 'Give the template a name so you can find it later.' };
  if (!subject) return { error: 'Add a subject line.' };
  if (!body.trim()) return { error: 'The email is empty — write something to send.' };
  if (rawId && !Number.isInteger(id)) return { error: 'That template no longer exists.' };

  try {
    if (id) {
      const updated = await updateTemplate(id, { name, subject, body });
      if (!updated) return { error: 'That template no longer exists.' };
      revalidatePath('/admin/templates');
      return { success: true, savedId: id };
    }

    const { id: newId } = await insertTemplate({ name, subject, body });
    revalidatePath('/admin/templates');
    return { success: true, savedId: newId };
  } catch (err) {
    console.error('Template save error:', err);
    return { error: 'Failed to save the template. Please try again.' };
  }
}

export async function deleteTemplateAction(
  prevState: TemplateState,
  formData: FormData,
): Promise<TemplateState> {
  if (!(await isAdmin())) {
    return { error: 'Unauthorized' };
  }

  const id = parseInt(formData.get('id') as string, 10);
  if (!Number.isInteger(id)) {
    return { error: 'Missing template id.' };
  }

  try {
    const removed = await deleteTemplate(id);
    if (!removed) return { error: 'That template no longer exists.' };
    revalidatePath('/admin/templates');
    return { success: true };
  } catch (err) {
    console.error('Template delete error:', err);
    return { error: 'Failed to delete the template.' };
  }
}
