'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/card';
import { formatNaira, formatDate } from '../../lib/utils';
import { api } from '../../lib/api';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  Ticket,
  Calendar,
  DollarSign,
  Activity,
  LogOut,
  ArrowRight,
  Radio,
  Search,
  ExternalLink,
  PieChart,
  Percent,
  Receipt,
  Building,
  X,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  slug?: string;
  eventDate: string;
  endDate?: string;
  venue: string;
  city?: string;
  isActive: boolean;
  status: string;
  organizer?: {
    name: string;
    email: string;
  } | null;
  totalCapacity: number;
  totalSold: number;
  paidOrdersCount: number;
  fillRate: number;

  // Financial allocation fields
  grossTicketSalesKobo: number;
  serviceFeesKobo: number;
  grossCollectedKobo: number;
  commission4PercentKobo: number;
  platformTotalTakeKobo: number;
  organizerAllocationKobo: number;
  notGeneratedRevenueKobo: number;
  potentialOrganizerAllocationKobo: number;
  totalPotentialRevenueKobo: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Events Table Filtering & Search States
  const [eventFilter, setEventFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected event for financial settlement breakdown modal
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Paystack subaccounts sync state
  const [syncingSubaccounts, setSyncingSubaccounts] = useState(false);
  const [syncResultMsg, setSyncResultMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/stats');
      setStats(response.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load platform statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      window.location.href = '/login?redirect=/admin';
      return;
    }
    if (user.role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }
    fetchStats();
  }, [user, router, fetchStats]);

  const handleSyncSubaccounts = async () => {
    setSyncingSubaccounts(true);
    setSyncResultMsg(null);
    try {
      const res = await api.post('/api/admin/paystack/sync-subaccounts');
      const data = res.data.data;
      setSyncResultMsg({
        text: `✓ Paystack Subaccount Sync Complete! ${data.syncedCount} organizer(s) automatically linked. All future ticket checkouts will auto-split!`,
        ok: true
      });
      await fetchStats();
      setTimeout(() => setSyncResultMsg(null), 8000);
    } catch (err: any) {
      setSyncResultMsg({
        text: `✗ Sync Notice: ${err.response?.data?.message || err.message}`,
        ok: false
      });
      setTimeout(() => setSyncResultMsg(null), 8000);
    } finally {
      setSyncingSubaccounts(false);
    }
  };

  // Filter events list
  const filteredEvents = useMemo(() => {
    if (!stats?.eventsBreakdown) return [];
    return (stats.eventsBreakdown as EventItem[]).filter((ev) => {
      if (eventFilter === 'active' && !ev.isActive) return false;
      if (eventFilter === 'inactive' && ev.isActive) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          ev.title?.toLowerCase().includes(query) ||
          ev.venue?.toLowerCase().includes(query) ||
          ev.organizer?.name?.toLowerCase().includes(query) ||
          ev.organizer?.email?.toLowerCase().includes(query) ||
          ev.city?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [stats?.eventsBreakdown, eventFilter, searchQuery]);

  const copySettlementSummary = (ev: EventItem) => {
    const text = `VYBETIX SETTLEMENT SUMMARY:
Event: ${ev.title}
Organizer: ${ev.organizer?.name || 'N/A'} (${ev.organizer?.email || 'N/A'})
Total Tickets Sold: ${ev.totalSold}
Gross Ticket Sales: ${formatNaira(ev.grossTicketSalesKobo)}
Less 4% Vybetix Commission: -${formatNaira(ev.commission4PercentKobo)}
Net Allocated to Organizer (96%): ${formatNaira(ev.organizerAllocationKobo)}
Platform Service Fees (₦100/order): ${formatNaira(ev.serviceFeesKobo)}
Total Collected: ${formatNaira(ev.grossCollectedKobo)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080C] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-8 w-8 text-[#E8441A] animate-pulse" />
          <p className="text-zinc-500 font-syne uppercase tracking-widest text-xs font-bold animate-pulse">
            Compiling Event Revenue & Financial Allocations...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#08080C] flex items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 max-w-md flex flex-col items-center">
          <ShieldAlert className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h2 className="text-white font-syne text-lg font-bold uppercase tracking-wider mb-2">Access Notice</h2>
          <p className="text-zinc-400 text-sm mb-4">{error}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setError('');
                setLoading(true);
                fetchStats();
              }}
              className="px-6 py-2.5 bg-[#E8441A] text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#ff5a2f] transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-2.5 bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-700 transition-colors"
            >
              Return to Safety
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080C] font-outfit text-zinc-100 pb-24">
      {/* Top Header */}
      <div className="w-full border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur-xl px-6 py-6 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#E8441A] to-purple-600 flex items-center justify-center shadow-lg shadow-[#E8441A]/20">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-black text-white font-syne uppercase tracking-tight flex items-center gap-2">
                Developer <span className="text-[#E8441A]">Console</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Revenue & Paystack Automated Split Engine • God Mode
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncSubaccounts}
              disabled={syncingSubaccounts}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
              title="Sync Subaccounts from Paystack to ensure automatic payouts work"
            >
              <RefreshCw className={`h-3 w-3 ${syncingSubaccounts ? 'animate-spin' : ''}`} />
              {syncingSubaccounts ? 'Syncing...' : 'Sync Paystack Subaccounts'}
            </button>
            <Link
              href="/events"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
            >
              Public Site <ExternalLink className="h-3 w-3" />
            </Link>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Return to Dashboard"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-6 mt-4 flex flex-col gap-8">

        {syncResultMsg && (
          <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in ${syncResultMsg.ok
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
            <span>{syncResultMsg.text}</span>
            <button
              onClick={() => setSyncResultMsg(null)}
              className="text-zinc-500 hover:text-white ml-4"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 1: FINANCIAL ALLOCATION SUMMARY CARDS            */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Total Gross Ticket Sales */}
          <Card className="p-5 border-zinc-800/80 bg-zinc-900/40 flex flex-col gap-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                <Ticket className="h-5 w-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-400">
                Gross Sales
              </span>
            </div>
            <div className="flex flex-col gap-0.5 mt-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gross Ticket Sales</span>
              <span className="text-2xl sm:text-3xl font-black text-white font-syne tracking-tight">
                {formatNaira(stats?.platformTotalTicketSalesKobo || 0)}
              </span>
              <span className="text-[11px] text-zinc-500 mt-1">
                across {stats?.totalEvents || 0} events ({stats?.activeEvents || 0} active)
              </span>
            </div>
          </Card>

          {/* Allocated to Organizers (96% Net Payout) */}
          <Card className="p-5 border-emerald-500/30 bg-emerald-500/5 flex flex-col gap-3 hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Building className="h-5 w-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                96% Auto Payout
              </span>
            </div>
            <div className="flex flex-col gap-0.5 mt-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Allocated to Organizers</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-syne tracking-tight">
                {formatNaira(stats?.platformTotalOrganizerAllocationsKobo || 0)}
              </span>
              <span className="text-[11px] text-zinc-500 mt-1">
                automatic Paystack subaccount split
              </span>
            </div>
          </Card>

          {/* Vybetix 4% Commission */}
          <Card className="p-5 border-purple-500/30 bg-purple-500/5 flex flex-col gap-3 hover:border-purple-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Percent className="h-5 w-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Our 4% Take
              </span>
            </div>
            <div className="flex flex-col gap-0.5 mt-1">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Vybetix 4% Commission</span>
              <span className="text-2xl sm:text-3xl font-black text-purple-300 font-syne tracking-tight">
                {formatNaira(stats?.platformTotal4PercentCommissionKobo || 0)}
              </span>
              <span className="text-[11px] text-zinc-500 mt-1">
                platform cut on all ticket sales
              </span>
            </div>
          </Card>

          {/* Vybetix Service Fees & Total Take */}
          <Card className="p-5 border-[#E8441A]/30 bg-[#E8441A]/5 flex flex-col gap-3 hover:border-[#E8441A]/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-[#E8441A]/10 text-[#E8441A] border border-[#E8441A]/20">
                <DollarSign className="h-5 w-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#E8441A]/20 text-[#E8441A] border border-[#E8441A]/30">
                4% + ₦100 Fees
              </span>
            </div>
            <div className="flex flex-col gap-0.5 mt-1">
              <span className="text-[10px] font-bold text-[#E8441A] uppercase tracking-widest">Total Vybetix Earnings</span>
              <span className="text-2xl sm:text-3xl font-black text-[#E8441A] font-syne tracking-tight">
                {formatNaira(stats?.platformTotalVybetixEarningsKobo || 0)}
              </span>
              <span className="text-[11px] text-zinc-500 mt-1">
                incl. {formatNaira(stats?.platformTotalServiceFeesKobo || 0)} service fees
              </span>
            </div>
          </Card>

        </div>

        {/* ========================================================= */}
        {/* SECTION 2: ACTIVE VS INACTIVE REVENUE & CAPACITY OVERVIEW */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Active Events Overview */}
          <Card className="p-6 border-zinc-800 bg-zinc-950/60 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-syne">
                  Active Events ({stats?.activeEvents || 0})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Selling Now
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Generated (Sold):</span>
                <span className="font-bold text-white font-mono">{formatNaira(stats?.activeGeneratedRevenueKobo || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Unsold Potential:</span>
                <span className="font-bold text-amber-400 font-mono">{formatNaira(stats?.activeNotGeneratedRevenueKobo || 0)}</span>
              </div>
              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Expected Organizer Share (96%):</span>
                <span className="font-bold text-emerald-400 font-mono">{formatNaira(Math.round((stats?.activeGeneratedRevenueKobo || 0) * 0.96))}</span>
              </div>
            </div>
          </Card>

          {/* Inactive / Ended Events Overview */}
          <Card className="p-6 border-zinc-800 bg-zinc-950/60 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-500" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-syne">
                  Past / Ended Events ({stats?.inactiveEvents || 0})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                Archived
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Realized Sales:</span>
                <span className="font-bold text-white font-mono">{formatNaira(stats?.inactiveGeneratedRevenueKobo || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Unsold at Close:</span>
                <span className="font-bold text-zinc-500 font-mono">{formatNaira(stats?.inactiveNotGeneratedRevenueKobo || 0)}</span>
              </div>
              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Organizer Realized Share (96%):</span>
                <span className="font-bold text-emerald-400 font-mono">{formatNaira(Math.round((stats?.inactiveGeneratedRevenueKobo || 0) * 0.96))}</span>
              </div>
            </div>
          </Card>

          {/* Total Buyer Collections & Split Formula */}
          <Card className="p-6 border-zinc-800 bg-zinc-950/60 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#E8441A]" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-syne">
                  Fee Split Formula
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#E8441A] bg-[#E8441A]/10 px-2 py-0.5 rounded">
                Transparent
              </span>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 flex flex-col gap-1">
                <div className="flex justify-between font-bold text-zinc-300">
                  <span>Organizer Receives:</span>
                  <span className="text-emerald-400">96% (Paystack Auto-Split)</span>
                </div>
                <span className="text-[10px] text-zinc-500">Directly into their Paystack subaccount</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 flex flex-col gap-1">
                <div className="flex justify-between font-bold text-zinc-300">
                  <span>Vybetix Receives:</span>
                  <span className="text-purple-400">4% + ₦100 Flat Fee</span>
                </div>
                <span className="text-[10px] text-zinc-500">Platform absorbs Paystack payment processing fees</span>
              </div>
            </div>
          </Card>

        </div>

        {/* ========================================================= */}
        {/* SECTION 3: PER-EVENT REVENUE & ALLOCATION TABLE          */}
        {/* ========================================================= */}
        <Card className="p-6 border-zinc-800 bg-zinc-950/40 flex flex-col gap-6">

          {/* Table Header with Filters & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-black text-white font-syne uppercase tracking-wider flex items-center gap-2">
                <PieChart className="h-5 w-5 text-[#E8441A]" />
                Event Financial Allocations & Revenue Breakdown
              </h2>
              <p className="text-xs text-zinc-400">
                Exact breakdown of ticket sales, Organizer 96% allocation, Vybetix 4% cut, and ₦100 service fees
              </p>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

              {/* Filter Tabs */}
              <div className="flex items-center p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setEventFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${eventFilter === 'all'
                    ? 'bg-[#E8441A] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  All ({stats?.totalEvents || 0})
                </button>
                <button
                  onClick={() => setEventFilter('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${eventFilter === 'active'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  Active ({stats?.activeEvents || 0})
                </button>
                <button
                  onClick={() => setEventFilter('inactive')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${eventFilter === 'inactive'
                    ? 'bg-zinc-700 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  Inactive ({stats?.inactiveEvents || 0})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search title, organizer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-[#E8441A] w-full sm:w-56"
                />
              </div>

            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 uppercase tracking-widest text-[10px]">
                  <th className="py-3.5 px-4 font-bold">Event & Organizer</th>
                  <th className="py-3.5 px-4 font-bold text-center">Status</th>
                  <th className="py-3.5 px-4 font-bold">Sold</th>
                  <th className="py-3.5 px-4 font-bold text-right">Gross Sales</th>
                  <th className="py-3.5 px-4 font-bold text-right text-emerald-400">To Organizer (96%)</th>
                  <th className="py-3.5 px-4 font-bold text-right text-purple-400">Our 4% Cut</th>
                  <th className="py-3.5 px-4 font-bold text-right text-sky-400">Service Fees</th>
                  <th className="py-3.5 px-4 font-bold text-right text-[#E8441A]">Vybetix Total</th>
                  <th className="py-3.5 px-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60 font-outfit">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-500">
                      No events match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-zinc-900/30 transition-colors group">

                      {/* Event Title & Organizer */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <Link
                            href={`/events/${ev.slug || ev.id}`}
                            className="font-bold text-white group-hover:text-[#E8441A] transition-colors flex items-center gap-1.5"
                          >
                            {ev.title}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          <span className="text-[11px] text-zinc-400">
                            Org: <strong className="text-zinc-300">{ev.organizer?.name || 'Unnamed Organizer'}</strong>
                            {ev.organizer?.email ? ` (${ev.organizer.email})` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {ev.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                            Ended
                          </span>
                        )}
                      </td>

                      {/* Tickets Sold */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        <span className="font-bold text-white">{ev.totalSold}</span>
                        <span className="text-zinc-500"> / {ev.totalCapacity}</span>
                      </td>

                      {/* Gross Ticket Sales */}
                      <td className="py-3.5 px-4 text-right font-bold text-white font-mono text-[13px] whitespace-nowrap">
                        {formatNaira(ev.grossTicketSalesKobo)}
                      </td>

                      {/* Allocated to Organizer (96%) */}
                      <td className="py-3.5 px-4 text-right font-black text-emerald-400 font-mono text-[13px] whitespace-nowrap bg-emerald-500/5">
                        {formatNaira(ev.organizerAllocationKobo)}
                      </td>

                      {/* Our 4% Cut */}
                      <td className="py-3.5 px-4 text-right font-bold text-purple-400 font-mono text-[12px] whitespace-nowrap">
                        {formatNaira(ev.commission4PercentKobo)}
                      </td>

                      {/* Service Fees (₦100 per paid order) */}
                      <td className="py-3.5 px-4 text-right font-bold text-sky-400 font-mono text-[12px] whitespace-nowrap">
                        {formatNaira(ev.serviceFeesKobo)}
                      </td>

                      {/* Vybetix Total Take */}
                      <td className="py-3.5 px-4 text-right font-black text-[#E8441A] font-mono text-[13px] whitespace-nowrap bg-[#E8441A]/5">
                        {formatNaira(ev.platformTotalTakeKobo)}
                      </td>

                      {/* Action: Open Settlement Receipt */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedEvent(ev)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold transition-colors"
                        >
                          Breakdown
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </Card>

        {/* ========================================================= */}
        {/* SECTION 4: PLATFORM USERS DEMOGRAPHICS & SECURITY HEALTH */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* User Demographics */}
          <Card className="col-span-1 lg:col-span-2 p-6 border-zinc-800 bg-zinc-900/20 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-[#E8441A]" /> Platform Demographics
              </h3>
              <span className="text-xs text-zinc-500 font-mono">
                Total Users: {stats?.totalUsers || 0}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Buyers</span>
                <span className="text-2xl font-black text-zinc-100 font-syne">{stats?.totalBuyers || 0}</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Organizers</span>
                <span className="text-2xl font-black text-zinc-100 font-syne">{stats?.totalOrganizers || 0}</span>
              </div>
              <div className="p-4 rounded-2xl bg-red-950/20 border border-red-900/30 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-red-500/70 uppercase tracking-widest">Banned</span>
                <span className="text-2xl font-black text-red-400 font-syne">{stats?.totalBannedUsers || 0}</span>
              </div>
            </div>
          </Card>

          {/* Security & System Health */}
          <Card className="p-6 border-zinc-800 bg-zinc-900/20 flex flex-col gap-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-emerald-400" /> Platform Security & Health
            </h3>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-900">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-zinc-300">Fraud Flags</span>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Unresolved security alerts</span>
                </div>
                <div className={`px-3 py-1 rounded-md text-xs font-bold ${stats?.activeFraudFlags > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {stats?.activeFraudFlags || 0} Active
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-900">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-zinc-300">Paystack Split Status</span>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Automatic payout engine</span>
                </div>
                <span className="px-3 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-400">
                  Active
                </span>
              </div>
            </div>

            <div className="mt-auto pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Orders Processed:</span>
              <span className="font-bold text-zinc-300 font-mono">{stats?.totalSuccessfulOrders || 0} orders</span>
            </div>
          </Card>

        </div>

      </div>

      {/* ========================================================= */}
      {/* FINANCIAL SETTLEMENT BREAKDOWN MODAL                      */}
      {/* ========================================================= */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#0e0e14] p-6 shadow-2xl flex flex-col gap-6 font-outfit">

            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#E8441A]">
                  Event Financial Settlement Receipt
                </span>
                <h3 className="text-xl font-black text-white font-syne">
                  {selectedEvent.title}
                </h3>
                <span className="text-xs text-zinc-400">
                  Organizer: <strong className="text-zinc-200">{selectedEvent.organizer?.name || 'N/A'}</strong> ({selectedEvent.organizer?.email || 'N/A'})
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Calculations Breakdown */}
            <div className="flex flex-col gap-3 text-xs">

              {/* Gross Sales */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="flex flex-col">
                  <span className="font-bold text-white">Gross Ticket Sales (Face Value)</span>
                  <span className="text-[10px] text-zinc-500">{selectedEvent.totalSold} tickets sold</span>
                </div>
                <span className="font-black text-white font-mono text-sm">
                  {formatNaira(selectedEvent.grossTicketSalesKobo)}
                </span>
              </div>

              {/* Less 4% Commission */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/20 border border-purple-900/30">
                <div className="flex flex-col">
                  <span className="font-bold text-purple-300">Less: Vybetix 4% Platform Cut</span>
                  <span className="text-[10px] text-purple-400/70">4% commission deducted from gross sales</span>
                </div>
                <span className="font-black text-purple-400 font-mono text-sm">
                  - {formatNaira(selectedEvent.commission4PercentKobo)}
                </span>
              </div>

              {/* Net Payout to Organizer */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                <div className="flex flex-col">
                  <span className="font-extrabold text-emerald-300 text-sm">Net Payable to Organizer (96%)</span>
                  <span className="text-[10px] text-emerald-400/80">Disbursed directly via Paystack subaccount</span>
                </div>
                <span className="font-black text-emerald-400 font-mono text-lg">
                  {formatNaira(selectedEvent.organizerAllocationKobo)}
                </span>
              </div>

              {/* Additional Service Fees Retained */}
              <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-800/80 flex flex-col gap-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Flat Buyer Service Fees Collected (₦100/order):</span>
                  <span className="font-bold text-sky-400 font-mono">+{formatNaira(selectedEvent.serviceFeesKobo)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 font-bold text-zinc-300">
                  <span>Total Vybetix Gross Profit (4% + Service Fees):</span>
                  <span className="text-[#E8441A] font-mono">{formatNaira(selectedEvent.platformTotalTakeKobo)}</span>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => copySettlementSummary(selectedEvent)}
                className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Summary Copied!' : 'Copy Settlement Summary'}
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="py-3 px-6 rounded-xl bg-[#E8441A] hover:bg-[#ff5a2f] text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
