import { getPrisma } from './prisma';

export type SubmissionStatus =
  | 'new'
  | 'reviewed'
  | 'contacted'
  | 'booked'
  | 'declined';

export interface Submission {
  id: number;
  name: string;
  email: string | null;
  location: string;
  bio: string;
  instagram: string | null;
  has_tattoos: boolean;
  availability: string;
  experience: string;
  video_url: string | null;
  headshot_url: string | null;
  source: 'web';
  status: SubmissionStatus;
  admin_notes: string | null;
  submitted_at: string;
}

export async function insertSubmission(data: {
  name: string;
  email: string | null;
  location: string;
  bio: string;
  instagram: string | null;
  has_tattoos: boolean;
  availability: string;
  experience: string;
  video_url: string | null;
  headshot_url: string | null;
  source: 'web';
}): Promise<{ id: number }> {
  const row = await getPrisma().submission.create({ data });
  return { id: row.id };
}

export async function getSubmissions(
  search?: string,
  statusFilter?: string,
): Promise<Submission[]> {
  const where: Record<string, unknown> = {};

  if (statusFilter && statusFilter !== 'all') {
    where.status = statusFilter;
  }

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { instagram: { contains: q, mode: 'insensitive' } },
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = await getPrisma().submission.findMany({
    where,
    orderBy: { submitted_at: 'desc' },
  });

  return rows.map((r) => ({
    ...r,
    source: 'web' as const,
    status: r.status as SubmissionStatus,
    submitted_at: r.submitted_at instanceof Date
      ? r.submitted_at.toISOString()
      : String(r.submitted_at),
  }));
}

export async function updateSubmission(
  id: number,
  status: string,
  admin_notes: string,
): Promise<void> {
  await getPrisma().submission.update({
    where: { id },
    data: { status, admin_notes },
  });
}
