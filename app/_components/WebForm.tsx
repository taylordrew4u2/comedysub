'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { recordAgreement, submitWebForm, type SubmitState } from '../actions';

const initial: SubmitState = {};

// py-3 + 16px mobile type (see globals.css) keeps every field a ≥44px tap target.
const inputClass =
  'w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3.5 py-3 text-base text-white placeholder:text-[#444] focus:border-[#DC143C] focus:outline-none focus:ring-1 focus:ring-[#DC143C]/50 sm:text-sm';
const labelClass = 'block mb-1.5 text-xs font-semibold text-[#666] uppercase tracking-wider';

const AUG_DATES = Array.from({ length: 13 }, (_, i) => i + 6);
const MAX_HEADSHOT_BYTES = 8 * 1024 * 1024;

// Comedians routinely leave mid-form to go copy their video link. Keep what
// they've typed so coming back doesn't mean starting over.
const DRAFT_KEY = 'pins-needles-draft-v1';
const DRAFT_FIELDS = [
  'name',
  'email',
  'video_url',
  'instagram',
  'location',
  'has_tattoos',
  'questions',
] as const;

type YesNo = 'yes' | 'no' | null;
type Draft = {
  fields: Record<string, string>;
  availability: number[];
  multipleShows: YesNo;
};

/*
 * The draft covers text inputs, the questions textarea and the tattoo radio
 * pair. A radio group comes back from form.elements as a RadioNodeList, whose
 * `value` reads the checked option and, on assignment, checks the one that
 * matches — so all three kinds are readable and writable the same way.
 */
type ValueField = HTMLInputElement | HTMLTextAreaElement | RadioNodeList;

function valueField(form: HTMLFormElement, name: string): ValueField | null {
  const field = form.elements.namedItem(name);
  return field instanceof HTMLInputElement ||
    field instanceof HTMLTextAreaElement ||
    field instanceof RadioNodeList
    ? field
    : null;
}

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      fields: parsed.fields ?? {},
      availability: Array.isArray(parsed.availability) ? parsed.availability : [],
      multipleShows:
        parsed.multipleShows === 'yes' || parsed.multipleShows === 'no'
          ? parsed.multipleShows
          : null,
    };
  } catch {
    // Private browsing, disabled storage, or corrupt JSON — drafts are a bonus.
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* nothing to clean up */
  }
}

function AgreementModal({
  refId,
  onDone,
}: {
  refId: number;
  onDone: (agreed: boolean) => void;
}) {
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  // Freeze the page behind the sheet so mobile scroll stays inside the dialog.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

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
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/80 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-[#2a2a2a] bg-[#111] p-6 pb-[calc(1.5rem+var(--safe-bottom))] sm:rounded-2xl sm:p-8 sm:pb-8">
        {/* Grab handle — signals "sheet" on mobile. */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#2a2a2a] sm:hidden" aria-hidden="true" />

        <p id="agreement-title" className="mb-2 text-xl font-extrabold text-white">
          One last thing
        </p>
        <p className="mb-5 text-sm leading-relaxed text-[#888]">
          Comedians who agree to the below will take priority when we book the lineup.
        </p>

        <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-4 transition active:border-[#DC143C]/60">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#DC143C]"
          />
          <span className="text-sm leading-relaxed text-white">
            I agree to bring at least <strong>two people</strong> to the show.
            The show is <strong>free</strong> and there is <strong>no drink minimum</strong>.
          </span>
        </label>

        <div className="flex flex-col-reverse gap-3 sm:grid sm:grid-cols-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => answer(false)}
            className="min-h-12 rounded-xl border border-[#2a2a2a] py-3 text-sm font-semibold uppercase tracking-widest text-[#888] transition hover:border-[#555] hover:text-white disabled:opacity-40"
          >
            I Disagree
          </button>
          <button
            type="button"
            disabled={!checked || saving}
            onClick={() => answer(true)}
            className="min-h-12 rounded-xl bg-[#DC143C] py-3 text-sm font-extrabold uppercase tracking-widest text-white transition hover:bg-[#b01030] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'I Agree'}
          </button>
        </div>
        {!checked && (
          <p className="mt-3 text-center text-[11px] text-[#555]">
            Tick the box above to agree.
          </p>
        )}
      </div>
    </div>
  );
}

function AvailabilityPicker({
  selected,
  setSelected,
}: {
  selected: number[];
  setSelected: (next: number[]) => void;
}) {
  const allSelected = selected.length === AUG_DATES.length;

  function toggle(day: number) {
    setSelected(
      selected.includes(day)
        ? selected.filter((d) => d !== day)
        : [...selected, day],
    );
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className={`${labelClass} mb-0`}>Available dates *</span>
        {/* -my-2 py-2 keeps the tap target ~44px tall without adding visible height. */}
        <div className="-my-2 flex shrink-0 items-center gap-3">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => setSelected([])}
              className="px-1 py-2 text-xs font-semibold text-[#666] underline underline-offset-4 transition hover:text-white"
            >
              Clear
            </button>
          )}
          {!allSelected && (
            <button
              type="button"
              onClick={() => setSelected([...AUG_DATES])}
              className="px-1 py-2 text-xs font-semibold text-[#DC143C] underline underline-offset-4 transition hover:text-white"
            >
              Select all
            </button>
          )}
        </div>
      </div>
      <p className="mb-2.5 text-xs text-[#555]">
        {selected.length > 0
          ? `${selected.length} date${selected.length === 1 ? '' : 's'} selected`
          : 'Tap the nights you can perform (Aug 6–18).'}
      </p>

      <div
        className="grid grid-cols-5 gap-2 sm:grid-cols-7"
        role="group"
        aria-label="Available dates in August"
      >
        {AUG_DATES.map((d) => (
          <label key={d} className="cursor-pointer">
            <input
              type="checkbox"
              name="availability"
              value={`Aug ${d}`}
              checked={selected.includes(d)}
              onChange={() => toggle(d)}
              /* Native "pick at least one": every box is required until one is ticked. */
              required={selected.length === 0}
              className="peer sr-only"
            />
            <span className="flex h-12 w-full select-none flex-col items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] text-sm font-semibold text-[#555] transition peer-checked:border-[#DC143C] peer-checked:bg-[#DC143C]/15 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#DC143C]">
              <span className="text-[9px] uppercase tracking-wider opacity-60">Aug</span>
              {d}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function TattooField() {
  return (
    <div>
      <label className={`${labelClass} mb-2.5`}>Do you have any tattoos? *</label>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Do you have any tattoos?">
        {[
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ].map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name="has_tattoos"
              value={option.value}
              required
              className="peer sr-only"
            />
            <span className="flex h-12 w-full select-none items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] text-sm font-semibold text-[#555] transition peer-checked:border-[#DC143C] peer-checked:bg-[#DC143C]/15 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#DC143C]">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * Only worth asking once someone has offered more than one night, so it appears
 * with the second date and disappears again if they drop back to one. Controlled
 * state rather than an uncontrolled input, so restoring a draft doesn't race the
 * re-render that mounts it.
 */
function MultipleShowsField({
  dateCount,
  value,
  onChange,
}: {
  dateCount: number;
  value: YesNo;
  onChange: (next: YesNo) => void;
}) {
  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-4">
      <label className={`${labelClass} mb-2.5`}>
        You&apos;re free on {dateCount} nights — want more than one show? *
      </label>
      <div
        className="grid grid-cols-2 gap-2"
        role="radiogroup"
        aria-label="Would you like to perform multiple shows?"
      >
        {[
          { value: 'yes' as const, label: 'Yes please' },
          { value: 'no' as const, label: 'Just one' },
        ].map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name="multiple_shows"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              required
              className="peer sr-only"
            />
            <span className="flex h-12 w-full select-none items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#111] text-sm font-semibold text-[#555] transition peer-checked:border-[#DC143C] peer-checked:bg-[#DC143C]/15 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#DC143C]">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function QuestionsField() {
  return (
    <div>
      <label htmlFor="questions" className={labelClass}>
        Any questions for us? <span className="normal-case font-normal text-[#444]">(optional)</span>
      </label>
      <textarea
        id="questions"
        name="questions"
        rows={3}
        maxLength={1000}
        enterKeyHint="done"
        className={`${inputClass} resize-y`}
        placeholder="Anything you want to know about the show, the slot, the venue…"
      />
      <p className="mt-1.5 text-xs text-[#555]">
        We&apos;ll answer when we get back to you.
      </p>
    </div>
  );
}

function HeadshotField() {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke the last object URL whenever it's replaced or the field unmounts.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setSizeError(null);

    if (!file) {
      setPreview(null);
      setFileName(null);
      return;
    }

    if (file.size > MAX_HEADSHOT_BYTES) {
      setSizeError('That image is over 8 MB — please pick a smaller one.');
      e.target.value = '';
      setPreview(null);
      setFileName(null);
      return;
    }

    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = '';
    setPreview(null);
    setFileName(null);
    setSizeError(null);
  }

  return (
    <div>
      <label htmlFor="headshot" className={labelClass}>Headshot *</label>

      <input
        ref={inputRef}
        id="headshot"
        name="headshot"
        type="file"
        accept="image/*"
        required={!fileName}
        onChange={handleChange}
        className="sr-only"
      />

      {preview ? (
        <div className="flex items-center gap-3 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Headshot preview"
            className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-[#2a2a2a]"
          />
          <p className="min-w-0 flex-1 truncate text-xs text-[#888]">{fileName}</p>
          <button
            type="button"
            onClick={clear}
            className="min-h-11 shrink-0 rounded-lg border border-[#2a2a2a] px-3 text-xs font-semibold text-[#888] transition hover:border-[#DC143C] hover:text-white"
          >
            Remove
          </button>
        </div>
      ) : (
        <label
          htmlFor="headshot"
          className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-sm text-[#666] transition hover:border-[#DC143C]/60 hover:text-white"
        >
          <span aria-hidden="true">📷</span>
          Take or choose a photo
        </label>
      )}

      {sizeError && <p className="mt-1.5 text-xs text-red-400">{sizeError}</p>}
    </div>
  );
}

export default function WebForm() {
  const [state, formAction, isPending] = useActionState(submitWebForm, initial);
  const [agreement, setAgreement] = useState<'agreed' | 'declined' | null>(null);
  const [availability, setAvailability] = useState<number[]>([]);
  const [multipleShows, setMultipleShows] = useState<YesNo>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // Guards the save effect from firing before the restore effect has run.
  const hydrated = useRef(false);

  /*
   * Restore after mount rather than via defaultValue: the draft lives in
   * localStorage, which the server can't read, so seeding it during render
   * would be a hydration mismatch. Syncing state *from* an external store on
   * mount is the case the set-state-in-effect rule exempts — it costs one
   * extra render, once, and only when a draft exists.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const draft = readDraft();
    hydrated.current = true;
    const form = formRef.current;
    if (!draft || !form) return;

    let restoredSomething = false;
    for (const key of DRAFT_FIELDS) {
      const value = draft.fields[key];
      const field = valueField(form, key);
      if (typeof value === 'string' && value && field) {
        field.value = value;
        restoredSomething = true;
      }
    }

    const days = draft.availability.filter((d) => AUG_DATES.includes(d));
    if (days.length) {
      setAvailability(days);
      restoredSomething = true;
    }
    if (days.length > 1 && draft.multipleShows) {
      setMultipleShows(draft.multipleShows);
      restoredSomething = true;
    }

    if (restoredSomething) setDraftRestored(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveDraft = useCallback(() => {
    if (!hydrated.current) return;
    const form = formRef.current;
    if (!form) return;

    const fields: Record<string, string> = {};
    for (const key of DRAFT_FIELDS) {
      const value = valueField(form, key)?.value.trim() ?? '';
      if (value) fields[key] = value;
    }

    try {
      if (!Object.keys(fields).length && !availability.length && !multipleShows) {
        localStorage.removeItem(DRAFT_KEY);
      } else {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ fields, availability, multipleShows }),
        );
      }
    } catch {
      /* storage unavailable — the form still works, it just won't persist */
    }
  }, [availability, multipleShows]);

  useEffect(() => {
    saveDraft();
  }, [saveDraft]);

  function startOver() {
    clearDraft();
    formRef.current?.reset();
    setAvailability([]);
    setMultipleShows(null);
    setDraftRestored(false);
  }

  // On a phone the submit button sits well below the fold — pull the result
  // (success or error) back into view instead of leaving a blank screen.
  useEffect(() => {
    if (state.success || state.error) {
      topRef.current?.scrollIntoView({ block: 'center' });
    }
  }, [state.success, state.error]);

  // The draft has served its purpose once the submission is in.
  useEffect(() => {
    if (state.success) clearDraft();
  }, [state.success]);

  if (state.success && state.refId) {
    return (
      <>
        {agreement === null && (
          <AgreementModal refId={state.refId} onDone={(a) => setAgreement(a ? 'agreed' : 'declined')} />
        )}
        <div ref={topRef} className="scroll-mt-6 py-6 text-center">
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
    <form
      ref={formRef}
      action={formAction}
      onChange={saveDraft}
      className="space-y-5"
      encType="multipart/form-data"
    >
      <div ref={topRef} className="scroll-mt-6" aria-live="polite">
        {state.error && (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {state.error}
          </div>
        )}
      </div>

      {draftRestored && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3">
          <p className="text-xs text-[#888]">
            <span className="text-[#DC143C]">✓</span> We kept what you started earlier.
          </p>
          <button
            type="button"
            onClick={startOver}
            className="shrink-0 text-xs font-semibold text-[#666] underline underline-offset-4 transition hover:text-white"
          >
            Start over
          </button>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>Name *</label>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            autoCapitalize="words"
            enterKeyHint="next"
            className={inputClass}
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Email *</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            className={inputClass}
            placeholder="jane@example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="video_url" className={labelClass}>Video Link *</label>
        <input
          id="video_url"
          name="video_url"
          type="text"
          required
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          className={inputClass}
          placeholder="Paste your link here"
        />
        <p className="mt-1.5 text-xs text-[#555]">
          YouTube, Vimeo, Instagram, Google Drive, Dropbox — any link that plays.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="instagram" className={labelClass}>Instagram *</label>
          <input
            id="instagram"
            name="instagram"
            required
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            className={inputClass}
            placeholder="@yourhandle"
          />
        </div>
        <div>
          <label htmlFor="location" className={labelClass}>Where are you located? *</label>
          <input
            id="location"
            name="location"
            required
            autoComplete="address-level2"
            autoCapitalize="words"
            enterKeyHint="done"
            maxLength={100}
            className={inputClass}
            placeholder="e.g. Glasgow"
          />
        </div>
      </div>

      <AvailabilityPicker selected={availability} setSelected={setAvailability} />

      {availability.length > 1 && (
        <MultipleShowsField
          dateCount={availability.length}
          value={multipleShows}
          onChange={setMultipleShows}
        />
      )}

      <TattooField />

      <HeadshotField />

      <QuestionsField />

      <button
        type="submit"
        disabled={isPending}
        className="min-h-14 w-full rounded-xl bg-[#DC143C] py-4 text-sm font-extrabold uppercase tracking-widest text-white transition hover:bg-[#b01030] active:bg-[#b01030] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Sending…' : 'Apply Now →'}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-[#444]">
        All fields required except questions · Stand-up sets only · We watch every submission
      </p>
    </form>
  );
}
