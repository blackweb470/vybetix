'use client';

export const dynamic = 'force-dynamic';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/ui/toast';
import Link from 'next/link';
import { Disc, LogIn, ArrowRight, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoggingIn } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const redirectUrl = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Credentials required', description: 'Please enter your email and password', variant: 'destructive' });
      return;
    }
    try {
      const session = await login({ email, password });
      toast({ title: 'Welcome Back!', description: `Signed in as ${session.user.full_name}`, variant: 'success' });

      let targetUrl = redirectUrl;
      if (targetUrl === '/') {
        if (session.user.role === 'organizer') {
          targetUrl = '/dashboard';
        } else if (session.user.role === 'admin') {
          targetUrl = '/admin';
        } else {
          targetUrl = '/tickets';
        }
      }

      window.location.href = targetUrl;
    } catch (err: any) {
      toast({ title: 'Login failed', description: err.response?.data?.message || err.message || 'No account found for this email', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-[#161713] text-[#161713] font-['DM_Sans',sans-serif] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-[#ff5a24] selection:text-[#161713]">

      {/* Brand Logo */}
      <Link href="/" className="mb-6 flex items-center">
        <span className="text-3xl font-black tracking-tight text-[#f4f1e9] uppercase">
          vybetix<i className="not-italic text-[#ff5a24] ml-0.5">✳</i>
        </span>
      </Link>

      {/* Collectible Paper Card */}
      <div className="w-full max-w-md bg-[#f4f1e9] rounded-3xl border-2 border-[#161713] shadow-[8px_8px_0px_#161713] p-6 sm:p-8">

        {/* Top Header */}
        <div className="border-b-2 border-[#161713] pb-4 mb-6">
          <div className="text-[10px] font-black uppercase tracking-wider text-[#ff5a24] flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> ACCESS YOUR PASSES
          </div>
          <h1 className="font-['Barlow_Condensed',Impact,sans-serif] font-black uppercase text-4xl text-[#161713] tracking-tight leading-none mt-1">
            SIGN IN TO VYBETIX.
          </h1>
          <p className="text-xs text-[#606257] mt-1.5 font-medium">
            Manage your permanent gate passes and tickets.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-[#737568] block mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="vybetix-login-email"
              name="email"
              autoComplete="username"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#ffffff] border-2 border-[#161713] rounded-xl px-4 py-3 text-sm text-[#161713] font-medium placeholder-[#a7a89e] focus:outline-none focus:border-[#ff5a24]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#737568]">
                Password
              </label>
              <Link href="/forgot-password" className="text-[10px] font-bold text-[#ff5a24] uppercase tracking-wider hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="vybetix-login-password"
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#ffffff] border-2 border-[#161713] rounded-xl px-4 py-3 pr-12 text-sm text-[#161713] font-medium placeholder-[#a7a89e] focus:outline-none focus:border-[#ff5a24]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-full px-3.5 flex items-center justify-center text-[#737568] hover:text-[#161713]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#ff5a24] hover:bg-[#e04a1a] text-[#161713] text-xs font-black uppercase tracking-wider transition-all border-2 border-[#161713] shadow-[3px_3px_0px_#161713] mt-2"
          >
            {isLoggingIn ? (
              <Disc className="h-4 w-4 animate-spin" />
            ) : (
              <>
                CONTINUE TO VAULT <span className="text-base leading-none">↗</span>
              </>
            )}
          </button>

          {/* Perforated tear with barcode */}
          <div className="vyb-tear my-1">
            <div className="vyb-barcode" />
            <span className="text-[7px] font-mono font-bold tracking-widest text-[#737568]">SECURE</span>
          </div>

          <div className="text-center pt-1">
            <span className="text-xs text-[#606257]">Don't have an account yet? </span>
            <Link
              href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}
              className="text-xs font-black text-[#161713] underline decoration-[#ff5a24] decoration-2 uppercase tracking-wide hover:text-[#ff5a24]"
            >
              Sign Up ↗
            </Link>
          </div>

        </form>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#161713] flex flex-col items-center justify-center p-6 text-[#f4f1e9] font-['DM_Sans',sans-serif]">
        <Disc className="h-10 w-10 text-[#ff5a24] animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
