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
  location: string | null;
  availability: string;
  video_url: string | null;
  headshot_url: string | null;
  source: 'web';
  status: SubmissionStatus;
  admin_notes: string | null;
  agreed_bring_two: boolean | null;
  has_tattoos: boolean | null;
  multiple_shows: boolean | null;
  questions: string | null;
  submitted_at: string;
}

/** A reusable email the admin writes once and sends to many comedians. */
export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  updated_at: string;
}

/** Creates the table on first use, and back-fills columns added since. */
async function ensureTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id            SERIAL PRIMARY KEY,
      name          TEXT        NOT NULL,
      email         TEXT,
      instagram     TEXT,
      location      TEXT,
      availability  TEXT        NOT NULL DEFAULT '',
      video_url     TEXT,
      headshot_url  TEXT,
      source        TEXT        NOT NULL DEFAULT 'web',
      status        TEXT        NOT NULL DEFAULT 'new',
      admin_notes   TEXT,
      agreed_bring_two BOOLEAN,
      has_tattoos   BOOLEAN,
      multiple_shows BOOLEAN,
      questions     TEXT,
      submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS email TEXT`;
  await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS headshot_url TEXT`;
  await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS location TEXT`;
  await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS agreed_bring_two BOOLEAN`;
  await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS has_tattoos BOOLEAN`;
  await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS questions TEXT`;
  await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS multiple_shows BOOLEAN`;
}

export async function insertSubmission(data: {
  name: string;
  email: string | null;
  instagram: string | null;
  location: string | null;
  availability: string;
  video_url: string | null;
  headshot_url: string | null;
  has_tattoos: boolean | null;
  multiple_shows: boolean | null;
  questions: string | null;
  source: 'web';
}): Promise<{ id: number }> {
  await ensureTable();
  const { rows } = await sql`
    INSERT INTO submissions
      (name, email, instagram, location, availability, video_url, headshot_url,
       has_tattoos, multiple_shows, questions, source)
    VALUES
      (${data.name}, ${data.email}, ${data.instagram}, ${data.location},
       ${data.availability}, ${data.video_url}, ${data.headshot_url},
       ${data.has_tattoos}, ${data.multiple_shows}, ${data.questions}, ${data.source})
    RETURNING id
  `;
  return rows[0] as { id: number };
}

/**
 * Every submission, newest first. Search and status filtering happen in the
 * dashboard against this list — see TODO.md if that ever needs to move into
 * SQL alongside server-side pagination.
 */
export async function getSubmissions(): Promise<Submission[]> {
  await ensureTable();
  const { rows } = await sql`SELECT * FROM submissions ORDER BY submitted_at DESC`;
  return rows as unknown as Submission[];
}

export async function setAgreement(id: number, agreed: boolean): Promise<void> {
  await sql`
    UPDATE submissions SET agreed_bring_two = ${agreed}
    WHERE id = ${id} AND agreed_bring_two IS NULL
  `;
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

/** Returns the deleted row so the caller can clean up its headshot blob. */
export async function deleteSubmission(id: number): Promise<Submission | null> {
  const { rows } = await sql`DELETE FROM submissions WHERE id = ${id} RETURNING *`;
  return (rows[0] as unknown as Submission) ?? null;
}

// ── Email templates ────────────────────────────────────────────────────────────

/** Same first-use pattern as the submissions table — no migration step. */
async function ensureTemplateTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS email_templates (
      id          SERIAL PRIMARY KEY,
      name        TEXT        NOT NULL,
      subject     TEXT        NOT NULL DEFAULT '',
      body        TEXT        NOT NULL DEFAULT '',
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function getTemplates(): Promise<EmailTemplate[]> {
  await ensureTemplateTable();
  const { rows } = await sql`SELECT * FROM email_templates ORDER BY name ASC`;
  return rows as unknown as EmailTemplate[];
}

export async function insertTemplate(data: {
  name: string;
  subject: string;
  body: string;
}): Promise<{ id: number }> {
  await ensureTemplateTable();
  const { rows } = await sql`
    INSERT INTO email_templates (name, subject, body)
    VALUES (${data.name}, ${data.subject}, ${data.body})
    RETURNING id
  `;
  return rows[0] as { id: number };
}

/** False when the row has since been deleted, so the caller can say so. */
export async function updateTemplate(
  id: number,
  data: { name: string; subject: string; body: string },
): Promise<boolean> {
  await ensureTemplateTable();
  const { rowCount } = await sql`
    UPDATE email_templates
    SET name = ${data.name}, subject = ${data.subject}, body = ${data.body},
        updated_at = NOW()
    WHERE id = ${id}
  `;
  return (rowCount ?? 0) > 0;
}

export async function deleteTemplate(id: number): Promise<boolean> {
  await ensureTemplateTable();
  const { rowCount } = await sql`DELETE FROM email_templates WHERE id = ${id}`;
  return (rowCount ?? 0) > 0;
}
