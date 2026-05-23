'use client';

import React from 'react';
import { useOrganizerEvents } from '../../../hooks/useEvents';
import { useAuth } from '../../../hooks/useAuth';
import { formatNaira, formatDate } from '../../../lib/utils';
import Link from 'next/link';
import { Plus, QrCode, Calendar, Disc, Banknote, Activity, Users, TrendingUp, ArrowRight, ChevronRight, Zap, LayoutGrid, Edit3, Share2, Ticket } from 'lucide-react';
import { useToast } from '../../../components/ui/toast';

export default function OrganizerDashboardPage() {
  const { user } = useAuth();
  const { data: events, isLoading, error } = useOrganizerEvents();
  const { toast } = useToast();
  const [mounted, setMounted] = React.useState(false);

  const handleShare = (slug: string) => {
    const url = `${window.location.origin}/events/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link Copied!', description: 'Event link copied to clipboard.', variant: 'success' });
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const totalEvents = events?.length || 0;
  const totalCapacity = events?.reduce((sum, ev) => sum + (ev.ticket_tiers?.reduce((s: number, t: any) => s + t.quantity, 0) || 0), 0) || 0;
  const totalSold = events?.reduce((sum, ev) => sum + (ev.ticket_tiers?.reduce((s: number, t: any) => s + (t.sold || 0), 0) || 0), 0) || 0;
  const estimatedSalesKobo = events?.reduce((sum, ev) => sum + (ev.ticket_tiers?.reduce((s: number, t: any) => s + ((t.sold || 0) * t.price), 0) || 0), 0) || 0;
  const fillRate = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;

  const STATS = [
    { icon: Banknote, label: 'Gross Revenue', value: formatNaira(estimatedSalesKobo), color: 'text-[#E8441A]', bg: 'bg-[#E8441A]/10 border-[#E8441A]/20' },
    { icon: Users, label: 'Tickets Sold', value: `${totalSold} / ${totalCapacity}`, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { icon: TrendingUp, label: 'Fill Rate', value: `${fillRate}%`, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { icon: Activity, label: 'Live Events', value: `${totalEvents} Active`, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  ];

  return (
    <div className="w-full min-h-screen bg-[#08080C] font-outfit text-zinc-100">
      {/* Sticky Header */}
      <div className="w-full border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur-xl px-6 py-6 sticky top-0 z-30">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Organizer Console</p>
            <h1 className="text-xl sm:text-2xl font-black text-white font-syne uppercase tracking-tight">
              {mounted && user?.full_name ? `${user.full_name.split(' ')[0]}'s` : "Organizer's"} Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/tickets" className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:border-[#E8441A] text-xs font-black uppercase tracking-widest transition-all">
              <Ticket className="h-4 w-4" />Ticket History
            </Link>
            <Link href="/events/create" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8441A] hover:brightness-110 text-white text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-[#E8441A]/15">
              <Plus className="h-4 w-4" />New Event
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {STATS.map((stat) => (
            <div key={stat.label} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/30 flex flex-col gap-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${stat.bg}`}>
                <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-black text-white font-syne mt-0.5">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Fill rate bar */}
        {totalCapacity > 0 && (
          <div className="mb-10 p-5 rounded-2xl border border-zinc-900 bg-zinc-950/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Overall Capacity Fill</span>
              </div>
              <span className="text-xs font-black text-amber-400">{fillRate}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#E8441A] to-amber-400 rounded-full transition-all duration-700" style={{ width: `${fillRate}%` }} />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-zinc-600">{totalSold} sold</span>
              <span className="text-[10px] text-zinc-600">{totalCapacity} capacity</span>
            </div>
          </div>
        )}

        {/* Events header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900/60">
          <h2 className="text-lg font-black text-white font-syne uppercase tracking-tight flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-[#E8441A]" />My Hosted Events
          </h2>
          <Link href="/events/create" className="flex items-center gap-1 text-xs font-black text-zinc-500 hover:text-[#E8441A] uppercase tracking-widest transition-colors group">
            Add<ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Events list */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Disc className="h-10 w-10 text-[#E8441A] animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Loading events...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16 border border-dashed border-zinc-900 rounded-3xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Failed to load. Please refresh.</p>
          </div>
        ) : events && events.length > 0 ? (
          <div className="flex flex-col gap-3">
            {events.map((event) => {
              const coverImage = event.cover_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=400';
              const soldQty = event.ticket_tiers?.reduce((s: number, t: any) => s + (t.sold || 0), 0) || 0;
              const totalQty = event.ticket_tiers?.reduce((s: number, t: any) => s + t.quantity, 0) || 0;
              const pct = totalQty > 0 ? Math.round((soldQty / totalQty) * 100) : 0;
              const revenue = event.ticket_tiers?.reduce((s: number, t: any) => s + ((t.sold || 0) * t.price), 0) || 0;
              return (
                <div key={event.id} className="group flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-2xl border border-zinc-900 bg-zinc-950/30 hover:border-zinc-800 transition-all">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverImage} alt={event.title} className="h-16 w-16 rounded-xl object-cover border border-zinc-900 shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest text-white uppercase bg-[#E8441A]/80">{event.category === 'other' && event.custom_category ? event.custom_category : event.category}</span>
                        {event.is_university_only && <span className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest text-white uppercase bg-purple-600/80">CAMPUS</span>}
                      </div>
                      <h3 className="text-sm font-black text-white font-syne uppercase tracking-tight truncate group-hover:text-[#E8441A] transition-colors">{event.title}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-[#E8441A]" />{formatDate(event.event_date)}</span>
                        <span className="hidden sm:inline text-zinc-700">·</span>
                        <span>{soldQty}/{totalQty} · {formatNaira(revenue)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1 bg-zinc-900 rounded-full overflow-hidden max-w-[100px]">
                          <div className="h-full bg-[#E8441A]/70 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-zinc-600">{pct}% full</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:flex md:items-center gap-2 mt-2 md:mt-0 w-full md:w-auto shrink-0">
                    <button onClick={() => handleShare(event.slug)} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-[#E8441A] hover:border-[#E8441A] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest w-full md:w-auto">
                      <Share2 className="h-3.5 w-3.5" />Share
                    </button>
                    <Link href={`/scan/${event.id}`} className="w-full md:w-auto">
                      <button className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-[#E8441A] hover:border-[#E8441A] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest w-full">
                        <QrCode className="h-3.5 w-3.5" />Gate
                      </button>
                    </Link>
                    <Link href={`/events/${event.slug}/edit`} className="w-full md:w-auto">
                      <button className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-[#E8441A] hover:border-[#E8441A] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest w-full">
                        <Edit3 className="h-3.5 w-3.5" />Edit
                      </button>
                    </Link>
                    <Link href={`/events/${event.slug}`} className="w-full md:w-auto">
                      <button className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-700 transition-all text-[10px] font-black uppercase tracking-widest w-full">
                        View<ArrowRight className="h-3 w-3 ml-1" />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full text-center py-24 border border-dashed border-zinc-900 rounded-3xl flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-zinc-700" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">No Events Yet</h3>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">Create your first event and start selling tickets in minutes.</p>
            </div>
            <Link href="/events/create" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E8441A] text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-md shadow-[#E8441A]/15">
              <Plus className="h-4 w-4" />Create First Event
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

