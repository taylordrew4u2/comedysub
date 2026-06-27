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
  location: string;
  bio: string;
  instagram: string | null;
  has_tattoos: boolean;
  availability: string;
  experience: string;
  video_url: string | null;
  source: 'web';
  status: SubmissionStatus;
  admin_notes: string | null;
  submitted_at: string;
}

/**
 * Creates the submissions table if it doesn't already exist.
 * Safe to call on every request — uses IF NOT EXISTS.
 */
export async function ensureTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id            SERIAL PRIMARY KEY,
      name          TEXT        NOT NULL,
      location      TEXT        NOT NULL,
      bio           TEXT        NOT NULL,
      instagram     TEXT,
      has_tattoos   BOOLEAN     NOT NULL DEFAULT FALSE,
      availability  TEXT        NOT NULL,
      experience    TEXT        NOT NULL,
      video_url     TEXT,
      source        TEXT        NOT NULL DEFAULT 'web',
      status        TEXT        NOT NULL DEFAULT 'new',
      admin_notes   TEXT,
      submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function insertSubmission(data: {
  name: string;
  location: string;
  bio: string;
  instagram: string | null;
  has_tattoos: boolean;
  availability: string;
  experience: string;
  video_url: string | null;
  source: 'web';
}): Promise<{ id: number }> {
  await ensureTable();
  const { rows } = await sql`
    INSERT INTO submissions
      (name, location, bio, instagram, has_tattoos, availability, experience, video_url, source)
    VALUES
      (${data.name}, ${data.location}, ${data.bio}, ${data.instagram},
       ${data.has_tattoos}, ${data.availability}, ${data.experience},
       ${data.video_url}, ${data.source})
    RETURNING id
  `;
  return rows[0] as { id: number };
}

export async function getSubmissions(search?: string): Promise<Submission[]> {
  await ensureTable();
  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    const { rows } = await sql`
      SELECT * FROM submissions
      WHERE  name      ILIKE ${q}
          OR location  ILIKE ${q}
          OR status    ILIKE ${q}
          OR instagram ILIKE ${q}
      ORDER  BY submitted_at DESC
    `;
    return rows as Submission[];
  }
  const { rows } = await sql`
    SELECT * FROM submissions ORDER BY submitted_at DESC
  `;
  return rows as Submission[];
}

export async function updateSubmission(
  id: number,
  status: string,
  admin_notes: string,
): Promise<void> {
  await sql`
    UPDATE submissions
    SET    status = ${status}, admin_notes = ${admin_notes}
    WHERE  id = ${id}
  `;
}
