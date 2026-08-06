'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  deleteBookingAction,
  saveBookingNotesAction,
  setBookingStatusAction,
} from '../actions';
import {
  BOOKING_STATUSES,
  type Booking,
  type BookingStatus,
} from '../lib/db';
import {
  dangerButton,
  formatDate,
  formatTimestamp,
  ghostButton,
  field,
  primaryButton,
} from './ui';

type Filter = 'all' | BookingStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pending', label: 'To answer' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'completed', label: 'Completed' },
  { key: 'declined', label: 'Declined' },
  { key: 'all', label: 'Everything' },
];

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: 'bg-gold-wash text-gold-deep',
  accepted: 'bg-green-wash text-green-deep',
  completed: 'bg-cream-dim text-ink-soft',
  declined: 'bg-red-50 text-red-800',
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Awaiting answer',
  accepted: 'Accepted',
  completed: 'Completed',
  declined: 'Declined',
};

export default function BookingsPanel({
  bookings: initial,
  businessName,
}: {
  bookings: Booking[];
  businessName: string;
}) {
  const [bookings, setBookings] = useState(initial);
  const [filter, setFilter] = useState<Filter>('pending');
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const counts = useMemo(() => {
    const base = Object.fromEntries(BOOKING_STATUSES.map((s) => [s, 0])) as Record<
      BookingStatus,
      number
    >;
    for (const b of bookings) base[b.status] += 1;
    return base;
  }, [bookings]);

  const shown = useMemo(
    () => (filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)),
    [bookings, filter],
  );

  function changeStatus(id: number, status: BookingStatus) {
    const previous = bookings;
    // Moved on the spot, then reconciled: the whole point of the two buttons is
    // that answering a request feels like one tap, not a page load.
    setBookings((rows) => rows.map((b) => (b.id === id ? { ...b, status } : b)));
    setBusyId(id);
    setError(null);

    startTransition(async () => {
      const result = await setBookingStatusAction(id, status);
      setBusyId(null);
      if (result.error) {
        setBookings(previous);
        setError(result.error);
      }
    });
  }

  function remove(booking: Booking) {
    if (
      !window.confirm(
        `Delete ${booking.name}’s request? This can’t be undone — decline it instead if you just want to say no.`,
      )
    ) {
      return;
    }

    const previous = bookings;
    setBookings((rows) => rows.filter((b) => b.id !== booking.id));
    setBusyId(booking.id);
    setError(null);

    startTransition(async () => {
      const result = await deleteBookingAction(booking.id);
      setBusyId(null);
      if (result.error) {
        setBookings(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const count = f.key === 'all' ? bookings.length : counts[f.key];
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={active}
              className={`rounded-full border px-4 py-2 text-[11px] font-light uppercase tracking-[0.16em] transition-colors ${
                active
                  ? 'border-green-deep bg-green-deep text-cream'
                  : 'border-green-wash text-green-deep hover:border-gold'
              }`}
            >
              {f.label}
              <span className={active ? 'ml-2 text-cream/70' : 'ml-2 text-ink-soft/60'}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-6 border-l-2 border-gold bg-gold-wash/50 px-4 py-3 text-sm font-light text-green-deep"
        >
          {error}
        </p>
      ) : null}

      {shown.length === 0 ? (
        <p className="mt-10 rounded-sm border border-dashed border-green-wash px-6 py-14 text-center text-sm font-light text-ink-soft">
          {filter === 'pending'
            ? 'Nothing waiting on you — every request has been answered.'
            : 'No bookings here yet.'}
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {shown.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              busy={busyId === booking.id}
              businessName={businessName}
              onStatus={changeStatus}
              onDelete={remove}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  busy,
  businessName,
  onStatus,
  onDelete,
}: {
  booking: Booking;
  busy: boolean;
  businessName: string;
  onStatus: (id: number, status: BookingStatus) => void;
  onDelete: (booking: Booking) => void;
}) {
  const [notes, setNotes] = useState(booking.admin_notes ?? '');
  const [savedNotes, setSavedNotes] = useState(booking.admin_notes ?? '');
  const [noteState, setNoteState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [openNotes, setOpenNotes] = useState(Boolean(booking.admin_notes));

  const when = `${formatDate(booking.preferred_date)}${
    booking.preferred_time ? ` at ${booking.preferred_time}` : ''
  }`;

  /* A confirmation email the owner sends themselves, from their own mail app —
     no sending domain, no API key, nothing to pay for. */
  const mailto = `mailto:${encodeURIComponent(booking.email)}?subject=${encodeURIComponent(
    `Your appointment at ${businessName}`,
  )}&body=${encodeURIComponent(
    `Hi ${booking.name.split(' ')[0]},\n\nThank you for your request for ${
      booking.service
    } on ${when}.\n\n\n\nWith best wishes,\n${businessName}`,
  )}`;

  async function saveNotes() {
    setNoteState('saving');
    const data = new FormData();
    data.set('id', String(booking.id));
    data.set('admin_notes', notes);
    const result = await saveBookingNotesAction({}, data);
    if (result.error) {
      setNoteState('error');
      return;
    }
    setSavedNotes(notes);
    setNoteState('saved');
  }

  return (
    <li className="rounded-sm border border-green-wash bg-white">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-serif text-xl font-light text-green-deep">{booking.name}</h3>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-light uppercase tracking-[0.16em] ${
                STATUS_STYLE[booking.status]
              }`}
            >
              {STATUS_LABEL[booking.status]}
            </span>
          </div>

          <p className="mt-3 text-[15px] font-light text-ink">
            {booking.service || 'No treatment given'}
          </p>
          <p className="mt-1 text-sm font-light text-gold-deep">{when}</p>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm font-light text-ink-soft">
            <a href={`mailto:${booking.email}`} className="break-all hover:text-gold-deep">
              {booking.email}
            </a>
            {booking.phone ? (
              <a
                href={`tel:${booking.phone.replace(/[^\d+]/g, '')}`}
                className="hover:text-gold-deep"
              >
                {booking.phone}
              </a>
            ) : null}
          </div>

          {booking.notes ? (
            <p className="mt-4 border-l-2 border-green-wash pl-4 text-sm font-light italic leading-relaxed text-ink-soft">
              “{booking.notes}”
            </p>
          ) : null}

          <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-ink-soft/60">
            Request #{booking.id} · {formatTimestamp(booking.created_at)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
          {booking.status === 'pending' ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => onStatus(booking.id, 'accepted')}
                className={primaryButton}
              >
                Accept
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onStatus(booking.id, 'declined')}
                className={ghostButton}
              >
                Decline
              </button>
            </>
          ) : (
            <>
              {booking.status === 'accepted' ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onStatus(booking.id, 'completed')}
                  className={ghostButton}
                >
                  Mark done
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={() => onStatus(booking.id, 'pending')}
                className={ghostButton}
              >
                Reopen
              </button>
            </>
          )}

          <a href={mailto} className={`${ghostButton} text-center`}>
            Email them
          </a>
        </div>
      </div>

      <div className="border-t border-green-wash px-5 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setOpenNotes((v) => !v)}
            className="text-[11px] font-light uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-gold-deep"
          >
            {openNotes ? 'Hide note' : savedNotes ? 'Show note' : 'Add a note'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDelete(booking)}
            className={dangerButton}
          >
            Delete
          </button>
        </div>

        {openNotes ? (
          <div className="pb-2 pt-3">
            <label className="sr-only" htmlFor={`note-${booking.id}`}>
              Private note
            </label>
            <textarea
              id={`note-${booking.id}`}
              value={notes}
              rows={2}
              maxLength={2000}
              onChange={(e) => {
                setNotes(e.target.value);
                setNoteState('idle');
              }}
              placeholder="Private note — only staff see this."
              className={`${field} resize-y`}
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={saveNotes}
                disabled={noteState === 'saving' || notes === savedNotes}
                className={ghostButton}
              >
                {noteState === 'saving' ? 'Saving…' : 'Save note'}
              </button>
              {noteState === 'saved' && notes === savedNotes ? (
                <span className="text-xs font-light text-green-mid">Saved.</span>
              ) : null}
              {noteState === 'error' ? (
                <span className="text-xs font-light text-red-700">
                  Couldn’t save — try again.
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </li>
  );
}
