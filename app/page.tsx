import type { Metadata } from 'next';
import WebForm from './_components/WebForm';

export const metadata: Metadata = {
  title: 'Pins & Needles — Comedian Submissions',
  description:
    'Apply to perform at Pins & Needles, the stand-up comedy showcase at Edinburgh Fringe. Submit your video link here.',
};

export default function HomePage() {
  const isOpen = process.env.APPLICATIONS_OPEN !== 'false';
  const closingDate = process.env.CLOSING_DATE ?? null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ── Nav ── */}
      <header className="border-b border-[#1a1a1a] px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-sm font-bold tracking-widest text-[#DC143C] uppercase">
            Pins &amp; Needles
          </span>
          <span className="text-xs text-[#555]">Edinburgh Fringe</span>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="px-4 py-16 text-center sm:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-[#DC143C]">
            Open Call · Edinburgh Fringe
          </p>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Pins &amp;{' '}
            <span className="text-[#DC143C]">Needles</span>
          </h1>
          <p className="mb-4 text-lg font-medium text-[#ccc] sm:text-xl">
            Stand-up comedy at Edinburgh Fringe.
          </p>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-[#777]">
            We&apos;re looking for stand-up comedians ready to take the Fringe stage.
            Stand-up only — no character acts, no sketch, no spoken word.
            Submit your set video below and we&apos;ll be in touch if you&apos;re shortlisted.
          </p>
        </div>
      </section>

      {/* ── Show Details ── */}
      <section className="px-4 pb-10">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border border-[#1e1e1e] bg-[#111] p-6 text-center">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#DC143C]">
              Show Details
            </p>
            <p className="text-base font-bold text-white">The Raging Bull</p>
            <p className="mt-1 text-sm text-[#888]">161 Lothian Rd, Edinburgh EH3 9AA</p>
            <p className="mt-2 text-sm font-semibold text-[#ccc]">10:15pm · August 6–18</p>
          </div>
        </div>
      </section>

      <div className="border-t border-[#1a1a1a]" />

      {/* ── Submission Form or Closed Banner ── */}
      <section className="px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-md">
          {isOpen ? (
            <>
              <div className="mb-8 text-center">
                <h2 className="mb-2 text-2xl font-bold sm:text-3xl">Submit Your Set</h2>
                <p className="text-sm text-[#777]">
                  Stand-up comedians only. Paste your performance video link below.
                </p>
                {closingDate && (
                  <p className="mt-3 text-xs font-semibold text-[#DC143C]">
                    Applications close {closingDate}
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-[#1e1e1e] bg-[#111] p-6 sm:p-8">
                <WebForm />
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-[#DC143C]/30 bg-[#DC143C]/10 p-10 text-center">
              <p className="mb-2 text-xl font-bold text-white">Applications Closed</p>
              <p className="text-sm text-[#999]">
                We&apos;re not currently accepting submissions. Check back soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1a1a1a] px-4 py-8 text-center text-xs text-[#444]">
        <p>© Pins &amp; Needles Comedy · Edinburgh Fringe</p>
      </footer>
    </div>
  );
}
