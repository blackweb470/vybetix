'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useMe } from '../../../hooks/useAuth';
import { useToast } from '../../../components/ui/toast';
import { api } from '../../../lib/api';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Building, 
  CreditCard, 
  ArrowRight, 
  CheckCircle, 
  Save, 
  Disc, 
  Ticket, 
  LayoutDashboard,
  Calendar,
  Lock,
  UserCheck,
  AlertCircle
} from 'lucide-react';

interface Bank {
  name: string;
  code: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, logout, updateProfile, isUpdatingProfile } = useAuth();
  const { data: me, isLoading: isLoadingMe, refetch } = useMe();

  const [mounted, setMounted] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [accountError, setAccountError] = useState('');

  // Banks selection dropdown states
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  // Active section inside the profile settings
  const [activeTab, setActiveTab] = useState<'personal' | 'business'>('personal');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch banks list for organizers
  useEffect(() => {
    if (me?.role === 'organizer') {
      const fetchBanks = async () => {
        setLoadingBanks(true);
        try {
          const { data } = await api.get('/api/payments/banks');
          if (data.success) {
            setBanks(data.data);
          }
        } catch (error) {
          console.error("Error fetching banks:", error);
        } finally {
          setLoadingBanks(false);
        }
      };
      fetchBanks();
    }
  }, [me]);

  // Map existing plain bank name to composite code:name string
  useEffect(() => {
    if (banks.length > 0 && me?.organizerProfile?.bank_name) {
      const currentBankName = me.organizerProfile.bank_name.toLowerCase();
      // Check for an exact or fuzzy match
      const matched = banks.find(
        b => b.name.toLowerCase() === currentBankName ||
             currentBankName.includes(b.name.toLowerCase()) ||
             b.name.toLowerCase().includes(currentBankName) ||
             `${b.code}:${b.name}`.toLowerCase() === currentBankName
      );
      if (matched) {
        setBankName(`${matched.code}:${matched.name}`);
      }
    }
  }, [banks, me]);

  useEffect(() => {
    const resolveAccount = async () => {
      // Don't auto-resolve if we just loaded the original profile data and nothing changed
      if (me?.organizerProfile &&
          accountNumber === me.organizerProfile.account_number &&
          accountName === me.organizerProfile.account_name &&
          accountName !== '') {
        return;
      }

      if (bankName && accountNumber.length === 10) {
        setResolvingAccount(true);
        setAccountError('');
        setAccountName('');
        try {
          const bankCode = bankName.split(':')[0];
          const { data } = await api.post('/api/payments/resolve-account', {
            account_number: accountNumber,
            bank_code: bankCode
          });
          if (data.success && data.data.account_name) {
            setAccountName(data.data.account_name);
          } else {
            setAccountError('Could not verify account details');
          }
        } catch (error: any) {
          console.error("Error resolving account:", error);
          setAccountError(error.response?.data?.message || 'Could not verify account details');
        } finally {
          setResolvingAccount(false);
        }
      } else if (accountNumber.length !== 10 && accountNumber !== (me?.organizerProfile?.account_number || '')) {
        setAccountName('');
        setAccountError('');
      }
    };
    
    const timeoutId = setTimeout(() => {
      resolveAccount();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [bankName, accountNumber]);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push(`/login?redirect=/profile`);
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (me) {
      setFullName(me.full_name || '');
      setPhone(me.phone || '');
      if (me.organizerProfile) {
        setBusinessName(me.organizerProfile.business_name || '');
        setBankName(me.organizerProfile.bank_name || '');
        setAccountNumber(me.organizerProfile.account_number || '');
        setAccountName(me.organizerProfile.account_name || '');
      }
    }
  }, [me]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) {
      toast({ title: 'Validation error', description: 'Full name and phone number are required.', variant: 'destructive' });
      return;
    }

    if (me?.role === 'organizer' && (!businessName || !bankName || !accountNumber || !accountName)) {
      toast({ title: 'Validation error', description: 'All business and bank fields are required for organizers.', variant: 'destructive' });
      return;
    }

    try {
      await updateProfile({
        fullName,
        phone,
        ...(me?.role === 'organizer' ? { businessName, bankName, accountNumber, accountName } : {})
      });
      toast({ title: 'Profile Updated!', description: 'Your profile changes have been successfully saved.', variant: 'success' });
      refetch();
    } catch (err: any) {
      toast({ title: 'Failed to update', description: err.response?.data?.message || err.message || 'Something went wrong', variant: 'destructive' });
    }
  };

  if (!mounted || isLoadingMe || !me) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#08080C] min-h-[70vh]">
        <Disc className="h-10 w-10 text-[#E8441A] animate-spin" />
        <span className="text-xxs font-black uppercase tracking-widest text-zinc-600 mt-4">
          Accessing your profile credentials...
        </span>
      </div>
    );
  }

  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'US';

  const inputCls = "h-11 w-full rounded-xl border border-zinc-850 bg-zinc-950/60 px-4 text-sm text-zinc-100 placeholder-zinc-650 focus:border-[#E8441A] focus:outline-none focus:ring-2 focus:ring-[#E8441A]/20 transition-all duration-300";

  return (
    <div className="w-full min-h-screen bg-[#08080C] text-zinc-100 font-outfit relative overflow-hidden py-14 px-4">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#E8441A]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#FF7A00]/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-4xl relative z-10">
        
        {/* Header Hero banner */}
        <div className="rounded-3xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-xl p-8 mb-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 flex-col md:flex-row text-center md:text-left">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#E8441A] to-[#FF7A00] flex items-center justify-center text-white text-2xl font-black font-syne tracking-tight shadow-lg shadow-[#E8441A]/20 relative group">
              {initials}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <UserCheck className="h-3 w-3 text-[#E8441A]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3.5 justify-center md:justify-start">
                <h1 className="text-xl font-black font-syne text-white uppercase tracking-tight">{fullName || 'Vybetix User'}</h1>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                  me.role === 'organizer' 
                    ? 'bg-[#E8441A]/10 border-[#E8441A]/25 text-[#E8441A]' 
                    : me.role === 'admin'
                    ? 'bg-purple-500/10 border-purple-500/25 text-purple-400'
                    : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                }`}>
                  {me.role}
                </span>
              </div>
              <p className="text-zinc-550 text-xs mt-1 tracking-wide">{me.email}</p>
              <div className="flex items-center gap-1 text-[10px] text-zinc-600 mt-2 font-black uppercase tracking-widest justify-center md:justify-start">
                <Calendar className="h-3.5 w-3.5 text-zinc-700" /> Member since {new Date(me.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {me.role === 'organizer' ? (
              <button 
                onClick={() => router.push('/dashboard')}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-850 hover:border-[#E8441A]/30 hover:text-[#E8441A] transition-all bg-zinc-950/60 text-xs font-black uppercase tracking-widest text-zinc-400"
              >
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </button>
            ) : (
              <button 
                onClick={() => router.push('/tickets')}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-850 hover:border-[#E8441A]/30 hover:text-[#E8441A] transition-all bg-zinc-950/60 text-xs font-black uppercase tracking-widest text-zinc-400"
              >
                <Ticket className="h-3.5 w-3.5" /> My Tickets
              </button>
            )}
            <button 
              onClick={logout}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900/60 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 transition-all border border-zinc-850 text-xs font-black uppercase tracking-widest"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Workspace grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel tabs */}
          <div className="lg:col-span-1 flex flex-col gap-3">
            <button
              onClick={() => setActiveTab('personal')}
              className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                activeTab === 'personal'
                  ? 'border-[#E8441A]/30 bg-[#E8441A]/5 text-white'
                  : 'border-zinc-900 bg-zinc-950/30 text-zinc-450 hover:border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className={`h-4.5 w-4.5 ${activeTab === 'personal' ? 'text-[#E8441A]' : 'text-zinc-500 group-hover:text-zinc-450'}`} />
                <span className="text-xs font-black uppercase tracking-wider">Personal Settings</span>
              </div>
              <ArrowRight className={`h-3.5 w-3.5 transition-transform ${activeTab === 'personal' ? 'text-[#E8441A] translate-x-1' : 'text-zinc-700'}`} />
            </button>

            {me.role === 'organizer' && (
              <button
                onClick={() => setActiveTab('business')}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                  activeTab === 'business'
                    ? 'border-[#E8441A]/30 bg-[#E8441A]/5 text-white'
                    : 'border-zinc-900 bg-zinc-950/30 text-zinc-450 hover:border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building className={`h-4.5 w-4.5 ${activeTab === 'business' ? 'text-[#E8441A]' : 'text-zinc-500 group-hover:text-zinc-450'}`} />
                  <span className="text-xs font-black uppercase tracking-wider">Business & Banking</span>
                </div>
                <ArrowRight className={`h-3.5 w-3.5 transition-transform ${activeTab === 'business' ? 'text-[#E8441A] translate-x-1' : 'text-zinc-700'}`} />
              </button>
            )}

            <div className="p-5 border border-zinc-900 bg-zinc-950/20 rounded-2xl flex flex-col gap-4 mt-4">
              <span className="text-[10px] font-black text-zinc-650 uppercase tracking-widest">Platform Security</span>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-400/80" />
                <span className="text-xxs text-zinc-450">Vybetix Premium Auth Enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-zinc-650" />
                <span className="text-xxs text-zinc-500">Secure end-to-end payment rails</span>
              </div>
            </div>
          </div>

          {/* Right panel forms */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSave} className="rounded-3xl border border-zinc-900 bg-zinc-950/30 backdrop-blur-xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
              
              {activeTab === 'personal' && (
                <div className="flex flex-col gap-5">
                  <div className="border-b border-zinc-900 pb-3">
                    <h2 className="text-sm font-black text-white font-syne uppercase tracking-wider flex items-center gap-2">
                      <User className="h-4 w-4 text-[#E8441A]" /> Personal Settings
                    </h2>
                    <p className="text-[10px] text-zinc-550 mt-1 tracking-wide">Manage your basic customer account information details</p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Samuel Adebayo"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email Address</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        disabled
                        value={me.email}
                        className="h-11 w-full rounded-xl border border-zinc-900 bg-zinc-950/20 px-4 text-sm text-zinc-500 cursor-not-allowed outline-none"
                      />
                      <Mail className="absolute right-4 top-3.5 h-4 w-4 text-zinc-700" />
                    </div>
                    <span className="text-[9px] text-zinc-650 tracking-wider">Account email address cannot be changed.</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Phone Number</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="+2348000000000"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className={inputCls}
                      />
                      <Phone className="absolute right-4 top-3.5 h-4 w-4 text-zinc-700" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'business' && me.role === 'organizer' && (
                <div className="flex flex-col gap-5">
                  <div className="border-b border-zinc-900 pb-3">
                    <h2 className="text-sm font-black text-white font-syne uppercase tracking-wider flex items-center gap-2">
                      <Building className="h-4 w-4 text-[#E8441A]" /> Business & Payout Banking
                    </h2>
                    <p className="text-[10px] text-zinc-550 mt-1 tracking-wide">Enter the details where payout funds of sold event tickets will be credited</p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Business / Event Brand Name</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="e.g. Adebayo Gala Productions"
                        value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                        className={inputCls}
                      />
                      <Building className="absolute right-4 top-3.5 h-4 w-4 text-zinc-700" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Bank Name</label>
                    <div className="relative">
                      {loadingBanks ? (
                        <div className="flex items-center gap-2 text-xs text-zinc-450 h-11 px-4 border border-zinc-850 rounded-xl bg-zinc-950/60">
                          <Disc className="h-3.5 w-3.5 animate-spin text-[#E8441A]" />
                          Retrieving settlement banks...
                        </div>
                      ) : (
                        <select
                          value={bankName}
                          onChange={e => setBankName(e.target.value)}
                          className={`${inputCls} appearance-none cursor-pointer`}
                        >
                          <option value="" disabled className="bg-zinc-950 text-zinc-500">Select Settlement Bank...</option>
                          {banks.map(bank => (
                            <option 
                              key={bank.code} 
                              value={`${bank.code}:${bank.name}`}
                              className="bg-zinc-950 text-zinc-150 py-1"
                            >
                              {bank.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Payout Account Number</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          maxLength={10}
                          placeholder="e.g. 0123456789"
                          value={accountNumber}
                          onChange={e => setAccountNumber(e.target.value)}
                          className={inputCls}
                        />
                        <CreditCard className="absolute right-4 top-3.5 h-4 w-4 text-zinc-700" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Beneficiary Account Name</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder={resolvingAccount ? "Verifying..." : "Resolved automatically"} 
                          readOnly
                          required
                          value={accountName} 
                          className={`${inputCls} pr-10 ${accountName ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-100' : 'bg-zinc-900 cursor-not-allowed'}`} 
                        />
                        {resolvingAccount && <Disc className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-[#E8441A]" />}
                        {accountName && !resolvingAccount && <CheckCircle className="absolute right-3 top-3.5 h-4 w-4 text-emerald-500" />}
                        {accountError && !resolvingAccount && <AlertCircle className="absolute right-3 top-3.5 h-4 w-4 text-red-500" />}
                      </div>
                      {accountError && <span className="text-[10px] text-red-400 mt-0.5">{accountError}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="border-t border-zinc-900 pt-5 flex justify-end gap-3 mt-4">
                <button 
                  type="submit" 
                  disabled={isUpdatingProfile}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E8441A] to-[#FF7A00] hover:scale-[1.02] text-white text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-md shadow-[#E8441A]/10 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isUpdatingProfile ? <Disc className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Profile Details
                </button>
              </div>

            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

