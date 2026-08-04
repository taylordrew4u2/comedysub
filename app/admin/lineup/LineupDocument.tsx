import Link from 'next/link';
import type { Submission } from '../../lib/db';
import { instagramUrl, normalizeInstagram, toHttpUrl } from '../../lib/normalize';
import { byNight, splitNights } from '../../lib/nights';
import PrintButton from './PrintButton';

/*
 * The printable document itself, split from the page so it can be rendered with
 * fixture data without a live database behind it.
 *
 * Grouped by night rather than listed flat: on the door this is read one night
 * at a time, and "who's on tonight" shouldn't mean scanning every entry for a
 * date. Someone booked on two nights appears under both — they're on both.
 */
export default function LineupDocument({
  booked,
  printedOn,
  dbError = false,
}: {
  booked: Submission[];
  printedOn: string;
  dbError?: boolean;
}) {
  const nights = new Map<string, Submission[]>();
  const undated: Submission[] = [];

  booked.forEach((sub) => {
    const on = splitNights(sub.booked_dates);
    if (!on.length) {
      undated.push(sub);
      return;
    }
    on.forEach((night) => {
      const list = nights.get(night);
      if (list) list.push(sub);
      else nights.set(night, [sub]);
    });
  });

  const running = [...nights.entries()].sort((a, b) => byNight(a[0], b[0]));

  return (
    <div className="lineup min-h-dvh bg-white text-black">
      {/* Toolbar — screen only, never printed. */}
      <div className="no-print sticky top-0 z-10 border-b border-neutral-200 bg-white px-safe py-3">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            className="min-h-11 self-center text-sm font-semibold text-neutral-600 underline underline-offset-4 hover:text-black"
          >
            ← Back to dashboard
          </Link>
          <PrintButton />
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-8 print:px-0 print:py-0">
        <header className="mb-8 border-b-2 border-black pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Pins &amp; Needles</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Booked lineup · The Raging Bull, Edinburgh Fringe · 22:15, Aug 6–18
          </p>
          <p className="mt-3 text-sm font-semibold">
            {booked.length} comedian{booked.length === 1 ? '' : 's'} booked
            {running.length > 0 && (
              <> across {running.length} night{running.length === 1 ? '' : 's'}</>
            )}
            <span className="font-normal text-neutral-500"> · printed {printedOn}</span>
          </p>
        </header>

        {dbError ? (
          <p className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            Could not load submissions from the database.
          </p>
        ) : booked.length === 0 ? (
          <p className="rounded border border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-600">
            Nobody is marked <strong>booked</strong> yet. Set a submission&apos;s status to
            Booked in the dashboard and it will appear here.
          </p>
        ) : (
          <>
            {running.map(([night, on]) => (
              <section key={night} className="mb-8">
                {/* break-after-avoid keeps a night's heading with its first act. */}
                <h2 className="mb-3 break-after-avoid border-b border-black pb-1 text-xl font-bold">
                  {night}
                  <span className="ml-2 text-sm font-normal text-neutral-600">
                    {on.length} comedian{on.length === 1 ? '' : 's'}
                  </span>
                </h2>
                <ol className="space-y-4">
                  {on.map((sub, i) => (
                    <ComedianCard key={sub.id} sub={sub} position={i + 1} night={night} />
                  ))}
                </ol>
              </section>
            ))}

            {undated.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 break-after-avoid border-b border-black pb-1 text-xl font-bold">
                  Night not set
                  <span className="ml-2 text-sm font-normal text-neutral-600">
                    {undated.length} comedian{undated.length === 1 ? '' : 's'}
                  </span>
                </h2>
                <p className="mb-3 text-sm text-neutral-600">
                  Booked, but no night picked yet — set their nights on the dashboard and
                  they&apos;ll move up into the running order.
                </p>
                <ol className="space-y-4">
                  {undated.map((sub, i) => (
                    <ComedianCard key={sub.id} sub={sub} position={i + 1} />
                  ))}
                </ol>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ComedianCard({
  sub,
  position,
  night,
}: {
  sub: Submission;
  position: number;
  /** Set when printed under a night, so the card can name their other ones. */
  night?: string;
}) {
  const handle = normalizeInstagram(sub.instagram);
  const igHref = instagramUrl(sub.instagram);
  const videoHref = toHttpUrl(sub.video_url);
  const alsoOn = night ? splitNights(sub.booked_dates).filter((n) => n !== night) : [];

  return (
    <li
      // Keep each comedian whole rather than split across a page break.
      className="break-inside-avoid rounded border border-neutral-300 p-4"
    >
      <div className="flex items-start gap-4">
        {sub.headshot_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={sub.headshot_url}
            alt=""
            className="h-20 w-20 shrink-0 rounded object-cover ring-1 ring-neutral-300"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold">
            {position}. {sub.name}
          </h3>
          {alsoOn.length > 0 && (
            <p className="text-sm text-neutral-600">Also on {alsoOn.join(', ')}</p>
          )}

          <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <Row label="Email" value={sub.email} />
            <Row
              label="Instagram"
              value={handle ? `@${handle}` : null}
              href={igHref}
            />
            <Row label="Location" value={sub.location} />
            <Row label="Available" value={sub.availability || null} />
            <Row
              label="Tattoos"
              value={
                sub.has_tattoos === null ? null : sub.has_tattoos ? 'Yes' : 'No'
              }
            />
            <Row
              label="Multiple shows"
              value={
                sub.multiple_shows === null ? null : sub.multiple_shows ? 'Yes' : 'No'
              }
            />
            <Row label="Brings +2" value={yesNo(sub.agreed_bring_two)} />
            <Row label="Video" value={videoHref} href={videoHref} />
          </dl>

          {sub.questions && (
            <p className="mt-3 border-l-2 border-neutral-400 pl-3 text-sm whitespace-pre-wrap">
              <span className="font-semibold">Asked: </span>
              {sub.questions}
            </p>
          )}
          {sub.admin_notes && (
            <p className="mt-2 text-sm text-neutral-700">
              <span className="font-semibold">Notes: </span>
              {sub.admin_notes}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

function yesNo(value: boolean | null) {
  return value === null ? null : value ? 'Yes' : 'No';
}

function Row({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null;
  href?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-semibold">{label}:</dt>
      <dd className="min-w-0 break-words">
        {href ? (
          // Chrome keeps hyperlinks live when printing to PDF.
          <a href={href} className="underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
