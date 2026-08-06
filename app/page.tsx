import Link from 'next/link';
import { toLines, toParagraphs } from './lib/content';
import { getContent, getServices, getTeam } from './lib/db';
import { toHttpUrl } from './lib/normalize';
import BookingSection from './_components/BookingSection';
import Reveal from './_components/Reveal';
import SiteShell from './_components/SiteShell';

/* Content, treatments and team all live in the database, so the page is
   rendered per request rather than baked at build time. */
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [content, allServices, allTeam] = await Promise.all([
    getContent(),
    getServices(),
    getTeam(),
  ]);

  const services = allServices.filter((s) => s.is_active);
  const team = allTeam.filter((m) => m.is_active);

  const heroLines = toLines(content.hero_heading);
  const heroImage = toHttpUrl(content.hero_image_url);
  const aboutImage = toHttpUrl(content.about_image_url);
  const aboutPoints = toLines(content.about_points);
  const aboutParagraphs = toParagraphs(content.about_body);
  const address = toLines(content.contact_address);
  const hours = toLines(content.contact_hours);
  const mapUrl = toHttpUrl(content.contact_map_url);

  return (
    <SiteShell content={content}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative -mt-24 flex min-h-[100svh] items-center overflow-hidden bg-green-deep">
        {heroImage ? (
          <>
            {/* A plain <img>: the owner pastes any URL they like into the admin,
                and next/image would reject every host not listed in the config. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-green-deep/45" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 90% at 70% 20%, #56684d 0%, #3f5138 45%, #2f3b2a 100%)',
            }}
          />
        )}

        {/* The leaf that bleeds off the left edge, as in the reference layout. */}
        <div
          aria-hidden="true"
          className="leaf-blob pointer-events-none absolute -left-40 top-1/4 hidden h-[34rem] w-[34rem] bg-green/70 lg:block"
        />

        <div className="px-safe relative mx-auto w-full max-w-3xl pb-24 pt-40 text-center">
          <Reveal>
            {content.hero_eyebrow ? (
              <p className="text-[11px] font-light uppercase tracking-[0.4em] text-gold-soft">
                {content.hero_eyebrow}
              </p>
            ) : null}
            <h1 className="mt-8 font-serif text-6xl font-light leading-[1.05] text-cream sm:text-7xl lg:text-8xl">
              {heroLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            {content.hero_subheading ? (
              <p className="mx-auto mt-8 max-w-xl whitespace-pre-line font-serif text-xl font-light leading-relaxed text-cream/85 sm:text-2xl">
                {content.hero_subheading}
              </p>
            ) : null}
            <a
              href="#book"
              className="mt-12 inline-block rounded-full border border-gold-soft px-12 py-4 text-[11px] font-light uppercase tracking-[0.32em] text-cream transition-colors hover:bg-gold-soft hover:text-green-deep"
            >
              {content.hero_cta_label}
            </a>
          </Reveal>
        </div>

        <a
          href="#about"
          aria-label="Scroll to about"
          className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 text-cream/60 transition-colors hover:text-cream sm:block"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 4v15M6 13l6 6 6-6" />
          </svg>
        </a>
      </section>

      {/* ── About ────────────────────────────────────────────────────────── */}
      <section id="about" className="bg-cream py-24 sm:py-32">
        <div className="px-safe mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
          <Reveal>
            {content.about_eyebrow ? (
              <p className="text-[11px] font-light uppercase tracking-[0.32em] text-gold-deep">
                {content.about_eyebrow}
              </p>
            ) : null}
            <h2 className="rule rule-left mt-4 font-serif text-4xl font-light text-green-deep sm:text-5xl">
              {content.about_title}
            </h2>
            <div className="mt-8 space-y-5 text-[15px] font-light leading-relaxed text-ink-soft">
              {aboutParagraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            {aboutPoints.length ? (
              <ul className="mt-10 grid gap-4 sm:grid-cols-2">
                {aboutPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <svg
                      viewBox="0 0 16 16"
                      className="mt-1 h-4 w-4 shrink-0 text-gold"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m3 8.5 3.2 3.2L13 5" />
                    </svg>
                    <span className="text-sm font-light text-ink">{point}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Reveal>

          <Reveal delay={120}>
            <div className="relative aspect-4/5 w-full overflow-hidden">
              {aboutImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={aboutImage}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-green-wash">
                  <svg
                    viewBox="0 0 200 260"
                    className="h-3/4 w-auto text-green-soft/60"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    aria-hidden="true"
                  >
                    <path d="M100 250V70" />
                    <path d="M100 150c0-40 22-70 62-82-4 44-24 70-62 82Z" />
                    <path d="M100 190c0-34-19-60-53-70 3 38 20 60 53 70Z" />
                    <path d="M100 110c0-32 17-56 49-64-3 35-16 56-49 64Z" />
                  </svg>
                </div>
              )}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-4 border border-gold/40"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Treatments ───────────────────────────────────────────────────── */}
      <section id="offer" className="bg-cream-deep/50 py-24 sm:py-32">
        <div className="px-safe mx-auto max-w-6xl">
          <Reveal className="text-center">
            {content.services_eyebrow ? (
              <p className="text-[11px] font-light uppercase tracking-[0.32em] text-gold-deep">
                {content.services_eyebrow}
              </p>
            ) : null}
            <h2 className="rule mt-4 font-serif text-4xl font-light text-green-deep sm:text-5xl">
              {content.services_title}
            </h2>
            {content.services_intro ? (
              <p className="mx-auto mt-8 max-w-2xl text-[15px] font-light leading-relaxed text-ink-soft">
                {content.services_intro}
              </p>
            ) : null}
          </Reveal>

          {services.length ? (
            <div className="mt-16 grid gap-px bg-green-wash sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, i) => (
                <Reveal key={service.id} delay={(i % 3) * 90}>
                  <article className="flex h-full flex-col bg-cream p-8 sm:p-10">
                    <h3 className="font-serif text-2xl font-light text-green-deep">
                      {service.name}
                    </h3>
                    <div className="mt-3 flex items-center gap-3 text-[11px] font-light uppercase tracking-[0.2em] text-gold-deep">
                      {service.duration ? <span>{service.duration}</span> : null}
                      {service.duration ? <span className="text-green-soft">·</span> : null}
                      <span>Free</span>
                    </div>
                    {service.description ? (
                      <p className="mt-5 flex-1 text-sm font-light leading-relaxed text-ink-soft">
                        {service.description}
                      </p>
                    ) : (
                      <div className="flex-1" />
                    )}
                    <Link
                      href={`/book?treatment=${encodeURIComponent(service.name)}`}
                      className="mt-8 self-start border-b border-gold pb-1 text-[11px] font-light uppercase tracking-[0.24em] text-green-deep transition-colors hover:text-gold-deep"
                    >
                      Book this
                    </Link>
                  </article>
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="mt-16 text-center text-sm font-light text-ink-soft">
              Our treatment list is being updated. Please check back shortly.
            </p>
          )}

          {content.services_note ? (
            <p className="mt-12 text-center text-sm font-light italic text-green-mid">
              {content.services_note}
            </p>
          ) : null}
        </div>
      </section>

      {/* ── Team ─────────────────────────────────────────────────────────── */}
      {team.length ? (
        <section id="team" className="bg-cream py-24 sm:py-32">
          <div className="px-safe mx-auto max-w-6xl">
            <Reveal className="text-center">
              {content.team_eyebrow ? (
                <p className="text-[11px] font-light uppercase tracking-[0.32em] text-gold-deep">
                  {content.team_eyebrow}
                </p>
              ) : null}
              <h2 className="rule mt-4 font-serif text-4xl font-light text-green-deep sm:text-5xl">
                {content.team_title}
              </h2>
              {content.team_intro ? (
                <p className="mx-auto mt-8 max-w-2xl text-[15px] font-light leading-relaxed text-ink-soft">
                  {content.team_intro}
                </p>
              ) : null}
            </Reveal>

            <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member, i) => {
                const photo = toHttpUrl(member.photo_url);
                return (
                  <Reveal key={member.id} delay={(i % 3) * 90} className="text-center">
                    <div className="mx-auto aspect-square w-40 overflow-hidden rounded-full bg-green-wash">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo}
                          alt={member.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-serif text-4xl font-light text-green-soft">
                          {member.name.trim().charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h3 className="mt-6 font-serif text-2xl font-light text-green-deep">
                      {member.name}
                    </h3>
                    {member.role ? (
                      <p className="mt-2 text-[11px] font-light uppercase tracking-[0.24em] text-gold-deep">
                        {member.role}
                      </p>
                    ) : null}
                    {member.bio ? (
                      <p className="mt-4 text-sm font-light leading-relaxed text-ink-soft">
                        {member.bio}
                      </p>
                    ) : null}
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Booking ──────────────────────────────────────────────────────── */}
      <BookingSection content={content} services={services} />

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <section id="contact" className="bg-cream py-24 sm:py-32">
        <div className="px-safe mx-auto max-w-6xl">
          <Reveal className="text-center">
            {content.contact_eyebrow ? (
              <p className="text-[11px] font-light uppercase tracking-[0.32em] text-gold-deep">
                {content.contact_eyebrow}
              </p>
            ) : null}
            <h2 className="rule mt-4 font-serif text-4xl font-light text-green-deep sm:text-5xl">
              {content.contact_title}
            </h2>
          </Reveal>

          <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {address.length ? (
              <Reveal className="text-center">
                <h3 className="text-[11px] font-light uppercase tracking-[0.24em] text-gold-deep">
                  Where
                </h3>
                <address className="mt-5 space-y-1 text-[15px] font-light not-italic leading-relaxed text-ink-soft">
                  {address.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </address>
                {mapUrl ? (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-5 inline-block border-b border-gold pb-1 text-[11px] font-light uppercase tracking-[0.24em] text-green-deep transition-colors hover:text-gold-deep"
                  >
                    Get directions
                  </a>
                ) : null}
              </Reveal>
            ) : null}

            {hours.length ? (
              <Reveal delay={90} className="text-center">
                <h3 className="text-[11px] font-light uppercase tracking-[0.24em] text-gold-deep">
                  When
                </h3>
                <dl className="mt-5 space-y-1 text-[15px] font-light leading-relaxed text-ink-soft">
                  {hours.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </dl>
              </Reveal>
            ) : null}

            <Reveal delay={180} className="text-center">
              <h3 className="text-[11px] font-light uppercase tracking-[0.24em] text-gold-deep">
                How
              </h3>
              <ul className="mt-5 space-y-2 text-[15px] font-light text-ink-soft">
                {content.contact_phone ? (
                  <li>
                    <a
                      href={`tel:${content.contact_phone.replace(/[^\d+]/g, '')}`}
                      className="transition-colors hover:text-gold-deep"
                    >
                      {content.contact_phone}
                    </a>
                  </li>
                ) : null}
                {content.contact_email ? (
                  <li>
                    <a
                      href={`mailto:${content.contact_email}`}
                      className="break-all transition-colors hover:text-gold-deep"
                    >
                      {content.contact_email}
                    </a>
                  </li>
                ) : null}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
