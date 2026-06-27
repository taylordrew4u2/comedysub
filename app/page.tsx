import type { Metadata } from 'next';
import WebForm from './_components/WebForm';

export const metadata: Metadata = {
  title: 'Pins & Needles — Apply to Perform',
  description:
    'Scottish stand-up comedian? Apply to perform at Pins & Needles at Edinburgh Fringe. Submit your set video now.',
};

export default function HomePage() {
  const isOpen = process.env.APPLICATIONS_OPEN !== 'false';
  const closingDate = process.env.CLOSING_DATE ?? null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ── Nav ── */}
      <header className="px-4 py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="text-xs font-bold tracking-widest text-[#DC143C] uppercase">
            Pins &amp; Needles
          </span>
          <span className="text-xs text-[#444]">Edinburgh Fringe</span>
        </div>
      </header>

      <main className="px-4 pb-20">
        <div className="mx-auto max-w-2xl">

          {/* ── Primary CTA block ── */}
          <div className="mb-10 pt-10 sm:pt-16">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#DC143C]">
              Open Call · Scotland
            </p>
            <h1 className="mb-4 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
              Scottish<br />
              <span className="text-[#DC143C]">stand-ups</span><br />
              — apply here.
            </h1>
            <p className="max-w-md text-base leading-relaxed text-[#888]">
              We&apos;re booking Scottish stand-up comedians for Pins &amp; Needles —
              a late-night show at The Raging Bull, Edinburgh Fringe.
              Submit your set video and we&apos;ll be in touch if you&apos;re selected.
            </p>
            <a
              href="https://pinsandneedlescomedy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#555] underline underline-offset-4 hover:text-[#DC143C] transition-colors"
            >
              Learn more about the show ↗
            </a>
          </div>

          {/* ── Form or Closed ── */}
          {isOpen ? (
            <div className="rounded-2xl border border-[#1e1e1e] bg-[#111] p-6 sm:p-8">
              {closingDate && (
                <p className="mb-5 text-xs font-semibold text-[#DC143C]">
                  ⏳ Applications close {closingDate}
                </p>
              )}
              <WebForm />
            </div>
          ) : (
            <div className="rounded-2xl border border-[#DC143C]/30 bg-[#DC143C]/10 p-10 text-center">
              <p className="mb-2 text-xl font-bold">Applications Closed</p>
              <p className="text-sm text-[#999]">
                We&apos;re not currently accepting submissions. Check back soon.
              </p>
            </div>
          )}

          {/* ── Show details — supporting info, below the fold ── */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 border-t border-[#1a1a1a] pt-6">
            <div className="flex items-center gap-2 text-sm text-[#555]">
              <span className="text-[#DC143C]" aria-hidden="true">📍</span>
              <span>The Raging Bull · 161 Lothian Rd, Edinburgh EH3 9AA</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#555]">
              <span className="text-[#DC143C]" aria-hidden="true">🕙</span>
              <span>10:15pm · Aug 6–18</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#1a1a1a] px-4 py-6 text-center text-xs text-[#333]">
        © Pins &amp; Needles Comedy · Edinburgh Fringe
      </footer>
    </div>
  );
}
