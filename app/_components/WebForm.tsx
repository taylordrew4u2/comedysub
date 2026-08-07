'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { submitWebForm, type SubmitState } from '../actions';
import { instagramUrl, toHttpUrl } from '../lib/normalize';
import { nightParts } from '../lib/nights';

const initial: SubmitState = {};

// py-3 + 16px mobile type (see globals.css) keeps every field a ≥44px tap target.
const inputClass =
  'w-full rounded-lg border bg-[#0a0a0a] px-3.5 py-3 text-base text-white placeholder:text-[#444] focus:outline-none focus:ring-1 sm:text-sm';
const okClass = 'border-[#2a2a2a] focus:border-[#DC143C] focus:ring-[#DC143C]/50';
const badClass = 'border-red-500/70 focus:border-red-500 focus:ring-red-500/50';
const labelClass = 'block mb-1.5 text-xs font-semibold text-[#666] uppercase tracking-wider';

const MAX_HEADSHOT_BYTES = 8 * 1024 * 1024;
/** Anything wider than this is shrunk before upload — see prepareHeadshot. */
const MAX_HEADSHOT_EDGE = 1400;

type YesNo = 'yes' | 'no' | null;

type Fields = {
  name: string;
  email: string;
  video_url: string;
  instagram: string;
  location: string;
  questions: string;
  has_tattoos: YesNo;
  multiple_shows: YesNo;
};

const EMPTY: Fields = {
  name: '',
  email: '',
  video_url: '',
  instagram: '',
  location: '',
  questions: '',
  has_tattoos: null,
  multiple_shows: null,
};

/**
 * Every field is required except `questions`, and each one gets its own message.
 *
 * The browser's own `required` can't do this job here: the date, tattoo and
 * headshot controls are custom, so the real inputs behind them are 1px and
 * invisible. Chrome refuses to submit and anchors its bubble to that 1px box —
 * from the comedian's side, the Apply button simply does nothing. So validation
 * lives here, points at the visible control, and says what to fix.
 */
type FieldKey = keyof Fields | 'availability' | 'agreed' | 'headshot';
type Problems = Partial<Record<FieldKey, string>>;

/** Form order, so "the first problem" is the topmost one on screen. */
const FIELD_ORDER: FieldKey[] = [
  'name',
  'email',
  'video_url',
  'instagram',
  'location',
  'availability',
  'multiple_shows',
  'has_tattoos',
  'headshot',
  'agreed',
];

function validate(
  fields: Fields,
  availability: string[],
  agreed: boolean,
  headshot: File | null,
): Problems {
  const problems: Problems = {};

  if (!fields.name.trim()) problems.name = 'Tell us your name.';

  if (!fields.email.trim()) problems.email = 'We need an email to reach you.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    problems.email = 'That email doesn’t look right — check it for a typo.';
  }

  if (!fields.video_url.trim()) problems.video_url = 'Paste a link to your set.';
  else if (!toHttpUrl(fields.video_url)) {
    problems.video_url = 'That doesn’t look like a link — paste the whole URL.';
  }

  if (!fields.instagram.trim()) problems.instagram = 'Add your Instagram — it’s one of the ways we’ll reach you.';
  else if (!instagramUrl(fields.instagram)) {
    problems.instagram = 'That doesn’t look like a handle — try @yourname.';
  }

  if (!fields.location.trim()) problems.location = 'Let us know where you’re based.';
  if (!availability.length) problems.availability = 'Pick at least one night you can perform.';
  if (availability.length > 1 && !fields.multiple_shows) {
    problems.multiple_shows = 'Pick one — more than one show, or just the one.';
  }
  if (!fields.has_tattoos) problems.has_tattoos = 'Let us know either way.';
  if (!headshot) problems.headshot = 'Add a headshot.';
  // The one condition of playing the show, so it gates the form rather than
  // being asked afterwards where the answer could be no.
  if (!agreed) problems.agreed = 'We can only take you if you agree to this.';

  return problems;
}

/**
 * Phone photos routinely land at 5–12 MB, and "pick a smaller one" is a dead end
 * on a phone. Scale the image down instead, and only fall back to the original
 * (and its size limit) if the browser can't decode it.
 */
async function prepareHeadshot(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_HEADSHOT_EDGE / Math.max(bitmap.width, bitmap.height));
    // Already small in both senses — re-encoding would only lose quality.
    if (scale === 1 && file.size <= 1_500_000) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
  } catch {
    // HEIC on an old browser, a corrupt file — let the original take its chances.
    return file;
  }
}

// Comedians routinely leave mid-form to go copy their video link. Keep what
// they've typed so coming back doesn't mean starting over.
const DRAFT_KEY = 'pins-needles-draft-v1';

type Draft = { fields: Partial<Fields>; availability: string[]; agreed?: boolean };

/** Drafts written when the picker dealt in day numbers rather than labels. */
function draftNights(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === 'number' ? `Aug ${v}` : v))
    .filter((v): v is string => typeof v === 'string');
}

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft & { multipleShows?: YesNo };
    if (!parsed || typeof parsed !== 'object') return null;
    const fields = { ...(parsed.fields ?? {}) };
    // Drafts written before multiple_shows moved in with the other fields.
    if (!fields.multiple_shows && parsed.multipleShows) fields.multiple_shows = parsed.multipleShows;
    return {
      fields,
      availability: draftNights(parsed.availability),
      agreed: parsed.agreed === true,
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

/** The message under a field, and the wiring that points the input at it. */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-xs text-red-400">
      <span aria-hidden="true">✗</span>
      {message}
    </p>
  );
}

function AvailabilityPicker({
  nights,
  selected,
  setSelected,
  error,
  groupRef,
}: {
  /** Only the nights still open — the admin can shut one at any time. */
  nights: string[];
  selected: string[];
  setSelected: (next: string[]) => void;
  error?: string;
  groupRef: React.RefObject<HTMLDivElement | null>;
}) {
  const allSelected = selected.length === nights.length;

  function toggle(night: string) {
    // Kept in show order however they were tapped.
    const wanted = new Set(selected);
    if (!wanted.delete(night)) wanted.add(night);
    setSelected(nights.filter((n) => wanted.has(n)));
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
              onClick={() => setSelected([...nights])}
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
          : // The range is read off the open nights: a full night is taken out of
            // the list, and the hint would otherwise still promise it.
            `Tap the nights you can perform${
              nights.length ? ` (${nights[0]}–${nights[nights.length - 1].replace(/^\D+/, '')})` : ''
            }.`}
      </p>

      <div
        ref={groupRef}
        tabIndex={-1}
        className="grid grid-cols-5 gap-2 focus:outline-none sm:grid-cols-7"
        role="group"
        aria-label="Available dates in August"
        aria-describedby={error ? 'availability-error' : undefined}
      >
        {nights.map((night) => {
          const { month, day } = nightParts(night);
          return (
          <label key={night} className="cursor-pointer">
            <input
              type="checkbox"
              name="availability"
              value={night}
              checked={selected.includes(night)}
              onChange={() => toggle(night)}
              className="peer sr-only"
            />
            <span
              /* Softer than a single field's outline — thirteen tiles at full
                 strength shout, and the message below already says it. */
              className={`flex h-12 w-full select-none flex-col items-center justify-center rounded-lg border bg-[#0a0a0a] text-sm font-semibold text-[#555] transition peer-checked:border-[#DC143C] peer-checked:bg-[#DC143C]/15 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#DC143C] ${
                error ? 'border-red-500/40' : 'border-[#2a2a2a]'
              }`}
            >
              {month && (
                <span className="text-[9px] uppercase tracking-wider opacity-60">{month}</span>
              )}
              {day}
            </span>
          </label>
          );
        })}
      </div>
      <FieldError id="availability-error" message={error} />
    </div>
  );
}

/** The yes/no pairs — tattoos and multiple shows — drawn the same way. */
function ChoiceField({
  name,
  label,
  options,
  value,
  onChange,
  error,
  groupRef,
  boxed = false,
}: {
  name: string;
  label: string;
  options: { value: 'yes' | 'no'; label: string }[];
  value: YesNo;
  onChange: (next: YesNo) => void;
  error?: string;
  groupRef: React.RefObject<HTMLDivElement | null>;
  boxed?: boolean;
}) {
  return (
    <div className={boxed ? 'rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-4' : undefined}>
      <span className={`${labelClass} mb-2.5`}>{label}</span>
      <div
        ref={groupRef}
        tabIndex={-1}
        className="grid grid-cols-2 gap-2 focus:outline-none"
        role="radiogroup"
        aria-label={label}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={`flex h-12 w-full select-none items-center justify-center rounded-lg border text-sm font-semibold text-[#555] transition peer-checked:border-[#DC143C] peer-checked:bg-[#DC143C]/15 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#DC143C] ${
                boxed ? 'bg-[#111]' : 'bg-[#0a0a0a]'
              } ${error ? 'border-red-500/70' : 'border-[#2a2a2a]'}`}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}

function HeadshotField({
  file,
  onPick,
  error,
  inputRef,
}: {
  file: File | null;
  onPick: (file: File | null) => void;
  error?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  // Revoke the last object URL whenever it's replaced or the field unmounts.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    setSizeError(null);

    if (!picked) {
      setPreview(null);
      onPick(null);
      return;
    }

    setWorking(true);
    const ready = await prepareHeadshot(picked);
    setWorking(false);

    // Only reachable when the browser couldn't decode the image at all.
    if (ready.size > MAX_HEADSHOT_BYTES) {
      setSizeError('That image is over 8 MB and we couldn’t shrink it — try another.');
      e.target.value = '';
      setPreview(null);
      onPick(null);
      return;
    }

    setPreview(URL.createObjectURL(ready));
    onPick(ready);
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = '';
    setPreview(null);
    setSizeError(null);
    onPick(null);
  }

  const message = sizeError ?? error;

  return (
    <div>
      <label htmlFor="headshot" className={labelClass}>Headshot *</label>

      <input
        ref={inputRef}
        id="headshot"
        name="headshot"
        type="file"
        accept="image/*"
        onChange={handleChange}
        aria-describedby={message ? 'headshot-error' : undefined}
        className="sr-only"
      />

      {working ? (
        <p className="flex min-h-12 items-center justify-center rounded-lg border border-dashed border-[#2a2a2a] px-4 text-sm text-[#888]">
          Getting your photo ready…
        </p>
      ) : preview && file ? (
        <div className="flex items-center gap-3 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Headshot preview"
            className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-[#2a2a2a]"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-[#aaa]">{file.name}</p>
            <p className="mt-0.5 text-[11px] text-[#DC143C]">✓ Ready to send</p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="min-h-11 shrink-0 rounded-lg border border-[#2a2a2a] px-3 text-xs font-semibold text-[#888] transition hover:border-[#DC143C] hover:text-white"
          >
            Replace
          </button>
        </div>
      ) : (
        <label
          htmlFor="headshot"
          className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed bg-[#0a0a0a] px-4 py-3 text-sm transition hover:border-[#DC143C]/60 hover:text-white ${
            message ? 'border-red-500/70 text-red-400' : 'border-[#2a2a2a] text-[#666]'
          }`}
        >
          <span aria-hidden="true">📷</span>
          Take or choose a photo
        </label>
      )}

      <FieldError id="headshot-error" message={message} />
      {!message && !file && (
        <p className="mt-1.5 text-xs text-[#555]">
          Any photo of you is fine — big ones get shrunk automatically.
        </p>
      )}
    </div>
  );
}

export default function WebForm({ nights }: { nights: string[] }) {
  const [state, formAction, isPending] = useActionState(submitWebForm, initial);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [availability, setAvailability] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [headshot, setHeadshot] = useState<File | null>(null);
  const [problems, setProblems] = useState<Problems>({});
  const [draftRestored, setDraftRestored] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const headshotRef = useRef<HTMLInputElement>(null);
  const datesRef = useRef<HTMLDivElement>(null);
  const multiRef = useRef<HTMLDivElement>(null);
  const tattooRef = useRef<HTMLDivElement>(null);
  const agreedRef = useRef<HTMLInputElement>(null);
  // Guards the save effect from firing before the restore effect has run.
  const hydrated = useRef(false);

  /*
   * Restore after mount rather than via an initial value: the draft lives in
   * localStorage, which the server can't read, so seeding it during render
   * would be a hydration mismatch. Syncing state *from* an external store on
   * mount is the case the set-state-in-effect rule exempts — it costs one
   * extra render, once, and only when a draft exists.
   */
  /* Restoring happens once, against the nights on offer at the time; re-running
     it because a night closed would fight whatever they've picked since. */
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    const draft = readDraft();
    hydrated.current = true;
    if (!draft) return;

    // A night that has closed since they started is quietly dropped.
    const days = draft.availability.filter((d) => nights.includes(d));
    const restored: Fields = { ...EMPTY };
    let found = days.length > 0 || draft.agreed === true;

    (Object.keys(EMPTY) as (keyof Fields)[]).forEach((key) => {
      const value = draft.fields[key];
      if (!value) return;
      if (key === 'has_tattoos' || key === 'multiple_shows') {
        if (value === 'yes' || value === 'no') {
          restored[key] = value;
          found = true;
        }
        return;
      }
      if (typeof value === 'string') {
        restored[key] = value;
        found = true;
      }
    });

    if (!found) return;
    setAvailability(days);
    setAgreed(draft.agreed === true);
    setFields(restored);
    setDraftRestored(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const saveDraft = useCallback(() => {
    if (!hydrated.current) return;
    const empty =
      availability.length === 0 &&
      !agreed &&
      (Object.keys(EMPTY) as (keyof Fields)[]).every((k) => !fields[k]);
    try {
      if (empty) localStorage.removeItem(DRAFT_KEY);
      else localStorage.setItem(DRAFT_KEY, JSON.stringify({ fields, availability, agreed }));
    } catch {
      /* storage unavailable — the form still works, it just won't persist */
    }
  }, [fields, availability, agreed]);

  useEffect(() => {
    saveDraft();
  }, [saveDraft]);

  /** Setting a field clears its complaint — you shouldn't have to resubmit to
   *  find out you've fixed it. */
  function setField<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
    setProblems((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function clearProblem(key: FieldKey) {
    setProblems((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function startOver() {
    clearDraft();
    setFields(EMPTY);
    setAvailability([]);
    setAgreed(false);
    setHeadshot(null);
    setProblems({});
    if (headshotRef.current) headshotRef.current.value = '';
    setDraftRestored(false);
  }

  /** Takes them to the first thing that needs fixing, rather than announcing it
   *  somewhere they aren't looking. */
  function goToFirstProblem(found: Problems) {
    const key = FIELD_ORDER.find((f) => found[f]);
    if (!key) return;
    const target =
      key === 'availability'
        ? datesRef.current
        : key === 'multiple_shows'
          ? multiRef.current
          : key === 'has_tattoos'
            ? tattooRef.current
            : key === 'agreed'
              ? agreedRef.current
              : key === 'headshot'
                ? formRef.current?.querySelector<HTMLElement>('label[for="headshot"]')
                : formRef.current?.elements.namedItem(key);
    const el = target instanceof HTMLElement ? target : null;
    el?.scrollIntoView({ block: 'center' });
    el?.focus?.();
  }

  function handleSubmit(formData: FormData) {
    const found = validate(fields, availability, agreed, headshot);
    setProblems(found);
    if (Object.keys(found).length) {
      goToFirstProblem(found);
      return;
    }
    // The file input still holds whatever was picked; send the prepared version.
    if (headshot) formData.set('headshot', headshot, headshot.name);
    formAction(formData);
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
      <div ref={topRef} className="scroll-mt-6 py-6 text-center">
        <p className="mb-1 text-2xl font-extrabold text-white">You&apos;re in!</p>
        <p className="text-sm text-[#666]">
          We&apos;ll be in touch if you&apos;re shortlisted.
        </p>
        {/* Said here as well as on the form — this is the screen people
            actually read, and both a DM from a stranger and a first email
            land somewhere you have to go looking. */}
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-[#aaa]">
          We message on <span className="font-semibold text-white">Instagram</span> and by{' '}
          <span className="font-semibold text-white">email</span> — so keep an eye on your DMs
          (including message requests) and your spam folder.
        </p>
        <p className="mx-auto mt-3 max-w-xs text-xs leading-relaxed text-[#666]">
          Remember: you&apos;ve agreed to bring at least two people if you&apos;re booked.
        </p>
        <p className="mt-4 font-mono text-xs text-[#444]">ref #{state.refId}</p>
      </div>
    );
  }

  const problemCount = Object.keys(problems).length;

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      noValidate
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
            value={fields.name}
            onChange={(e) => setField('name', e.target.value)}
            autoComplete="name"
            autoCapitalize="words"
            enterKeyHint="next"
            aria-invalid={!!problems.name}
            aria-describedby={problems.name ? 'name-error' : undefined}
            className={`${inputClass} ${problems.name ? badClass : okClass}`}
            placeholder="Jane Doe"
          />
          <FieldError id="name-error" message={problems.name} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Email *</label>
          <input
            id="email"
            name="email"
            type="email"
            value={fields.email}
            onChange={(e) => setField('email', e.target.value)}
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            aria-invalid={!!problems.email}
            aria-describedby={problems.email ? 'email-error' : undefined}
            className={`${inputClass} ${problems.email ? badClass : okClass}`}
            placeholder="jane@example.com"
          />
          <FieldError id="email-error" message={problems.email} />
        </div>
      </div>

      <div>
        <label htmlFor="video_url" className={labelClass}>Video Link *</label>
        <input
          id="video_url"
          name="video_url"
          type="text"
          value={fields.video_url}
          onChange={(e) => setField('video_url', e.target.value)}
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          aria-invalid={!!problems.video_url}
          aria-describedby={problems.video_url ? 'video_url-error' : undefined}
          className={`${inputClass} ${problems.video_url ? badClass : okClass}`}
          placeholder="Paste your link here"
        />
        <FieldError id="video_url-error" message={problems.video_url} />
        {!problems.video_url && (
          <p className="mt-1.5 text-xs text-[#555]">
            YouTube, Vimeo, Instagram, Google Drive, Dropbox — any link that plays.
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="instagram" className={labelClass}>Instagram *</label>
          <input
            id="instagram"
            name="instagram"
            value={fields.instagram}
            onChange={(e) => setField('instagram', e.target.value)}
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            aria-invalid={!!problems.instagram}
            aria-describedby={problems.instagram ? 'instagram-error' : undefined}
            className={`${inputClass} ${problems.instagram ? badClass : okClass}`}
            placeholder="@yourhandle"
          />
          <FieldError id="instagram-error" message={problems.instagram} />
          {!problems.instagram && (
            <p className="mt-1.5 text-xs text-[#666]">
              We message here as well as by email — keep an eye on your DMs and message requests.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="location" className={labelClass}>Where are you located? *</label>
          <input
            id="location"
            name="location"
            value={fields.location}
            onChange={(e) => setField('location', e.target.value)}
            autoComplete="address-level2"
            autoCapitalize="words"
            enterKeyHint="done"
            maxLength={100}
            aria-invalid={!!problems.location}
            aria-describedby={problems.location ? 'location-error' : undefined}
            className={`${inputClass} ${problems.location ? badClass : okClass}`}
            placeholder="e.g. Glasgow"
          />
          <FieldError id="location-error" message={problems.location} />
        </div>
      </div>

      <AvailabilityPicker
        nights={nights}
        selected={availability}
        setSelected={(next) => {
          setAvailability(next);
          clearProblem('availability');
          if (next.length < 2) clearProblem('multiple_shows');
        }}
        error={problems.availability}
        groupRef={datesRef}
      />

      {/* Only worth asking once someone has offered more than one night, so it
          appears with the second date and disappears again if they drop back. */}
      {availability.length > 1 && (
        <ChoiceField
          name="multiple_shows"
          label={`You're free on ${availability.length} nights — want more than one show? *`}
          options={[
            { value: 'yes', label: 'Yes please' },
            { value: 'no', label: 'Just one' },
          ]}
          value={fields.multiple_shows}
          onChange={(v) => setField('multiple_shows', v)}
          error={problems.multiple_shows}
          groupRef={multiRef}
          boxed
        />
      )}

      <ChoiceField
        name="has_tattoos"
        label="Do you have any tattoos? *"
        options={[
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ]}
        value={fields.has_tattoos}
        onChange={(v) => setField('has_tattoos', v)}
        error={problems.has_tattoos}
        groupRef={tattooRef}
      />

      <HeadshotField
        file={headshot}
        onPick={(f) => {
          setHeadshot(f);
          if (f) clearProblem('headshot');
        }}
        error={problems.headshot}
        inputRef={headshotRef}
      />

      <div>
        <label htmlFor="questions" className={labelClass}>
          Any questions for us? <span className="normal-case font-normal text-[#444]">(optional)</span>
        </label>
        <textarea
          id="questions"
          name="questions"
          value={fields.questions}
          onChange={(e) => setField('questions', e.target.value)}
          rows={3}
          maxLength={1000}
          enterKeyHint="done"
          className={`${inputClass} ${okClass} resize-y`}
          placeholder="Anything you want to know about the show, the slot, the venue…"
        />
        <p className="mt-1.5 text-xs text-[#555]">
          We&apos;ll answer when we get back to you.
        </p>
      </div>

      {/* The condition of playing the show, so it sits with the button rather
          than after the submission, where the honest answer could be no. */}
      <label
        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
          problems.agreed
            ? 'border-red-500/70 bg-red-500/5'
            : agreed
              ? 'border-[#DC143C] bg-[#DC143C]/10'
              : 'border-[#2a2a2a] bg-[#0a0a0a] hover:border-[#DC143C]/60'
        }`}
      >
        <input
          ref={agreedRef}
          type="checkbox"
          name="agreed"
          checked={agreed}
          onChange={(e) => {
            setAgreed(e.target.checked);
            if (e.target.checked) clearProblem('agreed');
          }}
          aria-invalid={!!problems.agreed}
          aria-describedby={problems.agreed ? 'agreed-error' : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#DC143C]"
        />
        <span className="text-sm leading-relaxed text-white">
          I&apos;ll bring at least <strong>two people</strong> to the show. *
          <span className="mt-1 block text-xs text-[#888]">
            The show is <strong className="font-semibold text-[#aaa]">free</strong> and there&apos;s{' '}
            <strong className="font-semibold text-[#aaa]">no drink minimum</strong>
            {' — '}it&apos;s how we fill the room.
          </span>
        </span>
      </label>
      <FieldError id="agreed-error" message={problems.agreed} />

      <button
        type="submit"
        disabled={isPending}
        className="min-h-14 w-full rounded-xl bg-[#DC143C] py-4 text-sm font-extrabold uppercase tracking-widest text-white transition hover:bg-[#b01030] active:bg-[#b01030] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Sending…' : 'Apply Now →'}
      </button>

      {/* Said next to the button they just pressed, not only up at the field. */}
      <p role="status" aria-live="polite" className="text-center text-xs empty:hidden">
        {problemCount > 0 && (
          <span className="text-red-400">
            {problemCount === 1
              ? 'One thing left — we’ve taken you to it.'
              : `${problemCount} things left — we’ve taken you to the first.`}
          </span>
        )}
      </p>

      <p className="text-center text-[11px] leading-relaxed text-[#444]">
        All fields required except questions · Stand-up sets only · We watch every submission
      </p>
    </form>
  );
}
