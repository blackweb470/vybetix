'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../../lib/api';
import { useToast } from '../../../../../components/ui/toast';
import { Users, Mail, Plus, Trash2, ArrowLeft, Shield, Disc } from 'lucide-react';
import Link from 'next/link';

interface StaffMember {
  id: string;
  email: string;
  user_id: string | null;
  created_at: string;
  users?: { name: string } | null;
}

export default function EventStaffPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/events/${id}/staff`);
      setStaff(response.data.data || []);
    } catch (err: any) {
      toast({ 
        title: 'Failed to load staff', 
        description: err.response?.data?.message || err.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStaff();
    }
  }, [id]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post(`/api/events/${id}/staff`, { email: email.trim().toLowerCase() });
      toast({ title: 'Staff Added!', description: `${email} has been added to the gate team.`, variant: 'success' });
      setEmail('');
      fetchStaff(); // Reload the list
    } catch (err: any) {
      toast({ 
        title: 'Error adding staff', 
        description: err.response?.data?.message || err.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStaff = async (staffId: string, staffEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${staffEmail} from the gate team?`)) return;

    try {
      await api.delete(`/api/events/${id}/staff/${staffId}`);
      toast({ title: 'Staff Removed', description: `${staffEmail} has been removed.`, variant: 'success' });
      fetchStaff(); // Reload the list
    } catch (err: any) {
      toast({ 
        title: 'Error removing staff', 
        description: err.response?.data?.message || err.message, 
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#08080C] font-outfit text-zinc-100">
      {/* Header */}
      <div className="w-full border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur-xl px-6 py-6 sticky top-0 z-30">
        <div className="mx-auto max-w-4xl flex items-center gap-4">
          <Link href="/dashboard" className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Event Configuration</p>
            <h1 className="text-xl sm:text-2xl font-black text-white font-syne uppercase tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-[#E8441A]" />
              Manage Gate Team
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10 flex flex-col gap-8">
        
        {/* Add Staff Form */}
        <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/30">
          <div className="mb-6">
            <h2 className="text-lg font-black text-white font-syne uppercase tracking-tight mb-2 flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#E8441A]" />
              Invite Team Member
            </h2>
            <p className="text-xs text-zinc-400">
              Add someone to help scan tickets at the gate. They will automatically be granted the <strong>Gate Staff</strong> role when they log in using this email.
            </p>
          </div>

          <form onSubmit={handleAddStaff} className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                Staff Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. staff@example.com"
                  className="w-full bg-[#0D0D0D] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#E8441A] focus:ring-1 focus:ring-[#E8441A] transition-all"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#E8441A] hover:brightness-110 text-white text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-[#E8441A]/15 disabled:opacity-50 disabled:cursor-not-allowed h-[46px]"
            >
              {isSubmitting ? (
                <Disc className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Add Staff
                </>
              )}
            </button>
          </form>
        </div>

        {/* Staff List */}
        <div>
          <h2 className="text-lg font-black text-white font-syne uppercase tracking-tight mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            Active Gate Staff
          </h2>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 border border-zinc-900 border-dashed rounded-3xl">
              <Disc className="h-8 w-8 text-[#E8441A] animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Loading team...</span>
            </div>
          ) : staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 border border-zinc-900 border-dashed rounded-3xl bg-zinc-950/20">
              <Users className="h-10 w-10 text-zinc-700" />
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-wider text-white mb-1">No Staff Added</p>
                <p className="text-xs text-zinc-500">You haven't added anyone to the gate team yet.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staff.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-900 bg-zinc-950/50 hover:border-zinc-800 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                      <Shield className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{member.email}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-0.5">
                        {member.user_id ? 'Registered User' : 'Pending Invite'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveStaff(member.id, member.email)}
                    className="p-2 rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors shrink-0"
                    title="Remove Staff"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
