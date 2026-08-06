import Link from 'next/link';
import type { SiteContent } from '../lib/content';
import { toLines } from '../lib/content';
import { instagramUrl, toHttpUrl } from '../lib/normalize';
import Logo from './Logo';
import SiteNav from './SiteNav';

/**
 * Header, footer, and the page in between.
 *
 * `base` is '' on the home page and '/' everywhere else, so the nav anchors
 * scroll within the page they already are on rather than reloading it.
 */
export default function SiteShell({
  content,
  base = '',
  children,
}: {
  content: SiteContent;
  base?: string;
  children: React.ReactNode;
}) {
  const links = [
    { href: `${base}#about`, label: 'About us' },
    { href: `${base}#offer`, label: 'Offer' },
    { href: `${base}#team`, label: 'Our team' },
    { href: `${base}#contact`, label: 'Contact' },
  ];

  const socials = [
    { label: 'Instagram', href: instagramUrl(content.social_instagram) },
    { label: 'Facebook', href: toHttpUrl(content.social_facebook) },
    { label: 'TikTok', href: toHttpUrl(content.social_tiktok) },
  ].filter((s): s is { label: string; href: string } => Boolean(s.href));

  const address = toLines(content.contact_address);
  const hours = toLines(content.contact_hours);

  return (
    <div id="top" className="flex min-h-full flex-col">
      <SiteNav
        brandMark={content.brand_mark}
        brandTagline={content.brand_tagline}
        brandName={content.brand_name}
        links={links}
        ctaLabel={content.hero_cta_label || 'Book a visit'}
        announcement={content.announcement}
      />

      <main className="flex-1">{children}</main>

      <footer className="bg-green-deep text-cream/80">
        <div className="px-safe mx-auto grid max-w-6xl gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo
              mark={content.brand_mark}
              tagline={content.brand_tagline}
              tone="light"
              className="text-[16px]"
            />
            {content.footer_note ? (
              <p className="mt-6 max-w-xs text-sm font-light leading-relaxed">
                {content.footer_note}
              </p>
            ) : null}
          </div>

          {address.length ? (
            <div>
              <h2 className="text-[11px] font-light uppercase tracking-[0.24em] text-gold-soft">
                Find us
              </h2>
              <address className="mt-5 space-y-1 text-sm font-light not-italic leading-relaxed">
                {address.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </address>
            </div>
          ) : null}

          {hours.length ? (
            <div>
              <h2 className="text-[11px] font-light uppercase tracking-[0.24em] text-gold-soft">
                Opening hours
              </h2>
              <dl className="mt-5 space-y-1 text-sm font-light leading-relaxed">
                {hours.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </dl>
            </div>
          ) : null}

          <div>
            <h2 className="text-[11px] font-light uppercase tracking-[0.24em] text-gold-soft">
              Get in touch
            </h2>
            <ul className="mt-5 space-y-2 text-sm font-light">
              {content.contact_phone ? (
                <li>
                  <a
                    href={`tel:${content.contact_phone.replace(/[^\d+]/g, '')}`}
                    className="transition-colors hover:text-gold-soft"
                  >
                    {content.contact_phone}
                  </a>
                </li>
              ) : null}
              {content.contact_email ? (
                <li>
                  <a
                    href={`mailto:${content.contact_email}`}
                    className="break-all transition-colors hover:text-gold-soft"
                  >
                    {content.contact_email}
                  </a>
                </li>
              ) : null}
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="transition-colors hover:text-gold-soft"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-cream/10">
          <div className="px-safe pb-safe mx-auto flex max-w-6xl flex-col gap-2 py-6 text-[11px] font-light tracking-wide text-cream/50 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {content.brand_name}. All rights reserved.
            </p>
            <Link href="/admin" className="transition-colors hover:text-gold-soft">
              Staff login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
