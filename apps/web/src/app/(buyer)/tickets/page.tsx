'use client';

import React, { useState, useMemo } from 'react';
import { useMyTickets } from '../../../hooks/useTickets';
import TicketCard from '../../../components/tickets/TicketCard';
import Link from 'next/link';
import { Ticket, Disc, Compass, ShieldCheck, QrCode } from 'lucide-react';

export default function BuyerTicketsPage() {
  const { data: tickets, isLoading, error } = useMyTickets();
  const [filter, setFilter] = useState<'all' | 'active' | 'used' | 'ended'>('active');

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((ticket) => {
      const event = ticket.ticket_tiers?.events;
      let isEnded = false;
      if (event) {
        // @ts-ignore - is_ended and end_date added to query but type may not have it yet
        isEnded = event.is_ended || (event.end_date && new Date(event.end_date) < new Date());
      }
      
      if (filter === 'active') return ticket.status === 'active' && !isEnded;
      if (filter === 'used') return ticket.status === 'used';
      if (filter === 'ended') return isEnded;
      return true; // 'all'
    });
  }, [tickets, filter]);

  return (
    <div className="w-full min-h-screen bg-[#08080C] font-outfit text-zinc-100">

      {/* PAGE HEADER */}
      <div className="w-full border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur-xl px-6 py-8 sticky top-0 z-30">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-syne uppercase tracking-tight">
              My Tickets
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isLoading ? 'Loading...' : `${tickets?.length ?? 0} active passes`}
            </p>
          </div>
          <Link
            href="/events"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8441A] hover:brightness-110 text-white text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-[#E8441A]/15"
          >
            <Compass className="h-4 w-4" />
            Find More Events
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* How it works quick tip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Ticket, color: 'text-[#E8441A]', bg: 'bg-[#E8441A]/10 border-[#E8441A]/20', title: 'Your Passes', desc: 'All purchased tickets appear here with a unique QR code.' },
            { icon: QrCode, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', title: 'Show at Gate', desc: 'Present QR code to gate worker for instant scan validation.' },
            { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', title: 'HMAC Secured', desc: 'Every ticket is cryptographically sealed and tamper-proof.' },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 p-4 rounded-2xl border border-zinc-900 bg-zinc-950/30">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${item.bg}`}>
                <item.icon className={`h-4.5 w-4.5 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider mb-0.5">{item.title}</p>
                <p className="text-[11px] text-zinc-500 leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        {!isLoading && !error && tickets && tickets.length > 0 && (
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'active', label: 'Active Passes' },
              { id: 'used', label: 'Used / Scanned' },
              { id: 'ended', label: 'Past Events' },
              { id: 'all', label: 'All Tickets' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-[#E8441A] text-white shadow-md shadow-[#E8441A]/20'
                    : 'bg-zinc-950/50 border border-zinc-900 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Tickets Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Disc className="h-10 w-10 text-[#E8441A] animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Loading your passes...</span>
          </div>
        ) : error ? (
          <div className="text-center py-20 border border-dashed border-zinc-900 rounded-3xl bg-zinc-950/20">
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-wide">Failed to load tickets. Please refresh.</p>
          </div>
        ) : filteredTickets && filteredTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : tickets && tickets.length > 0 ? (
          <div className="w-full text-center py-20 border border-dashed border-zinc-900 rounded-3xl bg-zinc-950/10">
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-wide">No tickets match this filter.</p>
          </div>
        ) : (
          <div className="w-full text-center py-24 border border-dashed border-zinc-900 rounded-3xl bg-zinc-950/10 flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-zinc-950/60 border border-zinc-900 flex items-center justify-center">
              <Ticket className="h-8 w-8 text-zinc-700" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">No Tickets Yet</h3>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                Browse our live event marketplace to discover concerts, festivals, and campus shows near you.
              </p>
            </div>
            <Link
              href="/events"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E8441A] text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all mt-1 shadow-md shadow-[#E8441A]/15"
            >
              <Compass className="h-4 w-4" />
              Explore Events
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

