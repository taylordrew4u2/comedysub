import type { Metadata } from 'next';
import { getContent, getServices } from '../lib/db';
import BookingSection from '../_components/BookingSection';
import SiteShell from '../_components/SiteShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Book a visit',
};

/**
 * The booking form on its own page.
 *
 * It exists so the "Book this" link beside each treatment can land somewhere
 * with that treatment already chosen, and so the form has a shareable address.
 */
export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ treatment?: string | string[] }>;
}) {
  const [content, allServices, params] = await Promise.all([
    getContent(),
    getServices(),
    searchParams,
  ]);

  const services = allServices.filter((s) => s.is_active);

  // Matched against the real list, so a hand-typed query string can't preselect
  // something that isn't on offer.
  const wanted = Array.isArray(params.treatment) ? params.treatment[0] : params.treatment;
  const initialService = services.find((s) => s.name === wanted)?.name;

  return (
    <SiteShell content={content} base="/">
      <div className="pt-24">
        <BookingSection
          content={content}
          services={services}
          initialService={initialService}
        />
      </div>
    </SiteShell>
  );
}
