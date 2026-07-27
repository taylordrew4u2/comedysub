'use client';

import Link from 'next/link';
import { useState, useActionState, useMemo, useRef } from 'react';
import {
  adminLogout,
  deleteSubmissionAction,
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

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  new: 'bg-blue-500/20 text-blue-300',
  reviewed: 'bg-yellow-500/20 text-yellow-300',
  contacted: 'bg-purple-500/20 text-purple-300',
  booked: 'bg-green-500/20 text-green-300',
  declined: 'bg-red-500/20 text-red-300',
};

const PAGE_SIZE = 25;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
        STATUS_COLORS[status as SubmissionStatus] ?? ''
      }`}
    >
      {status}
    </span>
  );
}

/**
 * Deleting is permanent, so it takes two taps: the first swaps in an explicit
 * confirmation rather than firing straight away. Kept in its own form because
 * it can't nest inside the update form beside it.
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
        {state.error && <p className="text-[10px] text-red-400">{state.error}</p>}
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
          className="min-h-11 flex-1 rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 lg:min-h-0"
        >
          {isPending ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setConfirming(false)}
          className="min-h-11 flex-1 rounded border border-[#2a2a2a] px-3 py-1 text-xs font-semibold text-[#888] transition hover:text-white disabled:opacity-50 lg:min-h-0"
        >
          Cancel
        </button>
      </div>
      {state.error && <p className="text-[10px] text-red-400">{state.error}</p>}
    </form>
  );
}

function RowForm({ sub }: { sub: Submission }) {
  const initial: UpdateState = {};
  const [state, formAction, isPending] = useActionState(updateSubmissionAction, initial);
  // Without this the button reads "✓ Saved" over edits you haven't saved yet.
  const [dirty, setDirty] = useState(false);

  return (
    <form
      action={(formData) => {
        setDirty(false);
        formAction(formData);
      }}
      onChange={() => setDirty(true)}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="id" value={sub.id} />
      <select
        name="status"
        aria-label={`Status for ${sub.name}`}
        defaultValue={sub.status}
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
        defaultValue={sub.admin_notes ?? ''}
        rows={2}
        placeholder="Notes…"
        className="w-full resize-none rounded border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1.5 text-xs text-white placeholder:text-[#444] focus:border-[#DC143C] focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className={`min-h-11 rounded px-3 py-1 text-xs font-semibold transition disabled:opacity-50 lg:min-h-0 ${
          state.success && !dirty
            ? 'bg-[#1a1a1a] text-[#666]'
            : 'bg-[#DC143C] text-white hover:bg-[#b01030]'
        }`}
      >
        {isPending ? 'Saving…' : state.success && !dirty ? '✓ Saved' : 'Save'}
      </button>
      {state.error && <p className="text-[10px] text-red-400">{state.error}</p>}
    </form>
  );
}

/* Mobile/tablet view — a tappable card per submission instead of a wide table. */
function SubmissionCard({ sub }: { sub: Submission }) {
  // Normalised at render so rows saved before normalisation existed link correctly.
  const handle = normalizeInstagram(sub.instagram);
  const igHref = instagramUrl(sub.instagram);
  const videoHref = toHttpUrl(sub.video_url);

  return (
    <div className="rounded-xl border border-[#1e1e1e] bg-[#111] p-4">
      <div className="flex items-start gap-3">
        {sub.headshot_url ? (
          <a href={sub.headshot_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sub.headshot_url}
              alt={sub.name}
              className="h-12 w-12 rounded-full object-cover ring-1 ring-[#2a2a2a]"
            />
          </a>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-sm font-bold text-[#444]">
            {sub.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold text-white">{sub.name}</p>
            <StatusBadge status={sub.status} />
          </div>
          <p className="mt-0.5 truncate text-xs text-[#555]">
            #{sub.id} · {formatDate(sub.submitted_at)}
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
        {sub.agreed_bring_two === true && (
          <span className="rounded bg-green-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-green-300">
            ✓ Brings +2
          </span>
        )}
        {sub.agreed_bring_two === false && (
          <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300">
            ✗ Declined +2
          </span>
        )}
        {sub.has_tattoos === true && (
          <span className="rounded bg-[#DC143C]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#f08ba0]">
            Tattooed
          </span>
        )}
        {sub.has_tattoos === false && (
          <span className="rounded bg-[#1e1e1e] px-2 py-0.5 text-[10px] font-bold uppercase text-[#777]">
            No tattoos
          </span>
        )}
        {sub.multiple_shows === true && (
          <span className="rounded bg-[#DC143C]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#f08ba0]">
            Wants multiple shows
          </span>
        )}
        {sub.availability
          ? sub.availability.split(', ').map((d) => (
              <span key={d} className="rounded bg-[#1e1e1e] px-1.5 py-0.5 text-[10px] text-[#888]">
                {d}
              </span>
            ))
          : null}
      </div>

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
        <div className="flex flex-col gap-2 pt-2">
          <RowForm sub={sub} />
          <DeleteForm sub={sub} />
        </div>
      </details>
    </div>
  );
}

export default function AdminDashboard({ submissions }: { submissions: Submission[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    let items = submissions;
    if (statusFilter !== 'all') {
      items = items.filter((s) => s.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.email ?? '').toLowerCase().includes(q) ||
          (s.instagram ?? '').toLowerCase().includes(q) ||
          (s.location ?? '').toLowerCase().includes(q) ||
          (s.admin_notes ?? '').toLowerCase().includes(q) ||
          (s.questions ?? '').toLowerCase().includes(q),
      );
    }
    return items;
  }, [submissions, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const counts = useMemo(() => {
    const c: Record<string, number> = { total: submissions.length };
    STATUS_OPTIONS.forEach((s) => {
      c[s] = submissions.filter((sub) => sub.status === s).length;
    });
    return c;
  }, [submissions]);

  function handleFilterClick(s: string) {
    setStatusFilter(s);
    setPage(1);
  }

  // Paging on a phone otherwise leaves you at the bottom of the previous page.
  function goToPage(next: number) {
    setPage(next);
    listRef.current?.scrollIntoView({ block: 'start' });
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">
      <header className="px-safe pt-safe sticky top-0 z-10 border-b border-[#1a1a1a] bg-[#0a0a0a]/95 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-sm font-bold text-[#DC143C]">Pins &amp; Needles</span>
            <span className="ml-2 hidden text-xs text-[#555] sm:inline">Admin Dashboard</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/admin/lineup"
              className="flex min-h-11 items-center rounded-lg border border-[#2a2a2a] px-3 text-xs text-[#888] transition hover:border-[#DC143C] hover:text-white sm:min-h-0 sm:py-1.5"
            >
              Export booked
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
        {/* ── Stats / Filter cards ── */}
        <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
          <StatCard
            label="Total"
            value={counts.total}
            accent
            active={statusFilter === 'all'}
            onClick={() => handleFilterClick('all')}
          />
          {STATUS_OPTIONS.map((s) => (
            <StatCard
              key={s}
              label={s}
              value={counts[s] ?? 0}
              active={statusFilter === s}
              onClick={() => handleFilterClick(s)}
            />
          ))}
        </div>

        {/* ── Search ── */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, email, notes, questions…"
            aria-label="Search submissions"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            className="w-full min-h-12 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2.5 text-base text-white placeholder:text-[#555] focus:border-[#DC143C] focus:outline-none sm:max-w-md sm:text-sm"
          />
          {(search || statusFilter !== 'all') && (
            <p className="text-xs text-[#666]">
              {filtered.length} of {submissions.length} submissions
            </p>
          )}
        </div>

        {/* ── Results ── */}
        <div ref={listRef} className="scroll-mt-20">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-[#1e1e1e] bg-[#111] py-16 text-center text-[#555]">
              {submissions.length === 0
                ? 'No submissions yet.'
                : 'No results match your filters.'}
            </div>
          ) : (
            <>
              {/* Cards — phones and tablets */}
              <div className="flex flex-col gap-3 lg:hidden">
                {paginated.map((sub) => (
                  <SubmissionCard key={sub.id} sub={sub} />
                ))}
              </div>

              {/* Table — desktop only, where 1080px actually fits */}
              <div className="hidden overflow-x-auto rounded-xl border border-[#1e1e1e] lg:block">
                <table className="w-full min-w-[1420px] text-sm">
                  <thead>
                    <tr className="border-b border-[#1e1e1e] bg-[#111] text-left text-[10px] font-semibold uppercase tracking-wider text-[#555]">
                      <th className="px-4 py-3 w-10">#</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Instagram</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Brings +2</th>
                      <th className="px-4 py-3">Tattoos</th>
                      <th className="px-4 py-3">Questions</th>
                      <th className="px-4 py-3">Availability</th>
                      <th className="px-4 py-3">Multi</th>
                      <th className="px-4 py-3">Video</th>
                      <th className="px-4 py-3">Headshot</th>
                      <th className="px-4 py-3">Submitted</th>
                      <th className="px-4 py-3 w-40">Status / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((sub, i) => (
                      <tr
                        key={sub.id}
                        className={`border-b border-[#1a1a1a] transition hover:bg-[#111] ${
                          i % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-[#0a0a0a]'
                        }`}
                      >
                        <td className="px-4 py-3 text-[#444] text-xs">{sub.id}</td>
                        <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                          {sub.name}
                        </td>
                        <td className="px-4 py-3 text-[#aaa] text-xs">
                          {sub.email ? (
                            <a
                              href={`mailto:${sub.email}`}
                              className="text-[#DC143C] hover:underline"
                            >
                              {sub.email}
                            </a>
                          ) : (
                            <span className="text-[#333]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#aaa]">
                          {instagramUrl(sub.instagram) ? (
                            <a
                              href={instagramUrl(sub.instagram)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#DC143C] hover:underline"
                            >
                              @{normalizeInstagram(sub.instagram)}
                            </a>
                          ) : sub.instagram ? (
                            <span className="text-xs">{normalizeInstagram(sub.instagram)}</span>
                          ) : (
                            <span className="text-[#333]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#aaa] text-xs">
                          {sub.location ? (
                            <span className="block max-w-[140px] truncate" title={sub.location}>
                              {sub.location}
                            </span>
                          ) : (
                            <span className="text-[#333]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {sub.agreed_bring_two === true ? (
                            <span className="rounded bg-green-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-green-300">
                              ✓ Agreed
                            </span>
                          ) : sub.agreed_bring_two === false ? (
                            <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300">
                              ✗ Declined
                            </span>
                          ) : (
                            <span className="text-[#333] text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {sub.has_tattoos === true ? (
                            <span className="rounded bg-[#DC143C]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#f08ba0]">
                              Yes
                            </span>
                          ) : sub.has_tattoos === false ? (
                            <span className="rounded bg-[#1e1e1e] px-2 py-0.5 text-[10px] font-bold uppercase text-[#777]">
                              No
                            </span>
                          ) : (
                            <span className="text-[#333] text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
                          {sub.questions ? (
                            <span
                              className="block text-xs leading-relaxed text-[#bbb]"
                              title={sub.questions}
                            >
                              {sub.questions}
                            </span>
                          ) : (
                            <span className="text-[#333] text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[160px]">
                          {sub.availability ? (
                            <div className="flex flex-wrap gap-1">
                              {sub.availability.split(', ').map((d) => (
                                <span
                                  key={d}
                                  className="rounded bg-[#1e1e1e] px-1.5 py-0.5 text-[10px] text-[#888]"
                                >
                                  {d}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#333] text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {sub.multiple_shows === true ? (
                            <span className="rounded bg-[#DC143C]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#f08ba0]">
                              Yes
                            </span>
                          ) : sub.multiple_shows === false ? (
                            <span className="rounded bg-[#1e1e1e] px-2 py-0.5 text-[10px] font-bold uppercase text-[#777]">
                              No
                            </span>
                          ) : (
                            <span className="text-[#333] text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {toHttpUrl(sub.video_url) ? (
                            <a
                              href={toHttpUrl(sub.video_url)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-[#1a1a1a] px-2 py-1 text-xs text-[#DC143C] transition hover:bg-[#2a2a2a]"
                            >
                              ▶ Watch
                            </a>
                          ) : sub.video_url ? (
                            <span className="block max-w-[140px] truncate text-xs text-[#888]" title={sub.video_url}>
                              {sub.video_url}
                            </span>
                          ) : (
                            <span className="text-[#333] text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {sub.headshot_url ? (
                            <a href={sub.headshot_url} target="_blank" rel="noopener noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={sub.headshot_url}
                                alt={sub.name}
                                className="h-10 w-10 rounded-full object-cover ring-1 ring-[#2a2a2a]"
                              />
                            </a>
                          ) : (
                            <span className="text-[#333] text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#555] text-xs whitespace-nowrap">
                          {formatDate(sub.submitted_at)}
                        </td>
                        <td className="px-4 py-3 w-40">
                          <div className="mb-2">
                            <StatusBadge status={sub.status} />
                          </div>
                          <div className="flex flex-col gap-2">
                            <RowForm sub={sub} />
                            <DeleteForm sub={sub} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="mt-5 flex flex-col-reverse items-center gap-3 text-xs text-[#666] sm:flex-row sm:justify-between">
                  <span>
                    Page {currentPage} of {totalPages} · {filtered.length} submissions
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
      }`}
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
