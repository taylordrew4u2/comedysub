'use client';

import { useState } from 'react';

const FIELDS = {
  name: '',
  location: '',
  instagram: '',
  has_tattoos: 'yes',
  availability: '',
  experience: '',
  video_url: '',
  bio: '',
};

type FieldKey = keyof typeof FIELDS;

function buildMessage(vals: typeof FIELDS): string {
  const tattoos = vals.has_tattoos === 'yes' ? 'Yes 🖊️' : 'No';
  const lines = [
    `Hi Pins & Needles! I'd love to be considered for Edinburgh Fringe. 🎭`,
    ``,
    `Name: ${vals.name || '[your name]'}`,
    `Location: ${vals.location || '[city, country]'}`,
    `Instagram: ${vals.instagram ? `@${vals.instagram.replace(/^@/, '')}` : '[your handle]'}`,
    `Tattoos: ${tattoos}`,
    `Availability: ${vals.availability || '[dates / when you are free]'}`,
    `Experience: ${vals.experience || '[brief comedy experience]'}`,
    `Video: ${vals.video_url || '[YouTube / Vimeo / Drive link]'}`,
    ``,
    `Bio:`,
    vals.bio || '[tell us about yourself and your comedy style]',
  ];
  return lines.join('\n');
}

// ── UPDATE THIS LINE ID ──────────────────────────────────────────────────────
// Replace 'pinsandneedlescomedy' below with your actual LINE Official Account ID
// (the part after the @ symbol in your LINE OA profile URL).
// e.g. if your LINE OA URL is line.me/R/ti/p/@mycomedy, use 'mycomedy'
const LINE_ID = 'pinsandneedlescomedy';
// ────────────────────────────────────────────────────────────────────────────
const LINE_ADD_URL = `https://line.me/R/ti/p/@${LINE_ID}`;

export default function LineForm() {
  const [vals, setVals] = useState(FIELDS);
  const [copied, setCopied] = useState(false);

  const message = buildMessage(vals);

  function update(key: FieldKey, value: string) {
    setVals((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select the textarea
      const el = document.getElementById('line-preview') as HTMLTextAreaElement;
      el?.select();
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-[#555] focus:border-[#DC143C] focus:outline-none focus:ring-1 focus:ring-[#DC143C]';
  const labelClass = 'block mb-1 text-xs font-semibold uppercase tracking-wider text-[#888]';

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ── Left: fields ── */}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input
              className={inputClass}
              placeholder="Jane Doe"
              value={vals.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>City, Country *</label>
            <input
              className={inputClass}
              placeholder="London, UK"
              value={vals.location}
              onChange={(e) => update('location', e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Instagram Handle</label>
            <input
              className={inputClass}
              placeholder="@yourhandle"
              value={vals.instagram}
              onChange={(e) => update('instagram', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Do you have tattoos? *</label>
            <select
              className={inputClass}
              value={vals.has_tattoos}
              onChange={(e) => update('has_tattoos', e.target.value)}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Availability *</label>
          <input
            className={inputClass}
            placeholder="e.g. 5–25 August, all dates / selected dates"
            value={vals.availability}
            onChange={(e) => update('availability', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Comedy Experience *</label>
          <input
            className={inputClass}
            placeholder="e.g. 3 years, open mics + festival support slots"
            value={vals.experience}
            onChange={(e) => update('experience', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Video Link (recommended)</label>
          <input
            className={inputClass}
            placeholder="YouTube, Vimeo, Google Drive, Dropbox…"
            value={vals.video_url}
            onChange={(e) => update('video_url', e.target.value)}
          />
          <p className="mt-1 text-[11px] text-[#666]">
            Unlisted YouTube, Vimeo, or any shareable link — no file uploads needed
          </p>
        </div>

        <div>
          <label className={labelClass}>Short Bio *</label>
          <textarea
            className={`${inputClass} min-h-[90px] resize-y`}
            placeholder="Tell us who you are and your comedy style…"
            value={vals.bio}
            onChange={(e) => update('bio', e.target.value)}
          />
        </div>
      </div>

      {/* ── Right: preview + CTA ── */}
      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className={labelClass}>Your Message Preview</label>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md bg-[#2a2a2a] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#3a3a3a]"
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <textarea
            id="line-preview"
            readOnly
            value={message}
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#111] p-3 font-mono text-xs leading-relaxed text-[#ccc] focus:outline-none"
            rows={16}
          />
        </div>

        <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-5 text-center">
          <p className="mb-3 text-sm text-[#aaa]">
            1. Copy your message above, then tap below to open LINE
          </p>

          {/* ── ADD ON LINE BUTTON ────────────────────────────────────────── */}
          {/* Update LINE_ID at the top of this file with your real LINE OA ID */}
          <a
            href={LINE_ADD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-xl bg-[#06C755] px-6 py-4 text-base font-bold text-white shadow-lg transition hover:bg-[#05a847] active:scale-95"
          >
            {/* LINE logo SVG */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            Add Pins &amp; Needles on LINE
          </a>
          {/* ──────────────────────────────────────────────────────────────── */}

          <p className="mt-3 text-[11px] text-[#555]">
            2. Paste your copied message in the LINE chat and send!
          </p>
        </div>

        <p className="text-center text-[11px] text-[#444]">
          Prefer email or a form? Scroll down to submit directly on this page.
        </p>
      </div>
    </div>
  );
}
