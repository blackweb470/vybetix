'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useMyTickets } from '../../hooks/useTickets';
import { useToast } from '../../components/ui/toast';
import Link from 'next/link';
import { User, Mail, Phone, Ticket, ShieldCheck, Sparkles, ArrowUpRight, Disc, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated, updateProfileMutation } = useAuth();
  const { data: tickets } = useMyTickets();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  if (!isAuthenticated && typeof window !== 'undefined') {
    // If not signed in, redirect to login
    window.location.href = '/login?redirect=/profile';
    return null;
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileMutation.mutateAsync({
        fullName,
        phone,
      });
      setIsEditing(false);
      toast({
        title: 'Profile Updated',
        description: 'Your account info has been saved successfully.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err.response?.data?.message || 'Could not update profile',
        variant: 'destructive',
      });
    }
  };

  const activeTicketsCount = tickets?.filter(t => t.status === 'active').length || 0;
  const totalTicketsCount = tickets?.length || 0;

  return (
    <div className="w-full min-h-screen bg-[#161713] text-[#f4f1e9] font-['DM_Sans',sans-serif] selection:bg-[#ff5a24] selection:text-[#161713] py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#393a32] mb-10">
          <div>
            <div className="vyb-eyebrow text-[#a7a89e] mb-2">
              <span className="vyb-dot" />
              <span>YOUR ACCOUNT ✳ VYBETIX IDENTITY</span>
            </div>
            <h1 className="font-['Barlow_Condensed',Impact,sans-serif] font-black uppercase text-5xl sm:text-6xl text-[#f4f1e9] tracking-tight leading-none">
              PROFILE & <span className="text-[#ff5a24]">PASSES.</span>
            </h1>
          </div>

          <Link
            href="/tickets"
            className="vyb-btn rounded-xl !py-3 !px-5 !text-xs !gap-2 shadow-[3px_3px_0px_#f4f1e9]"
          >
            OPEN TICKET VAULT <span className="vyb-arrow">↗</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* LEFT: TICKET STAMP STATS CARD */}
          <div className="flex flex-col gap-4">
            
            {/* VIP Pass Card Silhouette */}
            <div className="bg-[#f4f1e9] text-[#161713] rounded-2xl border-2 border-[#161713] shadow-[6px_6px_0px_#161713] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#161713] text-[#f4f1e9] px-2.5 py-0.5 rounded-full">
                    MEMBER PASS
                  </span>
                  <Sparkles className="h-4 w-4 text-[#ff5a24]" />
                </div>

                <div className="w-16 h-16 rounded-2xl bg-[#ff5a24] text-[#161713] flex items-center justify-center font-black text-2xl font-['Barlow_Condensed',Impact,sans-serif] border-2 border-[#161713] shadow-[2px_2px_0px_#161713] mb-4">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>

                <h3 className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-2xl uppercase tracking-tight text-[#161713] leading-none">
                  {user?.full_name || 'Vybetix Member'}
                </h3>
                <p className="text-[11px] text-[#606257] mt-1 font-mono">
                  {user?.email}
                </p>

                <div className="mt-4 pt-3 border-t border-[#d5d2c6] flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#737568]">Role</span>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#c4db59] text-[#161713]">
                    {user?.role || 'Buyer'}
                  </span>
                </div>
              </div>

              {/* Mini Barcode */}
              <div className="vyb-tear mt-4 pt-3">
                <div className="vyb-barcode" />
                <span className="text-[7px] font-mono font-bold tracking-widest text-[#737568]">VERIFIED</span>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="bg-[#20211a] border border-[#393a32] rounded-2xl p-5 flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#a7a89e]">Vault Summary</span>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#a7a89e]">Active Gate Passes</span>
                <span className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-2xl text-[#c4db59]">
                  {activeTicketsCount}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#393a32]">
                <span className="text-xs text-[#a7a89e]">All-Time Tickets</span>
                <span className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-2xl text-[#f4f1e9]">
                  {totalTicketsCount}
                </span>
              </div>
            </div>

          </div>

          {/* RIGHT: ACCOUNT DETAILS & SETTINGS */}
          <div className="md:col-span-2">
            <div className="bg-[#20211a] border border-[#393a32] rounded-3xl p-6 sm:p-8">
              
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#393a32]">
                <div>
                  <h2 className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-2xl uppercase tracking-tight text-[#f4f1e9]">
                    Account Details
                  </h2>
                  <p className="text-xs text-[#a7a89e] mt-0.5">
                    Your personal information used on your tickets and checkout passes.
                  </p>
                </div>

                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-xl bg-[#2e3025] hover:bg-[#3d3f32] text-[#f4f1e9] text-xs font-black uppercase tracking-wider transition-colors border border-[#393a32]"
                  >
                    Edit Info
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#a7a89e] mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full bg-[#161713] border border-[#393a32] rounded-xl px-4 py-3 text-sm text-[#f4f1e9] focus:outline-none focus:border-[#ff5a24]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#a7a89e] mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#161713] border border-[#393a32] rounded-xl px-4 py-3 text-sm text-[#f4f1e9] focus:outline-none focus:border-[#ff5a24]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#a7a89e] mb-1.5">
                      Email Address (Permanent)
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-[#161713]/60 border border-[#2b2c24] rounded-xl px-4 py-3 text-sm text-[#737568] cursor-not-allowed"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="px-6 py-3 rounded-xl bg-[#ff5a24] text-[#161713] font-black text-xs uppercase tracking-wider hover:bg-[#e04a1a] transition-all flex items-center gap-2 shadow-[2px_2px_0px_#161713]"
                    >
                      {updateProfileMutation.isPending && <Disc className="h-3.5 w-3.5 animate-spin" />}
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-3 rounded-xl bg-transparent text-[#a7a89e] hover:text-[#f4f1e9] text-xs font-black uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#161713] border border-[#2b2c24]">
                    <User className="h-5 w-5 text-[#ff5a24] shrink-0" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#737568] block">Full Name</span>
                      <span className="text-sm font-bold text-[#f4f1e9]">{user?.full_name || 'Not set'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#161713] border border-[#2b2c24]">
                    <Mail className="h-5 w-5 text-[#c4db59] shrink-0" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#737568] block">Email</span>
                      <span className="text-sm font-bold text-[#f4f1e9]">{user?.email || 'Not set'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#161713] border border-[#2b2c24]">
                    <Phone className="h-5 w-5 text-[#f7a6c5] shrink-0" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#737568] block">Phone</span>
                      <span className="text-sm font-bold text-[#f4f1e9]">{user?.phone || 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-2 text-xs text-[#a7a89e]">
                    <ShieldCheck className="h-4 w-4 text-[#c4db59]" />
                    <span>Your tickets will always use this information for gate verification.</span>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

