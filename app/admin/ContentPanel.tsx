'use client';

import { useActionState, useMemo, useState } from 'react';
import { saveContentAction, type SaveState } from '../actions';
import { CONTENT_GROUPS, type ContentField, type SiteContent } from '../lib/content';
import { field as fieldClass, fieldLabel, help, primaryButton, sectionTitle } from './ui';

/**
 * Every word on the public site, in one form.
 *
 * The fields are rendered from `CONTENT_GROUPS` rather than written out here,
 * so adding a line to the site is a change in one file and it appears here.
 */
export default function ContentPanel({ content }: { content: SiteContent }) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    saveContentAction,
    {},
  );
  const [values, setValues] = useState<SiteContent>(content);
  const [group, setGroup] = useState(CONTENT_GROUPS[0].id);

  const current = useMemo(
    () => CONTENT_GROUPS.find((g) => g.id === group) ?? CONTENT_GROUPS[0],
    [group],
  );

  const dirty = useMemo(
    () => Object.keys(values).some((key) => values[key] !== content[key]),
    [values, content],
  );

  function set(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <form action={formAction}>
      {/*
        Every group posts on every save, not just the one on screen. The tabs
        are a way of reading a long form, not separate forms — switching them
        must never quietly drop what was typed in another.
      */}
      {CONTENT_GROUPS.flatMap((g) => g.fields)
        .filter((field) => field.type !== 'toggle')
        .map((field) => (
          <input
            key={field.key}
            type="hidden"
            name={field.key}
            value={values[field.key] ?? ''}
          />
        ))}

      <div className="flex flex-wrap gap-2">
        {CONTENT_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGroup(g.id)}
            aria-pressed={group === g.id}
            className={`rounded-full border px-4 py-2 text-[11px] font-light uppercase tracking-[0.16em] transition-colors ${
              group === g.id
                ? 'border-green-deep bg-green-deep text-cream'
                : 'border-green-wash text-green-deep hover:border-gold'
            }`}
          >
            {g.title}
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-sm border border-green-wash bg-white p-5 sm:p-8">
        <h2 className={sectionTitle}>{current.title}</h2>
        <p className="mt-1 text-sm font-light text-ink-soft">{current.description}</p>

        <div className="mt-8 space-y-7">
          {current.fields.map((field) => (
            <Field
              key={field.key}
              field={field}
              value={values[field.key] ?? ''}
              onChange={(value) => set(field.key, value)}
            />
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-6 flex flex-wrap items-center gap-4 border-t border-green-wash bg-cream/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? 'Saving…' : 'Save changes'}
        </button>
        {state.error ? (
          <span role="alert" className="text-sm font-light text-red-700">
            {state.error}
          </span>
        ) : state.success && !dirty ? (
          <span className="text-sm font-light text-green-mid">
            Saved — the website is updated.
          </span>
        ) : dirty ? (
          <span className="text-sm font-light text-ink-soft">You have unsaved changes.</span>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: ContentField;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `content-${field.key}`;

  if (field.type === 'toggle') {
    const on = value === 'true';
    return (
      <div>
        {/* The real value, so an "off" toggle still posts something. */}
        <input type="hidden" name={field.key} value={on ? 'true' : 'false'} />
        <div className="flex items-start gap-4">
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-labelledby={`${id}-label`}
            onClick={() => onChange(on ? 'false' : 'true')}
            className={`mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
              on ? 'bg-green-deep' : 'bg-cream-dim'
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                on ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span>
            <span id={`${id}-label`} className={fieldLabel}>
              {field.label}
            </span>
            {field.help ? <span className={`${help} block`}>{field.help}</span> : null}
          </span>
        </div>
      </div>
    );
  }

  const rows = field.type === 'lines' ? 5 : field.type === 'textarea' ? 4 : 0;

  return (
    <div>
      <label className={fieldLabel} htmlFor={id}>
        {field.label}
      </label>
      {rows ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          maxLength={5000}
          onChange={(e) => onChange(e.target.value)}
          className={`mt-2 ${fieldClass} resize-y font-light leading-relaxed`}
        />
      ) : (
        <input
          id={id}
          type={field.type === 'url' ? 'url' : 'text'}
          value={value}
          maxLength={5000}
          placeholder={field.type === 'url' ? 'https://…' : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`mt-2 ${fieldClass}`}
        />
      )}
      {field.help ? <p className={help}>{field.help}</p> : null}
    </div>
  );
}
