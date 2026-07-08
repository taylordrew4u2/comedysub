'use client';

import { useActionState, useState } from 'react';
import { recordAgreement, submitWebForm, type SubmitState } from '../actions';

const initial: SubmitState = {};

const inputClass =
  'w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-[#444] focus:border-[#DC143C] focus:outline-none focus:ring-1 focus:ring-[#DC143C]/50';
const labelClass = 'block mb-1.5 text-xs font-semibold text-[#666] uppercase tracking-wider';

const AUG_DATES = Array.from({ length: 13 }, (_, i) => i + 6);

function AgreementModal({
  refId,
  onDone,
}: {
  refId: number;
  onDone: (agreed: boolean) => void;
}) {
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  async function answer(agreed: boolean) {
    setSaving(true);
    try {
      await recordAgreement(refId, agreed);
    } finally {
      onDone(agreed);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="agreement-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#2a2a2a] bg-[#111] p-6 sm:p-8">
        <p id="agreement-title" className="mb-2 text-xl font-extrabold text-white">
          One last thing
        </p>
        <p className="mb-5 text-sm leading-relaxed text-[#888]">
          Comedians who agree to the below will take priority when we book the lineup.
        </p>

        <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-4">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#DC143C]"
          />
          <span className="text-sm leading-relaxed text-white">
            I agree to bring at least <strong>two people</strong> to the show.
            There is <strong>no drink minimum</strong>.
          </span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={!checked || saving}
            onClick={() => answer(true)}
            className="rounded-xl bg-[#DC143C] py-3 text-sm font-extrabold uppercase tracking-widest text-white transition hover:bg-[#b01030] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'I Agree'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => answer(false)}
            className="rounded-xl border border-[#2a2a2a] py-3 text-sm font-semibold uppercase tracking-widest text-[#888] transition hover:border-[#555] hover:text-white disabled:opacity-40"
          >
            I Disagree
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WebForm() {
  const [state, formAction, isPending] = useActionState(submitWebForm, initial);
  const [agreement, setAgreement] = useState<'agreed' | 'declined' | null>(null);

  if (state.success && state.refId) {
    return (
      <>
        {agreement === null && (
          <AgreementModal refId={state.refId} onDone={(a) => setAgreement(a ? 'agreed' : 'declined')} />
        )}
        <div className="py-6 text-center">
          <p className="mb-1 text-2xl font-extrabold text-white">You&apos;re in!</p>
          <p className="text-sm text-[#666]">
            We&apos;ll be in touch if you&apos;re shortlisted.
          </p>
          {agreement === 'agreed' && (
            <p className="mt-3 text-xs font-semibold text-[#DC143C]">
              ★ Priority noted — thanks for agreeing to bring two people.
            </p>
          )}
          <p className="mt-4 font-mono text-xs text-[#444]">ref #{state.refId}</p>
        </div>
      </>
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
          <label htmlFor="name" className={labelClass}>Name *</label>
          <input id="name" name="name" required autoComplete="name" className={inputClass} placeholder="Jane Doe" />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" name="email" type="email" autoComplete="email" className={inputClass} placeholder="jane@example.com" />
        </div>
      </div>

      <div>
        <label htmlFor="video_url" className={labelClass}>Video Link *</label>
        <input
          id="video_url"
          name="video_url"
          type="url"
          required
          className={inputClass}
          placeholder="YouTube, Vimeo, Dropbox — any shareable link"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="instagram" className={labelClass}>Instagram</label>
          <input id="instagram" name="instagram" className={inputClass} placeholder="@yourhandle" />
        </div>
        <div>
          <label htmlFor="location" className={labelClass}>Where are you located?</label>
          <input
            id="location"
            name="location"
            autoComplete="address-level2"
            maxLength={100}
            className={inputClass}
            placeholder="e.g. Glasgow"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Available dates — August</label>
        <div className="mt-2 grid grid-cols-7 gap-1.5" role="group" aria-label="Available dates in August">
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
        <label htmlFor="headshot" className={labelClass}>
          Headshot <span className="normal-case font-normal text-[#444]">(optional)</span>
        </label>
        <input
          id="headshot"
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
