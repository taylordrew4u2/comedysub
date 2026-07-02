'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';
import { insertSubmission, updateSubmission } from './lib/db';

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
  const video_url = (formData.get('video_url') as string)?.trim() || null;
  const instagram = (formData.get('instagram') as string)?.trim() || null;
  const location = (formData.get('location') as string)?.trim().slice(0, 100) || null;
  const headshotFile = formData.get('headshot') as File | null;
  const availability = formData.getAll('availability').join(', ') || '';

  if (!name || !video_url) {
    return { error: 'Please fill in your name and video link.' };
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
      source: 'web',
    });
    return { success: true, refId: id };
  } catch (err) {
    console.error('DB error:', err);
    return { error: 'Failed to save your submission. Please try again later.' };
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

// ── Admin Update Submission ────────────────────────────────────────────────────

export interface UpdateState {
  error?: string;
  success?: boolean;
}

export async function updateSubmissionAction(
  prevState: UpdateState,
  formData: FormData,
): Promise<UpdateState> {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_auth')?.value !== 'true') {
    return { error: 'Unauthorized' };
  }

  const id = parseInt(formData.get('id') as string, 10);
  const status = formData.get('status') as string;
  const admin_notes = (formData.get('admin_notes') as string) ?? '';

  if (!id || !status) {
    return { error: 'Missing required fields.' };
  }

  try {
    await updateSubmission(id, status, admin_notes);
    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    console.error('Update error:', err);
    return { error: 'Failed to update submission.' };
  }
}
