'use client';

import { useState, useTransition } from 'react';
import { deleteServiceAction, saveServiceAction } from '../actions';
import type { Service } from '../lib/db';
import {
  dangerButton,
  field,
  fieldLabel,
  ghostButton,
  help,
  primaryButton,
  sectionTitle,
} from './ui';

/** A row being edited: a real service, or a blank one that has no id yet. */
type Draft = Omit<Service, 'id'> & { id: number | null };

const BLANK: Draft = {
  id: null,
  name: '',
  description: '',
  duration: '60 minutes',
  sort_order: 0,
  is_active: true,
};

export default function ServicesPanel({ services: initial }: { services: Service[] }) {
  const [services, setServices] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  function edit(service: Service) {
    setError(null);
    setDraft({ ...service });
  }

  function add() {
    setError(null);
    // Lands at the end of the list rather than the top — the order on screen is
    // the order visitors read.
    const nextOrder = services.reduce((max, s) => Math.max(max, s.sort_order), 0) + 1;
    setDraft({ ...BLANK, sort_order: nextOrder });
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);

    const data = new FormData();
    if (draft.id !== null) data.set('id', String(draft.id));
    data.set('name', draft.name);
    data.set('description', draft.description);
    data.set('duration', draft.duration);
    data.set('sort_order', String(draft.sort_order));
    data.set('is_active', draft.is_active ? 'true' : 'false');

    const result = await saveServiceAction({}, data);
    setSaving(false);

    if (result.error || result.savedId === undefined) {
      setError(result.error ?? 'Failed to save the treatment.');
      return;
    }

    const saved: Service = { ...draft, id: result.savedId };
    setServices((rows) => {
      const next = rows.some((s) => s.id === saved.id)
        ? rows.map((s) => (s.id === saved.id ? saved : s))
        : [...rows, saved];
      return next.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    });
    setDraft(null);
  }

  function remove(service: Service) {
    if (!window.confirm(`Remove “${service.name}” from the website?`)) return;

    const previous = services;
    setServices((rows) => rows.filter((s) => s.id !== service.id));
    setError(null);

    startTransition(async () => {
      const result = await deleteServiceAction(service.id);
      if (result.error) {
        setServices(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className={sectionTitle}>Treatments</h2>
          <p className="mt-1 max-w-lg text-sm font-light text-ink-soft">
            What appears under “Our offer”, and what people can pick on the booking
            form. Everything here is free — there is nowhere to put a price.
          </p>
        </div>
        <button type="button" onClick={add} className={primaryButton}>
          Add a treatment
        </button>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-6 border-l-2 border-gold bg-gold-wash/50 px-4 py-3 text-sm font-light text-green-deep"
        >
          {error}
        </p>
      ) : null}

      {draft ? (
        <div className="mt-6 rounded-sm border border-gold/50 bg-white p-5 sm:p-6">
          <h3 className="font-serif text-xl font-light text-green-deep">
            {draft.id === null ? 'New treatment' : 'Editing treatment'}
          </h3>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={fieldLabel} htmlFor="service-name">
                Name
              </label>
              <input
                id="service-name"
                type="text"
                value={draft.name}
                maxLength={120}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className={`mt-2 ${field}`}
                placeholder="Swedish Relaxation Massage"
              />
            </div>

            <div className="sm:col-span-2">
              <label className={fieldLabel} htmlFor="service-description">
                Description
              </label>
              <textarea
                id="service-description"
                rows={3}
                value={draft.description}
                maxLength={1000}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className={`mt-2 ${field} resize-y`}
              />
            </div>

            <div>
              <label className={fieldLabel} htmlFor="service-duration">
                Length
              </label>
              <input
                id="service-duration"
                type="text"
                value={draft.duration}
                maxLength={60}
                onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
                className={`mt-2 ${field}`}
                placeholder="60 minutes"
              />
            </div>

            <div>
              <label className={fieldLabel} htmlFor="service-order">
                Position in the list
              </label>
              <input
                id="service-order"
                type="number"
                value={draft.sort_order}
                onChange={(e) =>
                  setDraft({ ...draft, sort_order: parseInt(e.target.value, 10) || 0 })
                }
                className={`mt-2 ${field}`}
              />
              <p className={help}>Lower numbers come first.</p>
            </div>

            <label className="flex items-center gap-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                className="h-4 w-4 accent-[#3f5138]"
              />
              <span className="text-sm font-light text-ink">
                Show this on the website
              </span>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={save} disabled={saving} className={primaryButton}>
              {saving ? 'Saving…' : 'Save treatment'}
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              disabled={saving}
              className={ghostButton}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {services.length === 0 ? (
        <p className="mt-8 rounded-sm border border-dashed border-green-wash px-6 py-14 text-center text-sm font-light text-ink-soft">
          No treatments yet. Add one and it appears on the website straight away.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {services.map((service) => (
            <li
              key={service.id}
              className="flex flex-col gap-4 rounded-sm border border-green-wash bg-white p-5 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-serif text-lg font-light text-green-deep">
                    {service.name}
                  </h3>
                  {service.is_active ? null : (
                    <span className="rounded-full bg-cream-dim px-3 py-1 text-[10px] font-light uppercase tracking-[0.16em] text-ink-soft">
                      Hidden
                    </span>
                  )}
                </div>
                {service.duration ? (
                  <p className="mt-1 text-[11px] font-light uppercase tracking-[0.16em] text-gold-deep">
                    {service.duration}
                  </p>
                ) : null}
                {service.description ? (
                  <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-ink-soft">
                    {service.description}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <button type="button" onClick={() => edit(service)} className={ghostButton}>
                  Edit
                </button>
                <button type="button" onClick={() => remove(service)} className={dangerButton}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
