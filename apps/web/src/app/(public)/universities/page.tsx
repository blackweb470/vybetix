'use client';

import React, { useState } from 'react';
import { useEvents, useUniversities } from '../../../hooks/useEvents';
import { formatNaira, formatDate } from '../../../lib/utils';
import Link from 'next/link';
import { GraduationCap, Calendar, MapPin, Disc, ArrowUpRight, Sparkles } from 'lucide-react';

export default function UniversitiesHubPage() {
  const { data: universities } = useUniversities();
  const [selectedUnivId, setSelectedUnivId] = useState('all');

  const { data: events, isLoading } = useEvents({
    isUniversityOnly: true
  });

  const filteredEvents = events?.filter((ev) => {
    if (selectedUnivId === 'all') return true;
    return ev.university_id === selectedUnivId;
  });

  const uniOptions = [
    { value: 'all', label: 'All Nigerian Campuses' },
    ...(universities?.map((u) => ({ value: u.id, label: `${u.name} (${u.short_code})` })) || [])
  ];

  return (
    <div className="w-full bg-[#161713] text-[#f4f1e9] font-['DM_Sans',sans-serif] min-h-screen py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#ff5a24] selection:text-[#161713]">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#393a32] mb-10">
          <div>
            <div className="vyb-eyebrow text-[#a7a89e] mb-2">
              <span className="vyb-dot" />
              <span>CAMPUS NETWORK ✳ EXCLUSIVE STUDENT VYBES</span>
            </div>
            <h1 className="font-['Barlow_Condensed',Impact,sans-serif] font-black uppercase text-5xl sm:text-7xl lg:text-8xl text-[#f4f1e9] tracking-tight leading-none">
              CAMPUS SHOWS & <span className="text-[#c4db59]">DERBIES.</span>
            </h1>
          </div>
          <p className="text-sm text-[#a7a89e] max-w-sm leading-relaxed">
            Faculty showdowns, hall weeks, and campus festivals across 40+ Nigerian universities.
          </p>
        </div>

        {/* Campus Filter Selection Row */}
        <div className="max-w-md mb-10">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#a7a89e] block mb-2">
            Select University Campus
          </label>
          <select
            value={selectedUnivId}
            onChange={(e) => setSelectedUnivId(e.target.value)}
            className="w-full bg-[#20211a] text-[#f4f1e9] text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-xl border-2 border-[#393a32] focus:outline-none focus:border-[#ff5a24] cursor-pointer"
          >
            {uniOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#161713] text-[#f4f1e9]">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Content Listing rendering */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <Disc className="h-10 w-10 text-[#ff5a24] animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest text-[#a7a89e]">
              Finding campus events...
            </span>
          </div>
        ) : filteredEvents && filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => {
              const coverImage = event.cover_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600';
              const startingPrice = event.ticket_tiers && event.ticket_tiers.length > 0
                ? Math.min(...event.ticket_tiers.map(t => t.price))
                : 0;

              return (
                <article
                  key={event.id}
                  className="bg-[#f4f1e9] text-[#161713] rounded-2xl border-2 border-[#161713] shadow-[6px_6px_0px_#161713] overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1.5"
                >
                  <div className="relative h-48 w-full bg-[#161713] overflow-hidden p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage}
                      alt={event.title}
                      className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161713]/85 via-transparent to-transparent" />
                    
                    <span className="absolute top-3 left-3 text-[9px] font-black uppercase px-2.5 py-1 rounded bg-[#c4db59] text-[#161713] shadow-sm">
                      CAMPUS GATED
                    </span>
                  </div>

                  <div className="p-5 flex flex-col gap-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#ff5a24] flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {event.venue}
                    </span>

                    <h3 className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-2xl uppercase tracking-tight text-[#161713] leading-[1.05] line-clamp-2">
                      {event.title}
                    </h3>

                    <p className="text-xs text-[#606257] flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-[#ff5a24] shrink-0" />
                      <span>{formatDate(event.event_date)}</span>
                    </p>

                    <div className="pt-4 mt-2 border-t border-dashed border-[#bebfb1] flex items-center justify-between">
                      <div>
                        <span className="block text-[8px] font-bold text-[#727365] uppercase tracking-wider">Tickets From</span>
                        <strong className="text-lg font-black text-[#161713]">
                          {startingPrice > 0 ? formatNaira(startingPrice) : 'FREE ENTRY'}
                        </strong>
                      </div>

                      <Link
                        href={`/events/${event.slug || event.id}`}
                        className="w-10 h-10 rounded-xl bg-[#161713] text-[#f4f1e9] hover:bg-[#ff5a24] hover:text-[#161713] flex items-center justify-center font-black transition-colors shadow-[2px_2px_0px_#161713]"
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
            <GraduationCap className="h-12 w-12 text-[#ff5a24] mx-auto mb-3" />
            <h3 className="font-['Barlow_Condensed',Impact,sans-serif] font-black uppercase text-3xl text-[#f4f1e9]">
              No active campus events found for this filter.
            </h3>
            <p className="text-xs text-[#a7a89e] mt-2 mb-6">
              Select another campus domain or check back soon as student organizers post new showdowns.
            </p>
            <button
              onClick={() => setSelectedUnivId('all')}
              className="vyb-btn rounded-xl !py-3 !px-6 !text-xs !gap-2"
            >
              Show All Campuses <span className="vyb-arrow">↗</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
