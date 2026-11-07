'use client';

export const dynamic = 'force-dynamic';

import React, { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/ui/toast';
import { api } from '../../../lib/api';
import Link from 'next/link';
import { Disc, UserPlus, Ticket, Building2, CheckCircle2, AlertCircle, Eye, EyeOff, Mail, Sparkles } from 'lucide-react';
import { SearchableSelect } from '../../../components/ui/searchable-select';

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
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  const [successData, setSuccessData] = useState<{ targetUrl: string; countdown: number } | null>(null);

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
            setAccountError('Account could not be verified');
          }
        } catch (error: any) {
          setAccountError(error.response?.data?.message || 'Invalid account details');
        } finally {
          setResolvingAccount(false);
        }
      }
    };
    resolveAccount();
  }, [bankName, accountNumber]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (successData && successData.countdown > 0) {
      timer = setTimeout(() => {
        setSuccessData(prev => prev ? { ...prev, countdown: prev.countdown - 1 } : null);
      }, 1000);
    } else if (successData && successData.countdown === 0) {
      window.location.href = successData.targetUrl;
    }
    return () => clearTimeout(timer);
  }, [successData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName || !phone) {
      toast({ title: 'Missing details', description: 'Please complete all required fields', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please check your passwords', variant: 'destructive' });
      return;
    }

    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+234' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+234' + formattedPhone;
    }

    if (!/^\+234[789][01]\d{8}$/.test(formattedPhone)) {
      toast({ title: 'Invalid phone', description: 'Phone must be a valid Nigerian number', variant: 'destructive' });
      return;
    }

    if (role === 'organizer' && (!businessName || !bankName || !accountNumber || !accountName)) {
      toast({ title: 'Banking info required', description: 'Please complete business and bank details', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        email, password, fullName, phone: formattedPhone, role,
        ...(role === 'organizer' ? { business_name: businessName, bank_name: bankName, account_number: accountNumber, account_name: accountName } : {})
      };
      await register(payload);
      setSuccessData({ targetUrl: '/login', countdown: 5 });
    } catch (err: any) {
      toast({ title: 'Signup failed', description: err.response?.data?.message || err.message || 'Email might already be registered', variant: 'destructive' });
    }
  };

  const inputCls = "w-full bg-[#ffffff] border-2 border-[#161713] rounded-xl px-4 py-2.5 text-xs text-[#161713] font-medium placeholder-[#a7a89e] focus:outline-none focus:border-[#ff5a24]";

  return (
    <div className="min-h-screen bg-[#161713] text-[#161713] font-['DM_Sans',sans-serif] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-[#ff5a24] selection:text-[#161713] py-12">

      {/* Brand Logo */}
      <Link href="/" className="mb-6 flex items-center">
        <span className="text-3xl font-black tracking-tight text-[#f4f1e9] uppercase">
          vybetix<i className="not-italic text-[#ff5a24] ml-0.5">✳</i>
        </span>
      </Link>

      {/* SUCCESS POPUP MODAL */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#f4f1e9] border-2 border-[#161713] p-8 rounded-3xl max-w-sm w-full flex flex-col items-center text-center shadow-[8px_8px_0px_#ff5a24]">
            <div className="h-16 w-16 bg-[#c4db59] border-2 border-[#161713] rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-[#161713]" />
            </div>
            <h3 className="text-3xl font-black font-['Barlow_Condensed',Impact,sans-serif] uppercase text-[#161713] mb-2">
              VERIFY YOUR EMAIL
            </h3>
            <p className="text-xs text-[#606257] mb-6">
              A verification link was sent to <strong>{email}</strong>. Check your inbox to activate your account.
            </p>
            <div className="w-full bg-[#e7e4db] rounded-xl p-3 border border-[#d5d2c6] mb-4">
              <span className="text-[10px] uppercase font-bold text-[#727365] block">Redirecting to login in</span>
              <span className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-3xl text-[#161713]">{successData.countdown}s</span>
            </div>
            <Link
              href="/login"
              className="w-full py-3 rounded-xl bg-[#ff5a24] text-[#161713] font-black text-xs uppercase tracking-wider border-2 border-[#161713] shadow-[2px_2px_0px_#161713]"
            >
              GO TO LOGIN ↗
            </Link>
          </div>
        </div>
      )}

      {/* Collectible Paper Card */}
      <div className="w-full max-w-lg bg-[#f4f1e9] rounded-3xl border-2 border-[#161713] shadow-[8px_8px_0px_#161713] p-6 sm:p-8">

        {/* Top Header */}
        <div className="border-b-2 border-[#161713] pb-4 mb-6">
          <div className="text-[10px] font-black uppercase tracking-wider text-[#ff5a24]">
            VYBETIX ✳ CREATE YOUR ACCOUNT
          </div>
          <h1 className="font-['Barlow_Condensed',Impact,sans-serif] font-black uppercase text-4xl text-[#161713] tracking-tight leading-none mt-1">
            BE THERE. GET YOUR PASS.
          </h1>
          <p className="text-xs text-[#606257] mt-1 font-medium">
            Join the live culture network. Setup takes under 2 minutes.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {ROLE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = role === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value as any)}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${active
                    ? 'border-[#161713] bg-[#ffffff] shadow-[3px_3px_0px_#ff5a24]'
                    : 'border-[#d5d2c6] bg-[#e7e4db] hover:border-[#161713]'
                  }`}
              >
                <Icon className={`h-4 w-4 mb-1 ${active ? 'text-[#ff5a24]' : 'text-[#737568]'}`} />
                <span className="font-['Barlow_Condensed',Impact,sans-serif] font-black uppercase text-sm block tracking-wide text-[#161713]">
                  {opt.label}
                </span>
                <span className="text-[9px] text-[#727365] block leading-tight">{opt.sub}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-[#737568] block mb-1">Full Name</label>
              <input type="text" placeholder="Tunde Alao" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-[#737568] block mb-1">Email Address</label>
              <input type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-[#737568] block mb-1">Phone Number (+234...)</label>
              <input
                type="tel"
                placeholder="0803 123 4567"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-[#737568] block mb-1">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} pr-9`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-0 h-full px-2.5 text-[#737568]">
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[9px] font-black uppercase tracking-wider text-[#737568] block mb-1">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" minLength={6} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputCls} pr-9`} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-0 top-0 h-full px-2.5 text-[#737568]">
                  {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Organizer Payout Details */}
          {role === 'organizer' && (
            <div className="p-4 rounded-2xl bg-[#e7e4db] border border-[#d5d2c6] space-y-3 mt-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#ff5a24] flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> ORGANIZER PAYOUT DETAILS
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-[#737568] block mb-1">Business Name</label>
                  <input type="text" placeholder="Vybe Media Productions" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-[#737568] block mb-1">Bank Name</label>
                  {loadingBanks ? (
                    <div className="text-xs text-[#737568] py-2">Loading banks...</div>
                  ) : (
                    <SearchableSelect
                      options={banks.map(bank => ({ value: `${bank.code}:${bank.name}`, label: bank.name }))}
                      value={bankName}
                      onChange={setBankName}
                      placeholder="Select Bank..."
                    />
                  )}
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-[#737568] block mb-1">Account Number (10 digits)</label>
                  <input type="text" maxLength={10} placeholder="0123456789" required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-[#737568] block mb-1">Account Name</label>
                  <input
                    type="text"
                    placeholder={resolvingAccount ? "Verifying..." : "Resolved automatically"}
                    required
                    readOnly
                    value={accountName}
                    className={`${inputCls} ${accountName ? 'bg-[#c4db59]/20 font-bold' : 'bg-[#e9e6dd]'}`}
                  />
                  {accountError && <span className="text-[9px] text-red-600 block mt-0.5">{accountError}</span>}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isRegistering}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#ff5a24] hover:bg-[#e04a1a] text-[#161713] text-xs font-black uppercase tracking-wider transition-all border-2 border-[#161713] shadow-[3px_3px_0px_#161713] mt-2"
          >
            {isRegistering ? (
              <Disc className="h-4 w-4 animate-spin" />
            ) : (
              <>CREATE ACCOUNT ↗</>
            )}
          </button>

          <div className="text-center pt-2">
            <span className="text-xs text-[#606257]">Already have an account? </span>
            <Link
              href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
              className="text-xs font-black text-[#161713] underline decoration-[#ff5a24] decoration-2 uppercase tracking-wide hover:text-[#ff5a24]"
            >
              Sign In ↗
            </Link>
          </div>

        </form>

      </div>

    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#161713] flex flex-col items-center justify-center p-6 text-[#f4f1e9] font-['DM_Sans',sans-serif]">
        <Disc className="h-10 w-10 text-[#ff5a24] animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
