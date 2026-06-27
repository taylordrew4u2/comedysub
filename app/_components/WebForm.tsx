'use client';

import { useActionState, useState } from 'react';
import { submitWebForm, type SubmitState } from '../actions';

const initial: SubmitState = {};

const inputClass =
  'w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-[#555] focus:border-[#DC143C] focus:outline-none focus:ring-1 focus:ring-[#DC143C]';
const labelClass =
  'block mb-1 text-xs font-semibold uppercase tracking-wider text-[#888]';

export default function WebForm() {
  const [state, formAction, isPending] = useActionState(submitWebForm, initial);
  const [preview, setPreview] = useState<string | null>(null);

  if (state.success) {
    return (
      <div className="rounded-xl border border-[#DC143C]/40 bg-[#DC143C]/10 p-8 text-center">
        <div className="mb-3 text-4xl">🎉</div>
        <h3 className="mb-2 text-xl font-bold text-white">Submission received!</h3>
        <p className="text-[#aaa]">
          Thanks for applying to Pins &amp; Needles Edinburgh Fringe.
          We&apos;ll be in touch if you&apos;re shortlisted.
        </p>
        <p className="mt-4 text-sm text-[#666]">
          Reference ID: <span className="font-mono font-bold text-[#DC143C]">#{state.refId}</span>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" encType="multipart/form-data">
      {state.error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div>
        <label className={labelClass}>Your Name *</label>
        <input
          name="name"
          required
          className={inputClass}
          placeholder="Jane Doe"
        />
      </div>

      <div>
        <label className={labelClass}>Email Address</label>
        <input
          name="email"
          type="email"
          className={inputClass}
          placeholder="jane@example.com"
        />
        <p className="mt-1 text-[11px] text-[#555]">
          So we can contact you directly if shortlisted.
        </p>
      </div>

      <div>
        <label className={labelClass}>Submission Video Link *</label>
        <input
          name="video_url"
          type="url"
          required
          className={inputClass}
          placeholder="YouTube, Vimeo, Google Drive, Dropbox — any shareable link"
        />
        <p className="mt-1 text-[11px] text-[#555]">
          Paste a link to your performance video. Unlisted YouTube links work great.
        </p>
      </div>

      <div>
        <label className={labelClass}>Instagram Handle</label>
        <input
          name="instagram"
          className={inputClass}
          placeholder="@yourhandle"
        />
      </div>

      <div>
        <label className={labelClass}>Headshot <span className="normal-case text-[#555]">(optional)</span></label>
        {preview && (
          <div className="mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Headshot preview"
              className="h-24 w-24 rounded-lg object-cover border border-[#2a2a2a]"
            />
          </div>
        )}
        <input
          name="headshot"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setPreview(URL.createObjectURL(file));
            else setPreview(null);
          }}
          className="w-full text-sm text-[#888] file:mr-3 file:rounded file:border-0 file:bg-[#1a1a1a] file:px-3 file:py-1.5 file:text-xs file:text-white file:cursor-pointer hover:file:bg-[#2a2a2a]"
        />
        <p className="mt-1 text-[11px] text-[#555]">
          JPG, PNG, or WebP. Max 4 MB.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-[#DC143C] py-3 text-base font-bold text-white transition hover:bg-[#b01030] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Submitting…' : 'Submit'}
      </button>

      <p className="text-center text-[11px] text-[#555]">
        We watch every submission. We&apos;ll reach out if you&apos;re shortlisted.
      </p>
    </form>
  );
}
