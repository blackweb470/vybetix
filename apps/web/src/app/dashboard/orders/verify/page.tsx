'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { Disc, CheckCircle2, AlertTriangle, ArrowRight, Mail, Ticket, QrCode, Compass, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../../../store/authStore';
import Link from 'next/link';

function OrderVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference');
  const { token } = useAuthStore();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your transaction with Paystack...');
  const [tickets, setTickets] = useState<any[]>([]);
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setMessage('No transaction reference found in redirect URL.');
      return;
    }

    if (verificationStarted.current) return;
    verificationStarted.current = true;

    async function verifyPayment() {
      try {
        const res = await api.get(`/api/payments/verify/${reference}`);
        const data = res.data?.data;
        const generatedTickets = data?.tickets || [];
        setTickets(generatedTickets);

        setStatus('success');
        setMessage(
          token
            ? 'Your admission pass has been confirmed and added to your Ticket Vault!'
            : 'Payment confirmed! Your permanent admission passes with QR codes are ready.'
        );

        if (token) {
          setTimeout(() => {
            window.location.href = '/tickets';
          }, 3500);
        }
      } catch (err: any) {
        console.error('Verification error:', err);
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
          'Failed to verify transaction status. Please check your email or contact support.'
        );
      }
    }

    verifyPayment();
  }, [reference, router, token]);

  return (
    <div className="w-full min-h-screen bg-[#161713] font-['DM_Sans',sans-serif] text-[#161713] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-[#ff5a24] selection:text-[#161713]">
      
      {/* COLLECTIBLE ORDER CONFIRMATION CARD */}
      <div className="w-full max-w-md bg-[#f4f1e9] rounded-3xl border-2 border-[#161713] shadow-[8px_8px_0px_#161713] p-6 sm:p-8 text-center flex flex-col items-center gap-5">
        
        {/* Top Kicker */}
        <div className="text-[10px] font-black uppercase tracking-wider text-[#ff5a24]">
          VYBETIX ✳ TRANSACTION RECEIPT
        </div>

        {/* Status Graphic */}
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-3 my-2">
            <Disc className="h-12 w-12 text-[#ff5a24] animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#737568]">
              Confirming with Paystack...
            </span>
          </div>
        )}

        {status === 'success' && (
          <div className="w-16 h-16 rounded-2xl bg-[#c4db59] text-[#161713] border-2 border-[#161713] shadow-[3px_3px_0px_#161713] flex items-center justify-center my-1">
            <Sparkles className="h-8 w-8 text-[#161713]" />
          </div>
        )}

        {status === 'error' && (
          <div className="w-16 h-16 rounded-2xl bg-[#ff5a24] text-[#f4f1e9] border-2 border-[#161713] shadow-[3px_3px_0px_#161713] flex items-center justify-center my-1">
            <AlertTriangle className="h-8 w-8 text-[#161713]" />
          </div>
        )}

        {/* Heading */}
        <div>
          <h2 className="font-['Barlow_Condensed',Impact,sans-serif] font-black uppercase text-3xl sm:text-4xl tracking-tight text-[#161713] leading-none">
            {status === 'verifying' && 'VERIFYING ORDER'}
            {status === 'success' && 'YOU ARE IN! BE THERE.'}
            {status === 'error' && 'TRANSACTION ISSUE'}
          </h2>
          <p className="text-[10px] font-mono font-bold text-[#737568] uppercase mt-2">
            REF: #{reference || 'N/A'}
          </p>
        </div>

        {/* Message */}
        <p className="text-xs text-[#606257] leading-relaxed max-w-xs font-medium">
          {message}
        </p>

        {/* Perforated Tear Notch with Barcode */}
        <div className="vyb-tear w-full my-1">
          <div className="vyb-barcode" />
          <span className="text-[7px] font-mono font-bold tracking-widest text-[#737568]">CONFIRMED</span>
        </div>

        {/* Actions */}
        {status === 'success' && (
          <div className="w-full flex flex-col gap-2.5 pt-2">
            {tickets.length > 0 && (
              <Link
                href={`/tickets/view?id=${tickets[0].id}&token=${encodeURIComponent(tickets[0].qr_token || '')}`}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#ff5a24] hover:bg-[#e04a1a] text-[#161713] text-xs font-black uppercase tracking-wider transition-all border-2 border-[#161713] shadow-[3px_3px_0px_#161713]"
              >
                <QrCode className="h-4 w-4" />
                VIEW ENTRY PASS NOW ↗
              </Link>
            )}

            {token ? (
              <Link
                href="/tickets"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#161713] hover:bg-[#25261f] text-[#f4f1e9] text-xs font-black uppercase tracking-wider transition-all border border-[#161713]"
              >
                Open Ticket Vault ↗
              </Link>
            ) : (
              <div className="flex flex-col gap-2 pt-1 text-center">
                <span className="text-[11px] text-[#606257] flex items-center justify-center gap-1.5 font-medium">
                  <Mail className="h-3.5 w-3.5 text-[#ff5a24]" />
                  A permanent copy of your pass was emailed to you.
                </span>
                <Link
                  href="/events"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-transparent hover:bg-[#e9e6dd] text-[#161713] text-xs font-black uppercase tracking-wider transition-all border border-[#161713] mt-1"
                >
                  <Compass className="h-3.5 w-3.5 text-[#ff5a24]" />
                  Explore More Vybes ↗
                </Link>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="w-full pt-2">
            <Link
              href="/events"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#161713] text-[#f4f1e9] text-xs font-black uppercase tracking-wider transition-all"
            >
              Return to Events ↗
            </Link>
          </div>
        )}

      </div>

    </div>
  );
}

export default function OrderVerifyPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-[#161713] text-[#f4f1e9] flex flex-col items-center justify-center p-6 font-['DM_Sans',sans-serif]">
        <Disc className="h-10 w-10 text-[#ff5a24] animate-spin mb-4" />
        <span className="text-xs font-black uppercase tracking-widest text-[#a7a89e]">Verifying Order...</span>
      </div>
    }>
      <OrderVerifyContent />
    </Suspense>
  );
}
