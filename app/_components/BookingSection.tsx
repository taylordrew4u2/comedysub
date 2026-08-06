import { toLines, type SiteContent } from '../lib/content';
import type { Service } from '../lib/db';
import BookingForm from './BookingForm';
import Reveal from './Reveal';

/**
 * The request form and everything around it.
 *
 * Shared between the home page and `/book` so there is only one place where
 * the wording, the treatment list, and the closed notice are decided.
 */
export default function BookingSection({
  content,
  services,
  initialService,
}: {
  content: SiteContent;
  services: Service[];
  initialService?: string;
}) {
  const open = content.bookings_open === 'true' && services.length > 0;
  const slots = toLines(content.booking_slots);

  return (
    <section id="book" className="bg-green-wash/40 py-24 sm:py-32">
      <div className="px-safe mx-auto max-w-3xl">
        <Reveal className="text-center">
          {content.booking_eyebrow ? (
            <p className="text-[11px] font-light uppercase tracking-[0.32em] text-gold-deep">
              {content.booking_eyebrow}
            </p>
          ) : null}
          <h2 className="rule mt-4 font-serif text-4xl font-light text-green-deep sm:text-5xl">
            {content.booking_title}
          </h2>
          {content.booking_intro ? (
            <p className="mx-auto mt-8 max-w-xl whitespace-pre-line text-[15px] font-light leading-relaxed text-ink-soft">
              {content.booking_intro}
            </p>
          ) : null}
        </Reveal>

        <Reveal className="mt-12">
          <div className="bg-cream p-8 shadow-[0_1px_40px_rgba(47,59,42,0.06)] sm:p-12">
            {open ? (
              <BookingForm
                services={services.map((s) => ({
                  id: s.id,
                  name: s.name,
                  duration: s.duration,
                }))}
                slots={slots}
                confirmation={content.booking_confirmation}
                initialService={initialService}
              />
            ) : (
              <div className="py-6 text-center">
                <p className="whitespace-pre-line text-[15px] font-light leading-relaxed text-ink-soft">
                  {services.length
                    ? content.booking_closed_message
                    : 'There are no treatments listed just now. Please check back shortly.'}
                </p>
                {content.contact_email ? (
                  <a
                    href={`mailto:${content.contact_email}`}
                    className="mt-8 inline-block rounded-full border border-gold px-8 py-3 text-[11px] font-light uppercase tracking-[0.28em] text-gold-deep transition-colors hover:bg-gold hover:text-cream"
                  >
                    Email us
                  </a>
                ) : null}
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
