'use client';

import Link from 'next/link';
import {
  useCallback,
  useState,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useTransition,
  type ReactNode,
} from 'react';
import {
  adminLogout,
  deleteSubmissionAction,
  setBookedDatesAction,
  updateSubmissionAction,
  type DeleteState,
  type UpdateState,
} from '../actions';
import type { Submission, SubmissionStatus } from '../lib/db';
import { instagramUrl, normalizeInstagram, toHttpUrl } from '../lib/normalize';

const STATUS_OPTIONS: SubmissionStatus[] = [
  'new',
  'reviewed',
  'contacted',
  'booked',
  'declined',
];

/**
 * Booked comedians live in their own tab, so the statuses you still have to act
 * on are the only ones the applicants tab filters by.
 */
const PIPELINE_STATUSES = STATUS_OPTIONS.filter((s) => s !== 'booked');

type TabKey = 'applicants' | 'booked';

const TAB_LABELS: Record<TabKey, string> = {
  applicants: 'Applicants',
  booked: 'Booked',
};

function tabFor(status: SubmissionStatus | string): TabKey {
  return status === 'booked' ? 'booked' : 'applicants';
}

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  new: 'bg-blue-500/20 text-blue-300',
  reviewed: 'bg-yellow-500/20 text-yellow-300',
  contacted: 'bg-purple-500/20 text-purple-300',
  booked: 'bg-green-500/20 text-green-300',
  declined: 'bg-red-500/20 text-red-300',
};

type SortKey = 'newest' | 'oldest' | 'name' | 'status';

const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  name: 'Name A–Z',
  status: 'Status',
};

const PAGE_SIZE = 25;

/** Shared badge shape so flags read the same in the card and the table. */
const BADGE = 'rounded px-2 py-0.5 text-[10px] font-bold uppercase whitespace-nowrap';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Used as a tooltip — two submissions on the same day are otherwise identical. */
function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`${BADGE} ${STATUS_COLORS[status as SubmissionStatus] ?? ''}`}>
      {status}
    </span>
  );
}

function Avatar({ sub, className = 'h-12 w-12 text-sm' }: { sub: Submission; className?: string }) {
  if (sub.headshot_url) {
    return (
      <a
        href={sub.headshot_url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0"
        title={`Open ${sub.name}'s headshot`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sub.headshot_url}
          alt={sub.name}
          className={`${className} rounded-full object-cover ring-1 ring-[#2a2a2a] transition hover:ring-[#DC143C]`}
        />
      </a>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] font-bold text-[#5a5a5a]`}
    >
      {sub.name.charAt(0).toUpperCase()}
    </div>
  );
}

/** The three yes/no answers, as badges. Renders nothing when none were given. */
function FlagBadges({ sub }: { sub: Submission }) {
  const flags: { key: string; label: string; className: string }[] = [];

  if (sub.agreed_bring_two === true) {
    flags.push({ key: 'plus2', label: '✓ Brings +2', className: 'bg-green-500/20 text-green-300' });
  } else if (sub.agreed_bring_two === false) {
    flags.push({ key: 'plus2', label: '✗ Declined +2', className: 'bg-red-500/20 text-red-300' });
  }

  if (sub.has_tattoos === true) {
    flags.push({ key: 'ink', label: 'Tattooed', className: 'bg-[#DC143C]/20 text-[#f08ba0]' });
  } else if (sub.has_tattoos === false) {
    flags.push({ key: 'ink', label: 'No tattoos', className: 'bg-[#1e1e1e] text-[#777]' });
  }

  if (sub.multiple_shows === true) {
    flags.push({ key: 'multi', label: 'Multi-show', className: 'bg-[#DC143C]/20 text-[#f08ba0]' });
  } else if (sub.multiple_shows === false) {
    flags.push({ key: 'multi', label: 'One show', className: 'bg-[#1e1e1e] text-[#777]' });
  }

  if (!flags.length) return <span className="text-xs text-[#333]">—</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {flags.map((f) => (
        <span key={f.key} className={`${BADGE} ${f.className}`}>
          {f.label}
        </span>
      ))}
    </div>
  );
}

/* ── Nights ──────────────────────────────────────────────────────────────────
 *
 * A booked comedian's `booked_dates` are the nights they're actually on, picked
 * from the dates they offered. Indexing those across everyone booked lets every
 * date chip say whether the night already has someone on it — which is a nudge,
 * not a block: more than one comic a night is normal.
 */

const NIGHT_CHIP = 'rounded px-1.5 py-0.5 text-[10px] leading-tight whitespace-nowrap';
const NIGHT_FREE = 'bg-[#1e1e1e] text-[#888]';
/** Amber: somebody is already on that night. Still bookable, just not empty. */
const NIGHT_TAKEN = 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30';
const NIGHT_ON = 'bg-green-500/25 text-green-200 ring-1 ring-green-500/50';

type NightIndex = Map<string, Submission[]>;

function splitDates(value: string | null): string[] {
  return (value ?? '')
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
}

/** Every night someone is booked on, with who. Only booked rows count — an
 *  applicant's dates are an offer, and un-booking someone frees their night. */
function buildNights(submissions: Submission[]): NightIndex {
  const nights: NightIndex = new Map();
  submissions.forEach((sub) => {
    if (sub.status !== 'booked') return;
    splitDates(sub.booked_dates).forEach((date) => {
      const on = nights.get(date);
      if (on) on.push(sub);
      else nights.set(date, [sub]);
    });
  });
  return nights;
}

/** "Aug 6" sorts before "Aug 13" — by the day, not by the string. */
function byNight(a: string, b: string): number {
  const dayA = parseInt(a.replace(/\D+/g, ''), 10);
  const dayB = parseInt(b.replace(/\D+/g, ''), 10);
  if (Number.isNaN(dayA) || Number.isNaN(dayB) || dayA === dayB) return a.localeCompare(b);
  return dayA - dayB;
}

/** Who else is on that night — a comedian isn't a clash with themselves. */
function othersOn(nights: NightIndex, date: string, exceptId: number): Submission[] {
  return (nights.get(date) ?? []).filter((s) => s.id !== exceptId);
}

function nightTitle(date: string, others: Submission[]): string | undefined {
  if (!others.length) return undefined;
  return `${date}: ${others.map((s) => s.name).join(', ')} already booked`;
}

/** Read-only dates — what an applicant offered, coloured by what's taken. */
function AvailabilityChips({ sub, nights }: { sub: Submission; nights: NightIndex }) {
  const dates = splitDates(sub.availability);
  if (!dates.length) return <span className="text-xs text-[#333]">—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {dates.map((d) => {
        const others = othersOn(nights, d, sub.id);
        return (
          <span
            key={d}
            title={nightTitle(d, others)}
            className={`${NIGHT_CHIP} ${others.length ? NIGHT_TAKEN : NIGHT_FREE}`}
          >
            {d}
            {others.length ? ` · ${others.length}` : ''}
          </span>
        );
      })}
    </div>
  );
}

/**
 * The same dates, tappable, for someone who's already booked — tap the nights
 * they're on. Saves per tap straight to the server action rather than through a
 * form, and holds the selection locally so the chip responds before the round
 * trip; a rejected save puts it back and says why.
 */
function BookedNightPicker({ sub, nights }: { sub: Submission; nights: NightIndex }) {
  const dates = useMemo(() => splitDates(sub.availability), [sub.availability]);
  const [selected, setSelected] = useState<string[]>(() => splitDates(sub.booked_dates));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(date: string) {
    const wanted = new Set(selected);
    if (!wanted.delete(date)) wanted.add(date);
    // Rebuilt from `dates` so the stored order always matches the offer order.
    const next = dates.filter((d) => wanted.has(d));
    const previous = selected;

    setSelected(next);
    setError(null);
    startTransition(async () => {
      const result = await setBookedDatesAction(sub.id, next);
      if (result.error) {
        setError(result.error);
        setSelected(previous);
      } else if (result.dates) {
        setSelected(result.dates);
      }
    });
  }

  if (!dates.length) {
    return <span className="text-xs text-[#333]">No dates given</span>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1">
        {dates.map((d) => {
          const on = selected.includes(d);
          const others = othersOn(nights, d, sub.id);
          return (
            <button
              key={d}
              type="button"
              aria-pressed={on}
              disabled={isPending}
              onClick={() => toggle(d)}
              title={nightTitle(d, others)}
              className={`${NIGHT_CHIP} flex min-h-11 items-center px-2.5 transition hover:ring-1 hover:ring-[#DC143C] disabled:opacity-60 lg:min-h-7 ${
                on ? NIGHT_ON : others.length ? NIGHT_TAKEN : NIGHT_FREE
              }`}
            >
              {on ? '✓ ' : ''}
              {d}
              {others.length ? ` · ${others.length}` : ''}
            </button>
          );
        })}
      </div>
      <p
        role="status"
        aria-live="polite"
        className={`text-[10px] leading-snug ${error ? 'text-red-400' : 'text-[#666]'}`}
      >
        {error ??
          (selected.length
            ? `On ${selected.length} night${selected.length === 1 ? '' : 's'}`
            : 'Tap the nights they’re booked for')}
      </p>
    </div>
  );
}

/** Which nights already have someone on them, above both lists. */
function NightsBar({ nights }: { nights: NightIndex }) {
  const booked = [...nights.entries()].sort((a, b) => byNight(a[0], b[0]));
  if (!booked.length) return null;

  return (
    <div className="mb-6 rounded-xl border border-[#1e1e1e] bg-[#111] px-4 py-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#555]">
        Nights with a comic on
      </p>
      <div className="flex flex-wrap gap-1.5">
        {booked.map(([date, subs]) => (
          <span
            key={date}
            title={subs.map((s) => s.name).join(', ')}
            className={`${NIGHT_CHIP} ${NIGHT_TAKEN} px-2 py-1`}
          >
            {date} · {subs.length}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-snug text-[#666]">
        Amber marks a night that already has someone on it — still open, just no longer empty.
      </p>
    </div>
  );
}

/**
 * Deleting is permanent, so it takes two taps: the first swaps in an explicit
 * confirmation rather than firing straight away. Kept in its own form because
 * it can't nest inside the update form above it.
 */
function DeleteForm({ sub }: { sub: Submission }) {
  const initial: DeleteState = {};
  const [state, formAction, isPending] = useActionState(deleteSubmissionAction, initial);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="min-h-11 rounded border border-[#2a2a2a] px-3 py-1 text-xs font-semibold text-[#666] transition hover:border-red-500/60 hover:text-red-400 lg:min-h-0"
        >
          Delete
        </button>
        <p role="status" aria-live="polite" className="text-[10px] text-red-400 empty:hidden">
          {state.error}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded border border-red-500/40 bg-red-500/10 p-2">
      <input type="hidden" name="id" value={sub.id} />
      <p className="text-[11px] leading-snug text-red-300">
        Delete {sub.name}&apos;s submission? This can&apos;t be undone.
      </p>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="min-h-11 flex-1 rounded bg-red-600 px-3 py-1 text-xs font-semibold whitespace-nowrap text-white transition hover:bg-red-700 disabled:opacity-50 lg:min-h-0"
        >
          {isPending ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setConfirming(false)}
          className="min-h-11 flex-1 rounded border border-[#2a2a2a] px-3 py-1 text-xs font-semibold whitespace-nowrap text-[#888] transition hover:text-white disabled:opacity-50 lg:min-h-0"
        >
          Cancel
        </button>
      </div>
      <p role="status" aria-live="polite" className="text-[10px] text-red-400 empty:hidden">
        {state.error}
      </p>
    </form>
  );
}

/**
 * Status + notes editor, with the delete control (`children`) below it.
 *
 * The fields are controlled: React resets an uncontrolled form once its action
 * settles, which threw away a half-written note whenever the save came back
 * with an error. Holding the values here also makes "unsaved" a comparison
 * against what the server last accepted, rather than a flag that any stray
 * change event — a blur, say — could flip back on after a successful save.
 */
function RowForm({
  sub,
  onStatusSaved,
  children,
}: {
  sub: Submission;
  /** Fired once per accepted save that changed the status, so the dashboard can
   *  explain why the row is about to leave the tab you're looking at. */
  onStatusSaved?: (sub: Submission, status: SubmissionStatus) => void;
  children?: ReactNode;
}) {
  const initial: UpdateState = {};
  const [state, formAction, isPending] = useActionState(updateSubmissionAction, initial);
  const [status, setStatus] = useState<string>(sub.status);
  const [notes, setNotes] = useState(sub.admin_notes ?? '');
  const [lastSent, setLastSent] = useState({ status: sub.status as string, notes: sub.admin_notes ?? '' });

  // Each save returns a fresh state object, so identity is enough to tell a new
  // result from a re-render caused by anything else.
  const announced = useRef<UpdateState | null>(null);
  useEffect(() => {
    if (!state.success || announced.current === state) return;
    announced.current = state;
    if (lastSent.status !== sub.status) {
      onStatusSaved?.(sub, lastSent.status as SubmissionStatus);
    }
  }, [state, lastSent, sub, onStatusSaved]);

  const dirty = status !== lastSent.status || notes !== lastSent.notes;
  const saved = state.success && !dirty;

  return (
    <div className="flex flex-col gap-2">
      <form
        action={(formData) => {
          setLastSent({ status, notes });
          formAction(formData);
        }}
        className="flex flex-col gap-2"
      >
        <input type="hidden" name="id" value={sub.id} />
        <select
          name="status"
          aria-label={`Status for ${sub.name}`}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="min-h-11 rounded border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1 text-xs text-white focus:border-[#DC143C] focus:outline-none lg:min-h-0"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <textarea
          name="admin_notes"
          aria-label={`Notes for ${sub.name}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Notes…"
          className="w-full resize-none rounded border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1.5 text-xs text-white placeholder:text-[#444] focus:border-[#DC143C] focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending || saved}
          className={`min-h-11 rounded px-3 py-1 text-xs font-semibold transition disabled:opacity-50 lg:min-h-0 ${
            saved ? 'bg-[#1a1a1a] text-[#666]' : 'bg-[#DC143C] text-white hover:bg-[#b01030]'
          }`}
        >
          {isPending ? 'Saving…' : saved ? '✓ Saved' : dirty ? 'Save changes' : 'Save'}
        </button>
        {/* Present from first render so screen readers announce the result. */}
        <p role="status" aria-live="polite" className="text-[10px] text-red-400 empty:hidden">
          {state.error}
          {!state.error && saved ? (
            <span className="sr-only">Saved {sub.name}&apos;s status and notes.</span>
          ) : null}
        </p>
      </form>
      {children}
    </div>
  );
}

/* Mobile/tablet view — a tappable card per submission instead of a wide table. */
function SubmissionCard({
  sub,
  nights,
  onStatusSaved,
}: {
  sub: Submission;
  nights: NightIndex;
  onStatusSaved?: (sub: Submission, status: SubmissionStatus) => void;
}) {
  // Normalised at render so rows saved before normalisation existed link correctly.
  const handle = normalizeInstagram(sub.instagram);
  const igHref = instagramUrl(sub.instagram);
  const videoHref = toHttpUrl(sub.video_url);

  return (
    <div className="rounded-xl border border-[#1e1e1e] bg-[#111] p-4 transition hover:border-[#2a2a2a]">
      <div className="flex items-start gap-3">
        <Avatar sub={sub} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold text-white">{sub.name}</p>
            <StatusBadge status={sub.status} />
          </div>
          <p className="mt-0.5 truncate text-xs text-[#555]">
            #{sub.id} · <span title={formatDateTime(sub.submitted_at)}>{formatDate(sub.submitted_at)}</span>
            {sub.location ? ` · ${sub.location}` : ''}
          </p>
        </div>
      </div>

      {/* Primary actions — full-size tap targets, no horizontal scrolling. */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {videoHref ? (
          <a
            href={videoHref}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[#DC143C] text-sm font-semibold text-white transition hover:bg-[#b01030]"
          >
            ▶ Watch video
          </a>
        ) : sub.video_url ? (
          // Not a URL — show what they wrote rather than a link that goes nowhere.
          <p className="col-span-2 rounded-lg border border-dashed border-[#2a2a2a] px-3 py-2 text-xs break-words text-[#888]">
            {sub.video_url}
          </p>
        ) : (
          <p className="col-span-2 flex min-h-11 items-center justify-center rounded-lg border border-dashed border-[#1e1e1e] text-xs text-[#444]">
            No video link
          </p>
        )}

        {sub.email && (
          <a
            href={`mailto:${sub.email}`}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#2a2a2a] px-2 text-xs text-[#aaa] transition hover:border-[#DC143C] hover:text-white"
          >
            <span aria-hidden="true">✉</span>
            <span className="truncate">Email</span>
          </a>
        )}
        {igHref ? (
          <a
            href={igHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#2a2a2a] px-2 text-xs text-[#aaa] transition hover:border-[#DC143C] hover:text-white"
          >
            <span aria-hidden="true">◎</span>
            <span className="truncate">@{handle}</span>
          </a>
        ) : handle ? (
          <p className="flex min-h-11 items-center justify-center rounded-lg border border-dashed border-[#2a2a2a] px-2 text-xs text-[#888]">
            <span className="truncate">{handle}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <FlagBadges sub={sub} />
        {sub.status !== 'booked' && <AvailabilityChips sub={sub} nights={nights} />}
      </div>

      {/* Booked comedians get the picker instead — same dates, tap to set. */}
      {sub.status === 'booked' && (
        <div className="mt-3 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#555]">
            Nights they’re on
          </p>
          <BookedNightPicker sub={sub} nights={nights} />
        </div>
      )}

      {sub.questions && (
        <div className="mt-3 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#DC143C]">
            Asked a question
          </p>
          <p className="text-xs leading-relaxed break-words whitespace-pre-wrap text-[#bbb]">
            {sub.questions}
          </p>
        </div>
      )}

      {/* Editing is collapsed by default so the list stays scannable on a phone. */}
      <details className="group mt-3 border-t border-[#1a1a1a] pt-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-xs font-semibold text-[#888] transition hover:text-white">
          <span>
            Status &amp; notes
            {sub.admin_notes ? <span className="ml-1.5 text-[#DC143C]">•</span> : null}
          </span>
          <span className="text-[#555] transition group-open:rotate-180" aria-hidden="true">▾</span>
        </summary>
        <div className="pt-2">
          <RowForm sub={sub} onStatusSaved={onStatusSaved}>
            <DeleteForm sub={sub} />
          </RowForm>
        </div>
      </details>
    </div>
  );
}

/** Shared by both tabs, so a search counts the same thing on either side. */
function matchesSearch(sub: Submission, query: string): boolean {
  return (
    sub.name.toLowerCase().includes(query) ||
    (sub.email ?? '').toLowerCase().includes(query) ||
    (sub.instagram ?? '').toLowerCase().includes(query) ||
    (sub.location ?? '').toLowerCase().includes(query) ||
    (sub.admin_notes ?? '').toLowerCase().includes(query) ||
    (sub.questions ?? '').toLowerCase().includes(query)
  );
}

function sortSubmissions(items: Submission[], sort: SortKey): Submission[] {
  const sorted = [...items];
  switch (sort) {
    case 'oldest':
      return sorted.sort(
        (a, b) => +new Date(a.submitted_at) - +new Date(b.submitted_at),
      );
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'en-GB', { sensitivity: 'base' }));
    case 'status':
      // Grouped in pipeline order, newest first inside each group.
      return sorted.sort(
        (a, b) =>
          STATUS_OPTIONS.indexOf(a.status) - STATUS_OPTIONS.indexOf(b.status) ||
          +new Date(b.submitted_at) - +new Date(a.submitted_at),
      );
    default:
      return sorted.sort(
        (a, b) => +new Date(b.submitted_at) - +new Date(a.submitted_at),
      );
  }
}

export default function AdminDashboard({ submissions }: { submissions: Submission[] }) {
  const [tab, setTab] = useState<TabKey>('applicants');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  // Rows leave the tab you're on the moment a booking saves, so say where they went.
  const [moved, setMoved] = useState<{ name: string; to: TabKey } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  /* Booked comedians are a separate list, not a status filter on the same one. */
  const byTab = useMemo(() => {
    const groups: Record<TabKey, Submission[]> = { applicants: [], booked: [] };
    submissions.forEach((s) => groups[tabFor(s.status)].push(s));
    return groups;
  }, [submissions]);

  const scoped = byTab[tab];

  /* Built from every booked comedian, so both tabs colour dates the same way. */
  const nights = useMemo(() => buildNights(submissions), [submissions]);

  /* Search next, so the stat cards can count within the current search. */
  const query = search.trim().toLowerCase();
  const searched = useMemo(
    () => (query ? scoped.filter((s) => matchesSearch(s, query)) : scoped),
    [scoped, query],
  );

  // Searching in one tab while the match sits in the other is the easiest way to
  // conclude a submission has vanished — so count the other side too.
  const otherTab: TabKey = tab === 'booked' ? 'applicants' : 'booked';
  const otherTabMatches = useMemo(
    () => (query ? byTab[otherTab].filter((s) => matchesSearch(s, query)).length : 0),
    [byTab, otherTab, query],
  );

  // Pipeline order is meaningless once everyone in view is booked.
  const effectiveSort: SortKey = tab === 'booked' && sort === 'status' ? 'newest' : sort;

  const filtered = useMemo(() => {
    const items =
      statusFilter === 'all' ? searched : searched.filter((s) => s.status === statusFilter);
    return sortSubmissions(items, effectiveSort);
  }, [searched, statusFilter, effectiveSort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { total: searched.length };
    PIPELINE_STATUSES.forEach((s) => {
      c[s] = searched.filter((sub) => sub.status === s).length;
    });
    return c;
  }, [searched]);

  const bookedTotal = byTab.booked.length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamped rather than stored, so deleting the last row of the last page lands
  // you on the new last page instead of an empty one. Paging reads this too.
  const currentPage = Math.min(page, totalPages);
  const firstOnPage = (currentPage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(firstOnPage, firstOnPage + PAGE_SIZE);

  // "/" jumps to search from anywhere, the way every other admin tool works.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest('input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const filtersActive = search.trim() !== '' || statusFilter !== 'all';

  function handleFilterClick(s: string) {
    // Tapping the active card again clears it, so the filter is never a trap.
    setStatusFilter((current) => (current === s && s !== 'all' ? 'all' : s));
    setPage(1);
  }

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
    searchRef.current?.focus();
  }

  /* Status filters belong to the tab that offers them, so switching drops them.
     The search is deliberately kept — following a match across is the point. */
  function switchTab(next: TabKey) {
    setTab(next);
    setStatusFilter('all');
    setPage(1);
    setMoved(null);
  }

  const handleStatusSaved = useCallback((sub: Submission, status: SubmissionStatus) => {
    const to = tabFor(status);
    // Only worth saying when the row actually changes tabs.
    if (to === tabFor(sub.status)) return;
    setMoved({ name: sub.name, to });
  }, []);

  // Paging on a phone otherwise leaves you at the bottom of the previous page.
  function goToPage(next: number) {
    setPage(next);
    listRef.current?.scrollIntoView({ block: 'start' });
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">
      <header className="admin-header px-safe sticky top-0 z-20 border-b border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0 truncate">
            <span className="text-sm font-bold text-[#DC143C]">Pins &amp; Needles</span>
            <span className="ml-2 hidden text-xs text-[#555] sm:inline">Admin Dashboard</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/admin/templates"
              className="flex min-h-11 items-center rounded-lg border border-[#2a2a2a] px-3 text-xs text-[#888] transition hover:border-[#DC143C] hover:text-white sm:min-h-0 sm:py-1.5"
            >
              Emails
            </Link>
            <Link
              href="/admin/lineup"
              className="flex min-h-11 items-center gap-1.5 rounded-lg border border-[#2a2a2a] px-3 text-xs text-[#888] transition hover:border-[#DC143C] hover:text-white sm:min-h-0 sm:py-1.5"
            >
              {/* The full label doesn't fit beside the other two on a phone. */}
              <span className="sm:hidden">Lineup</span>
              <span className="hidden sm:inline">Export booked</span>
              <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[10px] font-bold text-[#aaa]">
                {bookedTotal}
              </span>
            </Link>
            <form action={adminLogout}>
              <button
                type="submit"
                className="min-h-11 shrink-0 rounded-lg border border-[#2a2a2a] px-3 text-xs text-[#888] transition hover:border-[#DC143C] hover:text-white sm:min-h-0 sm:py-1.5"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="px-safe pb-safe mx-auto max-w-7xl py-6 sm:py-8">
        {/* ── Tabs ── */}
        <div
          role="tablist"
          aria-label="Submission lists"
          className="mb-4 grid w-full grid-cols-2 gap-1 rounded-xl border border-[#1e1e1e] bg-[#111] p-1 sm:w-fit"
        >
          <TabButton
            tab="applicants"
            active={tab === 'applicants'}
            count={byTab.applicants.length}
            onClick={switchTab}
          />
          <TabButton
            tab="booked"
            active={tab === 'booked'}
            count={bookedTotal}
            onClick={switchTab}
          />
        </div>

        {/* Announces the move for screen readers; mounted so the update is heard. */}
        <div role="status" aria-live="polite">
          {moved && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#DC143C]/40 bg-[#DC143C]/10 px-4 py-3">
              <p className="min-w-0 flex-1 text-sm text-[#f0aebc]">
                <span className="font-semibold text-white">{moved.name}</span> moved to{' '}
                {TAB_LABELS[moved.to]}.
              </p>
              {tab !== moved.to && (
                <button
                  type="button"
                  onClick={() => switchTab(moved.to)}
                  className="min-h-11 shrink-0 rounded-lg border border-[#DC143C]/50 px-3 text-xs font-semibold whitespace-nowrap text-white transition hover:bg-[#DC143C]/20 sm:min-h-0 sm:py-1.5"
                >
                  View {TAB_LABELS[moved.to]}
                </button>
              )}
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setMoved(null)}
                className="shrink-0 px-1 text-lg leading-none text-[#888] transition hover:text-white"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* ── Stats / Filter cards ── */}
        {tab === 'booked' ? (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[#1e1e1e] bg-[#111] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#555]">
                {search.trim() ? 'Matching booked' : 'Booked for the show'}
              </p>
              <p className="mt-0.5 text-xl font-extrabold text-[#DC143C] sm:text-2xl">
                {counts.total}
                <span className="ml-2 text-xs font-semibold text-[#666]">
                  {counts.total === 1 ? 'comedian' : 'comedians'}
                </span>
              </p>
            </div>
            <Link
              href="/admin/lineup"
              className="flex min-h-11 items-center justify-center rounded-lg border border-[#2a2a2a] px-4 text-xs font-semibold text-[#aaa] transition hover:border-[#DC143C] hover:text-white sm:min-h-0 sm:py-2"
            >
              Export lineup PDF
            </Link>
          </div>
        ) : (
          <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-5">
            <StatCard
              label={search.trim() ? 'Matches' : 'Total'}
              value={counts.total}
              accent
              active={statusFilter === 'all'}
              onClick={() => handleFilterClick('all')}
            />
            {PIPELINE_STATUSES.map((s) => (
              <StatCard
                key={s}
                label={s}
                value={counts[s] ?? 0}
                active={statusFilter === s}
                onClick={() => handleFilterClick(s)}
              />
            ))}
          </div>
        )}

        <NightsBar nights={nights} />

        {/* ── Search / sort ── */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <div className="relative w-full sm:max-w-md">
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && search) {
                  e.preventDefault();
                  setSearch('');
                  setPage(1);
                }
              }}
              placeholder="Search name, email, notes, questions…"
              aria-label="Search submissions"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
              className="min-h-12 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2.5 text-base text-white placeholder:text-[#555] focus:border-[#DC143C] focus:outline-none sm:text-sm"
            />
            {!search && (
              <kbd
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-[#2a2a2a] bg-[#111] px-1.5 py-0.5 font-sans text-[10px] text-[#555] lg:block"
              >
                /
              </kbd>
            )}
          </div>

          <label className="flex items-center gap-2 text-xs text-[#666]">
            <span className="shrink-0">Sort</span>
            <select
              value={effectiveSort}
              onChange={(e) => {
                setSort(e.target.value as SortKey);
                setPage(1);
              }}
              aria-label="Sort submissions"
              className="min-h-12 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-base text-white focus:border-[#DC143C] focus:outline-none sm:min-h-0 sm:w-auto sm:py-2 sm:text-sm"
            >
              {(Object.keys(SORT_LABELS) as SortKey[])
                // Everyone here shares one status, so grouping by it does nothing.
                .filter((key) => key !== 'status' || tab !== 'booked')
                .map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
            </select>
          </label>

          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-12 rounded-lg border border-[#2a2a2a] px-3 text-xs text-[#888] transition hover:border-[#DC143C] hover:text-white sm:min-h-0 sm:py-2"
            >
              Clear filters
            </button>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:ml-auto">
            <p role="status" aria-live="polite" className="text-xs text-[#666]">
              {filtersActive
                ? `${filtered.length} of ${scoped.length} in ${TAB_LABELS[tab]}`
                : `${scoped.length} ${
                    tab === 'booked'
                      ? `booked comedian${scoped.length === 1 ? '' : 's'}`
                      : `submission${scoped.length === 1 ? '' : 's'}`
                  }`}
            </p>
            {otherTabMatches > 0 && (
              <button
                type="button"
                onClick={() => switchTab(otherTab)}
                className="text-xs font-semibold text-[#DC143C] transition hover:underline"
              >
                {otherTabMatches} match{otherTabMatches === 1 ? '' : 'es'} in{' '}
                {TAB_LABELS[otherTab]} →
              </button>
            )}
          </div>
        </div>

        {/* ── Results ── */}
        <div ref={listRef} className="admin-scroll-anchor">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-[#1e1e1e] bg-[#111] px-6 py-16 text-center">
              <p className="text-[#555]">
                {filtersActive
                  ? 'No results match your filters.'
                  : tab === 'booked'
                    ? 'Nobody is booked yet. Set someone’s status to Booked and they’ll move here.'
                    : submissions.length === 0
                      ? 'No submissions yet.'
                      : 'Every submission is booked — they’re all in the Booked tab.'}
              </p>
              {filtersActive && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 min-h-11 rounded-lg border border-[#2a2a2a] px-4 text-xs font-semibold text-[#888] transition hover:border-[#DC143C] hover:text-white"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Cards — phones and tablets */}
              <div className="flex flex-col gap-3 lg:hidden">
                {paginated.map((sub) => (
                  <SubmissionCard
                    key={sub.id}
                    sub={sub}
                    nights={nights}
                    onStatusSaved={handleStatusSaved}
                  />
                ))}
              </div>

              {/* Table — desktop only, where the full width actually fits */}
              <div className="hidden overflow-x-auto rounded-xl border border-[#1e1e1e] lg:block">
                <table className="w-full min-w-[1300px] text-sm">
                  <thead>
                    <tr className="border-b border-[#1e1e1e] bg-[#111] text-left text-[10px] font-semibold uppercase tracking-wider text-[#555]">
                      <th className="min-w-[210px] px-4 py-3">Comedian</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Video</th>
                      <th className="px-4 py-3">Available</th>
                      <th className="px-4 py-3">Answers</th>
                      <th className="w-[300px] px-4 py-3">Questions</th>
                      <th className="px-4 py-3">Submitted</th>
                      <th className="w-56 px-4 py-3">Status / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((sub, i) => {
                      const handle = normalizeInstagram(sub.instagram);
                      const igHref = instagramUrl(sub.instagram);
                      const videoHref = toHttpUrl(sub.video_url);

                      return (
                        <tr
                          key={sub.id}
                          className={`border-b border-[#1a1a1a] align-top transition hover:bg-[#141414] ${
                            i % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-[#0a0a0a]'
                          }`}
                        >
                          {/* Identity — avatar, name, status and where they are, in one cell. */}
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-3">
                              <Avatar sub={sub} className="h-10 w-10 text-xs" />
                              <div className="min-w-0">
                                <p className="font-medium text-white">{sub.name}</p>
                                <p className="mt-0.5 truncate text-[11px] text-[#555]">
                                  #{sub.id}
                                  {sub.location ? ` · ${sub.location}` : ''}
                                </p>
                                <div className="mt-1.5">
                                  <StatusBadge status={sub.status} />
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="max-w-[200px] px-4 py-3 text-xs">
                            <div className="flex flex-col gap-1">
                              {sub.email ? (
                                <a
                                  href={`mailto:${sub.email}`}
                                  className="truncate text-[#DC143C] hover:underline"
                                  title={sub.email}
                                >
                                  {sub.email}
                                </a>
                              ) : null}
                              {igHref ? (
                                <a
                                  href={igHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="truncate text-[#aaa] hover:text-[#DC143C] hover:underline"
                                >
                                  @{handle}
                                </a>
                              ) : handle ? (
                                <span className="truncate text-[#888]">{handle}</span>
                              ) : null}
                              {!sub.email && !handle ? (
                                <span className="text-[#333]">—</span>
                              ) : null}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            {videoHref ? (
                              <a
                                href={videoHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded bg-[#1a1a1a] px-2 py-1 text-xs text-[#DC143C] transition hover:bg-[#2a2a2a]"
                              >
                                ▶ Watch
                              </a>
                            ) : sub.video_url ? (
                              <span
                                className="block max-w-[140px] truncate text-xs text-[#888]"
                                title={sub.video_url}
                              >
                                {sub.video_url}
                              </span>
                            ) : (
                              <span className="text-xs text-[#333]">—</span>
                            )}
                          </td>

                          <td className="w-[230px] px-4 py-3">
                            {sub.status === 'booked' ? (
                              <BookedNightPicker sub={sub} nights={nights} />
                            ) : (
                              <AvailabilityChips sub={sub} nights={nights} />
                            )}
                          </td>

                          <td className="max-w-[140px] px-4 py-3">
                            <FlagBadges sub={sub} />
                          </td>

                          {/* Never clamped — a half-shown question is one you
                              have to hover to answer. */}
                          <td className="w-[300px] min-w-[260px] px-4 py-3">
                            {sub.questions ? (
                              <span className="block text-xs leading-relaxed break-words whitespace-pre-wrap text-[#bbb]">
                                {sub.questions}
                              </span>
                            ) : (
                              <span className="text-xs text-[#333]">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-xs whitespace-nowrap text-[#555]">
                            <span title={formatDateTime(sub.submitted_at)}>
                              {formatDate(sub.submitted_at)}
                            </span>
                          </td>

                          <td className="w-56 px-4 py-3">
                            <RowForm sub={sub} onStatusSaved={handleStatusSaved}>
                              <DeleteForm sub={sub} />
                            </RowForm>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="mt-5 flex flex-col-reverse items-center gap-3 text-xs text-[#666] sm:flex-row sm:justify-between">
                  <span>
                    Showing {firstOnPage + 1}–{firstOnPage + paginated.length} of {filtered.length}
                    <span className="hidden sm:inline"> · page {currentPage} of {totalPages}</span>
                  </span>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <button
                      onClick={() => goToPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="min-h-11 flex-1 rounded-lg border border-[#2a2a2a] px-4 transition hover:border-[#DC143C] disabled:opacity-30 sm:min-h-0 sm:flex-none sm:py-1.5"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="min-h-11 flex-1 rounded-lg border border-[#2a2a2a] px-4 transition hover:border-[#DC143C] disabled:opacity-30 sm:min-h-0 sm:flex-none sm:py-1.5"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function TabButton({
  tab,
  active,
  count,
  onClick,
}: {
  tab: TabKey;
  active: boolean;
  count: number;
  onClick: (tab: TabKey) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onClick(tab)}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition sm:px-8 ${
        active
          ? 'bg-[#DC143C] text-white'
          : 'text-[#888] hover:bg-[#1a1a1a] hover:text-white'
      }`}
    >
      {TAB_LABELS[tab]}
      <span
        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
          active ? 'bg-black/25 text-white' : 'bg-[#1e1e1e] text-[#aaa]'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function StatCard({
  label,
  value,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: number;
  accent?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border px-3 py-2.5 text-left transition sm:px-4 sm:py-3 ${
        active
          ? 'border-[#DC143C] bg-[#DC143C]/10'
          : 'border-[#1e1e1e] bg-[#111] hover:border-[#DC143C]/50'
      } ${value === 0 && !active ? 'opacity-60' : ''}`}
    >
      <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-[#555]">
        {label}
      </p>
      <p
        className={`mt-0.5 text-xl font-extrabold sm:mt-1 sm:text-2xl ${
          accent ? 'text-[#DC143C]' : 'text-white'
        }`}
      >
        {value}
      </p>
    </button>
  );
}
