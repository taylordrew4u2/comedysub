import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import { getContent } from './lib/db';
import './globals.css';

/* Self-hosted at build time by next/font — no request ever leaves for Google. */
const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
});

const body = Jost({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

/** Titles follow the business name, so renaming it in the admin renames the tab. */
export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const name = content.brand_name || 'TLC Massage Wellness';

  return {
    title: {
      default: `${name} — ${content.brand_tagline || 'Massage & Wellness'}`,
      template: `%s — ${name}`,
    },
    description: content.meta_description,
    appleWebApp: { capable: true, title: name, statusBarStyle: 'default' },
    formatDetection: {
      // Let iOS link the phone number, but keep it off dates and addresses.
      telephone: true,
      date: false,
      address: false,
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Let the user pinch-zoom — never trap them at 1x.
  maximumScale: 5,
  userScalable: true,
  // Draw under the notch/home indicator; the .p*-safe helpers pad it back.
  viewportFit: 'cover',
  themeColor: '#2f3b2a',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
