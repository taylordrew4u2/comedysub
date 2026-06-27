'use client';

import { useActionState } from 'react';
import { submitWebForm, type SubmitState } from '../actions';

const initial: SubmitState = {};

const inputClass =
  'w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-[#444] focus:border-[#DC143C] focus:outline-none focus:ring-1 focus:ring-[#DC143C]/50';
const labelClass = 'block mb-1.5 text-xs font-semibold text-[#666] uppercase tracking-wider';

const AUG_DATES = Array.from({ length: 13 }, (_, i) => i + 6);

const AUG_DATES = Array.from({ length: 13 }, (_, i) => {
  const d = i + 6;
  return { value: `Aug ${d}`, label: `${d}` };
});

export default function WebForm() {
  const [state, formAction, isPending] = useActionState(submitWebForm, initial);

  if (state.success) {
    return (
      <div className="py-6 text-center">
        <p className="mb-1 text-2xl font-extrabold text-white">You&apos;re in!</p>
        <p className="text-sm text-[#666]">
          We&apos;ll be in touch if you&apos;re shortlisted.
        </p>
        <p className="mt-4 font-mono text-xs text-[#444]">ref #{state.refId}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      {state.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Name *</label>
          <input name="name" required className={inputClass} placeholder="Jane Doe" />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input name="email" type="email" className={inputClass} placeholder="jane@example.com" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Video Link *</label>
        <input
          name="video_url"
          type="url"
          required
          className={inputClass}
          placeholder="YouTube, Vimeo, Dropbox — any shareable link"
        />
      </div>

      <div>
        <label className={labelClass}>Instagram</label>
        <input name="instagram" className={inputClass} placeholder="@yourhandle" />
      </div>

      <div>
        <label className={labelClass}>Available dates — August</label>
        <div className="mt-2 grid grid-cols-7 gap-1.5">
          {AUG_DATES.map((d) => (
            <label key={d} className="cursor-pointer">
              <input
                type="checkbox"
                name="availability"
                value={`Aug ${d}`}
                className="peer sr-only"
              />
              <span className="flex h-9 w-full select-none items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] text-xs font-semibold text-[#555] transition peer-checked:border-[#DC143C] peer-checked:bg-[#DC143C]/15 peer-checked:text-white">
                {d}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Headshot <span className="normal-case font-normal text-[#444]">(optional)</span></label>
        <input
          name="headshot"
          type="file"
          accept="image/*"
          className="w-full text-xs text-[#555] file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-[#1a1a1a] file:px-3 file:py-1.5 file:text-xs file:text-white hover:file:bg-[#2a2a2a]"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-[#DC143C] py-3.5 text-sm font-extrabold uppercase tracking-widest text-white transition hover:bg-[#b01030] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Sending…' : 'Apply Now →'}
      </button>

      <p className="text-center text-[10px] text-[#444]">
        Stand-up sets only · We watch every submission
      </p>
    </form>
  );
}
