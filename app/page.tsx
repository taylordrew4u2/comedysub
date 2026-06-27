import type { Metadata } from 'next';
import WebForm from './_components/WebForm';

export const metadata: Metadata = {
  title: 'Pins & Needles — Comedian Submissions',
  description:
    'Apply to perform at Pins & Needles, the tattooed comedy showcase at Edinburgh Fringe. Submit your video link here.',
};

export default function HomePage() {
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
            We&apos;re looking for bold, inked-up comedians ready to take the Fringe stage.
            All experience levels welcome — stand-up, storytelling, character, spoken word.
            Submit your video below and we&apos;ll be in touch.
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
              Comedians only. Paste your performance video link below.
            </p>
          </div>
          <div className="rounded-2xl border border-[#1e1e1e] bg-[#111] p-6 sm:p-8">
            <WebForm />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1a1a1a] px-4 py-8 text-center text-xs text-[#444]">
        <p>© Pins &amp; Needles Comedy · Edinburgh Fringe</p>
      </footer>
    </div>
  );
}
