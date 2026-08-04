/**
 * The nights the show runs, in one place.
 *
 * The public form offers these, the admin opens and closes them, and both the
 * booked-nights index and the submitted availability are stored as these exact
 * labels — so they have to come from the same list rather than three copies of
 * "Aug 6".
 */

const FIRST_DAY = 6;
const LAST_DAY = 18;
const MONTH = 'Aug';

export const SHOW_NIGHTS: string[] = Array.from(
  { length: LAST_DAY - FIRST_DAY + 1 },
  (_, i) => `${MONTH} ${FIRST_DAY + i}`,
);

/** The stored format everywhere: a comma-separated list of night labels. */
export function splitNights(value: string | null | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
}

export function joinNights(nights: string[]): string {
  return nights.join(', ');
}

/** "Aug 6" sorts before "Aug 13" — by the day, not by the string. */
export function byNight(a: string, b: string): number {
  const dayA = parseInt(a.replace(/\D+/g, ''), 10);
  const dayB = parseInt(b.replace(/\D+/g, ''), 10);
  if (Number.isNaN(dayA) || Number.isNaN(dayB) || dayA === dayB) return a.localeCompare(b);
  return dayA - dayB;
}

/** Splits "Aug 6" for the two-line date tiles. Falls back to the whole label. */
export function nightParts(night: string): { month: string; day: string } {
  const match = night.match(/^(\D+)\s*(\d+)$/);
  return match ? { month: match[1].trim(), day: match[2] } : { month: '', day: night };
}
