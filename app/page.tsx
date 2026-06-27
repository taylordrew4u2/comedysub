import type { Metadata } from 'next';
import WebForm from './_components/WebForm';

export const metadata: Metadata = {
  title: 'Pins & Needles — Comedian Submissions',
  description:
    'Apply to perform at Pins & Needles, the tattooed comedy showcase at Edinburgh Fringe. Submit your video link here.',
};

export default function HomePage() {
  // Set APPLICATIONS_OPEN=false in Vercel env vars to close submissions
  const isOpen = process.env.APPLICATIONS_OPEN !== 'false';
  // Set CLOSING_DATE to e.g. "31 July 2026" to show a deadline notice
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
            The tattoo-fuelled comedy showcase at Edinburgh Fringe.
          </p>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-[#777]">
            We&apos;re looking for stand-up comedians ready to take the Fringe stage.
            Stand-up only — all experience levels welcome.
            Submit your set video below and we&apos;ll be in touch.
          </p>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="border-t border-[#1a1a1a]" />

      {/* ── Submission Form ── */}
      <section className="px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold sm:text-3xl">Submit Your Video</h2>
            <p className="text-sm text-[#777]">
              Stand-up comedians only. Paste a link to your set below.
            </p>
            {closingDate && isOpen && (
              <p className="mt-3 text-xs font-semibold text-[#DC143C] uppercase tracking-wider">
                Submissions close {closingDate}
              </p>
            )}
          </div>

          {isOpen ? (
            <div className="rounded-2xl border border-[#1e1e1e] bg-[#111] p-6 sm:p-8">
              <WebForm />
            </div>
          ) : (
            <div className="rounded-2xl border border-[#1e1e1e] bg-[#111] p-10 text-center">
              <p className="text-2xl mb-3">🔒</p>
              <h3 className="text-lg font-bold text-white mb-2">Applications Closed</h3>
              <p className="text-sm text-[#777]">
                We&apos;re not accepting submissions right now.
                Check back later or follow us on Instagram for updates.
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
