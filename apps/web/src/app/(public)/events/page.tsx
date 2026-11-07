'use client';

import React, { useState, useMemo } from 'react';
import { useEvents } from '../../../hooks/useEvents';
import { formatNaira, formatDate } from '../../../lib/utils';
import Link from 'next/link';
import { 
  Calendar, MapPin, Search, Music, Trophy, Theater, Disc, 
  Flame, Cpu, GraduationCap, Utensils, Tag, Heart, ArrowUpRight, Sparkles 
} from 'lucide-react';

const CITY_OPTIONS = [
  'All locations', 'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Enugu', 'Benin City', 'Calabar', 'Kaduna'
];

const CATEGORIES = [
  { value: 'all', label: 'All vybes' },
  { value: 'music', label: 'Music & Concerts' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'arts', label: 'Arts & Culture' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'campus', label: 'Campus Shows' },
  { value: 'food', label: 'Food & Social' },
  { value: 'tech', label: 'Tech & Meetups' },
];

export default function EventsExplorePage() {
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('All locations');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [campusOnly, setCampusOnly] = useState(false);

  const filters = {
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    city: selectedCity === 'All locations' ? undefined : selectedCity,
    search: search.trim() || undefined,
    isUniversityOnly: campusOnly ? true : undefined,
    limit: 60,
  };

  const { data: events, isLoading, error } = useEvents(filters);

  // Dynamic visual style cycles (one orange, two pink, three green)
  const getThemeClass = (index: number) => {
    const cycle = index % 3;
    if (cycle === 0) return { bg: 'bg-[#ff5a24]', text: 'text-[#f4f1e9]', tag: 'bg-[#f4f1e9] text-[#161713]' };
    if (cycle === 1) return { bg: 'bg-[#f7a6c5]', text: 'text-[#161713]', tag: 'bg-[#161713] text-[#f7a6c5]' };
    return { bg: 'bg-[#c4db59]', text: 'text-[#161713]', tag: 'bg-[#161713] text-[#c4db59]' };
  };

  return (
    <div className="w-full min-h-screen bg-[#161713] text-[#f4f1e9] font-['DM_Sans',sans-serif] selection:bg-[#ff5a24] selection:text-[#161713]">

      {/* TOP MARQUEE */}
      <div className="bg-[#ff5a24] text-[#161713] py-2 overflow-hidden border-b-2 border-[#161713]">
        <div className="flex justify-around gap-8 whitespace-nowrap text-xs font-black uppercase tracking-wider animate-marquee">
          <span>DISCOVER LIVE EXPERIENCES <i>✳</i></span>
          <span>CAMPUS FESTIVALS <i>✳</i></span>
          <span>NIGHTLIFE & SETS <i>✳</i></span>
          <span>PERMANENT ENTRY PASSES <i>✳</i></span>
          <span>FIND YOUR PEOPLE <i>✳</i></span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">

        {/* SECTION HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#393a32]">
          <div>
            <div className="vyb-eyebrow text-[#a7a89e] mb-2">
              <span className="vyb-dot" />
              <span>THE NEXT GOOD THING ✳ LAGOS & BEYOND</span>
            </div>
            <h1 className="font-['Barlow_Condensed',Impact,sans-serif] font-black uppercase text-5xl sm:text-7xl lg:text-8xl text-[#f4f1e9] tracking-tight leading-none">
              YOUR PLANS <span className="text-[#ff5a24]">START HERE.</span>
            </h1>
          </div>
          <p className="text-sm text-[#a7a89e] max-w-xs leading-relaxed">
            A big night out or a new obsession. There’s a live vybe with your name on it.
          </p>
        </div>

        {/* SEARCH BAR (Style from user's HTML) */}
        <div className="my-8 flex flex-col sm:flex-row items-stretch bg-[#20211a] border-2 border-[#393a32] rounded-2xl p-2 gap-2 shadow-[4px_4px_0px_#161713]">
          <div className="flex items-center flex-1 px-3">
            <Search className="h-4 w-4 text-[#a7a89e] mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Search events, sounds, artists, venues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-0 text-[#f4f1e9] text-sm placeholder-[#737568] focus:outline-none"
            />
          </div>

          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-[#161713] text-[#f4f1e9] text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-xl border border-[#393a32] focus:outline-none cursor-pointer"
          >
            {CITY_OPTIONS.map((city) => (
              <option key={city} value={city} className="bg-[#161713] text-[#f4f1e9]">
                {city}
              </option>
            ))}
          </select>

          <button
            onClick={() => setCampusOnly(!campusOnly)}
            className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
              campusOnly 
                ? 'bg-[#c4db59] text-[#161713] border-[#c4db59]' 
                : 'bg-[#161713] text-[#a7a89e] border-[#393a32] hover:text-[#f4f1e9]'
            }`}
          >
            Campus Shows {campusOnly ? '✓' : ''}
          </button>
        </div>

        {/* CATEGORY FILTER CAPSULES */}
        <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                selectedCategory === cat.value
                  ? 'bg-[#f4f1e9] text-[#161713] border-[#f4f1e9] shadow-[3px_3px_0px_#ff5a24]'
                  : 'bg-[#20211a] border-[#393a32] text-[#a7a89e] hover:text-[#f4f1e9] hover:border-[#5a5b50]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* EVENTS GRID */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <Disc className="h-10 w-10 text-[#ff5a24] animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest text-[#a7a89e]">
              Finding upcoming vybes...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-20 border-2 border-dashed border-[#393a32] rounded-3xl bg-[#20211a]/40">
            <p className="text-sm font-bold text-[#ff5a24] uppercase tracking-wide">
              Could not load events. Please refresh the page.
            </p>
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, idx) => {
              const theme = getThemeClass(idx);
              const activeTiers = event.ticket_tiers || event.tiers || [];
              const hasFree = activeTiers.some((t: any) => t.price === 0);
              const hasPaid = activeTiers.some((t: any) => t.price > 0);
              const minPrice = hasPaid 
                ? Math.min(...activeTiers.filter((t: any) => t.price > 0).map((t: any) => t.price))
                : 0;

              return (
                <article
                  key={event.id}
                  className="group bg-[#f4f1e9] text-[#161713] rounded-2xl border-2 border-[#161713] shadow-[6px_6px_0px_#161713] overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1.5"
                >
                  {/* Top Visual Poster */}
                  <div className={`relative h-56 w-full ${theme.bg} overflow-hidden p-4 flex flex-col justify-between`}>
                    
                    {/* Event Tag */}
                    <div className="flex items-center justify-between z-10">
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded shadow-sm ${theme.tag}`}>
                        {event.category || 'LIVE VYBE'}
                      </span>
                      {event.is_university_only && (
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-[#161713] text-[#c4db59]">
                          CAMPUS EXCLUSIVE
                        </span>
                      )}
                    </div>

                    {/* Poster Cover / Title Artwork */}
                    {event.cover_image_url ? (
                      <div className="absolute inset-0 z-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={event.cover_image_url}
                          alt={event.title}
                          className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#161713]/85 via-transparent to-transparent" />
                      </div>
                    ) : (
                      <div className="z-10 text-center transform -rotate-6">
                        <div className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-5xl uppercase leading-none text-[#161713]">
                          {event.title.split(' ').slice(0, 3).join(' ')}
                        </div>
                      </div>
                    )}

                    {/* Bottom overlay title if cover image is present */}
                    {event.cover_image_url && (
                      <div className="relative z-10 mt-auto">
                        <span className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-3xl uppercase tracking-tight text-[#f4f1e9] leading-tight line-clamp-1">
                          {event.title}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Details */}
                  <div className="p-5 flex flex-col gap-3">
                    <div className="text-[10px] font-black uppercase tracking-wider text-[#ff5a24]">
                      {formatDate(event.event_date)}
                    </div>

                    <h3 className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-2xl uppercase tracking-tight text-[#161713] leading-[1.05] line-clamp-2">
                      {event.title}
                    </h3>

                    <p className="text-xs text-[#606257] flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#ff5a24] shrink-0" />
                      <span className="truncate">{event.venue}, {event.city}</span>
                    </p>

                    {/* Ticket Foot Stub */}
                    <div className="pt-4 mt-2 border-t border-dashed border-[#bebfb1] flex items-center justify-between">
                      <div>
                        <span className="block text-[8px] font-bold text-[#727365] uppercase tracking-wider">Starting From</span>
                        <strong className="text-lg font-black text-[#161713]">
                          {hasFree && hasPaid ? 'Free / Paid' : hasPaid ? formatNaira(minPrice) : 'FREE'}
                        </strong>
                      </div>

                      <Link
                        href={`/events/${event.slug || event.id}`}
                        className="w-10 h-10 rounded-xl bg-[#161713] text-[#f4f1e9] hover:bg-[#ff5a24] hover:text-[#161713] flex items-center justify-center font-black transition-colors shadow-[2px_2px_0px_#161713]"
                        aria-label={`View ${event.title}`}
                      >
                        <ArrowUpRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 border-2 border-dashed border-[#393a32] rounded-3xl bg-[#20211a]/40">
            <h3 className="font-['Barlow_Condensed',Impact,sans-serif] font-black uppercase text-3xl text-[#f4f1e9]">
              No vybes found matching your search.
            </h3>
            <p className="text-xs text-[#a7a89e] mt-2 mb-6">
              Try choosing another city, resetting filters, or clearing your search keywords.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCity('All locations');
                setSelectedCategory('all');
                setCampusOnly(false);
              }}
              className="vyb-btn rounded-xl !py-3 !px-6 !text-xs !gap-2"
            >
              Reset All Filters <span className="vyb-arrow">↗</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
