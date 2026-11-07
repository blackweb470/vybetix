'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo } from 'react';
import { useMyTickets } from '../../../hooks/useTickets';
import { useAuth } from '../../../hooks/useAuth';
import TicketCard from '../../../components/tickets/TicketCard';
import Link from 'next/link';
import { Ticket, Disc, Compass, Sparkles, QrCode, ShieldCheck, ArrowUpRight, Flame, Smile } from 'lucide-react';

export default function BuyerTicketsPage() {
  const { user } = useAuth();
  const { data: tickets, isLoading, error } = useMyTickets();
  const [filter, setFilter] = useState<'all' | 'active' | 'used' | 'ended'>('active');

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((ticket) => {
      const event = ticket.ticket_tiers?.events;
      let isEnded = false;
      if (event) {
        // @ts-ignore
        isEnded = event.is_ended || (event.end_date && new Date(event.end_date) < new Date());
      }

      if (filter === 'active') return ticket.status === 'active' && !isEnded;
      if (filter === 'used') return ticket.status === 'used';
      if (filter === 'ended') return isEnded;
      return true; // 'all'
    });
  }, [tickets, filter]);

  const activeCount = useMemo(() => {
    if (!tickets) return 0;
    return tickets.filter(t => t.status === 'active').length;
  }, [tickets]);

  return (
    <div className="w-full min-h-screen bg-[#161713] text-[#f4f1e9] font-['DM_Sans',sans-serif] selection:bg-[#ff5a24] selection:text-[#161713]">

      {/* TOP MARQUEE TICKER */}
      <div className="bg-[#ff5a24] text-[#161713] py-2 overflow-hidden border-b-2 border-[#161713]">
        <div className="flex justify-around gap-8 whitespace-nowrap text-xs font-black uppercase tracking-wider font-['DM_Sans',sans-serif] animate-marquee">
          <span>YOUR TICKET VAULT <i>✳</i></span>
          <span>PERMANENT ENTRY PASSES <i>✳</i></span>
          <span>NO APPS NEEDED <i>✳</i></span>
          <span>FLASH QR AT THE GATE <i>✳</i></span>
          <span>PRINT OR SAVE ANYTIME <i>✳</i></span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

        {/* VAULT HERO HEADER */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 pb-10 border-b border-[#393a32]">
          <div className="max-w-2xl">
            <div className="vyb-eyebrow text-[#a7a89e] mb-3">
              <span className="vyb-dot" />
              <span>OFFICIAL BUYER PASSES ✳ {user?.full_name ? `HEY, ${user.full_name.toUpperCase()}` : 'WELCOME'}</span>
            </div>

            <h1 className="font-['Barlow_Condensed',Impact,sans-serif] font-black uppercase text-5xl sm:text-7xl lg:text-8xl leading-[0.92] tracking-tight text-[#f4f1e9]">
              READY FOR <span className="text-[#ff5a24]">THE NIGHT.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#a7a89e] mt-4 max-w-lg leading-relaxed">
              Every ticket is permanently attached to your pass. Flash your high-contrast QR code at the gate, take a screenshot, or print out your pass.
            </p>
          </div>

          {/* Quick Action Pill */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/events"
              className="vyb-btn rounded-xl !py-3.5 !px-6 !text-xs !gap-3 shadow-[4px_4px_0px_#f4f1e9]"
            >
              FIND MORE EVENTS <span className="vyb-arrow">↗</span>
            </Link>
          </div>
        </div>

        {/* 3 HIGHLIGHT STICKER CARDS (Inspired by m*ticket & Gen Z visuals) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-10">
          <div className="bg-[#20211a] border border-[#393a32] rounded-2xl p-4 flex items-start gap-3.5 hover:border-[#ff5a24] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#ff5a24] text-[#161713] flex items-center justify-center font-black shrink-0 text-sm shadow-[2px_2px_0px_#161713]">
              01
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-[#f4f1e9]">Permanent QR Passes</h4>
              <p className="text-[11px] text-[#a7a89e] mt-0.5 leading-snug">Static gate QR codes that never expire or lock you out of your device.</p>
            </div>
          </div>

          <div className="bg-[#20211a] border border-[#393a32] rounded-2xl p-4 flex items-start gap-3.5 hover:border-[#c4db59] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#c4db59] text-[#161713] flex items-center justify-center font-black shrink-0 text-sm shadow-[2px_2px_0px_#161713]">
              02
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-[#f4f1e9]">Instant Gate Check-in</h4>
              <p className="text-[11px] text-[#a7a89e] mt-0.5 leading-snug">Present the QR on your phone screen or paper ticket to gate staff.</p>
            </div>
          </div>

          <div className="bg-[#20211a] border border-[#393a32] rounded-2xl p-4 flex items-start gap-3.5 hover:border-[#f7a6c5] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#f7a6c5] text-[#161713] flex items-center justify-center font-black shrink-0 text-sm shadow-[2px_2px_0px_#161713]">
              03
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-[#f4f1e9]">Print & Save Friendly</h4>
              <p className="text-[11px] text-[#a7a89e] mt-0.5 leading-snug">Download the pass image or print a physical stub for safekeeping.</p>
            </div>
          </div>
        </div>

        {/* FILTER CAPSULES (Styled like m*ticket filters) */}
        {!isLoading && !error && tickets && tickets.length > 0 && (
          <div className="flex items-center gap-2.5 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'active', label: `Active Passes (${activeCount})` },
              { id: 'used', label: 'Used / Scanned' },
              { id: 'ended', label: 'Past Events' },
              { id: 'all', label: `All Tickets (${tickets.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border ${filter === tab.id
                    ? 'bg-[#f4f1e9] text-[#161713] border-[#f4f1e9] shadow-[3px_3px_0px_#ff5a24]'
                    : 'bg-[#20211a] border-[#393a32] text-[#a7a89e] hover:text-[#f4f1e9] hover:border-[#5a5b50]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* TICKETS GRID */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <Disc className="h-10 w-10 text-[#ff5a24] animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest text-[#a7a89e]">
              Unlocking your ticket stubs...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-20 border-2 border-dashed border-[#393a32] rounded-3xl bg-[#20211a]/50">
            <p className="text-sm font-bold text-[#ff5a24] uppercase tracking-wide">
              Failed to load passes. Please refresh the page.
            </p>
          </div>
        ) : filteredTickets && filteredTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {filteredTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}

            {/* m*ticket Companion Promo Card */}
            <div className="bg-[#c4db59] text-[#161713] rounded-2xl border-2 border-[#161713] shadow-[6px_6px_0px_#161713] p-6 flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#161713] text-[#c4db59]">
                    PROMO ✳ VYBETIX
                  </span>
                  <Smile className="h-6 w-6 text-[#161713]" />
                </div>

                <h3 className="font-['Barlow_Condensed',Impact,sans-serif] font-black uppercase text-3xl sm:text-4xl leading-[0.92] tracking-tight text-[#161713]">
                  STILL WASTING TIME LOOKING FOR TICKETS?
                </h3>

                <p className="text-xs text-[#2b2f15] mt-3 leading-relaxed font-medium">
                  Simply relax and bring your friends. We’ll hold the door, handle entry, and keep your memories in your pocket.
                </p>
              </div>

              <div className="pt-6 border-t-2 border-[#161713]/20">
                <Link
                  href="/events"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#161713] text-[#f4f1e9] text-xs font-black uppercase tracking-wider hover:bg-[#25261f] transition-all shadow-[2px_2px_0px_#161713]"
                >
                  DISCOVER NEW VYBES ↗
                </Link>
              </div>
            </div>
          </div>
        ) : tickets && tickets.length > 0 ? (
          <div className="w-full text-center py-20 border-2 border-dashed border-[#393a32] rounded-3xl bg-[#20211a]/40">
            <p className="text-sm font-bold text-[#a7a89e] uppercase tracking-wide">
              No tickets found in this tab.
            </p>
          </div>
        ) : (
          /* EMPTY STATE WITH TICKET MOCKUP */
          <div className="w-full text-center py-20 border-2 border-dashed border-[#393a32] rounded-3xl bg-[#20211a]/30 flex flex-col items-center gap-6 p-6">
            <div className="w-20 h-20 rounded-2xl bg-[#ff5a24] text-[#161713] border-2 border-[#161713] shadow-[4px_4px_0px_#161713] flex items-center justify-center">
              <Ticket className="h-10 w-10 text-[#161713]" />
            </div>

            <div className="flex flex-col gap-2 max-w-md">
              <h3 className="font-['Barlow_Condensed',Impact,sans-serif] font-black uppercase text-4xl text-[#f4f1e9] tracking-tight">
                NO TICKETS IN YOUR VAULT YET.
              </h3>
              <p className="text-xs text-[#a7a89e] leading-relaxed">
                Outside is calling. Pick up. Explore live concerts, campus parties, festivals, and university shows near you.
              </p>
            </div>

            <Link
              href="/events"
              className="vyb-btn rounded-xl !py-3.5 !px-8 !text-xs !gap-3 shadow-[4px_4px_0px_#f4f1e9]"
            >
              EXPLORE SHOWS NOW <span className="vyb-arrow">↗</span>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
