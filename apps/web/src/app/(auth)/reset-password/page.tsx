'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/ui/toast';
import Link from 'next/link';
import { Disc, Lock, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

function ResetPasswordContent() {
  const router = useRouter();
  const { resetPassword, isResettingPassword } = useAuth();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Supabase passes the access token in the URL fragment
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        setToken(accessToken);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({ title: 'Invalid Link', description: 'Recovery token is missing. Please request a new link.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords mismatch', description: 'Ensure both passwords are exactly the same', variant: 'destructive' });
      return;
    }
    try {
      await resetPassword({ password, token });
      setIsSuccess(true);
      toast({ title: 'Password updated', description: 'Your password has been successfully changed.', variant: 'success' });
      // Remove the hash from URL for security
      window.history.replaceState(null, '', window.location.pathname);
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.response?.data?.message || err.message || 'Could not update password. The link might have expired.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex-1 flex min-h-screen bg-[#08080C] font-outfit">
      
      {/* LEFT — Brand immersion panel */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ backgroundImage: "linear-gradient(135deg, rgba(8,8,12,0.88) 0%, rgba(8,8,12,0.60) 60%, rgba(232,68,26,0.12) 100%), url('https://images.unsplash.com/photo-1574629810360-7efbb1925846?q=80&w=1200')", backgroundSize: 'cover', backgroundPosition: 'center' }}
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
                Restoration.
              </span>
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
              Your connection is verified. Create a new secure cryptographic key to restore access to your account.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Token Verified' },
              { icon: Lock, color: 'text-[#E8441A]', bg: 'bg-[#E8441A]/10 border-[#E8441A]/20', label: 'End-to-End Encryption' },
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

      {/* RIGHT — Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-16 relative">
        <div className="w-full max-w-md relative z-10">

          <Link href="/" className="flex items-center gap-4 mb-10 lg:hidden group w-fit">
            <Image src="/logo.png" alt="Vybetix" width={96} height={96} />
            <span className="text-3xl font-black tracking-tighter font-syne text-white">Vybetix</span>
          </Link>

          {!isSuccess ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-black text-white font-syne uppercase tracking-tight mb-2">Create New Password</h1>
                <p className="text-sm text-zinc-500">
                  {token ? 'Connection secure. Please enter your new password below.' : 'Looking for secure recovery token...'}
                </p>
              </div>

              {!token ? (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-center">
                  <p className="text-sm text-red-400">Invalid or missing recovery link. Please request a new password reset email.</p>
                  <Link href="/forgot-password" className="mt-4 inline-block text-xs font-bold text-white uppercase tracking-widest bg-zinc-900 px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors">
                    Request New Link
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#E8441A] focus:outline-none focus:ring-2 focus:ring-[#E8441A]/20 transition-all backdrop-blur-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Confirm Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#E8441A] focus:outline-none focus:ring-2 focus:ring-[#E8441A]/20 transition-all backdrop-blur-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isResettingPassword}
                    className="h-12 w-full rounded-xl bg-[#E8441A] hover:brightness-110 active:scale-[0.98] transition-all text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#E8441A]/20 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                  >
                    {isResettingPassword ? (
                      <Disc className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-syne uppercase tracking-tight">System Secured</h1>
              <p className="text-sm text-zinc-400 max-w-sm">
                Your password has been successfully updated. Your account is secure and ready to use.
              </p>
              
              <Link
                href="/login"
                className="mt-4 h-12 w-full max-w-xs rounded-xl bg-zinc-100 text-zinc-900 hover:bg-white transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                Sign In Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center bg-[#08080C] py-36">
        <Disc className="h-10 w-10 text-[#E8441A] animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
