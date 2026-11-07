'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEvent } from '../../../../hooks/useEvents';
import CheckoutModal from '../../../../components/tickets/CheckoutModal';
import { formatNaira, formatDate, formatTime } from '../../../../lib/utils';
import { useToast } from '../../../../components/ui/toast';
import {
  Calendar, MapPin, ArrowLeft, Disc, GraduationCap,
  ShieldCheck, Clock, Share2, BanIcon, ArrowUpRight, Sparkles, Ticket
} from 'lucide-react';
import Link from 'next/link';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const id = params.id as string;
  const { data: event, isLoading, error } = useEvent(id);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#161713] py-32 gap-4 min-h-screen text-[#f4f1e9] font-['DM_Sans',sans-serif]">
        <Disc className="h-10 w-10 text-[#ff5a24] animate-spin" />
        <span className="text-xs font-black uppercase tracking-widest text-[#a7a89e]">Loading Event Details...</span>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#161713] px-6 py-32 text-center gap-4 min-h-screen text-[#f4f1e9] font-['DM_Sans',sans-serif]">
        <div className="w-16 h-16 rounded-2xl bg-[#ff5a24]/10 border-2 border-[#ff5a24] flex items-center justify-center text-[#ff5a24]">
          <BanIcon className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tight text-[#f4f1e9] font-['Barlow_Condensed',Impact,sans-serif]">
          Event Not Found
        </h2>
        <p className="text-xs text-[#a7a89e] max-w-sm">This event may have been removed or does not exist.</p>
        <Link
          href="/events"
          className="vyb-btn rounded-xl !py-3 !px-6 !text-xs !gap-2"
        >
          Back to Events <span className="vyb-arrow">↗</span>
        </Link>
      </div>
    );
  }

  const coverImage = event.cover_image_url || 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1200';
  const activeTiers = event.ticket_tiers || event.tiers || [];
  const hasFreeTier = activeTiers.some(t => t.price === 0);
  const hasPaidTier = activeTiers.some(t => t.price > 0);
  const startingPrice = activeTiers.length > 0 && hasPaidTier
    ? Math.min(...activeTiers.filter(t => t.price > 0).map(t => t.price))
    : 0;

  const isEnded: boolean = event.is_ended ||
    (event.end_date ? new Date(event.end_date) < new Date() : false);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link Copied!', description: 'Event link copied to clipboard.', variant: 'success' });
  };

  const handleBuyTickets = () => {
    if (isEnded) return;
    setIsCheckoutOpen(true);
  };

  const eventDateObj = event.event_date ? new Date(event.event_date) : null;
  const monthName = eventDateObj ? eventDateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'TBD';
  const dayNumber = eventDateObj ? eventDateObj.getDate() : '--';

  return (
    <div className="w-full bg-[#161713] pb-28 font-['DM_Sans',sans-serif] min-h-screen text-[#f4f1e9] selection:bg-[#ff5a24] selection:text-[#161713]">

      {/* TOP HERO COVER */}
      <div className="relative w-full h-[45vh] min-h-[340px] max-h-[500px] overflow-hidden bg-[#161713]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverImage} alt={event.title} className="h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#161713] via-[#161713]/50 to-transparent" />

        {/* Back and Share buttons */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between max-w-7xl mx-auto">
          <Link
            href="/events"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#f4f1e9] bg-[#161713]/80 hover:bg-[#161713] backdrop-blur-md px-4 py-2.5 rounded-full border border-[#393a32] transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#ff5a24]" />
            All Events
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#f4f1e9] bg-[#161713]/80 hover:bg-[#161713] backdrop-blur-md px-4 py-2.5 rounded-full border border-[#393a32] transition-all"
          >
            <Share2 className="h-3.5 w-3.5 text-[#c4db59]" />
            Share
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">

          {/* LEFT 2 COLUMNS — Event Details */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* Title & Date Bar */}
            <div className="bg-[#20211a] border-2 border-[#393a32] rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_#161713]">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-[#ff5a24] text-[#161713]">
                  {event.category || 'LIVE VYBE'}
                </span>
                {event.is_university_only && (
                  <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-[#f7a6c5] text-[#161713] flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" /> Campus Exclusive
                  </span>
                )}
              </div>

              <h1 className="font-['Barlow_Condensed',Impact,sans-serif] font-black uppercase text-4xl sm:text-6xl text-[#f4f1e9] tracking-tight leading-[0.95]">
                {event.title}
              </h1>

              {/* Date, Time, Venue Pills */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#a7a89e] mt-5 pt-5 border-t border-[#393a32]">
                <span className="flex items-center gap-1.5 font-bold text-[#f4f1e9]">
                  <Calendar className="h-4 w-4 text-[#ff5a24]" />
                  {formatDate(event.event_date)}
                </span>
                <span className="flex items-center gap-1.5 font-bold text-[#f4f1e9]">
                  <Clock className="h-4 w-4 text-[#c4db59]" />
                  {formatTime(event.event_date)}
                </span>
                <span className="flex items-center gap-1.5 font-bold text-[#f4f1e9]">
                  <MapPin className="h-4 w-4 text-[#f7a6c5]" />
                  {event.venue}, {event.city}
                </span>
              </div>
            </div>

            {/* About / Description */}
            <div className="bg-[#20211a] border-2 border-[#393a32] rounded-3xl p-6 sm:p-8">
              <h3 className="font-['Barlow_Condensed',Impact,sans-serif] font-black uppercase text-2xl tracking-tight text-[#f4f1e9] mb-3">
                About The Vybe
              </h3>
              <p className="text-sm text-[#a7a89e] leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Ticket Tiers (Styled like mini stubs) */}
            <div className="bg-[#20211a] border-2 border-[#393a32] rounded-3xl p-6 sm:p-8">
              <h3 className="font-['Barlow_Condensed',Impact,sans-serif] font-black uppercase text-2xl tracking-tight text-[#f4f1e9] mb-4">
                Admission Passes & Tiers
              </h3>

              {isEnded ? (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase">
                  This event has concluded. Passes are no longer available for purchase.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {activeTiers.map((tier) => {
                    const soldCount = tier.sold || 0;
                    const isSoldOut = soldCount >= tier.quantity;
                    return (
                      <div
                        key={tier.id}
                        className="p-4 rounded-2xl bg-[#f4f1e9] text-[#161713] border-2 border-[#161713] shadow-[4px_4px_0px_#161713] flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-xl uppercase tracking-tight text-[#161713]">
                              {tier.name}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${isSoldOut ? 'bg-red-500 text-white' : 'bg-[#c4db59] text-[#161713]'}`}>
                              {isSoldOut ? 'Sold Out' : 'Available'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#606257] mt-0.5">
                            {tier.description || 'Full venue gate access and admission'}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-2xl text-[#161713]">
                            {tier.price === 0 ? 'FREE' : formatNaira(tier.price)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Guaranteed Trust Stamp */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#20211a] border border-[#393a32] flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-[#c4db59] shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#a7a89e]">Instant Gate QR</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#20211a] border border-[#393a32] flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-[#ff5a24] shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#a7a89e]">No Login Required</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#20211a] border border-[#393a32] flex items-center gap-3">
                <Ticket className="h-5 w-5 text-[#f7a6c5] shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#a7a89e]">Pass In Email</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN — Sticky Ticket Purchase Box */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-24">
            <div className="bg-[#f4f1e9] text-[#161713] rounded-3xl border-2 border-[#161713] shadow-[8px_8px_0px_#161713] p-6 sm:p-7 flex flex-col gap-5">

              {/* Header inside ticket box */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-[#161713]">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#606257]">Passes From</span>
                  <div className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-3xl uppercase tracking-tight text-[#161713] leading-none mt-0.5">
                    {hasFreeTier && hasPaidTier
                      ? 'Free & Paid'
                      : (hasPaidTier ? formatNaira(startingPrice) : 'FREE ENTRY')}
                  </div>
                </div>

                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded bg-[#ff5a24] text-[#161713]">
                  ADMIT ONE
                </span>
              </div>

              {/* Date Box */}
              <div className="bg-[#e7e4db] rounded-2xl p-4 border border-[#d5d2c6] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#727365] uppercase">Date</span>
                  <span className="font-black text-[#161713]">{formatDate(event.event_date)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#727365] uppercase">Time</span>
                  <span className="font-black text-[#161713]">{formatTime(event.event_date)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#727365] uppercase">Location</span>
                  <span className="font-black text-[#161713] truncate max-w-[150px]">{event.venue}</span>
                </div>
              </div>

              {/* Tear line with barcode */}
              <div className="vyb-tear my-0">
                <div className="vyb-barcode" />
                <span className="text-[7px] font-mono font-bold tracking-widest text-[#737568]">GATE PASS</span>
              </div>

              {/* Buy Button */}
              {isEnded ? (
                <button
                  disabled
                  className="w-full py-4 rounded-xl bg-[#20211a] text-[#737568] text-xs font-black uppercase tracking-wider cursor-not-allowed"
                >
                  Sales Closed
                </button>
              ) : (
                <button
                  onClick={handleBuyTickets}
                  className="vyb-btn rounded-xl !w-full !py-4 !text-xs !gap-2 shadow-[3px_3px_0px_#161713]"
                >
                  GET TICKETS NOW <span className="vyb-arrow">↗</span>
                </button>
              )}

              <p className="text-center text-[10px] text-[#606257] font-medium -mt-2">
                Instant delivery to email ✳ Print or show on phone
              </p>

            </div>
          </div>

        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} event={event} />
      )}

    </div>
  );
}
