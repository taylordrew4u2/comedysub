import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pins & Needles — Edinburgh Fringe Submissions',
  description:
    'Apply to perform at Pins & Needles, the tattoo-fuelled comedy showcase at Edinburgh Fringe.',
  appleWebApp: {
    capable: true,
    title: 'Pins & Needles',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    // Stop iOS turning dates/addresses into blue auto-links.
    telephone: false,
    date: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Let the user pinch-zoom — never trap them at 1x.
  maximumScale: 5,
  userScalable: true,
  // Draw under the notch/home indicator; the .p*-safe helpers pad it back.
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
