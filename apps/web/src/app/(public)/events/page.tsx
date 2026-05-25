'use client';

import React, { useState, useRef } from 'react';
import { useEvents } from '../../../hooks/useEvents';
import { Badge } from '../../../components/ui/badge';
import { SearchableSelect } from '../../../components/ui/searchable-select';
import { formatNaira, formatDate } from '../../../lib/utils';
import Link from 'next/link';
import { 
  Calendar, MapPin, Search, Music, Trophy, Theater, Disc, 
  ChevronRight, ChevronLeft, Filter, Flame, Cpu, GraduationCap, 
  Utensils, Tag, Heart, BanIcon
} from 'lucide-react';

const CITY_OPTIONS = [
  'Abia', 'Abuja FCT', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

const CATEGORIES = [
  { value: 'all', label: 'All Events', icon: Flame },
  { value: 'music', label: 'Music', icon: Music },
  { value: 'sports', label: 'Sports', icon: Trophy },
  { value: 'tech', label: 'Tech', icon: Cpu },
  { value: 'comedy', label: 'Comedy', icon: Theater },
  { value: 'church', label: 'Religion', icon: Heart },
  { value: 'campus', label: 'Campus', icon: GraduationCap },
  { value: 'food', label: 'Food', icon: Utensils },
  { value: 'other', label: 'Custom', icon: Tag },
];

const CAT_GRADIENTS: Record<string, string> = {
  music: 'from-[#E8441A] to-[#ff7d59]',
  sports: 'from-amber-500 to-orange-400',
  tech: 'from-blue-600 to-cyan-500',
  comedy: 'from-purple-600 to-pink-500',
  church: 'from-emerald-600 to-teal-500',
  campus: 'from-indigo-600 to-purple-500',
  food: 'from-rose-600 to-amber-500',
  other: 'from-zinc-650 to-zinc-450',
  Concerts: 'from-[#E8441A] to-[#ff7d59]',
  Sports: 'from-amber-500 to-orange-400',
  Theater: 'from-purple-600 to-pink-500',
  Festivals: 'from-cyan-500 to-blue-500',
};

const getCategoryLabel = (category: string, customCategory?: string) => {
  if (category === 'other' && customCategory) return customCategory;
  const labels: Record<string, string> = {
    music: 'Music',
    sports: 'Sports',
    tech: 'Tech',
    comedy: 'Comedy',
    church: 'Religion',
    campus: 'Campus',
    food: 'Food',
    other: 'Other',
  };
  return labels[category] || category;
};

// Horizontal Carousel Shelf Component
interface ShelfProps {
  title: string;
  subtitle?: string;
  events: any[];
}

function EventShelf({ title, subtitle, events }: ShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!events || events.length === 0) return null;

  return (
    <div className="relative group/shelf mb-10 w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white font-syne uppercase tracking-tight">
            {title}
          </h2>
          {subtitle && <p className="text-[10px] text-zinc-550 tracking-wider mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* Navigation arrows for desktop */}
        <button
          onClick={() => scroll('left')}
          className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-zinc-950/80 border border-zinc-800 text-white items-center justify-center opacity-0 group-hover/shelf:opacity-100 transition-opacity hover:bg-zinc-900 shadow-lg hidden md:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-zinc-950/80 border border-zinc-800 text-white items-center justify-center opacity-0 group-hover/shelf:opacity-100 transition-opacity hover:bg-zinc-900 shadow-lg hidden md:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Scroll Track */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 scroll-smooth"
        >
          {events.map((event) => {
            const coverImage = event.cover_image_url || 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600';
            const activeTiers = event.ticket_tiers || event.tiers || [];
            const hasFreeTier = activeTiers.some((t: any) => t.price === 0);
            const hasPaidTier = activeTiers.some((t: any) => t.price > 0);
            const startingPrice = hasPaidTier
              ? Math.min(...activeTiers.filter((t: any) => t.price > 0).map((t: any) => t.price))
              : 0;
            const gradient = CAT_GRADIENTS[event.category] || 'from-[#E8441A] to-[#ff7d59]';

            return (
              <div key={event.id} className="w-[280px] sm:w-[320px] shrink-0 snap-start">
                <Link href={`/events/${event.slug}`} className="group block">
                  <div className="rounded-2xl border border-zinc-900/80 bg-zinc-950/30 overflow-hidden transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-zinc-800 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
                    
                    {/* Cover image */}
                    <div className="relative h-44 w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImage}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#08080C]/90 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest text-white uppercase bg-gradient-to-r ${gradient}`}>
                          {getCategoryLabel(event.category, event.custom_category)}
                        </span>
                        {event.is_university_only && (
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest text-white uppercase bg-purple-600/90 border border-purple-500/30">
                            CAMPUS
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col gap-2">
                      <div className="flex items-center gap-1 text-[9px] font-black text-[#E8441A] uppercase tracking-widest">
                        <Calendar className="h-3 w-3" />
                        {formatDate(event.event_date)}
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-white font-syne uppercase tracking-tight line-clamp-1 group-hover:text-[#E8441A] transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{event.venue}, {event.city}</span>
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="px-4 pb-4 pt-2 border-t border-zinc-900/50 flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-black text-zinc-650 uppercase tracking-widest">From</p>
                        <p className="text-xs sm:text-sm font-extrabold text-white">
                          {hasFreeTier && hasPaidTier ? 'Free/Paid' : (hasPaidTier ? formatNaira(startingPrice) : 'Free')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-black text-[#E8441A] uppercase tracking-widest group-hover:gap-1.5 transition-all">
                        <span>Tickets</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </div>

                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function EventsListingPage() {
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCampusOnly, setShowCampusOnly] = useState(false);

  const filters = {
    search: search || undefined,
    city: selectedCity,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    isUniversityOnly: showCampusOnly || undefined,
    limit: 100, // Fetch up to 100 recent/trending events to populate all the shelves
  };

  const { data: events, isLoading } = useEvents(filters);

  // Check if user is actively searching/filtering
  const isFiltering = !!(search || selectedCity || selectedCategory !== 'all' || showCampusOnly);

  // 1. Calculate trending score using time-decay formula
  const getTrendingScore = (event: any) => {
    // Sum total sold tickets across tiers (mocked or actual)
    const ticketSales = event.ticket_tiers?.reduce((acc: number, t: any) => acc + (t.sold || 0), 0) || 0;
    const createdDate = new Date(event.created_at || Date.now());
    const hoursSincePublished = Math.max(0.1, (Date.now() - createdDate.getTime()) / (1000 * 60 * 60));
    return ticketSales / Math.pow(hoursSincePublished + 2, 1.8);
  };

  // 2. Shelf Category Sorting and Filtering (Client side)
  const spotlightEvents = events ? events.slice(0, 3) : [];
  const trendingEvents = events ? [...events].sort((a, b) => getTrendingScore(b) - getTrendingScore(a)) : [];
  const campusEvents = events ? events.filter(e => e.is_university_only) : [];
  const musicEvents = events ? events.filter(e => e.category === 'music') : [];
  const techEvents = events ? events.filter(e => e.category === 'tech') : [];
  const comedyEvents = events ? events.filter(e => e.category === 'comedy') : [];
  const foodEvents = events ? events.filter(e => e.category === 'food') : [];

  return (
    <div className="w-full min-h-screen bg-[#08080C] font-outfit text-zinc-100">

      {/* PAGE HERO — Ticketmaster-style sub-header with search */}
      <div className="w-full bg-zinc-950/80 border-b border-zinc-900 px-6 py-8 sticky top-0 z-30 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-start sm:items-center gap-4">

          {/* Title */}
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-black text-white font-syne uppercase tracking-tight">
              {selectedCategory === 'all' ? 'All Events' : selectedCategory}
              {selectedCity && <span className="text-zinc-500"> · {selectedCity}</span>}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isLoading ? 'Loading...' : `${events?.length ?? 0} events available`}
            </p>
          </div>

          {/* Inline search */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex items-center flex-1 sm:w-64">
              <Search className="absolute left-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search events, venues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-900/60 pl-9 pr-4 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#E8441A] focus:outline-none focus:ring-2 focus:ring-[#E8441A]/20 transition-all"
              />
            </div>

            {/* City dropdown */}
            <div className="w-48 z-50">
              <SearchableSelect
                options={[
                  { value: '', label: 'All Cities' },
                  ...CITY_OPTIONS.map(c => ({ value: c.toLowerCase().replace(' ', '_'), label: c }))
                ]}
                value={selectedCity || ''}
                onChange={(val) => setSelectedCity(val || undefined)}
                placeholder="All Cities"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY PILL FILTER ROW */}
      <div className="w-full border-b border-zinc-900/80 px-6 py-3 bg-[#08080C]">
        <div className="mx-auto max-w-6xl flex items-center gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${
                  active
                    ? 'bg-[#E8441A] text-white shadow-md shadow-[#E8441A]/20'
                    : 'bg-zinc-900/60 border border-zinc-800 text-zinc-440 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}

          <div className="flex-1" />

          {/* Campus toggle */}
          <button
            onClick={() => setShowCampusOnly(!showCampusOnly)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${
              showCampusOnly ? 'bg-purple-600 text-white' : 'bg-zinc-900/60 border border-zinc-800 text-zinc-440 hover:border-zinc-700'
            }`}
          >
            <Disc className="h-3.5 w-3.5" />
            Campus Only
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-6xl px-6 py-10">

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="h-80 rounded-2xl border border-zinc-900/80 bg-zinc-950/30 overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="h-44 w-full bg-zinc-900/40 animate-pulse" />
                  <div className="p-4 flex flex-col gap-3">
                    <div className="w-20 h-3 bg-zinc-900/50 rounded animate-pulse" />
                    <div className="w-full h-4 bg-zinc-800/50 rounded animate-pulse" />
                    <div className="w-2/3 h-3 bg-zinc-900/50 rounded animate-pulse" />
                  </div>
                </div>
                <div className="px-4 pb-4 pt-2 border-t border-zinc-900/50 flex items-center justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="w-10 h-2 bg-zinc-900/50 rounded animate-pulse" />
                    <div className="w-16 h-4 bg-zinc-800/50 rounded animate-pulse" />
                  </div>
                  <div className="w-16 h-3 bg-zinc-900/50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : isFiltering ? (
          
          /* VIEW 1: FILTERED RESULTS LIST (Traditional Grid Layout) */
          <div>
            {events && events.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900/60">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Showing <span className="text-white">{events.length}</span> matches found
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {events.map((event) => {
                    const coverImage = event.cover_image_url || 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600';
                    const activeTiers = event.ticket_tiers || event.tiers || [];
                    const hasFreeTier = activeTiers.some((t: any) => t.price === 0);
                    const hasPaidTier = activeTiers.some((t: any) => t.price > 0);
                    const startingPrice = hasPaidTier
                      ? Math.min(...activeTiers.filter((t: any) => t.price > 0).map((t: any) => t.price))
                      : 0;
                    const gradient = CAT_GRADIENTS[event.category] || 'from-[#E8441A] to-[#ff7d59]';
                    const isEnded = event.is_ended ||
                      (event.end_date ? new Date(event.end_date) < new Date() : false);

                    return (
                      <Link key={event.id} href={`/events/${event.slug}`} className="group block">
                        <div className={`rounded-2xl border overflow-hidden transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] ${
                          isEnded ? 'border-zinc-800/50 bg-zinc-950/20 opacity-80' : 'border-zinc-900/80 bg-zinc-950/30 group-hover:border-zinc-800'
                        }`}>
                          <div className="relative h-44 w-full overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={coverImage}
                              alt={event.title}
                              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isEnded ? 'grayscale-[30%]' : ''}`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#08080C]/90 via-transparent to-transparent" />
                            <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest text-white uppercase bg-gradient-to-r ${gradient}`}>
                                {getCategoryLabel(event.category, event.custom_category)}
                              </span>
                              <div className="flex items-center gap-1">
                                {isEnded && (
                                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest text-white uppercase bg-amber-700/90 border border-amber-600/40 flex items-center gap-0.5">
                                    <BanIcon className="h-2.5 w-2.5" /> ENDED
                                  </span>
                                )}
                                {event.is_university_only && (
                                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest text-white uppercase bg-purple-600/90 border border-purple-500/30">
                                    CAMPUS
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="p-4 flex flex-col gap-2.5">
                            <div className="flex items-center gap-1 text-[10px] font-black text-[#E8441A] uppercase tracking-widest">
                              <Calendar className="h-3 w-3" />
                              {formatDate(event.event_date)}
                            </div>
                            <h3 className="text-sm font-black text-white font-syne uppercase tracking-tight line-clamp-2 leading-snug group-hover:text-[#E8441A] transition-colors">
                              {event.title}
                            </h3>
                            <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{event.venue}, {event.city}</span>
                            </p>
                          </div>
                          <div className="px-4 pb-4 pt-2 border-t border-zinc-900/50 flex items-center justify-between">
                            <div>
                              <p className="text-[8px] font-black text-zinc-650 uppercase tracking-widest">From</p>
                              <p className="text-sm font-extrabold text-white">
                                {hasFreeTier && hasPaidTier ? 'Free & Paid' : (hasPaidTier ? formatNaira(startingPrice) : 'Free')}
                              </p>
                            </div>
                            {isEnded ? (
                              <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase tracking-widest">
                                <BanIcon className="h-3 w-3" /> Sales Closed
                              </span>
                            ) : (
                              <div className="flex items-center gap-1 text-[10px] font-black text-[#E8441A] uppercase tracking-widest group-hover:gap-1.5 transition-all">
                                <span>Tickets</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="w-full text-center py-24 border border-dashed border-zinc-900 rounded-3xl bg-zinc-950/20">
                <MapPin className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-2">No Events Found</h3>
                <p className="text-xs text-zinc-650">Try clearing your filters or search query.</p>
              </div>
            )}
          </div>
        ) : (

          /* VIEW 2: DYNAMIC NETFLIX-STYLE SHELVES (Default Explorer View) */
          <div className="flex flex-col gap-10">

            {/* A. Spotlight Tour selections */}
            {spotlightEvents.length > 0 && (
              <div className="mb-6 w-full">
                <h2 className="text-base sm:text-lg font-black uppercase text-white font-syne tracking-tight mb-4 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-amber-500" />
                  Spotlight Selections
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Primary widescreen highlight card */}
                  <div className="lg:col-span-8 group relative rounded-3xl overflow-hidden border border-zinc-850 h-[320px] sm:h-[360px] flex flex-col justify-end p-6 sm:p-8 shadow-2xl transition-all hover:border-[#E8441A]/30">
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105" 
                      style={{ backgroundImage: `linear-gradient(to top, rgba(8, 8, 14, 0.98) 15%, rgba(8, 8, 14, 0.35) 60%, rgba(8, 8, 14, 0) 100%), url('${spotlightEvents[0].cover_image_url || 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=800'}')` }}
                    />
                    <div className="relative z-10 flex flex-col gap-2 max-w-xl">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#E8441A] font-black text-[9px] tracking-widest px-2.5 py-0.5">
                          {getCategoryLabel(spotlightEvents[0].category, spotlightEvents[0].custom_category)}
                        </Badge>
                        {spotlightEvents[0].is_university_only && (
                          <Badge className="bg-purple-600/90 font-black text-[9px] tracking-widest px-2.5 py-0.5 border border-purple-500/25">
                            CAMPUS EXCLUSIVE
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs font-black text-[#E8441A] uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {formatDate(spotlightEvents[0].event_date)}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white font-syne uppercase tracking-tight group-hover:text-[#E8441A] transition-colors leading-tight line-clamp-1">
                        {spotlightEvents[0].title}
                      </h3>
                      <p className="text-xs text-zinc-400 flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-zinc-550 shrink-0" />
                        {spotlightEvents[0].venue}, {spotlightEvents[0].city}
                      </p>
                      <div className="flex items-center justify-between border-t border-zinc-800/60 pt-4 mt-2">
                        <span className="text-xs font-black text-white">
                          {(() => {
                            const tiers = spotlightEvents[0].ticket_tiers || [];
                            const hasFree = tiers.some((t: any) => t.price === 0);
                            const hasPaid = tiers.some((t: any) => t.price > 0);
                            const startPrice = hasPaid ? Math.min(...tiers.filter((t: any) => t.price > 0).map((t: any) => t.price)) : 0;
                            if (hasFree && hasPaid) return 'Free & Paid';
                            if (hasPaid) return `From ${formatNaira(startPrice)}`;
                            return 'FREE';
                          })()}
                        </span>
                        <Link href={`/events/${spotlightEvents[0].slug}`}>
                          <button className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-[#E8441A] hover:text-white transition-all duration-300 text-xxs font-black uppercase tracking-widest flex items-center gap-1">
                            <span>Get Tickets</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Secondary auxiliary spotlight cards */}
                  <div className="lg:col-span-4 flex flex-col gap-6 justify-between h-[320px] sm:h-[360px]">
                    {spotlightEvents.slice(1, 3).map((event) => {
                      const activeTiers = event.ticket_tiers || [];
                      const hasFreeTier = activeTiers.some((t: any) => t.price === 0);
                      const hasPaidTier = activeTiers.some((t: any) => t.price > 0);
                      const startingPrice = hasPaidTier
                        ? Math.min(...activeTiers.filter((t: any) => t.price > 0).map((t: any) => t.price))
                        : 0;

                      return (
                        <div 
                          key={event.id}
                          className="group flex-1 relative rounded-3xl overflow-hidden border border-zinc-850 p-5 flex flex-col justify-end shadow-2xl transition-all hover:border-[#E8441A]/30"
                        >
                          <div 
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105" 
                            style={{ backgroundImage: `linear-gradient(to top, rgba(8, 8, 14, 0.95) 20%, rgba(8, 8, 14, 0.25) 70%, rgba(8, 8, 14, 0) 100%), url('${event.cover_image_url || 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=800'}')` }}
                          />
                          <div className="relative z-10 flex flex-col gap-1">
                            <span className="text-[9px] font-black text-[#E8441A] uppercase tracking-widest flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {formatDate(event.event_date)}
                            </span>
                            <h4 className="text-sm font-black text-white font-syne uppercase tracking-tight line-clamp-1 group-hover:text-[#E8441A] transition-colors">
                              {event.title}
                            </h4>
                            <div className="flex items-center justify-between pt-2 mt-1 border-t border-zinc-800/40">
                              <span className="text-xs font-black text-white">
                                {hasFreeTier && hasPaidTier ? 'Free/Paid' : (hasPaidTier ? formatNaira(startingPrice) : 'Free')}
                              </span>
                              <Link href={`/events/${event.slug}`} className="text-[10px] font-black uppercase tracking-widest text-[#E8441A] group-hover:text-[#ff5d35] flex items-center gap-0.5">
                                <span>Get Tickets</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* B. Trending Vibes Carousel */}
            <EventShelf 
              title="Trending Vibes" 
              subtitle="The most popular events calculations based on live sales & page views" 
              events={trendingEvents} 
            />

            {/* C. Campus Exclusives */}
            <EventShelf 
              title="Campus Exclusives" 
              subtitle="Events restricted exclusively to verified students & universities" 
              events={campusEvents} 
            />

            {/* D. Music & Concerts */}
            <EventShelf 
              title="Music & Raves" 
              subtitle="Premium outdoor concert events, festivals, and beach raves" 
              events={musicEvents} 
            />

            {/* E. Tech Summits */}
            <EventShelf 
              title="Tech & Hackathons" 
              subtitle="Developer gatherings, tech conferences, and networking events" 
              events={techEvents} 
            />

            {/* F. Comedy & Theater */}
            <EventShelf 
              title="Comedy & Theater" 
              subtitle="Unforgettable nights of laughs, theater shows, and student acts" 
              events={comedyEvents} 
            />

            {/* G. Food & Socials */}
            <EventShelf 
              title="Food & Socials" 
              subtitle="Enjoy delicacies, outdoor social meetups, games, and grills" 
              events={foodEvents} 
            />

          </div>
        )}

      </div>
    </div>
  );
}

