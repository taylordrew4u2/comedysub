import { sql } from '@vercel/postgres';

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
  instagram: string | null;
  availability: string;
  video_url: string | null;
  headshot_url: string | null;
  source: 'web';
  status: SubmissionStatus;
  admin_notes: string | null;
  submitted_at: string;
}

export async function ensureTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id            SERIAL PRIMARY KEY,
      name          TEXT        NOT NULL,
      email         TEXT,
      instagram     TEXT,
      availability  TEXT        NOT NULL DEFAULT '',
      video_url     TEXT,
      headshot_url  TEXT,
      source        TEXT        NOT NULL DEFAULT 'web',
      status        TEXT        NOT NULL DEFAULT 'new',
      admin_notes   TEXT,
      submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS email TEXT`;
  await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS headshot_url TEXT`;
}

export async function insertSubmission(data: {
  name: string;
  email: string | null;
  instagram: string | null;
  availability: string;
  video_url: string | null;
  headshot_url: string | null;
  source: 'web';
}): Promise<{ id: number }> {
  await ensureTable();
  const { rows } = await sql`
    INSERT INTO submissions
      (name, email, instagram, availability, video_url, headshot_url, source)
    VALUES
      (${data.name}, ${data.email}, ${data.instagram},
       ${data.availability}, ${data.video_url}, ${data.headshot_url}, ${data.source})
    RETURNING id
  `;
  return rows[0] as { id: number };
}

export async function getSubmissions(
  search?: string,
  statusFilter?: string,
): Promise<Submission[]> {
  await ensureTable();

  const hasSearch = !!(search && search.trim());
  const hasStatus = !!(statusFilter && statusFilter !== 'all');

  if (hasSearch && hasStatus) {
    const q = `%${search!.trim()}%`;
    const { rows } = await sql`
      SELECT * FROM submissions
      WHERE status = ${statusFilter}
        AND (name ILIKE ${q} OR email ILIKE ${q} OR instagram ILIKE ${q})
      ORDER BY submitted_at DESC
    `;
    return rows as unknown as Submission[];
  }

  if (hasStatus) {
    const { rows } = await sql`
      SELECT * FROM submissions WHERE status = ${statusFilter} ORDER BY submitted_at DESC
    `;
    return rows as unknown as Submission[];
  }

  if (hasSearch) {
    const q = `%${search!.trim()}%`;
    const { rows } = await sql`
      SELECT * FROM submissions
      WHERE name ILIKE ${q} OR email ILIKE ${q} OR instagram ILIKE ${q}
      ORDER BY submitted_at DESC
    `;
    return rows as unknown as Submission[];
  }

  const { rows } = await sql`SELECT * FROM submissions ORDER BY submitted_at DESC`;
  return rows as unknown as Submission[];
}

export async function updateSubmission(
  id: number,
  status: string,
  admin_notes: string,
): Promise<void> {
  await sql`
    UPDATE submissions SET status = ${status}, admin_notes = ${admin_notes} WHERE id = ${id}
  `;
}
