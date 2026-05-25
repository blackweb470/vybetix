import type { Metadata } from 'next';
import { Syne, Outfit } from 'next/font/google';
import './globals.css';
import Providers from '../components/shared/Providers';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';

// Load Syne for high-fidelity headlines
const syneFont = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne'
});

// Load Outfit for highly-legible body copies
const outfitFont = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-outfit'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://vybetix.com'),
  title: {
    default: 'Vybetix | The Smartest Event Ticketing Platform in Nigeria',
    template: '%s | Vybetix'
  },
  description: 'Buy and sell tickets for live concerts, campus shows, tech events, and festivals in Nigeria. The most secure ticketing platform with fraud-proof HMAC-sealed tickets.',
  keywords: ['ticketing platform', 'event tickets Nigeria', 'buy event tickets', 'sell event tickets', 'concert tickets', 'campus shows', 'fraud-proof tickets', 'online ticketing', 'event management', 'Vybetix'],
  authors: [{ name: 'Vybetix' }],
  creator: 'Vybetix',
  publisher: 'Vybetix',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Vybetix | The Smartest Event Ticketing Platform in Nigeria',
    description: 'Buy and sell tickets for live concerts, campus shows, tech events, and festivals in Nigeria. The most secure ticketing platform with fraud-proof HMAC-sealed tickets.',
    url: 'https://vybetix.com',
    siteName: 'Vybetix',
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vybetix | The Smartest Event Ticketing Platform in Nigeria',
    description: 'Buy and sell tickets for live concerts, campus shows, tech events, and festivals in Nigeria.',
    creator: '@vybetix',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicons/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/favicons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/favicons/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${syneFont.variable} ${outfitFont.variable} font-outfit antialiased bg-[#0D0D0D] text-zinc-100 min-h-screen flex flex-col`}
        suppressHydrationWarning={true}
      >
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

