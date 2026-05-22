'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { Disc, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function OrderVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your transaction with Paystack...');
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setMessage('No transaction reference found in redirect URL.');
      return;
    }

    // Prevent double invocation in React StrictMode
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    async function verifyPayment() {
      try {
        await api.get(`/api/payments/verify/${reference}`);
        setStatus('success');
        setMessage('Your ticket purchase has been verified successfully!');
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          router.push('/tickets');
        }, 3000);
      } catch (err: any) {
        console.error('Verification error:', err);
        setStatus('error');
        setMessage(err.response?.data?.message || 'Failed to verify transaction status. Please contact support if your account was debited.');
      }
    }

    verifyPayment();
  }, [reference, router]);

  return (
    <div className="w-full min-h-screen bg-[#08080C] font-outfit text-zinc-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md p-8 rounded-3xl border border-zinc-900 bg-zinc-950/80 backdrop-blur-2xl text-center flex flex-col items-center gap-6 shadow-2xl shadow-black/50">
        
        {/* Status Graphic */}
        {status === 'verifying' && (
          <div className="relative flex items-center justify-center w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-[#E8441A]/10 animate-pulse" />
            <Disc className="h-12 w-12 text-[#E8441A] animate-spin" />
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-pulse">
            <AlertTriangle className="h-10 w-10" />
          </div>
        )}

        {/* Title */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-black text-white font-syne uppercase tracking-wider">
            {status === 'verifying' && 'Verifying Payment'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'error' && 'Verification Failed'}
          </h2>
          <p className="text-xs text-zinc-500 font-mono tracking-tight break-all">
            Ref: {reference || 'N/A'}
          </p>
        </div>

        {/* Message */}
        <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
          {message}
        </p>

        {/* Action Button */}
        {status !== 'verifying' && (
          <div className="w-full pt-4 border-t border-zinc-900/80">
            <Link
              href="/tickets"
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                status === 'success'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/10'
                  : 'bg-[#E8441A] hover:brightness-110 text-white shadow-lg shadow-[#E8441A]/15'
              }`}
            >
              Go to My Tickets
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {status === 'verifying' && (
          <p className="text-xxs text-zinc-600 animate-pulse uppercase tracking-widest font-bold">
            Communicating with Paystack securely...
          </p>
        )}

      </div>
    </div>
  );
}

export default function OrderVerifyPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-[#08080C] font-outfit text-zinc-100 flex flex-col items-center justify-center p-6">
        <Disc className="h-12 w-12 text-[#E8441A] animate-spin" />
      </div>
    }>
      <OrderVerifyContent />
    </Suspense>
  );
}
