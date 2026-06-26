import type { Metadata } from 'next';
import LineForm from './_components/LineForm';
import WebForm from './_components/WebForm';

export const metadata: Metadata = {
  title: 'Pins & Needles — Edinburgh Fringe Submissions',
  description:
    'Apply to perform at Pins & Needles, the tattooed comedy showcase at Edinburgh Fringe. Submit via LINE or directly on this page.',
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
            All experience levels welcome — we care about authentic voices and raw talent.
            Stand-up, storytelling, character, spoken word. If you&apos;ve got ink and a mic,
            we want to hear from you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#555]">
            <span>📍 Edinburgh, Scotland</span>
            <span>🗓️ August Fringe Season</span>
            <span>🎤 All Acts Welcome</span>
            <span>🖊️ Tattoos Required</span>
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="border-t border-[#1a1a1a]" />

      {/* ── Option A: Submit via LINE ── */}
      <section id="line" className="px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <span className="mb-3 inline-block rounded-full bg-[#06C755]/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#06C755]">
              ★ Recommended
            </span>
            <h2 className="mb-3 text-2xl font-bold sm:text-3xl">
              Submit via LINE
            </h2>
            <p className="mx-auto max-w-lg text-sm text-[#777]">
              The fastest way to reach us — especially if you have a video to share.
              Fill in the fields below, copy your message, then tap{' '}
              <strong className="text-white">Add on LINE</strong> to open a chat
              and paste it. We respond faster on LINE.
            </p>
          </div>
          <LineForm />
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="border-t border-[#1a1a1a]" />

      {/* ── Option B: Submit via Web Form ── */}
      <section id="form" className="px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-2xl font-bold sm:text-3xl">
              Or Submit Directly Here
            </h2>
            <p className="text-sm text-[#777]">
              Prefer a straightforward form? Fill this out and we&apos;ll get back to you.
              You&apos;ll receive a reference ID on submission.
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
        <p className="mt-1">
          Questions?{' '}
          <a
            href="#line"
            className="text-[#DC143C] underline-offset-2 hover:underline"
          >
            Reach us on LINE
          </a>
        </p>
      </footer>
    </div>
  );
}
