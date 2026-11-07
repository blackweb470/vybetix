'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ticket, Mail, ShieldCheck, Printer, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // Home page uses the bespoke landing page footer
  if (pathname === '/') {
    return null;
  }
  return (
    <footer className="w-full border-t border-[#393a32] bg-[#161713] py-14 text-[#a7a89e] font-['DM_Sans',sans-serif] relative overflow-hidden">

      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col gap-10 relative z-10">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#393a32]">

          {/* Branding */}
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tight text-[#f4f1e9] uppercase flex items-center">
                vybetix<i className="not-italic text-[#ff5a24] ml-0.5">✳</i>
              </span>
            </Link>
            <p className="text-xs text-[#a7a89e] max-w-sm font-normal">
              Zero passwords, zero device lockouts — verified gate passes delivered straight to your email.
            </p>
          </div>

          {/* Quick Pillar Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-black uppercase text-zinc-300">
              ⚡️ Guest Checkout
            </span>
            <span className="px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-black uppercase text-emerald-400">
              ✉️ Pass in Email
            </span>
            <span className="px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-black uppercase text-amber-400">
              🖨️ Print or Scan
            </span>
          </div>

        </div>

        {/* Directory Links & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-zinc-500">
          <p className="text-center sm:text-left">
            &copy; {new Date().getFullYear()} Vybetix Platforms Ltd. All rights reserved. Built for live culture.
          </p>

          <div className="flex flex-wrap items-center gap-6 uppercase tracking-wider text-[11px] font-bold">
            <Link href="/events" className="hover:text-white transition-colors">
              Explore Vibes
            </Link>
            <Link href="/universities" className="hover:text-white transition-colors">
              Campus Hub
            </Link>
            <Link href="/register?role=organizer" className="hover:text-[#ff5a24] transition-colors">
              Host an Event
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
