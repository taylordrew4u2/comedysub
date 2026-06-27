'use client';

import { useState, useActionState, useMemo } from 'react';
import { adminLogout, updateSubmissionAction, type UpdateState } from '../actions';
import type { Submission, SubmissionStatus } from '../lib/db';

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

// ── Per-row update form ────────────────────────────────────────────────────────
function RowForm({ sub }: { sub: Submission }) {
  const initial: UpdateState = {};
  const [state, formAction, isPending] = useActionState(updateSubmissionAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={sub.id} />

      <select
        name="status"
        defaultValue={sub.status}
        className="rounded border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1 text-xs text-white focus:outline-none focus:border-[#DC143C]"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>

      <textarea
        name="admin_notes"
        defaultValue={sub.admin_notes ?? ''}
        rows={2}
        placeholder="Notes…"
        className="w-full rounded border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1 text-xs text-white placeholder:text-[#444] focus:outline-none focus:border-[#DC143C] resize-none"
      />

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-[#DC143C] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#b01030] disabled:opacity-50"
      >
        {isPending ? 'Saving…' : state.success ? '✓ Saved' : 'Save'}
      </button>

      {state.error && (
        <p className="text-[10px] text-red-400">{state.error}</p>
      )}
    </form>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function AdminDashboard({ submissions }: { submissions: Submission[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return submissions;
    const q = search.toLowerCase();
    return submissions.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q) ||
        (s.instagram ?? '').toLowerCase().includes(q),
    );
  }, [submissions, search]);

  // Count by status
  const counts = useMemo(() => {
    const c: Record<string, number> = { total: submissions.length };
    STATUS_OPTIONS.forEach((s) => {
      c[s] = submissions.filter((sub) => sub.status === s).length;
    });
    return c;
  }, [submissions]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-10 border-b border-[#1a1a1a] bg-[#0a0a0a]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <span className="text-sm font-bold text-[#DC143C]">Pins &amp; Needles</span>
            <span className="ml-2 text-xs text-[#555]">Admin Dashboard</span>
          </div>
          <form action={adminLogout}>
            <button
              type="submit"
              className="rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#888] transition hover:border-[#DC143C] hover:text-white"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* ── Stats row ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total" value={counts.total} accent />
          {STATUS_OPTIONS.map((s) => (
            <StatCard key={s} label={s} value={counts[s] ?? 0} />
          ))}
        </div>

        {/* ── Search ── */}
        <div className="mb-6">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, location, status, Instagram…"
            className="w-full max-w-md rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2.5 text-sm text-white placeholder:text-[#555] focus:border-[#DC143C] focus:outline-none"
          />
          {search && (
            <p className="mt-2 text-xs text-[#666]">
              Showing {filtered.length} of {submissions.length} submissions
            </p>
          )}
        </div>

        {/* ── Table ── */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[#1e1e1e] bg-[#111] py-16 text-center text-[#555]">
            {submissions.length === 0
              ? 'No submissions yet.'
              : 'No results match your search.'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#1e1e1e]">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-[#1e1e1e] bg-[#111] text-left text-[10px] font-semibold uppercase tracking-wider text-[#555]">
                  <th className="px-4 py-3 w-10">#</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Tattoos</th>
                  <th className="px-4 py-3">Instagram</th>
                  <th className="px-4 py-3">Availability</th>
                  <th className="px-4 py-3">Experience</th>
                  <th className="px-4 py-3">Video</th>
                  <th className="px-4 py-3 max-w-[180px]">Bio</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 w-40">Status / Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub, i) => (
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
                    <td className="px-4 py-3 text-[#aaa] whitespace-nowrap">{sub.location}</td>
                    <td className="px-4 py-3">
                      <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-[#DC143C]/20 text-[#DC143C]">
                        web
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {sub.has_tattoos ? '✅' : '❌'}
                    </td>
                    <td className="px-4 py-3 text-[#aaa]">
                      {sub.instagram ? (
                        <a
                          href={`https://instagram.com/${sub.instagram.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#DC143C] hover:underline"
                        >
                          {sub.instagram.startsWith('@')
                            ? sub.instagram
                            : `@${sub.instagram}`}
                        </a>
                      ) : (
                        <span className="text-[#333]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#aaa] max-w-[140px]">
                      <span className="line-clamp-2">{sub.availability}</span>
                    </td>
                    <td className="px-4 py-3 text-[#aaa] max-w-[160px]">
                      <span className="line-clamp-2">{sub.experience}</span>
                    </td>
                    <td className="px-4 py-3">
                      {sub.video_url ? (
                        <a
                          href={sub.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-[#1a1a1a] px-2 py-1 text-xs text-[#DC143C] transition hover:bg-[#2a2a2a]"
                        >
                          ▶ Watch
                        </a>
                      ) : (
                        <span className="text-[#333] text-xs">No video</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="line-clamp-3 text-xs text-[#888]">{sub.bio}</p>
                    </td>
                    <td className="px-4 py-3 text-[#555] text-xs whitespace-nowrap">
                      {new Date(sub.submitted_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 w-40">
                      <div className="mb-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            STATUS_COLORS[sub.status as SubmissionStatus] ?? ''
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>
                      <RowForm sub={sub} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#1e1e1e] bg-[#111] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#555]">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-extrabold ${
          accent ? 'text-[#DC143C]' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
