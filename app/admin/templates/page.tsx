import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getSubmissions,
  getTemplates,
  type EmailTemplate,
  type Submission,
} from '../../lib/db';
import TemplateManager from './TemplateManager';

export const metadata: Metadata = {
  title: 'Pins & Needles — Email templates',
};

/*
 * Where the standard emails live — the booking yes, the no, the chase-up.
 * Submissions come along too so a template can be previewed against a real
 * comedian and handed to the mail app already filled in.
 */
export default async function TemplatesPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_auth')?.value !== 'true') {
    redirect('/admin');
  }

  let templates: EmailTemplate[] = [];
  let submissions: Submission[] = [];
  let dbError = false;

  try {
    templates = await getTemplates();
    submissions = await getSubmissions();
  } catch (err) {
    console.error('Failed to load email templates:', err);
    dbError = true;
  }

  return (
    <TemplateManager templates={templates} submissions={submissions} dbError={dbError} />
  );
}
