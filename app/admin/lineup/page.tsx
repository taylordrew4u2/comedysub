import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSubmissions, type Submission } from '../../lib/db';
import LineupDocument from './LineupDocument';

export const metadata: Metadata = {
  title: 'Pins & Needles — Booked Lineup',
};

/*
 * A print-first page: everything marked "booked", laid out for paper so the
 * browser's own Save-as-PDF produces the export.
 */
export default async function LineupPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_auth')?.value !== 'true') {
    redirect('/admin');
  }

  let booked: Submission[] = [];
  let dbError = false;
  try {
    const all = await getSubmissions();
    booked = all.filter((s) => s.status === 'booked');
  } catch (err) {
    console.error('Failed to load submissions:', err);
    dbError = true;
  }

  const printedOn = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return <LineupDocument booked={booked} printedOn={printedOn} dbError={dbError} />;
}
