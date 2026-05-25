'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEvent } from '../../../../hooks/useEvents';
import { Badge } from '../../../../components/ui/badge';
import CheckoutModal from '../../../../components/tickets/CheckoutModal';
import { formatNaira, formatDate, formatTime } from '../../../../lib/utils';
import { useAuth } from '../../../../hooks/useAuth';
import { useToast } from '../../../../components/ui/toast';
import {
  Calendar, MapPin, ArrowLeft, ShieldAlert, LogIn, Disc, GraduationCap,
  ShieldCheck, Clock, Tag, ChevronRight, Users, Share2, BanIcon
} from 'lucide-react';

const CAT_GRADIENTS: Record<string, string> = {
  music: 'from-[#E8441A] to-[#ff7d59]',
  sports: 'from-amber-500 to-orange-400',
  tech: 'from-blue-600 to-cyan-500',
  comedy: 'from-purple-600 to-pink-500',
  church: 'from-emerald-600 to-teal-500',
  campus: 'from-indigo-600 to-purple-500',
  food: 'from-rose-600 to-amber-500',
  other: 'from-zinc-600 to-zinc-400',
  Concerts: 'from-[#E8441A] to-[#ff7d59]',
  Sports: 'from-amber-500 to-orange-400',
  Theater: 'from-purple-600 to-pink-500',
  Festivals: 'from-cyan-500 to-blue-500',
};

const getCategoryLabel = (category: string, customCategory?: string) => {
  if (category === 'other' && customCategory) return customCategory;
  const labels: Record<string, string> = {
    music: 'Music & Concerts',
    sports: 'Sports & Fitness',
    tech: 'Tech & Science',
    comedy: 'Comedy & Drama',
    church: 'Religion & Church',
    campus: 'Campus Event',
    food: 'Food & Drinks',
    other: 'Other / Custom',
  };
  return labels[category] || category;
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const id = params.id as string;
  const { data: event, isLoading, error } = useEvent(id);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#08080C] py-32 gap-4">
        <Disc className="h-10 w-10 text-[#E8441A] animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Loading Event...</span>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#08080C] px-6 py-32 text-center gap-4">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-black uppercase tracking-tight text-white font-syne">Event Not Found</h2>
        <p className="text-sm text-zinc-500 max-w-sm">This event may have been removed or does not exist.</p>
        <button
          onClick={() => window.location.href = '/events'}
          className="mt-2 px-6 py-2.5 rounded-xl bg-[#E8441A] text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all"
        >
          Back to Events
        </button>
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
  const gradient = CAT_GRADIENTS[event.category] || 'from-[#E8441A] to-[#ff7d59]';

  // Determine if the event has ended
  const isEnded: boolean = event.is_ended ||
    (event.end_date ? new Date(event.end_date) < new Date() : false);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link Copied!', description: 'Event link copied to clipboard.', variant: 'success' });
  };

  const handleBuyTickets = () => {
    if (isEnded) return; // already blocked by the UI, but guard anyway
    if (!isAuthenticated) {
      toast({ title: 'Sign in required', description: 'Please log in to purchase tickets', variant: 'destructive' });
      window.location.href = `/login?redirect=${encodeURIComponent(`/events/${id}`)}`;
      return;
    }
    if (user?.role !== 'buyer' && user?.role !== 'gate_staff') {
      toast({ title: 'Buyer account required', description: 'Only Buyer or Gate Staff accounts can purchase tickets.', variant: 'destructive' });
      return;
    }
    if (event.is_university_only && user?.email && !user.email.endsWith('.edu.ng')) {
      toast({ title: 'Campus access only', description: 'This event is restricted to valid university email addresses (.edu.ng)', variant: 'destructive' });
      return;
    }
    setIsCheckoutOpen(true);
  };

  return (
    <div className="w-full bg-[#08080C] pb-28 font-outfit min-h-screen text-zinc-100">

      {/* HERO BANNER */}
      <div className="relative w-full h-[50vh] min-h-[320px] max-h-[500px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverImage} alt={event.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080C] via-[#08080C]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080C]/30 to-transparent" />

        {/* Back and Share buttons overlaid on hero */}
        <div className="absolute top-6 left-6 flex items-center gap-3">
          <button
            onClick={() => window.location.href = '/events'}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/80 hover:text-white bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 transition-all hover:bg-black/50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Events
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/80 hover:text-white bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 transition-all hover:bg-black/50"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-6xl px-6 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">

          {/* LEFT — Event Info */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* Title block */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-white uppercase bg-gradient-to-r ${gradient}`}>
                  {getCategoryLabel(event.category, event.custom_category)}
                </span>
                {event.is_university_only && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-white uppercase bg-purple-600/90 border border-purple-500/25 flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" /> Campus Exclusive
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-syne uppercase tracking-tight leading-[1.05]">
                {event.title}
              </h1>

              {/* Ended banner */}
              {isEnded && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-950/30 border border-amber-700/40 mt-1">
                  <BanIcon className="h-4 w-4 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">This Event Has Ended</p>
                    <p className="text-xs text-amber-300/60 mt-0.5">Ticket sales are permanently closed. You can still view event details below.</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
                <span className="flex items-center gap-1.5 font-bold">
                  <Calendar className="h-3.5 w-3.5 text-[#E8441A]" />
                  {formatDate(event.event_date)}
                </span>
                <span className="flex items-center gap-1.5 font-bold">
                  <Clock className="h-3.5 w-3.5 text-[#E8441A]" />
                  {formatTime(event.event_date)}
                </span>
                <span className="flex items-center gap-1.5 font-bold">
                  <MapPin className="h-3.5 w-3.5 text-[#E8441A]" />
                  {event.venue}, {event.city}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-zinc-900 pt-6">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">About This Event</h3>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>

            {/* Ticket Tiers table */}
            <div className="border-t border-zinc-900 pt-6">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Available Ticket Tiers</h3>
              {isEnded ? (
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-900/30 bg-amber-950/10">
                  <BanIcon className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-black text-amber-400 uppercase tracking-wide">Sales Closed</p>
                    <p className="text-xs text-zinc-500 mt-0.5">This event has ended. Ticket purchases are no longer available.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {activeTiers.map((tier) => {
                    const soldCount = tier.sold || 0;
                    const remaining = tier.quantity - soldCount;
                    const isSoldOut = soldCount >= tier.quantity;
                    const pctSold = tier.quantity > 0 ? Math.min(100, Math.round((soldCount / tier.quantity) * 100)) : 0;
                    return (
                      <div key={tier.id} className="p-4 rounded-2xl border border-zinc-900 bg-zinc-950/40 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-black text-white uppercase tracking-wide">{tier.name}</span>
                            <span className="text-xs text-zinc-500">{tier.description || 'Standard entry gate access'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-base font-black text-[#E8441A]">
                              {tier.price === 0 ? 'FREE' : formatNaira(tier.price)}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isSoldOut ? 'bg-red-950/40 text-red-400 border border-red-900/40' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'}`}>
                              {isSoldOut ? 'Sold Out' : 'Available'}
                            </span>
                          </div>
                        </div>
                        {/* Sold progress bar + remaining */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-zinc-900 rounded-full overflow-hidden">
                            <div className="h-full bg-[#E8441A]/60 rounded-full" style={{ width: `${pctSold}%` }} />
                          </div>
                          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest whitespace-nowrap">
                            {soldCount}/{tier.quantity} sold
                          </span>
                        </div>
                        {/* Remaining tickets */}
                        {!isSoldOut && (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                              <span className="text-emerald-400 font-black">{remaining}</span>
                              {remaining === 1 ? 'ticket left' : 'tickets left'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Trust row */}
            <div className="border-t border-zinc-900 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: ShieldCheck, color: 'text-[#E8441A]', label: 'HMAC-SHA256 Sealed Entry' },
                { icon: Tag, color: 'text-amber-400', label: 'Paystack Secured Checkout' },
                { icon: Users, color: 'text-purple-400', label: 'Verified Organizer' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-950/30 border border-zinc-900">
                  <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-tight">{item.label}</span>
                </div>
              ))}
            </div>

          </div>

          {/* RIGHT — Sticky Checkout Card */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 backdrop-blur-xl p-6 flex flex-col gap-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">

              {/* Price */}
              <div className="flex items-end justify-between pb-4 border-b border-zinc-900">
                <div>
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Tickets From</p>
                  <p className="text-2xl font-black text-white font-syne mt-1">
                    {hasFreeTier && hasPaidTier
                      ? 'Free & Paid Options'
                      : (hasPaidTier ? formatNaira(startingPrice) : 'FREE ENTRY')}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest text-white uppercase bg-gradient-to-r ${gradient}`}>
                  {getCategoryLabel(event.category, event.custom_category)}
                </span>
              </div>

              {/* Date & Venue */}
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E8441A]/10 border border-[#E8441A]/20 flex items-center justify-center text-[#E8441A] shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Date & Time</p>
                    <p className="text-sm font-bold text-white mt-0.5">{formatDate(event.event_date)}</p>
                    <p className="text-xs text-zinc-500">Starts at {formatTime(event.event_date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E8441A]/10 border border-[#E8441A]/20 flex items-center justify-center text-[#E8441A] shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Venue</p>
                    <p className="text-sm font-bold text-white mt-0.5">{event.venue}</p>
                    <p className="text-xs text-zinc-500">{event.city}, Nigeria</p>
                  </div>
                </div>
              </div>

              {/* Campus alert */}
              {event.is_university_only && (
                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/30 flex gap-2.5 items-start">
                  <GraduationCap className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Campus Only Event</p>
                    <p className="text-xs text-purple-300/70 mt-1 leading-relaxed">Requires a valid .edu.ng university email to purchase tickets.</p>
                  </div>
                </div>
              )}

              {/* CTA Button */}
              {isEnded ? (
                <div className="flex flex-col gap-2">
                  <div className="h-12 w-full rounded-xl bg-zinc-900 border border-amber-900/30 text-amber-500 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                    <BanIcon className="h-4 w-4" />
                    Sales Closed
                  </div>
                  <p className="text-center text-[10px] text-zinc-600">This event has ended. No tickets can be purchased.</p>
                </div>
              ) : (
                <button
                  onClick={handleBuyTickets}
                  className="h-12 w-full rounded-xl bg-[#E8441A] hover:brightness-110 active:scale-[0.98] transition-all text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#E8441A]/20"
                >
                  {isAuthenticated ? (
                    <><span>Get Tickets</span><ChevronRight className="h-4 w-4" /></>
                  ) : (
                    <><LogIn className="h-4 w-4" /><span>Sign In to Buy</span></>
                  )}
                </button>
              )}

              {!isAuthenticated && !isEnded && (
                <p className="text-center text-[10px] text-zinc-600 -mt-2">You must be signed in to purchase</p>
              )}

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
