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
  title: 'Vybetix - Nigeria\'s Smartest Event Ticketing Platform',
  description: 'Discover and buy tickets for live concerts, campus shows, festivals, and more across Nigeria. Every ticket is HMAC-sealed and fraud-proof.'},
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

