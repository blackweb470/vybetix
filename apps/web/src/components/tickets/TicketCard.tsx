'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import QRDisplay from './QRDisplay';
import { BuyerTicket } from '../../types';
import { formatDate } from '../../lib/utils';
import { Calendar, MapPin, QrCode, User, Printer, ArrowUpRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface TicketCardProps {
  ticket: BuyerTicket;
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const [showQR, setShowQR] = useState(false);

  // Extract relational metadata
  const event = ticket.ticket_tiers?.events;
  const tierName = ticket.ticket_tiers?.name || 'Standard Admission';
  const eventTitle = event?.title || 'Live Experience Session';
  const coverImage = event?.cover_image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600';
  const venue = event?.venue || 'Venue to be announced';
  const eventDateObj = event?.event_date ? new Date(event.event_date) : null;

  const viewPassUrl = `/tickets/view?id=${ticket.id}${ticket.qr_token ? `&token=${encodeURIComponent(ticket.qr_token)}` : ''}`;

  // Formatted date parts
  const monthName = eventDateObj ? eventDateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'TBD';
  const dayNumber = eventDateObj ? eventDateObj.getDate() : '--';
  const timeString = eventDateObj ? eventDateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '7:00 PM';

  const isUsed = ticket.status === 'used';
  const isCancelled = ticket.status === 'cancelled';
  const isActive = ticket.status === 'active';

  return (
    <div className="relative flex flex-col bg-[#f4f1e9] text-[#161713] rounded-2xl border-2 border-[#161713] shadow-[6px_6px_0px_#161713] overflow-hidden font-['DM_Sans',sans-serif] transition-transform duration-200 hover:-translate-y-1">

      {/* 1. TOP STUB HEADER */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161713] text-[#f4f1e9] border-b-2 border-[#161713]">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider font-['DM_Sans',sans-serif]">
            VYBETIX<i>✳</i>
          </span>
          <span className="text-[9px] text-[#a7a89e] uppercase tracking-widest hidden sm:inline">
            • ADMISSION PASS
          </span>
        </div>

        {/* Tier badge pill */}
        <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#f7a6c5] text-[#161713] tracking-wider">
          {tierName}
        </span>
      </div>

      {/* 2. POSTER / VISUAL HERO WITH DATE STAMP */}
      <div className="relative h-40 w-full overflow-hidden bg-[#161713]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImage}
          alt={eventTitle}
          className="h-full w-full object-cover opacity-90 transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#161713]/80 via-transparent to-transparent" />

        {/* Date stamp box in style of Lewistage */}
        <div className="absolute top-3 left-3 bg-[#f4f1e9] text-[#161713] border-2 border-[#161713] shadow-[3px_3px_0px_#161713] rounded-lg px-2.5 py-1.5 text-center leading-none">
          <span className="block text-[9px] font-black uppercase tracking-wider text-[#ff5a24]">{monthName}</span>
          <span className="block text-2xl font-black font-['Barlow_Condensed',Impact,sans-serif] leading-none my-0.5">{dayNumber}</span>
          <span className="block text-[8px] font-bold text-[#606257]">{timeString}</span>
        </div>

        {/* Status Stamp Badge */}
        <div className="absolute top-3 right-3">
          {isActive && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#c4db59] text-[#161713] font-black text-[9px] uppercase tracking-wider border border-[#161713] shadow-[2px_2px_0px_#161713]">
              <Sparkles className="h-2.5 w-2.5" /> ADMIT ONE
            </span>
          )}
          {isUsed && (
            <span className="inline-block px-2.5 py-1 rounded bg-[#ff5a24] text-white font-black text-[9px] uppercase tracking-wider border border-[#161713] -rotate-3 shadow-[2px_2px_0px_#161713]">
              SCANNED / USED
            </span>
          )}
          {isCancelled && (
            <span className="inline-block px-2.5 py-1 rounded bg-zinc-800 text-zinc-400 font-black text-[9px] uppercase tracking-wider border border-zinc-700">
              CANCELLED
            </span>
          )}
        </div>
      </div>

      {/* 3. TICKET BODY */}
      <div className="p-4 flex flex-col gap-3">
        {/* Title */}
        <div>
          <h3 className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-2xl uppercase tracking-tight text-[#161713] leading-[1.05] line-clamp-2">
            {eventTitle}
          </h3>
          <p className="text-[11px] text-[#606257] flex items-center gap-1 mt-1 font-medium">
            <MapPin className="h-3.5 w-3.5 text-[#ff5a24] shrink-0" />
            <span className="truncate">{venue}</span>
          </p>
        </div>

        {/* Holder and Serial Info */}
        <div className="bg-[#e9e6dd] border border-[#d5d2c6] rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#737568]">Attendee</span>
            <span className="font-black text-[#161713] uppercase text-xs truncate max-w-[150px]">
              {ticket.holder_name}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#737568]">Pass Ref</span>
            <span className="font-mono text-[10px] font-bold text-[#161713] uppercase">
              #{ticket.id.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* 4. PERFORATED TEAR WITH NOTCHES & BARCODE */}
        <div className="vyb-tear my-1">
          <div className="vyb-barcode" />
          <span className="text-[7px] font-mono font-bold tracking-widest text-[#737568]">GATE PASS</span>
        </div>

        {/* Collapsible QR Code View */}
        {showQR && isActive && (
          <div className="bg-white rounded-xl p-3 border-2 border-[#161713] shadow-[3px_3px_0px_#161713] animate-in fade-in duration-200">
            <QRDisplay ticketId={ticket.id} staticToken={ticket.qr_token || ticket.id} />
          </div>
        )}

        {/* 5. ACTION BUTTONS */}
        <div className="flex flex-col gap-2 pt-1">
          {isActive && (
            <button
              onClick={() => setShowQR(!showQR)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#161713] text-[#f4f1e9] hover:bg-[#25261f] text-xs font-black uppercase tracking-wider transition-all border border-[#161713]"
            >
              <QrCode className="h-4 w-4 text-[#c4db59]" />
              {showQR ? 'Hide Gate QR' : 'Show Gate QR Code'}
            </button>
          )}

          <Link
            href={viewPassUrl}
            target="_blank"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#ff5a24] hover:bg-[#e04a1a] text-[#161713] text-xs font-black uppercase tracking-wider transition-all border border-[#161713] shadow-[2px_2px_0px_#161713]"
          >
            <Printer className="h-3.5 w-3.5" />
            View & Print Full Pass
            <ArrowUpRight className="h-3.5 w-3.5 ml-auto" />
          </Link>
        </div>

        {isUsed && (
          <div className="text-center py-2 bg-[#e7e4db] rounded-lg text-[10px] font-black uppercase tracking-wider text-[#606257] border border-[#d5d2c6]">
            Checked in at gate • {ticket.scanned_at ? formatDate(ticket.scanned_at, 'MMM d, h:mm a') : 'Scanned'}
          </div>
        )}
      </div>

    </div>
  );
}
