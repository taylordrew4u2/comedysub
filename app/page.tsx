import type { Metadata } from 'next';
import WebForm from './_components/WebForm';

export const metadata: Metadata = {
  title: 'Pins & Needles — Apply to Perform',
  description:
    'Scottish stand-up comedian? Apply to perform at Pins & Needles at Edinburgh Fringe. Submit your set video now.',
};

const VENUE = 'The Raging Bull, 161 Lothian Rd, Edinburgh EH3 9AA';
const MAP_URL = `https://maps.google.com/?q=${encodeURIComponent(VENUE)}`;

export default function HomePage() {
  const isOpen = process.env.APPLICATIONS_OPEN !== 'false';
  const closingDate = process.env.CLOSING_DATE ?? null;

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">
      {/* ── Nav ── */}
      <header className="px-safe pt-safe py-4 sm:py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <span className="text-xs font-bold tracking-widest text-[#DC143C] uppercase">
            Pins &amp; Needles
          </span>
          <span className="shrink-0 text-xs text-[#444]">Edinburgh Fringe</span>
        </div>
      </header>

      <main className="px-safe pb-16">
        <div className="mx-auto max-w-2xl">

          {/* ── Primary CTA block ── */}
          <div className="mb-8 pt-8 sm:mb-10 sm:pt-16">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#DC143C] sm:tracking-[0.25em]">
              Open Call · Scotland
            </p>
            {/* Steps up in three stops so 13 characters never overflow a 320px screen. */}
            <h1 className="mb-4 text-[2.25rem] font-extrabold leading-[1.05] tracking-tight min-[400px]:text-5xl sm:text-7xl">
              Scottish<br />
              <span className="text-[#DC143C]">stand-ups</span><br />
              — apply here.
            </h1>
            <p className="max-w-md text-base leading-relaxed text-[#888]">
              We&apos;re booking Scottish stand-up comedians for Pins &amp; Needles —
              a late-night show at The Raging Bull, Edinburgh Fringe.
              Submit your set video and we&apos;ll message you on Instagram or by email
              if you&apos;re selected — so keep an eye on both.
            </p>

            {isOpen && (
              <a
                href="#apply"
                className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#DC143C] px-6 text-sm font-extrabold uppercase tracking-widest text-white transition hover:bg-[#b01030] sm:hidden"
              >
                Apply now ↓
              </a>
            )}

            <a
              href="https://pinsandneedlescomedy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-[#666] underline underline-offset-4 transition-colors hover:text-[#DC143C] sm:text-xs sm:text-[#555]"
            >
              Learn more about the show ↗
            </a>
          </div>

          {/* ── Form or Closed ── */}
          {isOpen ? (
            <div
              id="apply"
              className="scroll-mt-4 rounded-2xl border border-[#1e1e1e] bg-[#111] p-5 sm:p-8"
            >
              {closingDate && (
                <p className="mb-5 text-xs font-semibold text-[#DC143C]">
                  ⏳ Applications close {closingDate}
                </p>
              )}
              <WebForm />
            </div>
          ) : (
            <div className="rounded-2xl border border-[#DC143C]/30 bg-[#DC143C]/10 p-8 text-center sm:p-10">
              <p className="mb-2 text-xl font-bold">Applications Closed</p>
              <p className="text-sm text-[#999]">
                We&apos;re not currently accepting submissions. Check back soon.
              </p>
            </div>
          )}

          {/* ── Show details — supporting info, below the fold ── */}
          <div className="mt-8 flex flex-col gap-1 border-t border-[#1a1a1a] pt-6 sm:flex-row sm:items-center sm:gap-6">
            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-2.5 text-sm text-[#666] transition-colors hover:text-[#DC143C]"
            >
              <span className="text-[#DC143C]" aria-hidden="true">📍</span>
              <span>The Raging Bull · 161 Lothian Rd, Edinburgh EH3 9AA</span>
            </a>
            <div className="flex min-h-11 items-center gap-2.5 text-sm text-[#666]">
              <span className="text-[#DC143C]" aria-hidden="true">🕙</span>
              <span>22:15 · Aug 6–18</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-safe pb-safe border-t border-[#1a1a1a] py-6 text-center text-xs text-[#333]">
        © Pins &amp; Needles Comedy · Edinburgh Fringe
      </footer>
    </div>
  );
}
