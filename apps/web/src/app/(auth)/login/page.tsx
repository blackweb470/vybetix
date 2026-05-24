'use client';

export const dynamic = 'force-dynamic';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/ui/toast';
import Link from 'next/link';
import { Disc, LogIn, ShieldCheck, Zap, Lock, ArrowRight } from 'lucide-react';
import Image from 'next/image';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoggingIn } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
          targetUrl = '/events';
        }
      }
      
      router.push(targetUrl);
      router.refresh();
    } catch (err: any) {
      toast({ title: 'Login failed', description: err.response?.data?.message || err.message || 'No account found for this email', variant: 'destructive' });
    }
  };

  return (
    <div className="flex-1 flex min-h-screen bg-[#08080C] font-outfit">

      {/* LEFT — Brand immersion panel */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ backgroundImage: "linear-gradient(135deg, rgba(8,8,12,0.88) 0%, rgba(8,8,12,0.60) 60%, rgba(232,68,26,0.12) 100%), url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Subtle radial glow */}
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#E8441A]/8 blur-[120px] pointer-events-none" />
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-purple-900/10 blur-[100px] pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-4 relative z-10 group w-fit">
          <Image src="/logo.png" alt="Vybetix" width={128} height={128} />
          <span className="text-5xl font-black tracking-tighter font-syne text-white group-hover:text-[#E8441A] transition-colors">Vybetix</span>
        </Link>

        {/* Centre copy */}
        <div className="relative z-10 flex flex-col gap-6">
          <div>
            <h2 className="text-4xl xl:text-5xl font-black text-white font-syne uppercase tracking-tight leading-[1.05] mb-4">
              Your Next<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8441A] to-amber-400">
                Live Experience
              </span><br />
              Awaits.
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
              Thousands of concerts, beach festivals, and campus showdowns secured by cryptographic entry codes. Sign in to claim your spot.
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-col gap-3">
            {[
              { icon: ShieldCheck, color: 'text-[#E8441A]', bg: 'bg-[#E8441A]/10 border-[#E8441A]/20', label: 'HMAC-SHA256 Cryptographic Entry' },
              { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Instant Paystack Ticket Delivery' },
              { icon: Lock, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', label: 'Verified Organizer Network Only' },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${b.bg}`}>
                  <b.icon className={`h-3.5 w-3.5 ${b.color}`} />
                </div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stat row */}
        <div className="relative z-10 flex items-center gap-8">
          {[['50K+', 'Tickets Issued'], ['200+', 'Live Events'], ['99.9%', 'Gate Uptime']].map(([val, lbl]) => (
            <div key={lbl} className="flex flex-col">
              <span className="text-xl font-black text-white font-syne">{val}</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — Sign-in form panel */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-16 relative">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#E8441A]/5 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">

          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-4 mb-10 lg:hidden group w-fit">
            <Image src="/logo.png" alt="Vybetix" width={96} height={96} />
            <span className="text-3xl font-black tracking-tighter font-syne text-white">Vybetix</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-white font-syne uppercase tracking-tight mb-2">Sign In</h1>
            <p className="text-sm text-zinc-500">Welcome back. Enter your registered email to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                id="vybetix-login-email"
                name="email"
                autoComplete="username"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#E8441A] focus:outline-none focus:ring-2 focus:ring-[#E8441A]/20 transition-all backdrop-blur-sm"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Password</label>
              <input
                type="password"
                id="vybetix-login-password"
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#E8441A] focus:outline-none focus:ring-2 focus:ring-[#E8441A]/20 transition-all backdrop-blur-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="h-12 w-full rounded-xl bg-[#E8441A] hover:brightness-110 active:scale-[0.98] transition-all text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#E8441A]/20 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {isLoggingIn ? (
                <Disc className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Continue
                </>
              )}
            </button>

            <div className="relative flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-zinc-900" />
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">New Here?</span>
              <div className="flex-1 h-px bg-zinc-900" />
            </div>

            <Link
              href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}
              className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all text-sm font-bold text-zinc-300 flex items-center justify-center gap-2 group"
            >
              Create an Account
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>

          </form>

          <p className="mt-8 text-center text-[10px] text-zinc-600 leading-relaxed">
            By continuing you agree to Vybetix's Terms of Service and acknowledge our Privacy Policy. All entry codes are cryptographically sealed.
          </p>
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center bg-[#08080C] py-36">
        <Disc className="h-10 w-10 text-[#E8441A] animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

