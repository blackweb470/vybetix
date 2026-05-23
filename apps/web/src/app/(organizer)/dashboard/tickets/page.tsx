'use client';

import React, { useState, useMemo } from 'react';
import { useOrganizerTickets } from '../../../../hooks/useTickets';
import { Disc, Calendar, Ticket, CheckCircle2, XCircle, Search } from 'lucide-react';
import { formatDate } from '../../../../lib/utils';
import { Badge } from '../../../../components/ui/badge';

export default function OrganizerTicketsPage() {
  const { data: tickets, isLoading, error } = useOrganizerTickets();
  const [filter, setFilter] = useState<'all' | 'active' | 'used'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((ticket) => {
      // 1. Status Filter
      if (filter !== 'all' && ticket.status !== filter) return false;
      
      // 2. Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = ticket.holder_name.toLowerCase().includes(query);
        const matchesEmail = ticket.holder_email.toLowerCase().includes(query);
        const matchesEvent = ticket.ticket_tiers?.events?.title.toLowerCase().includes(query) || false;
        const matchesId = ticket.id.toLowerCase().includes(query);
        
        if (!matchesName && !matchesEmail && !matchesEvent && !matchesId) return false;
      }
      
      return true;
    });
  }, [tickets, filter, searchQuery]);

  return (
    <div className="w-full font-outfit text-zinc-100 max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white font-syne uppercase tracking-tight">
          Sold Tickets History
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Track all tickets purchased by attendees across all your events.
        </p>
      </div>

      {/* Analytics Summary */}
      {!isLoading && tickets && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Sold</p>
            <p className="text-3xl font-black text-white">{tickets.length}</p>
          </div>
          <div className="bg-[#E8441A]/10 border border-[#E8441A]/20 rounded-2xl p-5">
            <p className="text-xs font-bold text-[#E8441A] uppercase tracking-widest mb-2">Active (Unscanned)</p>
            <p className="text-3xl font-black text-[#E8441A]">
              {tickets.filter(t => t.status === 'active').length}
            </p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Used (Checked-in)</p>
            <p className="text-3xl font-black text-emerald-400">
              {tickets.filter(t => t.status === 'used').length}
            </p>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-950/60 p-4 border border-zinc-900 rounded-2xl">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: 'All Tickets' },
            { id: 'active', label: 'Active' },
            { id: 'used', label: 'Used / Checked In' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-white text-black shadow-md'
                  : 'bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search name, email, or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-[#E8441A] transition-colors placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-zinc-950/30 border border-zinc-900/50 rounded-3xl">
          <Disc className="h-10 w-10 text-[#E8441A] animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Loading history...</span>
        </div>
      ) : error ? (
        <div className="text-center py-20 border border-dashed border-zinc-900 rounded-3xl bg-zinc-950/20">
          <p className="text-sm font-bold text-red-500 uppercase tracking-wide">Failed to load tickets.</p>
        </div>
      ) : filteredTickets && filteredTickets.length > 0 ? (
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Attendee</th>
                <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Event & Tier</th>
                <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Purchased / Used</th>
                <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Ticket ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-bold text-white">{ticket.holder_name}</p>
                    <p className="text-xs text-zinc-500">{ticket.holder_email}</p>
                    <p className="text-[10px] text-zinc-600 font-mono mt-0.5">{ticket.holder_phone}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-zinc-200 line-clamp-1">
                      {ticket.ticket_tiers?.events?.title || 'Unknown Event'}
                    </p>
                    <Badge variant="outline" className="mt-1 text-[10px] bg-zinc-900">
                      {ticket.ticket_tiers?.name}
                    </Badge>
                  </td>
                  <td className="p-4">
                    {ticket.status === 'used' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 className="h-3 w-3" /> Used
                      </span>
                    ) : ticket.status === 'cancelled' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest">
                        <XCircle className="h-3 w-3" /> Cancelled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8441A]/10 text-[#E8441A] text-[10px] font-black uppercase tracking-widest">
                        <Ticket className="h-3 w-3" /> Active
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                        Bought: {formatDate(ticket.created_at)}
                      </span>
                      {ticket.status === 'used' && ticket.scanned_at && (
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                          Used: {formatDate(ticket.scanned_at, 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-xs font-mono text-zinc-600 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800">
                      {ticket.id.split('-')[0]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="w-full text-center py-24 border border-dashed border-zinc-900 rounded-3xl bg-zinc-950/10 flex flex-col items-center gap-4">
          <Ticket className="h-10 w-10 text-zinc-700" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider">No Tickets Found</h3>
          <p className="text-xs text-zinc-500">
            {searchQuery ? 'No tickets match your search query.' : 'You haven\'t sold any tickets yet.'}
          </p>
        </div>
      )}

    </div>
  );
}
