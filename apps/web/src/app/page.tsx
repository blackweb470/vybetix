'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useEvents } from '../hooks/useEvents';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { formatNaira, formatDate } from '../lib/utils';
import { 
  Search, Calendar, MapPin, Music, Trophy, Theater, Disc, 
  Tent, ShieldCheck, Zap, Ticket, ArrowRight, Lock, Flame, ChevronRight, HelpCircle,
  Cpu, GraduationCap, Utensils, Tag, Heart
} from 'lucide-react';

const CATEGORIES = [
  { name: 'music', label: 'Music', icon: Music, gradient: 'from-[#E8441A] to-[#ff7d59]' },
  { name: 'sports', label: 'Sports', icon: Trophy, gradient: 'from-amber-500 to-orange-400' },
  { name: 'tech', label: 'Tech & Sci', icon: Cpu, gradient: 'from-blue-600 to-cyan-500' },
  { name: 'comedy', label: 'Comedy', icon: Theater, gradient: 'from-purple-600 to-pink-500' },
  { name: 'church', label: 'Religion', icon: Heart, gradient: 'from-emerald-600 to-teal-500' },
  { name: 'campus', label: 'Campus Hub', icon: GraduationCap, gradient: 'from-indigo-600 to-purple-500' },
  { name: 'food', label: 'Food', icon: Utensils, gradient: 'from-rose-600 to-amber-500' },
  { name: 'other', label: 'Custom', icon: Tag, gradient: 'from-zinc-600 to-zinc-400' }
];

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

const CITIES = ['Lagos', 'Abuja', 'Ibadan', 'Port Harcourt', 'Enugu'];

export default function LandingPage() {
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  
  // Set up active filters to fetch live events from backend
  const filters = {
    search: search || undefined,
    city: selectedCity,
    category: selectedCategory
  };

  const { data: events, isLoading } = useEvents(filters);

  // Divide events into Spotlight (first 3) and Trending Grid (remaining)
  const spotlightEvents = events ? events.slice(0, 3) : [];
  const remainingEvents = events ? events.slice(3) : [];

  const handleCitySelect = (city: string | undefined) => {
    setSelectedCity(city);
  };

  return (
    <div className="w-full bg-[#08080C] pb-32 overflow-x-hidden font-outfit relative">
      
      {/* Immersive Widescreen Background Overlays */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[50%] rounded-full bg-[#E8441A] blur-[200px] opacity-[0.05] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/30 blur-[180px] opacity-[0.05] pointer-events-none" />
      
      {/* 1. HERO SEARCH CONSOLE (Inspired by Ticketmaster's immersive focus) */}
      <section className="relative w-full min-h-[460px] sm:min-h-[520px] flex items-center justify-center px-6 bg-cover bg-center" style={{ backgroundImage: "linear-gradient(rgba(8, 8, 12, 0.45), rgba(8, 8, 12, 0.98)), url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200')" }}>
        <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#08080C]/90 to-transparent pointer-events-none" />
        
        <div className="mx-auto max-w-5xl w-full flex flex-col items-center text-center relative z-30 pt-16 pb-8">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-6 uppercase tracking-tight font-syne leading-[1.05]">
            Discover Live Events <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8441A] via-[#ff7d59] to-amber-500">
              Near You. Secured Instantly.
            </span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mb-10 leading-relaxed font-light">
            Search thousands of music concerts, premium beach festivals, and verified campus vibes. Backed by HMAC-SHA256 digital entry codes.
          </p>

          {/* Ticketmaster-Style Double Filter Search Box */}
          <div className="w-full max-w-3xl bg-zinc-950/85 backdrop-blur-xl border border-zinc-800/80 rounded-2xl sm:rounded-full p-2 flex flex-col sm:flex-row items-center gap-2 shadow-[0_30px_60px_rgba(0,0,0,0.8)] focus-within:border-[#E8441A]/50 transition-all duration-300">
            
            {/* Search Input field */}
            <div className="flex-1 w-full flex items-center pl-4 border-b sm:border-b-0 sm:border-r border-zinc-850 pb-2.5 sm:pb-0">
              <Search className="h-5 w-5 text-zinc-500 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Search events, artists, colleges, or venues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-none text-sm text-zinc-205 placeholder-zinc-500 focus:outline-none focus:ring-0 py-3"
              />
            </div>

            {/* City Dropdown Selection */}
            <div className="w-full sm:w-48 flex items-center px-4 pb-2.5 sm:pb-0">
              <MapPin className="h-5 w-5 text-zinc-500 mr-2.5 shrink-0" />
              <select
                value={selectedCity || ''}
                onChange={(e) => setSelectedCity(e.target.value || undefined)}
                className="w-full bg-transparent border-none text-sm text-zinc-300 focus:outline-none focus:ring-0 py-3 appearance-none cursor-pointer"
              >
                <option value="" className="bg-zinc-900 text-zinc-300">All Locations</option>
                {CITIES.map(c => (
                  <option key={c} value={c} className="bg-zinc-900 text-zinc-300">{c}</option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button className="w-full sm:w-auto px-8 py-3.5 sm:rounded-full bg-gradient-to-r from-[#E8441A] to-[#ff663e] hover:brightness-110 active:scale-95 transition-all text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#E8441A]/20 shrink-0">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* 2. CIRCULAR CATEGORY NAV (Famous Ticketmaster circles element) */}
      <section className="w-full px-6 mt-8 relative z-20">
        <div className="mx-auto max-w-6xl">
          <div className="bg-zinc-950/90 backdrop-blur-2xl border border-zinc-850 p-6 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            <div className="flex flex-wrap justify-center sm:justify-around items-center gap-6 sm:gap-4">
              
              {/* All Vibes circle */}
              <button 
                onClick={() => setSelectedCategory(undefined)}
                className="flex flex-col items-center gap-2 group focus:outline-none"
              >
                <div className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-300 ${selectedCategory === undefined ? 'bg-[#E8441A] border-[#E8441A] shadow-lg shadow-[#E8441A]/25 text-white' : 'bg-zinc-900/60 border-zinc-800 text-zinc-450 group-hover:border-zinc-500 group-hover:text-zinc-200'}`}>
                  <Ticket className="h-5.5 w-5.5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">All Vibes</span>
              </button>

              {/* Categorized circles */}
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.name;
                return (
                  <button 
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className="flex flex-col items-center gap-2 group focus:outline-none"
                  >
                    <div className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-300 ${isActive ? `bg-gradient-to-r ${cat.gradient} border-transparent shadow-lg text-white` : `bg-zinc-900/60 border-zinc-800 text-zinc-450 group-hover:border-zinc-500 group-hover:text-zinc-200`}`}>
                      <Icon className="h-5.5 w-5.5" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">{cat.label}</span>
                  </button>
                );
              })}

            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE "EVENTS NEAR YOU" QUICK CITIES BAR */}
      <section className="w-full px-6 mt-16 relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950/40 border border-zinc-900 p-5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#E8441A]/10 border border-[#E8441A]/20 flex items-center justify-center text-[#E8441A]">
                <MapPin className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">SHOWING EVENTS IN</p>
                <p className="text-sm font-black text-white uppercase tracking-wider">{selectedCity || 'All Locations, Nigeria'}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => handleCitySelect(undefined)}
                className={`px-3 py-1.5 rounded-lg text-xxs font-black uppercase tracking-widest transition-all ${!selectedCity ? 'bg-[#E8441A] text-white' : 'bg-zinc-900/60 border border-zinc-800 text-zinc-500 hover:text-zinc-200'}`}
              >
                All
              </button>
              {CITIES.map(c => (
                <button 
                  key={c}
                  onClick={() => handleCitySelect(c)}
                  className={`px-3 py-1.5 rounded-lg text-xxs font-black uppercase tracking-widest transition-all ${selectedCity === c ? 'bg-[#E8441A] text-white' : 'bg-zinc-900/60 border border-zinc-800 text-zinc-500 hover:text-zinc-200'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. SPOTLIGHT EVENTS (Immersive highlights header block) */}
      {spotlightEvents.length > 0 && (
        <section className="w-full px-6 mt-16 relative z-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl sm:text-2xl font-black uppercase text-white font-syne tracking-tight mb-6 flex items-center gap-2">
              <Flame className="h-5.5 w-5.5 text-amber-500" />
              Spotlight Tour selections
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Primary massive widescreen showcase */}
              <div className="lg:col-span-8 group relative rounded-3xl overflow-hidden border border-zinc-850 h-[380px] sm:h-[420px] flex flex-col justify-end p-6 sm:p-10 shadow-2xl transition-all hover:border-[#E8441A]/30">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105" 
                  style={{ backgroundImage: `linear-gradient(to top, rgba(8, 8, 14, 0.98) 10%, rgba(8, 8, 14, 0.35) 60%, rgba(8, 8, 14, 0) 100%), url('${spotlightEvents[0].cover_image_url || 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=800'}')` }}
                />
                
                <div className="relative z-10 flex flex-col gap-3 max-w-xl">
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
                  
                  <h3 className="text-2xl sm:text-4xl font-black text-white font-syne uppercase tracking-tight group-hover:text-[#E8441A] transition-colors leading-[1.1]">
                    {spotlightEvents[0].title}
                  </h3>

                  <p className="text-xs text-zinc-400 flex items-center gap-1">
                    <MapPin className="h-4.5 w-4.5 text-zinc-550 shrink-0" />
                    {spotlightEvents[0].venue}, {spotlightEvents[0].city}
                  </p>

                  <div className="flex items-center justify-between border-t border-zinc-800/60 pt-5 mt-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest">TICKET STARTS AT</span>
                      <span className="text-lg font-black text-white">
                        {spotlightEvents[0].ticket_tiers && spotlightEvents[0].ticket_tiers.length > 0
                          ? formatNaira(Math.min(...spotlightEvents[0].ticket_tiers.map(t => t.price)))
                          : 'FREE ENTRY'}
                      </span>
                    </div>
                    <Link href={`/events/${spotlightEvents[0].slug}`}>
                      <button className="px-6 py-3 rounded-xl bg-white text-black hover:bg-[#E8441A] hover:text-white transition-all duration-300 text-xs font-black uppercase tracking-widest flex items-center gap-1">
                        <span>Get Tickets</span>
                        <ChevronRight className="h-4.5 w-4.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Auxiliary Spotlight list grids */}
              <div className="lg:col-span-4 flex flex-col gap-6 justify-between">
                {spotlightEvents.slice(1, 3).map((event) => {
                  const startingPrice = event.ticket_tiers && event.ticket_tiers.length > 0
                    ? Math.min(...event.ticket_tiers.map(t => t.price))
                    : 0;

                  return (
                    <div 
                      key={event.id}
                      className="group flex-1 relative rounded-3xl overflow-hidden border border-zinc-850 p-6 flex flex-col justify-end shadow-2xl h-[180px] sm:h-[195px] transition-all hover:border-[#E8441A]/30"
                    >
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105" 
                        style={{ backgroundImage: `linear-gradient(to top, rgba(8, 8, 14, 0.95) 20%, rgba(8, 8, 14, 0.25) 70%, rgba(8, 8, 14, 0) 100%), url('${event.cover_image_url || 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=800'}')` }}
                      />
                      
                      <div className="relative z-10 flex flex-col gap-1.5">
                        <span className="text-[10px] font-black text-[#E8441A] uppercase tracking-widest flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {formatDate(event.event_date)}
                        </span>
                        
                        <h4 className="text-lg font-black text-white font-syne uppercase tracking-tight line-clamp-1 group-hover:text-[#E8441A] transition-colors">
                          {event.title}
                        </h4>

                        <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-zinc-800/40">
                          <span className="text-sm font-extrabold text-white">
                            {startingPrice > 0 ? formatNaira(startingPrice) : 'FREE'}
                          </span>
                          <Link href={`/events/${event.slug}`} className="text-xxs font-black uppercase tracking-widest text-[#E8441A] group-hover:text-[#ff5d35] flex items-center gap-0.5">
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
        </section>
      )}

      {/* 5. MAIN VIBES EVENT LISTING GRID (Ticketmaster trending style) */}
      <section className="w-full px-6 mt-20 relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8 border-b border-zinc-900 pb-4">
            <h2 className="text-xl sm:text-2xl font-black uppercase text-white font-syne tracking-tight flex items-center gap-2">
              <Flame className="h-5.5 w-5.5 text-[#E8441A]" />
              Trending Vibes
            </h2>
            <Link
              href="/events"
              className="text-xs font-black uppercase tracking-widest text-[#E8441A] hover:text-[#ff5d35] flex items-center gap-1.5 group"
            >
              <span>Explore All Vibes</span>
              <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-[400px] w-full rounded-3xl bg-zinc-950/60 animate-pulse border border-zinc-900/60" />
              ))}
            </div>
          ) : remainingEvents.length > 0 || (spotlightEvents.length > 0 && remainingEvents.length === 0) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Fallback to original list if spotlight divides too aggressively */}
              {(remainingEvents.length > 0 ? remainingEvents : events || []).map((event) => {
                const coverImage = event.cover_image_url || 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600';
                const startingPrice = event.ticket_tiers && event.ticket_tiers.length > 0
                  ? Math.min(...event.ticket_tiers.map(t => t.price))
                  : 0;
                
                const catData = CATEGORIES.find(c => c.name === event.category);
                const badgeGradient = catData ? catData.gradient : 'from-[#E8441A] to-[#ff7d59]';

                return (
                  <Card key={event.id} className="group hover:-translate-y-2 transition-all duration-500 border-zinc-900/80 bg-zinc-950/20 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col justify-between h-full">
                    <div className="absolute inset-0 border border-transparent group-hover:border-[#E8441A]/15 rounded-2xl pointer-events-none transition-colors duration-500" />
                    
                    <div>
                      {/* Cover image wrap */}
                      <div className="relative h-52 w-full overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverImage}
                          alt={event.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#08080E] via-transparent to-transparent" />
                        
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest text-white uppercase bg-gradient-to-r ${badgeGradient}`}>
                            {getCategoryLabel(event.category, event.custom_category)}
                          </span>
                          {event.is_university_only && (
                            <span className="px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest text-white uppercase bg-purple-600/90 border border-purple-500/30 backdrop-blur-md">
                              CAMPUS ACCESS
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Wrap */}
                      <div className="p-6 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-black text-[#E8441A] uppercase tracking-widest flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(event.event_date)}
                          </span>
                          <h3 className="text-lg font-black text-white tracking-tight uppercase font-syne group-hover:text-[#E8441A] transition-colors duration-300 line-clamp-1">
                            {event.title}
                          </h3>
                          <p className="text-zinc-500 text-xs flex items-center gap-1 font-light tracking-wide line-clamp-1 mt-1">
                            <MapPin className="h-3.5 w-3.5 text-zinc-650 shrink-0" />
                            {event.venue}, {event.city}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="px-6 pb-6 pt-4 border-t border-zinc-900/60 flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Entry Fee</span>
                        <span className="text-sm font-extrabold text-white">
                          {startingPrice > 0 ? formatNaira(startingPrice) : 'FREE'}
                        </span>
                      </div>
                      <Link href={`/events/${event.slug}`}>
                        <button className="px-5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-white hover:text-black hover:border-white transition-all duration-300 text-xxs font-black uppercase tracking-widest active:scale-95">
                          Get Tickets
                        </button>
                      </Link>
                    </div>

                  </Card>
                );
              })}

            </div>
          ) : (
            <div className="w-full text-center py-20 border border-dashed border-zinc-900 rounded-3xl bg-zinc-950/20 backdrop-blur-md">
              <Disc className="h-12 w-12 text-zinc-700 animate-spin-slow mx-auto mb-4" />
              <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                No active events found. Try adjusting your search query or location!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 6. TICKETMASTER TRUST SECURED BANNER PANELS */}
      <section className="w-full px-6 mt-32 relative z-10">
        <div className="mx-auto max-w-6xl border-t border-zinc-900 pt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="flex gap-4 items-start p-6 bg-zinc-950/25 border border-zinc-950 rounded-2xl">
              <div className="w-10 h-10 rounded-lg bg-[#E8441A]/10 border border-[#E8441A]/20 flex items-center justify-center text-[#E8441A] shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h4 className="text-sm font-black text-white font-outfit uppercase tracking-wider">100% Cryptographic Lock</h4>
                <p className="text-zinc-550 text-xs font-light leading-relaxed">
                  Every ticket is locked down with HMAC-SHA256 digital seals. Fake, duplicate or screenshot tickets are instantly flagged at the gate.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-6 bg-zinc-950/25 border border-zinc-950 rounded-2xl">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h4 className="text-sm font-black text-white font-outfit uppercase tracking-wider">Verified Organizers Only</h4>
                <p className="text-zinc-550 text-xs font-light leading-relaxed">
                  We check banking credentials and identity details for every organizer to ensure you buy tickets for legitimate concerts.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-6 bg-zinc-950/25 border border-zinc-950 rounded-2xl">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h4 className="text-sm font-black text-white font-outfit uppercase tracking-wider">Realtime Payouts & Gate</h4>
                <p className="text-zinc-550 text-xs font-light leading-relaxed">
                  Gate workers scan tickets using secure cryptographic checks in under 1 second. Fast settlements and auto Paystack integrations.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. ORGANIZER CTA HERO CARD */}
      <section className="w-full px-6 mt-28 relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="relative w-full rounded-[32px] bg-gradient-to-r from-zinc-950 to-zinc-900/80 border border-zinc-850 p-8 sm:p-12 lg:p-16 overflow-hidden flex flex-col items-center text-center">
            
            {/* Ambient glows inside card */}
            <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-[#E8441A]/10 blur-[100px] pointer-events-none" />
            <div className="absolute left-0 bottom-0 w-80 h-80 rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />
            
            <div className="relative z-10 max-w-2xl flex flex-col items-center">
              <Badge className="mb-6 font-bold bg-[#E8441A]/10 border border-[#E8441A]/20 text-[#E8441A] tracking-widest px-3.5 py-1">
                HOST A VIBE
              </Badge>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white font-syne uppercase tracking-tight leading-tight mb-6">
                Are you an Event Organizer?
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed font-light mb-10">
                Setup your tickets in 5 minutes, limit access to target universities, verify guests at the gate in under 1 second with cryptographically locked QR codes, and receive direct fast payouts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link href="/register?role=organizer">
                  <Button className="w-full sm:w-auto px-8 py-3.5 bg-white text-black hover:bg-zinc-200 text-xs font-black tracking-widest uppercase rounded-xl">
                    Create Organizer Profile
                  </Button>
                </Link>
                <Link href="/events">
                  <Button variant="outline" className="w-full sm:w-auto px-8 py-3.5 text-zinc-300 border-zinc-800 hover:bg-zinc-900 text-xs font-black tracking-widest uppercase rounded-xl">
                    Browse All Events
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
