import { sql } from '@vercel/postgres';

/** Pipeline order — the dashboard groups by it, the server validates against it. */
export const SUBMISSION_STATUSES = [
  'new',
  'reviewed',
  'contacted',
  'booked',
  'declined',
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export function isSubmissionStatus(value: unknown): value is SubmissionStatus {
  return SUBMISSION_STATUSES.includes(value as SubmissionStatus);
}

export interface Submission {
  id: number;
  name: string;
  email: string | null;
  instagram: string | null;
  location: string | null;
  availability: string;
  /** The nights they're actually on, picked by the admin once they're booked.
   *  Always a subset of `availability`, in the same comma-separated format. */
  booked_dates: string | null;
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
      booked_dates  TEXT,
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
  await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS booked_dates TEXT`;
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

export async function getSubmission(id: number): Promise<Submission | null> {
  await ensureTable();
  const { rows } = await sql`SELECT * FROM submissions WHERE id = ${id}`;
  return (rows[0] as unknown as Submission) ?? null;
}

/** Writes the nights an already-booked comedian is on. Validated by the caller
 *  against their availability, so this stores whatever it is given. */
export async function setBookedDates(id: number, dates: string): Promise<void> {
  await sql`UPDATE submissions SET booked_dates = ${dates} WHERE id = ${id}`;
}

/* Status and notes save separately: the status is a one-tap pill, the notes are
 * a deliberate write. Both report whether the row was still there. */

export async function setStatus(id: number, status: SubmissionStatus): Promise<boolean> {
  const { rowCount } = await sql`UPDATE submissions SET status = ${status} WHERE id = ${id}`;
  return (rowCount ?? 0) > 0;
}

export async function setNotes(id: number, admin_notes: string): Promise<boolean> {
  const { rowCount } = await sql`
    UPDATE submissions SET admin_notes = ${admin_notes} WHERE id = ${id}
  `;
  return (rowCount ?? 0) > 0;
}

/** Returns the deleted row so the caller can clean up its headshot blob. */
export async function deleteSubmission(id: number): Promise<Submission | null> {
  const { rows } = await sql`DELETE FROM submissions WHERE id = ${id} RETURNING *`;
  return (rows[0] as unknown as Submission) ?? null;
}

// ── Show settings ──────────────────────────────────────────────────────────────

/** Same first-use pattern as everything else — no migration step. */
async function ensureSettingsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS show_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;
}

const CLOSED_NIGHTS_KEY = 'closed_nights';

/**
 * The nights that are shut to new applicants, comma-separated.
 *
 * Stored as *closed* rather than open so an empty table means "everything is
 * open" — the behaviour before this existed, and no seeding to get there.
 */
export async function getClosedNights(): Promise<string[]> {
  await ensureSettingsTable();
  const { rows } = await sql`SELECT value FROM show_settings WHERE key = ${CLOSED_NIGHTS_KEY}`;
  const value = (rows[0] as { value?: string } | undefined)?.value ?? '';
  return value
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
}

export async function setClosedNights(nights: string[]): Promise<void> {
  await ensureSettingsTable();
  await sql`
    INSERT INTO show_settings (key, value)
    VALUES (${CLOSED_NIGHTS_KEY}, ${nights.join(', ')})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
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
