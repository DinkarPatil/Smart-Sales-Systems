import type { Metadata } from 'next';
import { Fraunces, Albert_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '900'],
  display: 'swap',
});

const albert = Albert_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Smart Sales',
  description: 'Multi-tenant sales support platform: AI-drafted replies, human-verified, escalation-aware.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${albert.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
