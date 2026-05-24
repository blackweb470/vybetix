'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/card';
import { formatNaira } from '../../lib/utils';
import { api } from '../../lib/api';
import { ShieldAlert, Users, Ticket, Calendar, DollarSign, Activity, Settings, LogOut, ArrowRight, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only allow admin role to access this page
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load platform statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080C] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-8 w-8 text-[#E8441A] animate-pulse" />
          <p className="text-zinc-500 font-syne uppercase tracking-widest text-xs font-bold animate-pulse">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#08080C] flex items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 max-w-md">
          <ShieldAlert className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h2 className="text-white font-syne text-lg font-bold uppercase tracking-wider mb-2">Access Denied</h2>
          <p className="text-zinc-400 text-sm">{error}</p>
          <button onClick={() => router.push('/dashboard')} className="mt-6 px-6 py-2.5 bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-700 transition-colors">
            Return to Safety
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Revenue Volume', value: formatNaira(stats?.totalRevenueKobo || 0), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Events Hosted', value: stats?.totalEvents || 0, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Tickets Sold', value: stats?.totalSuccessfulOrders || 0, icon: Ticket, color: 'text-[#E8441A]', bg: 'bg-[#E8441A]/10' },
  ];

  return (
    <div className="min-h-screen bg-[#08080C] font-outfit text-zinc-100 pb-20">
      {/* Header */}
      <div className="w-full border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur-xl px-6 py-6 sticky top-0 z-30">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#E8441A] to-purple-600 flex items-center justify-center shadow-lg shadow-[#E8441A]/20">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-white font-syne uppercase tracking-tight flex items-center gap-2">
                Developer <span className="text-[#E8441A]">Console</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5">God Mode Activated</p>
            </div>
          </div>
          <button onClick={() => router.push('/dashboard')} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-6 mt-4 flex flex-col gap-8">
        
        {/* Top Level KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <Card key={i} className="p-5 border-zinc-800/60 bg-zinc-900/30 flex flex-col gap-4 hover:border-zinc-700 transition-colors group">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-lg ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <TrendingUp className="h-3 w-3 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                <span className="text-2xl font-black text-white font-syne tracking-tight">{stat.value}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Detailed Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* User Demographics */}
          <Card className="col-span-1 lg:col-span-2 p-6 border-zinc-800 bg-zinc-900/20 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-[#E8441A]" /> Platform Demographics
              </h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Buyers</span>
                <span className="text-xl font-bold text-zinc-200">{stats?.totalBuyers || 0}</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Organizers</span>
                <span className="text-xl font-bold text-zinc-200">{stats?.totalOrganizers || 0}</span>
              </div>
              <div className="p-4 rounded-2xl bg-red-950/20 border border-red-900/30 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-red-500/70 uppercase tracking-widest">Banned</span>
                <span className="text-xl font-bold text-red-400">{stats?.totalBannedUsers || 0}</span>
              </div>
            </div>
          </Card>

          {/* Security & Health */}
          <Card className="p-6 border-zinc-800 bg-zinc-900/20 flex flex-col gap-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-emerald-400" /> Security Health
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
                  <span className="text-xs font-bold text-zinc-300">Pending Payouts</span>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Manual organizer transfers</span>
                </div>
                <div className="px-3 py-1 rounded-md text-xs font-bold bg-yellow-500/10 text-yellow-400">
                  {stats?.pendingPayoutRequests?.length || 0} Pending
                </div>
              </div>
            </div>

            <button className="mt-auto w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2">
              <Settings className="h-3.5 w-3.5" /> Platform Settings
            </button>
          </Card>

        </div>
      </div>
    </div>
  );
}
