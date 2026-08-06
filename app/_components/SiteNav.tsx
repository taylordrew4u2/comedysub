'use client';

import { useEffect, useState } from 'react';
import Logo from './Logo';

export interface NavLink {
  href: string;
  label: string;
}

interface SiteNavProps {
  brandMark: string;
  brandTagline: string;
  brandName: string;
  links: NavLink[];
  ctaLabel: string;
  announcement: string;
}

/**
 * The header: logo centred, links split either side of it on desktop, a sheet
 * behind a button on mobile.
 *
 * It starts transparent over the hero and turns solid once the page scrolls,
 * which is what keeps the opening panel looking like one uninterrupted image.
 */
export default function SiteNav({
  brandMark,
  brandTagline,
  brandName,
  links,
  ctaLabel,
  announcement,
}: SiteNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // A sheet that scrolls the page behind it reads as broken, so freeze the body.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const solid = scrolled || open;
  const half = Math.ceil(links.length / 2);

  const linkClass = solid
    ? 'text-green-deep hover:text-gold'
    : 'text-cream/90 hover:text-white';

  return (
    <>
      {announcement ? (
        <div className="bg-green-deep px-safe py-2 text-center text-[11px] font-light uppercase tracking-[0.28em] text-gold-soft">
          {announcement}
        </div>
      ) : null}

      <header
        className={`sticky top-0 z-50 transition-colors duration-300 ${
          solid ? 'bg-cream/95 shadow-[0_1px_0_rgba(47,59,42,0.08)] backdrop-blur' : 'bg-transparent'
        }`}
      >
        <nav
          aria-label="Main"
          className="px-safe mx-auto flex h-24 max-w-6xl items-center justify-between gap-4"
        >
          {/* Mobile: an empty slot the width of the menu button, so the logo
              between them stays optically centred. */}
          <span className="w-11 lg:hidden" aria-hidden="true" />

          {/* Desktop: links, logo, links. */}
          <ul className="hidden flex-1 items-center justify-start gap-8 lg:flex">
            {links.slice(0, half).map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`text-[11px] font-light uppercase tracking-[0.24em] transition-colors ${linkClass}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <a href="#top" className="shrink-0" aria-label={`${brandName} — home`}>
            <Logo
              mark={brandMark}
              tagline={brandTagline}
              tone={solid ? 'dark' : 'light'}
              className="text-[15px]"
            />
          </a>

          <ul className="hidden flex-1 items-center justify-end gap-8 lg:flex">
            {links.slice(half).map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`text-[11px] font-light uppercase tracking-[0.24em] transition-colors ${linkClass}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#book"
                className={`rounded-full border px-5 py-2 text-[11px] font-light uppercase tracking-[0.24em] transition-colors ${
                  solid
                    ? 'border-gold text-gold-deep hover:bg-gold hover:text-cream'
                    : 'border-cream/70 text-cream hover:bg-cream hover:text-green-deep'
                }`}
              >
                {ctaLabel}
              </a>
            </li>
          </ul>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className={`-mr-2 flex h-11 w-11 items-center justify-center rounded-full lg:hidden ${
              solid ? 'text-green-deep' : 'text-cream'
            }`}
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </nav>

        {open ? (
          <div
            id="mobile-menu"
            className="px-safe border-t border-green-wash bg-cream pb-8 pt-4 lg:hidden"
          >
            <ul className="mx-auto flex max-w-6xl flex-col">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-green-wash py-4 text-sm font-light uppercase tracking-[0.24em] text-green-deep"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="#book"
              onClick={() => setOpen(false)}
              className="mt-6 block rounded-full bg-green-deep px-6 py-4 text-center text-xs font-light uppercase tracking-[0.24em] text-cream"
            >
              {ctaLabel}
            </a>
          </div>
        ) : null}
      </header>
    </>
  );
}
