'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { requestBooking, type BookingState } from '../actions';

interface BookingFormProps {
  services: { id: number; name: string; duration: string }[];
  slots: string[];
  confirmation: string;
  /** Pre-selects a treatment when someone came from a "Book this" link. */
  initialService?: string;
}

const field =
  'w-full rounded-none border-0 border-b border-green-wash bg-transparent px-0 py-3 text-[15px] text-ink placeholder:text-ink-soft/60 focus:border-gold focus:outline-none';
const label = 'block text-[11px] font-light uppercase tracking-[0.22em] text-green-mid';

/** Today in the browser's own timezone — `toISOString` would shift it west. */
function todayLocal(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export default function BookingForm({
  services,
  slots,
  confirmation,
  initialService,
}: BookingFormProps) {
  const [state, formAction, pending] = useActionState<BookingState, FormData>(
    requestBooking,
    {},
  );
  const [service, setService] = useState(initialService ?? services[0]?.name ?? '');

  /* The earliest bookable day has to come from the visitor's own clock — a
     server-rendered date can be a day out — so it is written onto the input
     after mount rather than rendered. The server re-checks it either way. */
  const dateRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (dateRef.current) dateRef.current.min = todayLocal();
  }, []);

  const chosen = useMemo(
    () => services.find((s) => s.name === service),
    [services, service],
  );

  if (state.success) {
    return (
      <div className="border border-gold-soft/60 bg-cream-deep/60 p-8 text-center sm:p-12">
        <svg
          viewBox="0 0 24 24"
          className="mx-auto h-10 w-10 text-gold"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m8 12.5 2.5 2.5L16 9.5" />
        </svg>
        <p className="mt-6 font-serif text-2xl text-green-deep">Request received</p>
        <p className="mx-auto mt-3 max-w-md whitespace-pre-line text-[15px] font-light leading-relaxed text-ink-soft">
          {confirmation}
        </p>
        {state.refId ? (
          <p className="mt-6 text-[11px] uppercase tracking-[0.24em] text-green-soft">
            Reference #{state.refId}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="booking-name">
            Your name
          </label>
          <input
            id="booking-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={120}
            className={field}
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className={label} htmlFor="booking-email">
            Email
          </label>
          <input
            id="booking-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={200}
            className={field}
            placeholder="jane@example.com"
          />
        </div>
        <div>
          <label className={label} htmlFor="booking-phone">
            Phone <span className="normal-case tracking-normal text-ink-soft/70">(optional)</span>
          </label>
          <input
            id="booking-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            className={field}
            placeholder="07700 900000"
          />
        </div>
        <div>
          <label className={label} htmlFor="booking-service">
            Treatment
          </label>
          <select
            id="booking-service"
            name="service"
            required
            value={service}
            onChange={(e) => setService(e.target.value)}
            className={`${field} appearance-none bg-[length:0.7rem] bg-[right_0.2rem_center] bg-no-repeat pr-6`}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23a89240' stroke-width='1.4'/%3E%3C/svg%3E\")",
            }}
          >
            {services.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          {chosen?.duration ? (
            <p className="mt-2 text-xs font-light text-ink-soft">
              {chosen.duration} · complimentary
            </p>
          ) : null}
        </div>
        <div>
          <label className={label} htmlFor="booking-date">
            Preferred date
          </label>
          <input
            id="booking-date"
            ref={dateRef}
            name="preferred_date"
            type="date"
            required
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="booking-time">
            Preferred time
          </label>
          <select
            id="booking-time"
            name="preferred_time"
            required
            defaultValue={slots[0] ?? ''}
            className={`${field} appearance-none bg-[length:0.7rem] bg-[right_0.2rem_center] bg-no-repeat pr-6`}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23a89240' stroke-width='1.4'/%3E%3C/svg%3E\")",
            }}
          >
            {slots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label} htmlFor="booking-notes">
          Anything we should know?{' '}
          <span className="normal-case tracking-normal text-ink-soft/70">(optional)</span>
        </label>
        <textarea
          id="booking-notes"
          name="notes"
          rows={3}
          maxLength={1000}
          className={`${field} resize-y`}
          placeholder="Injuries, pregnancy, allergies, or anything you'd like us to take account of."
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="border-l-2 border-gold bg-gold-wash/50 px-4 py-3 text-sm font-light text-green-deep"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-green-deep px-10 py-4 text-[11px] font-light uppercase tracking-[0.28em] text-cream transition-colors hover:bg-green disabled:opacity-60 sm:w-auto"
        >
          {pending ? 'Sending…' : 'Send request'}
        </button>
        <p className="text-xs font-light text-ink-soft">
          No payment is taken — every treatment is free.
        </p>
      </div>
    </form>
  );
}
