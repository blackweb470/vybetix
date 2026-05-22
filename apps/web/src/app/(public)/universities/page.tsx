'use client';

import React, { useState } from 'react';
import { useEvents, useUniversities } from '../../../hooks/useEvents';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Select } from '../../../components/ui/select';
import { formatNaira, formatDate } from '../../../lib/utils';
import Link from 'next/link';
import { GraduationCap, Calendar, MapPin, Disc } from 'lucide-react';

export default function UniversitiesHubPage() {
  const { data: universities } = useUniversities();
  const [selectedUnivId, setSelectedUnivId] = useState('all');

  const { data: events, isLoading } = useEvents({
    isUniversityOnly: true
  });

  // Filter events locally by university if requested
  const filteredEvents = events?.filter((ev) => {
    if (selectedUnivId === 'all') return true;
    return ev.university_id === selectedUnivId;
  });

  const uniOptions = [
    { value: 'all', label: 'All Nigerian Campuses' },
    ...(universities?.map((u) => ({ value: u.id, label: `${u.name} (${u.short_code})` })) || [])
  ];

  return (
    <div className="w-full bg-[#0D0D0D] py-12 px-6 font-outfit min-h-screen text-zinc-100">
      <div className="mx-auto max-w-6xl">
        
        {/* Header Hero */}
        <div className="relative border border-zinc-800 rounded-3xl bg-[#121212]/35 p-8 sm:p-12 mb-12 overflow-hidden shadow-2xl">
          {/* Subtle glow elements */}
          <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-purple-600 blur-[130px] opacity-10 pointer-events-none" />

          <div className="max-w-2xl relative z-10 flex flex-col gap-3">
            <Badge className="w-fit bg-purple-600/10 text-purple-400 border border-purple-500/20 font-bold flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" />
              CAMPUS NETWORK EXCLUSIVE
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white font-syne">
              STUDENT SOUNDS & SHOWDOWNS
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Explore dynamic social parties, sports derbies, and academic hackathons hosted by student associations across Nigeria. Checked and gated with university domain verification locks.
            </p>
          </div>
        </div>

        {/* Campus Filter Selection Row */}
        <div className="max-w-md mb-10">
          <Select
            label="Filter by Campus Network"
            options={uniOptions}
            value={selectedUnivId}
            onChange={(e) => setSelectedUnivId(e.target.value)}
          />
        </div>

        {/* Content Listing rendering */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 w-full rounded-2xl bg-zinc-900 animate-pulse border border-zinc-850" />
            ))}
          </div>
        ) : filteredEvents && filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const coverImage = event.cover_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600';
              const startingPrice = event.ticket_tiers && event.ticket_tiers.length > 0
                ? Math.min(...event.ticket_tiers.map(t => t.price))
                : 0;

              return (
                <Card key={event.id} className="group hover:-translate-y-1.5 transition-all duration-300 border-zinc-800 bg-zinc-900/40">
                  <div className="relative h-48 w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage}
                      alt={event.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent" />
                    <Badge className="absolute top-4 right-4 bg-purple-600">
                      CAMPUS GATED
                    </Badge>
                  </div>
                  
                  <div className="p-5 flex flex-col gap-4 font-outfit">
                    <div className="flex flex-col gap-1">
                      <span className="text-xxs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {event.venue}
                      </span>
                      <h3 className="text-lg font-bold text-white tracking-wide uppercase font-syne group-hover:text-purple-400 transition-colors line-clamp-1">
                        {event.title}
                      </h3>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                        {formatDate(event.event_date)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-850 pt-4 mt-2">
                      <div className="flex flex-col">
                        <span className="text-xxs font-bold text-zinc-500 uppercase tracking-widest">
                          Tickets from
                        </span>
                        <span className="text-base font-extrabold text-[#E8441A]">
                          {startingPrice > 0 ? formatNaira(startingPrice) : 'FREE'}
                        </span>
                      </div>
                      <Link href={`/events/${event.slug}`}>
                        <Button size="sm" className="rounded-lg text-xxs font-bold uppercase tracking-wider bg-purple-600 hover:bg-purple-700">
                          Verify & Book
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="w-full text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
            <GraduationCap className="h-10 w-10 text-zinc-650 mx-auto mb-4 animate-bounce-short" />
            <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
              No active student campus events found in this selected school domain!
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
