import { sql } from '@vercel/postgres';
import {
  DEFAULT_CONTENT,
  isContentKey,
  withDefaults,
  type SiteContent,
} from './content';

/**
 * Storage for everything the admin can change.
 *
 * On Vercel this is Postgres. With no database connected the same functions
 * fall back to an in-process copy of the seed data, so `npm run dev` and a
 * first deploy both render a complete site instead of an error page — but
 * nothing written in that mode outlives the process. `hasDatabase()` is what
 * the admin uses to warn about exactly that.
 */

export function hasDatabase(): boolean {
  return Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);
}

// ── Types ──────────────────────────────────────────────────────────────────────

/** Pipeline order — the dashboard groups by it, the server validates against it. */
export const BOOKING_STATUSES = ['pending', 'accepted', 'declined', 'completed'] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export function isBookingStatus(value: unknown): value is BookingStatus {
  return BOOKING_STATUSES.includes(value as BookingStatus);
}

export interface Booking {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  /** Copied from the treatment at request time, so renaming one later doesn't
   *  rewrite what somebody actually asked for. */
  service: string;
  preferred_date: string;
  preferred_time: string;
  notes: string | null;
  status: BookingStatus;
  admin_notes: string | null;
  created_at: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  duration: string;
  sort_order: number;
  is_active: boolean;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  photo_url: string;
  sort_order: number;
  is_active: boolean;
}

export type ServiceInput = Omit<Service, 'id'>;
export type TeamMemberInput = Omit<TeamMember, 'id'>;

// ── Seed data ──────────────────────────────────────────────────────────────────

const SEED_SERVICES: ServiceInput[] = [
  {
    name: 'Swedish Relaxation Massage',
    description:
      'Long, slow strokes over the whole body to settle the nervous system and unwind held tension.',
    duration: '60 minutes',
    sort_order: 1,
    is_active: true,
  },
  {
    name: 'Deep Tissue Massage',
    description:
      'Firmer, more focused work through the layers beneath the surface, for shoulders and backs that have been carrying too much.',
    duration: '60 minutes',
    sort_order: 2,
    is_active: true,
  },
  {
    name: 'Hot Stone Therapy',
    description:
      'Warmed basalt stones rested along the back and worked through the muscles, easing everything open with heat.',
    duration: '75 minutes',
    sort_order: 3,
    is_active: true,
  },
  {
    name: 'Aromatherapy Massage',
    description:
      'A gentle full-body treatment with an essential-oil blend chosen with you at the start of the session.',
    duration: '60 minutes',
    sort_order: 4,
    is_active: true,
  },
  {
    name: 'Head, Neck & Shoulders',
    description:
      'A shorter seated treatment for desk-bound necks and tension headaches. No need to undress.',
    duration: '30 minutes',
    sort_order: 5,
    is_active: true,
  },
  {
    name: 'Reflexology',
    description:
      'Pressure-point work through the feet, a quiet treatment that tends to leave people half-asleep.',
    duration: '45 minutes',
    sort_order: 6,
    is_active: true,
  },
];

const SEED_TEAM: TeamMemberInput[] = [
  {
    name: 'Add your therapists',
    role: 'Edit this from the admin',
    bio: 'Sign in at /admin, open the Team tab, and replace this with the people who actually work here. You can add a photo by pasting an image link.',
    photo_url: '',
    sort_order: 1,
    is_active: true,
  },
];

// ── In-memory fallback ─────────────────────────────────────────────────────────

interface MemoryStore {
  content: SiteContent;
  services: Service[];
  team: TeamMember[];
  bookings: Booking[];
  nextId: number;
}

/**
 * Hung off `globalThis` so the dev server's module reloading doesn't wipe it
 * between edits. Never reached when a database is configured.
 */
const memory: MemoryStore = ((
  globalThis as { __tlcStore?: MemoryStore }
).__tlcStore ??= {
  content: {},
  services: SEED_SERVICES.map((s, i) => ({ ...s, id: i + 1 })),
  team: SEED_TEAM.map((m, i) => ({ ...m, id: 100 + i })),
  bookings: [],
  nextId: 1000,
});

function memoryId(): number {
  return memory.nextId++;
}

// ── Schema ─────────────────────────────────────────────────────────────────────

let ready: Promise<void> | null = null;

/** Creates the tables on first use and seeds the treatment list once. */
function ensureSchema(): Promise<void> {
  ready ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS site_content (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL DEFAULT ''
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS services (
        id          SERIAL PRIMARY KEY,
        name        TEXT    NOT NULL,
        description TEXT    NOT NULL DEFAULT '',
        duration    TEXT    NOT NULL DEFAULT '',
        sort_order  INTEGER NOT NULL DEFAULT 0,
        is_active   BOOLEAN NOT NULL DEFAULT TRUE
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS team_members (
        id          SERIAL PRIMARY KEY,
        name        TEXT    NOT NULL,
        role        TEXT    NOT NULL DEFAULT '',
        bio         TEXT    NOT NULL DEFAULT '',
        photo_url   TEXT    NOT NULL DEFAULT '',
        sort_order  INTEGER NOT NULL DEFAULT 0,
        is_active   BOOLEAN NOT NULL DEFAULT TRUE
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id             SERIAL PRIMARY KEY,
        name           TEXT        NOT NULL,
        email          TEXT        NOT NULL,
        phone          TEXT,
        service        TEXT        NOT NULL DEFAULT '',
        preferred_date TEXT        NOT NULL DEFAULT '',
        preferred_time TEXT        NOT NULL DEFAULT '',
        notes          TEXT,
        status         TEXT        NOT NULL DEFAULT 'pending',
        admin_notes    TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    /*
     * Seeded once, and only into an empty table: an owner who deletes every
     * treatment means it, and should not find them back on the next deploy.
     * The marker row makes "never seeded" distinguishable from "emptied".
     */
    const { rows } = await sql`SELECT value FROM site_content WHERE key = 'seeded'`;
    if (!rows.length) {
      for (const s of SEED_SERVICES) {
        await sql`
          INSERT INTO services (name, description, duration, sort_order, is_active)
          VALUES (${s.name}, ${s.description}, ${s.duration}, ${s.sort_order}, ${s.is_active})
        `;
      }
      for (const m of SEED_TEAM) {
        await sql`
          INSERT INTO team_members (name, role, bio, photo_url, sort_order, is_active)
          VALUES (${m.name}, ${m.role}, ${m.bio}, ${m.photo_url}, ${m.sort_order}, ${m.is_active})
        `;
      }
      await sql`INSERT INTO site_content (key, value) VALUES ('seeded', 'true')
                ON CONFLICT (key) DO NOTHING`;
    }
  })().catch((err) => {
    // Don't cache a failed setup — the next request should try again.
    ready = null;
    throw err;
  });
  return ready;
}

// ── Content ────────────────────────────────────────────────────────────────────

/**
 * The full content map, defaults filled in.
 *
 * Never throws: the public site should still render its seed copy when the
 * database is unreachable, rather than showing an error to a visitor.
 */
export async function getContent(): Promise<SiteContent> {
  if (!hasDatabase()) return withDefaults(memory.content);
  try {
    await ensureSchema();
    const { rows } = await sql`SELECT key, value FROM site_content`;
    const stored: SiteContent = {};
    for (const row of rows as { key: string; value: string }[]) {
      if (isContentKey(row.key)) stored[row.key] = row.value;
    }
    return withDefaults(stored);
  } catch (err) {
    console.error('Could not read site content:', err);
    return { ...DEFAULT_CONTENT };
  }
}

export async function setContent(updates: SiteContent): Promise<void> {
  if (!hasDatabase()) {
    Object.assign(memory.content, updates);
    return;
  }
  await ensureSchema();
  for (const [key, value] of Object.entries(updates)) {
    await sql`
      INSERT INTO site_content (key, value) VALUES (${key}, ${value})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
  }
}

// ── Services ───────────────────────────────────────────────────────────────────

const byOrder = (a: { sort_order: number; id: number }, b: { sort_order: number; id: number }) =>
  a.sort_order - b.sort_order || a.id - b.id;

export async function getServices(): Promise<Service[]> {
  if (!hasDatabase()) return [...memory.services].sort(byOrder);
  try {
    await ensureSchema();
    const { rows } = await sql`SELECT * FROM services ORDER BY sort_order ASC, id ASC`;
    return rows as unknown as Service[];
  } catch (err) {
    console.error('Could not read services:', err);
    return [];
  }
}

export async function insertService(data: ServiceInput): Promise<number> {
  if (!hasDatabase()) {
    const id = memoryId();
    memory.services.push({ ...data, id });
    return id;
  }
  await ensureSchema();
  const { rows } = await sql`
    INSERT INTO services (name, description, duration, sort_order, is_active)
    VALUES (${data.name}, ${data.description}, ${data.duration},
            ${data.sort_order}, ${data.is_active})
    RETURNING id
  `;
  return (rows[0] as { id: number }).id;
}

export async function updateService(id: number, data: ServiceInput): Promise<boolean> {
  if (!hasDatabase()) {
    const found = memory.services.find((s) => s.id === id);
    if (!found) return false;
    Object.assign(found, data);
    return true;
  }
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE services
    SET name = ${data.name}, description = ${data.description}, duration = ${data.duration},
        sort_order = ${data.sort_order}, is_active = ${data.is_active}
    WHERE id = ${id}
  `;
  return (rowCount ?? 0) > 0;
}

export async function deleteService(id: number): Promise<boolean> {
  if (!hasDatabase()) {
    const before = memory.services.length;
    memory.services = memory.services.filter((s) => s.id !== id);
    return memory.services.length < before;
  }
  await ensureSchema();
  const { rowCount } = await sql`DELETE FROM services WHERE id = ${id}`;
  return (rowCount ?? 0) > 0;
}

// ── Team ───────────────────────────────────────────────────────────────────────

export async function getTeam(): Promise<TeamMember[]> {
  if (!hasDatabase()) return [...memory.team].sort(byOrder);
  try {
    await ensureSchema();
    const { rows } = await sql`SELECT * FROM team_members ORDER BY sort_order ASC, id ASC`;
    return rows as unknown as TeamMember[];
  } catch (err) {
    console.error('Could not read team:', err);
    return [];
  }
}

export async function insertTeamMember(data: TeamMemberInput): Promise<number> {
  if (!hasDatabase()) {
    const id = memoryId();
    memory.team.push({ ...data, id });
    return id;
  }
  await ensureSchema();
  const { rows } = await sql`
    INSERT INTO team_members (name, role, bio, photo_url, sort_order, is_active)
    VALUES (${data.name}, ${data.role}, ${data.bio}, ${data.photo_url},
            ${data.sort_order}, ${data.is_active})
    RETURNING id
  `;
  return (rows[0] as { id: number }).id;
}

export async function updateTeamMember(id: number, data: TeamMemberInput): Promise<boolean> {
  if (!hasDatabase()) {
    const found = memory.team.find((m) => m.id === id);
    if (!found) return false;
    Object.assign(found, data);
    return true;
  }
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE team_members
    SET name = ${data.name}, role = ${data.role}, bio = ${data.bio},
        photo_url = ${data.photo_url}, sort_order = ${data.sort_order},
        is_active = ${data.is_active}
    WHERE id = ${id}
  `;
  return (rowCount ?? 0) > 0;
}

export async function deleteTeamMember(id: number): Promise<boolean> {
  if (!hasDatabase()) {
    const before = memory.team.length;
    memory.team = memory.team.filter((m) => m.id !== id);
    return memory.team.length < before;
  }
  await ensureSchema();
  const { rowCount } = await sql`DELETE FROM team_members WHERE id = ${id}`;
  return (rowCount ?? 0) > 0;
}

// ── Bookings ───────────────────────────────────────────────────────────────────

export interface BookingInput {
  name: string;
  email: string;
  phone: string | null;
  service: string;
  preferred_date: string;
  preferred_time: string;
  notes: string | null;
}

export async function insertBooking(data: BookingInput): Promise<number> {
  if (!hasDatabase()) {
    const id = memoryId();
    memory.bookings.unshift({
      ...data,
      id,
      status: 'pending',
      admin_notes: null,
      created_at: new Date().toISOString(),
    });
    return id;
  }
  await ensureSchema();
  const { rows } = await sql`
    INSERT INTO bookings (name, email, phone, service, preferred_date, preferred_time, notes)
    VALUES (${data.name}, ${data.email}, ${data.phone}, ${data.service},
            ${data.preferred_date}, ${data.preferred_time}, ${data.notes})
    RETURNING id
  `;
  return (rows[0] as { id: number }).id;
}

/** Newest request first — the admin works from the top of the list down. */
export async function getBookings(): Promise<Booking[]> {
  if (!hasDatabase()) return [...memory.bookings];
  try {
    await ensureSchema();
    const { rows } = await sql`SELECT * FROM bookings ORDER BY created_at DESC, id DESC`;
    return rows as unknown as Booking[];
  } catch (err) {
    console.error('Could not read bookings:', err);
    return [];
  }
}

export async function setBookingStatus(id: number, status: BookingStatus): Promise<boolean> {
  if (!hasDatabase()) {
    const found = memory.bookings.find((b) => b.id === id);
    if (!found) return false;
    found.status = status;
    return true;
  }
  await ensureSchema();
  const { rowCount } = await sql`UPDATE bookings SET status = ${status} WHERE id = ${id}`;
  return (rowCount ?? 0) > 0;
}

export async function setBookingNotes(id: number, admin_notes: string): Promise<boolean> {
  if (!hasDatabase()) {
    const found = memory.bookings.find((b) => b.id === id);
    if (!found) return false;
    found.admin_notes = admin_notes;
    return true;
  }
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE bookings SET admin_notes = ${admin_notes} WHERE id = ${id}
  `;
  return (rowCount ?? 0) > 0;
}

export async function deleteBooking(id: number): Promise<boolean> {
  if (!hasDatabase()) {
    const before = memory.bookings.length;
    memory.bookings = memory.bookings.filter((b) => b.id !== id);
    return memory.bookings.length < before;
  }
  await ensureSchema();
  const { rowCount } = await sql`DELETE FROM bookings WHERE id = ${id}`;
  return (rowCount ?? 0) > 0;
}
