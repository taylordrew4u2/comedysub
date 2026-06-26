import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pins & Needles — Edinburgh Fringe Submissions',
  description:
    'Apply to perform at Pins & Needles, the tattoo-fuelled comedy showcase at Edinburgh Fringe.',
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
