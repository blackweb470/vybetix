'use client';

import React, { useState, useEffect } from 'react';
import { TicketTier, EventDetail } from '../../types';
import { usePurchaseTicket } from '../../hooks/useTickets';
import { formatNaira, formatDate } from '../../lib/utils';
import { openPaystackCheckout } from '../../lib/paystack';
import { api } from '../../lib/api';
import { useToast } from '../ui/toast';
import { useAuth } from '../../hooks/useAuth';
import { X, Minus, Plus, ShieldCheck, Zap, ChevronRight } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventDetail;
}

export default function CheckoutModal({ isOpen, onClose, event }: CheckoutModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const purchaseMutation = usePurchaseTicket();
  const [isPaystackLoading, setIsPaystackLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const availableTiers = event.ticket_tiers || event.tiers || [];
  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    availableTiers.length > 0 ? availableTiers[0].id : null
  );
  const [quantity, setQuantity] = useState(1);
  const [attendees, setAttendees] = useState<{ name: string; email: string; phone: string }[]>([
    { name: user?.full_name || '', email: user?.email || '', phone: user?.phone || '' },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleQuantityChange = (newQty: number) => {
    setQuantity(newQty);
    setAttendees((prev) => {
      const updated = [...prev];
      if (newQty > prev.length) {
        for (let i = prev.length; i < newQty; i++) {
          updated.push({ name: '', email: '', phone: '' });
        }
      } else {
        updated.splice(newQty);
      }
      return updated;
    });
  };

  const updateAttendee = (index: number, field: 'name' | 'email' | 'phone', value: string) => {
    const updated = [...attendees];
    updated[index][field] = value;
    setAttendees(updated);
  };

  const activeTier = availableTiers.find((t) => t.id === selectedTierId);
  const baseAmountKobo = activeTier ? activeTier.price * quantity : 0;
  const platformFeeKobo = baseAmountKobo > 0 ? 10000 : 0;
  const totalAmountKobo = baseAmountKobo + platformFeeKobo;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTierId || !activeTier) {
      toast({ title: 'Select ticket tier', description: 'Please choose a ticket tier to proceed', variant: 'destructive' });
      return;
    }

    const incompleteAttendee = attendees.find((a) => !a.name || !a.email || !a.phone);
    if (incompleteAttendee) {
      toast({ title: 'Missing details', description: 'Please complete all attendee registration details', variant: 'destructive' });
      return;
    }

    // Normalize phone before validation
    const normalizedAttendees = attendees.map((a) => {
      let phone = a.phone.replace(/[\s\-]/g, '');
      if (phone.startsWith('0')) phone = '+234' + phone.slice(1);
      else if (phone.startsWith('234') && !phone.startsWith('+')) phone = '+' + phone;
      else if (!phone.startsWith('+')) phone = '+234' + phone;
      return { ...a, phone };
    });

    const invalidPhone = normalizedAttendees.find((a) => !/^\+234[789][01]\d{8}$/.test(a.phone));
    if (invalidPhone) {
      toast({ title: 'Invalid phone format', description: 'Enter a valid Nigerian number (e.g. 08012345678)', variant: 'destructive' });
      return;
    }

    try {
      setIsPaystackLoading(true);
      const orderSession = await purchaseMutation.mutateAsync({
        tierId: selectedTierId,
        quantity,
        attendees: normalizedAttendees,
      });

      const targetDestination = user
        ? '/tickets'
        : `/dashboard/orders/verify?reference=${encodeURIComponent(orderSession.reference)}`;

      if (orderSession.amount === 0 || !orderSession.accessCode) {
        toast({ title: 'Passes Claimed!', description: 'Your free gate passes have been sent to your email.', variant: 'success' });
        setIsPaystackLoading(false);
        onClose();
        window.location.href = targetDestination;
        return;
      }

      toast({ title: 'Connecting to Paystack', description: 'Launching secure checkout portal...', variant: 'success' });

      openPaystackCheckout({
        email: normalizedAttendees[0].email,
        amount: orderSession.amount,
        reference: orderSession.reference,
        accessCode: orderSession.accessCode,
        onSuccess: async (transaction) => {
          try {
            toast({ title: 'Verifying payment...', description: 'Confirming order with Paystack gateway...', variant: 'info' });
            await api.get(`/api/payments/verify/${orderSession.reference}`);
            toast({ title: 'Payment successful!', description: 'Order confirmed. Gate pass ready!', variant: 'success' });
          } catch (error: any) {
            console.error('Payment verification failed:', error);
          } finally {
            setIsPaystackLoading(false);
            onClose();
            window.location.href = targetDestination;
          }
        },
        onCancel: () => {
          setIsPaystackLoading(false);
          toast({ title: 'Payment cancelled', description: 'The checkout transaction was cancelled.', variant: 'destructive' });
        },
      });
    } catch (err: any) {
      setIsPaystackLoading(false);
      toast({ title: 'Checkout failed', description: err.response?.data?.message || err.message || 'Failed to start transaction', variant: 'destructive' });
    }
  };

  if (!isOpen) return null;

  const coverImage = event.cover_image_url || (event as any).image_url;
  const isLoading = purchaseMutation.isPending || isPaystackLoading;

  return (
    <div className="fixed inset-0 z-50 flex font-['DM_Sans',sans-serif]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel — slides in from right */}
      <div
        className="relative ml-auto w-full max-w-md h-full bg-[#10100f] border-l-2 border-[#ff5a24] flex flex-col overflow-hidden shadow-2xl"
        style={{ animation: 'slideInRight 0.28s cubic-bezier(0.22,1,0.36,1)' }}
      >
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2a2b25]">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-[#ff5a24]">
              VYBETIX ✳ CHECKOUT
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="w-8 h-8 rounded-full border border-[#2a2b25] flex items-center justify-center text-[#a7a89e] hover:text-white hover:border-[#ff5a24] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Event identity strip */}
          <div
            className="relative h-32 bg-[#1a1b15] overflow-hidden"
            style={coverImage ? { backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#10100f] via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
              <h2 className="font-black text-white text-xl uppercase tracking-tight leading-tight line-clamp-1" style={{ fontFamily: "'Barlow Condensed', Impact, sans-serif" }}>
                {event.title}
              </h2>
              <p className="text-[10px] text-[#a7a89e] font-bold uppercase tracking-wider mt-0.5">
                {event.city && `${event.city.toUpperCase()} · `}{formatDate(event.event_date)}
              </p>
            </div>
          </div>

          <form id="checkout-form" onSubmit={handleCheckout} className="px-6 pt-6 pb-32 flex flex-col gap-6">

            {/* ── Tier selection ── */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#737568]">
                Choose Tier
              </span>
              <div className="flex flex-col gap-2">
                {availableTiers.map((tier) => {
                  const isSelected = tier.id === selectedTierId;
                  const soldCount = tier.sold || 0;
                  const isSoldOut = soldCount >= tier.quantity;
                  const remaining = tier.quantity - soldCount;

                  return (
                    <button
                      key={tier.id}
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => { setSelectedTierId(tier.id); handleQuantityChange(1); }}
                      className={`group flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isSelected
                          ? 'border-[#ff5a24] bg-[#ff5a24]/8'
                          : 'border-[#2a2b25] bg-[#1a1b15] hover:border-[#393a32]'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Radio dot */}
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'border-[#ff5a24]' : 'border-[#393a32]'
                          }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-[#ff5a24]" />}
                        </div>
                        <div>
                          <span className="font-black text-white text-sm uppercase tracking-tight block" style={{ fontFamily: "'Barlow Condensed', Impact, sans-serif" }}>
                            {tier.name}
                          </span>
                          <span className="text-[10px] text-[#737568] font-medium">
                            {isSoldOut ? 'Sold out' : `${remaining} left${tier.description ? ' · ' + tier.description : ''}`}
                          </span>
                        </div>
                      </div>
                      <span className="font-black text-lg text-white" style={{ fontFamily: "'Barlow Condensed', Impact, sans-serif" }}>
                        {tier.price === 0 ? 'FREE' : formatNaira(tier.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Quantity ── */}
            {activeTier && (
              <div className="flex items-center justify-between bg-[#1a1b15] border border-[#2a2b25] rounded-2xl px-4 py-3">
                <span className="text-xs font-black uppercase tracking-widest text-[#f1ede4]">Passes</span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-xl bg-[#2a2b25] hover:bg-[#ff5a24] text-white font-black flex items-center justify-center transition-all"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-black text-2xl text-white w-6 text-center" style={{ fontFamily: "'Barlow Condensed', Impact, sans-serif" }}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(Math.min(5, activeTier.quantity - (activeTier.sold || 0), quantity + 1))}
                    className="w-9 h-9 rounded-xl bg-[#2a2b25] hover:bg-[#ff5a24] text-white font-black flex items-center justify-center transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Attendee forms ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#ff5a24] shrink-0" />
                <span className="text-[10px] font-bold text-[#a7a89e] uppercase tracking-wider">
                  Gate QR codes delivered to each email below
                </span>
              </div>

              {attendees.map((attendee, index) => (
                <div key={index} className="bg-[#1a1b15] border border-[#2a2b25] rounded-2xl p-4 flex flex-col gap-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#ff5a24]">
                    Attendee {index + 1}{index === 0 && quantity > 1 ? ' (Primary)' : ''}
                  </span>

                  {/* Name */}
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-[#737568] block mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Morgan"
                      required
                      value={attendee.name}
                      onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                      className="w-full bg-[#10100f] border border-[#393a32] rounded-xl px-3 py-2.5 text-sm text-[#f1ede4] font-medium placeholder-[#4a4b43] focus:outline-none focus:border-[#ff5a24] transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-[#737568] block mb-1.5">
                      Email (Pass Delivery)
                    </label>
                    <input
                      type="email"
                      placeholder="alex@example.com"
                      required
                      value={attendee.email}
                      onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                      className="w-full bg-[#10100f] border border-[#393a32] rounded-xl px-3 py-2.5 text-sm text-[#f1ede4] font-medium placeholder-[#4a4b43] focus:outline-none focus:border-[#ff5a24] transition-colors"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-[#737568] block mb-1.5">
                      Phone Number
                    </label>
                    <div className="flex items-center bg-[#10100f] border border-[#393a32] rounded-xl px-3 py-2.5 focus-within:border-[#ff5a24] transition-colors">
                      <span className="text-xs font-bold text-[#737568] mr-2 shrink-0">+234</span>
                      <input
                        type="tel"
                        placeholder="801 234 5678"
                        required
                        value={attendee.phone.replace(/^\+234/, '').replace(/^0/, '')}
                        onChange={(e) => {
                          const numeric = e.target.value.replace(/\D/g, '');
                          updateAttendee(index, 'phone', numeric ? `+234${numeric}` : '');
                        }}
                        className="w-full bg-transparent text-sm text-[#f1ede4] font-medium placeholder-[#4a4b43] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </form>
        </div>

        {/* ── Sticky footer ── */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#10100f] border-t-2 border-[#ff5a24] px-6 py-5">
          {/* Price breakdown */}
          {activeTier && baseAmountKobo > 0 && (
            <div className="flex items-center justify-between mb-3 text-[11px] font-bold text-[#737568]">
              <span>{quantity}x {activeTier.name}</span>
              <span>{formatNaira(baseAmountKobo)}</span>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-[#a7a89e]">Total Due</span>
            <span className="font-black text-3xl text-white leading-none" style={{ fontFamily: "'Barlow Condensed', Impact, sans-serif" }}>
              {totalAmountKobo === 0 ? 'FREE' : formatNaira(totalAmountKobo)}
            </span>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#ff5a24] hover:brightness-110 text-[#10100f] text-sm font-black uppercase tracking-wider transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#10100f]/30 border-t-[#10100f] rounded-full animate-spin" />
                Connecting...
              </>
            ) : totalAmountKobo === 0 ? (
              <>
                <Zap className="h-4 w-4" />
                CLAIM FREE PASSES ↗
              </>
            ) : (
              <>
                PAY WITH PAYSTACK
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Slide-in keyframe */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
