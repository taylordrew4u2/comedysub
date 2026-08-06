/** Class strings the admin panels share, so the four of them stay in step. */

export const field =
  'w-full rounded-sm border border-green-wash bg-cream px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-soft/50 focus:border-gold focus:outline-none';

export const fieldLabel =
  'block text-[11px] font-light uppercase tracking-[0.18em] text-green-mid';

export const help = 'mt-1.5 text-xs font-light leading-relaxed text-ink-soft/80';

export const card = 'rounded-sm border border-green-wash bg-white p-5 sm:p-6';

export const primaryButton =
  'rounded-full bg-green-deep px-6 py-2.5 text-[11px] font-light uppercase tracking-[0.2em] text-cream transition-colors hover:bg-green disabled:opacity-60';

export const ghostButton =
  'rounded-full border border-green-wash px-5 py-2.5 text-[11px] font-light uppercase tracking-[0.2em] text-green-deep transition-colors hover:border-gold hover:text-gold-deep disabled:opacity-60';

export const dangerButton =
  'rounded-full border border-transparent px-4 py-2.5 text-[11px] font-light uppercase tracking-[0.2em] text-ink-soft/70 transition-colors hover:text-red-700 disabled:opacity-60';

export const sectionTitle = 'font-serif text-2xl font-light text-green-deep';

/** Dates are stored as plain `YYYY-MM-DD`; a fixed locale keeps the server and
 *  client renders identical, which a locale-dependent format would not. */
export function formatDate(value: string): string {
  if (!value) return '';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
