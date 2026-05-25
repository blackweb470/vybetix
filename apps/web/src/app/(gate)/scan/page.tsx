'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useToast } from '../../../components/ui/toast';
import { QrCode, Disc, MapPin, Calendar, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface AssignedEvent {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string;
  event_date: string;
  venue: string;
  city: string;
}

export default function StaffScanPortal() {
  const [events, setEvents] = useState<AssignedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAssignedEvents = async () => {
      try {
        const response = await api.get('/api/events/staff/assigned');
        setEvents(response.data.data || []);
      } catch (err: any) {
        toast({ title: 'Error', description: err.response?.data?.message || 'Failed to load assigned events', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignedEvents();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-36 bg-[#08080C] min-h-screen">
        <Disc className="h-10 w-10 text-[#E8441A] animate-spin mb-4" />
        <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Loading Events...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080C] font-outfit text-zinc-100">
      <div className="w-full border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur-xl px-6 py-6 sticky top-0 z-30">
        <div className="mx-auto max-w-4xl">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Gate Portal</p>
          <h1 className="text-xl sm:text-2xl font-black text-white font-syne uppercase tracking-tight flex items-center gap-2">
            <QrCode className="h-6 w-6 text-[#E8441A]" />
            Scan Tickets
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-sm font-black uppercase tracking-wider text-white">Assigned Events</h2>
          <p className="text-xs text-zinc-400 mt-1">Select an event below to open the scanning console.</p>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 border border-zinc-900 border-dashed rounded-3xl bg-zinc-950/20">
            <QrCode className="h-10 w-10 text-zinc-700" />
            <div className="text-center">
              <p className="text-sm font-black uppercase tracking-wider text-white mb-1">No Assigned Events</p>
              <p className="text-xs text-zinc-500">You haven't been added to the gate team for any upcoming events.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <Link key={event.id} href={`/scan/${event.id}`}>
                <div className="group flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-[#E8441A]/30 hover:bg-zinc-900/60 transition-all cursor-pointer h-full">
                  <div className="relative w-full sm:w-24 h-32 sm:h-24 rounded-xl overflow-hidden shrink-0">
                    <Image
                      src={event.cover_image_url || '/placeholder.jpg'}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 w-full py-1">
                    <h3 className="text-base font-black text-white font-syne uppercase tracking-tight line-clamp-1 mb-1">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(event.event_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 line-clamp-1">
                      <MapPin className="h-3 w-3" />
                      {event.venue}, {event.city}
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-[#E8441A] text-[10px] font-black uppercase tracking-widest">
                      Open Console <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
