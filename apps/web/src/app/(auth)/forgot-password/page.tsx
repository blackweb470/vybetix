'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/ui/toast';
import Link from 'next/link';
import { Disc, Mail, ArrowLeft, ShieldCheck, Lock, Zap } from 'lucide-react';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword, isForgottingPassword } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await forgotPassword(email);
      setIsSent(true);
      toast({ title: 'Email Sent', description: 'Check your inbox for the reset link', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Request failed', description: err.response?.data?.message || err.message || 'Could not send reset email', variant: 'destructive' });
    }
  };

  return (
    <div className="flex-1 flex min-h-screen bg-[#08080C] font-outfit">
      
      {/* LEFT — Brand immersion panel */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ backgroundImage: "linear-gradient(135deg, rgba(8,8,12,0.88) 0%, rgba(8,8,12,0.60) 60%, rgba(232,68,26,0.12) 100%), url('https://images.unsplash.com/photo-1516280440504-a169b122bb33?q=80&w=1200')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#E8441A]/8 blur-[120px] pointer-events-none" />
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-purple-900/10 blur-[100px] pointer-events-none" />

        <Link href="/" className="flex items-center gap-4 relative z-10 group w-fit">
          <Image src="/logo.png" alt="Vybetix" width={128} height={128} />
          <span className="text-5xl font-black tracking-tighter font-syne text-white group-hover:text-[#E8441A] transition-colors">Vybetix</span>
        </Link>

        <div className="relative z-10 flex flex-col gap-6">
          <div>
            <h2 className="text-4xl xl:text-5xl font-black text-white font-syne uppercase tracking-tight leading-[1.05] mb-4">
              Secure System<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8441A] to-amber-400">
                Recovery.
              </span>
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
              Regain access to your encrypted ticketing profile. Your data remains completely secure during the recovery process.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { icon: ShieldCheck, color: 'text-[#E8441A]', bg: 'bg-[#E8441A]/10 border-[#E8441A]/20', label: 'Identity Verification' },
              { icon: Lock, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', label: 'Encrypted Recovery Link' },
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
      </div>

      {/* RIGHT — Forgot password form */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-16 relative">
        <div className="w-full max-w-md relative z-10">

          <Link href="/" className="flex items-center gap-4 mb-10 lg:hidden group w-fit">
            <Image src="/logo.png" alt="Vybetix" width={96} height={96} />
            <span className="text-3xl font-black tracking-tighter font-syne text-white">Vybetix</span>
          </Link>

          {!isSent ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-black text-white font-syne uppercase tracking-tight mb-2">Reset Password</h1>
                <p className="text-sm text-zinc-500">Enter your email and we'll send you an encrypted link to reset your password.</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#E8441A] focus:outline-none focus:ring-2 focus:ring-[#E8441A]/20 transition-all backdrop-blur-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isForgottingPassword}
                  className="h-12 w-full rounded-xl bg-[#E8441A] hover:brightness-110 active:scale-[0.98] transition-all text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#E8441A]/20 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                >
                  {isForgottingPassword ? (
                    <Disc className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Mail className="h-8 w-8 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-black text-white font-syne uppercase tracking-tight">Check your inbox</h1>
              <p className="text-sm text-zinc-400 max-w-sm">
                We've sent a secure reset link to <span className="text-white font-bold">{email}</span>. Click the link to set a new password.
              </p>
            </div>
          )}

          <div className="mt-8">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
