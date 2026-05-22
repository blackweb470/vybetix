import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-900 bg-[#070707] py-12 text-zinc-500 font-outfit">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Branding */}
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="VibeTix" width={80} height={80} />
          <span className="text-xl font-bold tracking-wider font-syne text-zinc-300">
            VibeTix
          </span>
        </div>

        {/* copyright */}
        <p className="text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} VibeTix Platforms Ltd. All rights reserved.
        </p>

        {/* Links */}
        <div className="flex items-center gap-6 text-xs font-semibold uppercase tracking-wider">
          <Link href="/events" className="hover:text-[#E8441A] transition-colors">
            Events Hub
          </Link>
          <Link href="/universities" className="hover:text-[#E8441A] transition-colors">
            Campus Network
          </Link>
        </div>

      </div>
    </footer>
  );
}
