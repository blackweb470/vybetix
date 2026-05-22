'use client';

export const dynamic = 'force-dynamic';

import React, { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/ui/toast';
import { api } from '../../../lib/api';
import Link from 'next/link';
import { Disc, UserPlus, Ticket, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface Bank {
  name: string;
  code: string;
}

const ROLE_OPTIONS = [
  { value: 'buyer', label: 'Ticket Buyer', sub: 'Discover & attend events', icon: Ticket },
  { value: 'organizer', label: 'Event Organizer', sub: 'Host events & collect payouts', icon: Building2 },
];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isRegistering } = useAuth();
  const { toast } = useToast();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'buyer' | 'organizer'>('buyer');
  const [businessName, setBusinessName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [accountError, setAccountError] = useState('');

  useEffect(() => {
    if (role === 'organizer') {
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
      if (banks.length === 0) fetchBanks();
    }
  }, [role, banks.length]);

  useEffect(() => {
    const resolveAccount = async () => {
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
      } else {
        setAccountName('');
        setAccountError('');
      }
    };
    
    const timeoutId = setTimeout(() => {
      resolveAccount();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [bankName, accountNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName || !phone || !password) {
      toast({ title: 'Missing details', description: 'Please complete all basic profile info including password', variant: 'destructive' });
      return;
    }
    if (!/^\+234[789][01]\d{8}$/.test(phone)) {
      toast({ title: 'Invalid phone', description: 'Phone must be a valid Nigerian number (+234...)', variant: 'destructive' });
      return;
    }
    if (role === 'organizer' && (!businessName || !bankName || !accountNumber || !accountName)) {
      toast({ title: 'Banking info required', description: 'Please complete all business and bank details', variant: 'destructive' });
      return;
    }
    try {
      const payload = {
        email, password, fullName, phone, role,
        ...(role === 'organizer' ? { business_name: businessName, bank_name: bankName, account_number: accountNumber, account_name: accountName } : {})
      };
      const session = await register(payload);
      toast({ title: 'Account Created!', description: `Welcome, ${session.user.full_name}`, variant: 'success' });
      const targetUrl = redirectUrl === '/' ? '/events' : redirectUrl;
      router.push(role === 'organizer' ? '/dashboard' : targetUrl);
      router.refresh();
    } catch (err: any) {
      toast({ title: 'Signup failed', description: err.response?.data?.message || err.message || 'Email might already be registered', variant: 'destructive' });
    }
  };

  const inputCls = "h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#E8441A] focus:outline-none focus:ring-2 focus:ring-[#E8441A]/20 transition-all";

  return (
    <div className="flex-1 flex min-h-screen bg-[#08080C] font-outfit">

      {/* LEFT brand panel */}
      <div
        className="hidden lg:flex lg:w-[40%] relative flex-col justify-between p-12 overflow-hidden border-r border-zinc-900/60"
        style={{ backgroundImage: "linear-gradient(160deg, rgba(8,8,12,0.92) 0%, rgba(8,8,12,0.72) 60%, rgba(100,30,200,0.10) 100%), url('https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=800')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-purple-700/8 blur-[120px] pointer-events-none" />

        <Link href="/" className="flex items-center gap-4 relative z-10 group w-fit">
          <Image src="/logo.png" alt="VibeTix" width={128} height={128} />
          <span className="text-5xl font-black tracking-tighter font-syne text-white group-hover:text-[#E8441A] transition-colors">VibeTix</span>
        </Link>

        <div className="relative z-10 flex flex-col gap-5">
          <h2 className="text-3xl xl:text-4xl font-black text-white font-syne uppercase tracking-tight leading-[1.05]">
            Join Nigeria's<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8441A] to-amber-400">Premier Ticket</span><br />
            Network.
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">Access student discounts, campus-gated events, and cryptographically sealed QR codes for instant entry.</p>
          <div className="flex flex-col gap-2.5 mt-2">
            {['Buy tickets with campus verification', 'Exclusive campus-only access gates', 'Host events & collect Paystack payouts'].map((t) => (
              <div key={t} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E8441A] shrink-0" />
                <span className="text-xs text-zinc-400">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">TRUSTED ACROSS NIGERIA</p>
          <p className="text-xs text-zinc-500 mt-1">UNILAG · UI · ABU · FUTA · OAU · UNN & 40+ campuses</p>
        </div>
      </div>

      {/* RIGHT form panel */}
      <div className="flex-1 flex items-start justify-center px-6 sm:px-10 py-12 overflow-y-auto">
        <div className="w-full max-w-lg">

          <Link href="/" className="flex items-center gap-4 mb-8 lg:hidden group w-fit">
            <Image src="/logo.png" alt="VibeTix" width={96} height={96} />
            <span className="text-3xl font-black tracking-tighter font-syne text-white">VibeTix</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-white font-syne uppercase tracking-tight mb-2">Create Account</h1>
            <p className="text-sm text-zinc-500">Join the network. Set up your profile in under 2 minutes.</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {ROLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = role === opt.value;
              return (
                <button key={opt.value} type="button" onClick={() => setRole(opt.value as any)}
                  className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border text-left transition-all ${active ? 'border-[#E8441A] bg-[#E8441A]/8' : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'}`}>
                  <Icon className={`h-5 w-5 ${active ? 'text-[#E8441A]' : 'text-zinc-500'}`} />
                  <span className={`text-xs font-black uppercase tracking-wider ${active ? 'text-white' : 'text-zinc-400'}`}>{opt.label}</span>
                  <span className="text-[10px] text-zinc-500 leading-snug">{opt.sub}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Full Name</label>
                <input type="text" placeholder="Tunde Alao" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email Address</label>
                <input type="email" placeholder="you@unilag.edu.ng" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Phone Number</label>
                <input type="tel" placeholder="+2348031234567" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Password</label>
                <input type="password" placeholder="••••••••" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
              </div>
            </div>

            {role === 'organizer' && (
              <div className="flex flex-col gap-4 pt-5 mt-1 border-t border-zinc-900">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#E8441A]" />
                  <span className="text-[10px] font-black text-[#E8441A] uppercase tracking-widest">Business & Payout Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Business Name</label>
                    <input type="text" placeholder="Alao Media Production" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Bank Name</label>
                    {loadingBanks ? (
                      <div className="flex items-center gap-2 text-xs text-zinc-450 h-11 px-4 border border-zinc-800 rounded-xl bg-zinc-950/60">
                        <Disc className="h-3.5 w-3.5 animate-spin text-[#E8441A]" />
                        Retrieving banks...
                      </div>
                    ) : (
                      <select
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        required
                        className={`${inputCls} appearance-none cursor-pointer`}
                      >
                        <option value="" disabled className="bg-zinc-950 text-zinc-500">Select Bank...</option>
                        {banks.map(bank => (
                          <option key={bank.code} value={`${bank.code}:${bank.name}`} className="bg-zinc-950 text-zinc-150 py-1">
                            {bank.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Account Number</label>
                    <input type="text" maxLength={10} placeholder="0123456789" required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className={inputCls} />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Account Name</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder={resolvingAccount ? "Verifying..." : "Resolved automatically"} 
                        required 
                        readOnly
                        value={accountName} 
                        className={`${inputCls} pr-10 ${accountName ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-100' : 'bg-zinc-900 cursor-not-allowed'}`} 
                      />
                      {resolvingAccount && <Disc className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-[#E8441A]" />}
                      {accountName && !resolvingAccount && <CheckCircle2 className="absolute right-3 top-3.5 h-4 w-4 text-emerald-500" />}
                      {accountError && !resolvingAccount && <AlertCircle className="absolute right-3 top-3.5 h-4 w-4 text-red-500" />}
                    </div>
                    {accountError && <span className="text-[10px] text-red-400 mt-0.5">{accountError}</span>}
                  </div>
                </div>
              </div>
            )}

            <button type="submit" disabled={isRegistering}
              className="h-12 w-full rounded-xl bg-[#E8441A] hover:brightness-110 active:scale-[0.98] transition-all text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#E8441A]/20 disabled:opacity-60 mt-1">
              {isRegistering ? <Disc className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" />Create Account</>}
            </button>

            <p className="text-center text-xs text-zinc-500">
              Already have an account?{' '}
              <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="text-[#E8441A] hover:text-[#ff6b3d] font-bold transition-colors">Sign In &rarr;</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex flex-col items-center justify-center bg-[#08080C] py-36"><Disc className="h-10 w-10 text-[#E8441A] animate-spin" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}
