'use client';

import React, { useState } from 'react';
import { Dialog } from '../ui/dialog';
import { TicketTier, EventDetail } from '../../types';
import { usePurchaseTicket } from '../../hooks/useTickets';
import { formatNaira } from '../../lib/utils';
import { openPaystackCheckout } from '../../lib/paystack';
import { api } from '../../lib/api';
import { useToast } from '../ui/toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { Minus, Plus, CreditCard, Disc, ShieldCheck } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventDetail;
}

export default function CheckoutModal({ isOpen, onClose, event }: CheckoutModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const purchaseMutation = usePurchaseTicket();
  const [isPaystackLoading, setIsPaystackLoading] = useState(false);

  const availableTiers = event.ticket_tiers || event.tiers || [];
  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    availableTiers.length > 0 ? availableTiers[0].id : null
  );
  const [quantity, setQuantity] = useState(1);

  const [attendees, setAttendees] = useState<{ name: string, email: string, phone: string }[]>([
    { name: user?.full_name || '', email: user?.email || '', phone: user?.phone || '' }
  ]);

  const handleQuantityChange = (newQty: number) => {
    setQuantity(newQty);
    setAttendees(prev => {
      const newAttendees = [...prev];
      if (newQty > prev.length) {
        for (let i = prev.length; i < newQty; i++) {
          newAttendees.push({ name: '', email: '', phone: '' });
        }
      } else if (newQty < prev.length) {
        newAttendees.splice(newQty);
      }
      return newAttendees;
    });
  };

  const updateAttendee = (index: number, field: 'name' | 'email' | 'phone', value: string) => {
    const newAttendees = [...attendees];
    newAttendees[index][field] = value;
    setAttendees(newAttendees);
  };

  const activeTier = availableTiers.find((t) => t.id === selectedTierId);
  const baseAmountKobo = activeTier ? activeTier.price * quantity : 0;
  const platformFeeKobo = baseAmountKobo > 0 ? 10000 : 0; // 100 Naira flat service fee
  const totalAmountKobo = baseAmountKobo + platformFeeKobo;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTierId || !activeTier) {
      toast({ title: 'Select ticket tier', description: 'Please choose a ticket tier to proceed', variant: 'destructive' });
      return;
    }

    const incompleteAttendee = attendees.find(a => !a.name || !a.email || !a.phone);
    if (incompleteAttendee) {
      toast({ title: 'Missing details', description: 'Please complete all attendee registration details', variant: 'destructive' });
      return;
    }

    const invalidPhone = attendees.find(a => !/^\+234[789][01]\d{8}$/.test(a.phone));
    if (invalidPhone) {
      toast({
        title: 'Invalid phone format',
        description: 'Phone numbers must be a valid Nigerian number (+234...)',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsPaystackLoading(true);
      const orderSession = await purchaseMutation.mutateAsync({
        tierId: selectedTierId,
        quantity,
        attendees
      });

      const targetDestination = user
        ? '/tickets'
        : `/dashboard/orders/verify?reference=${encodeURIComponent(orderSession.reference)}`;

      if (orderSession.amount === 0 || !orderSession.accessCode) {
        toast({
          title: 'Passes Claimed!',
          description: 'Your free gate passes have been sent to your email.',
          variant: 'success'
        });
        setIsPaystackLoading(false);
        onClose();
        window.location.href = targetDestination;
        return;
      }

      toast({
        title: 'Connecting to Paystack',
        description: 'Launching secure checkout portal...',
        variant: 'success'
      });

      openPaystackCheckout({
        email: attendees[0].email,
        amount: orderSession.amount,
        reference: orderSession.reference,
        accessCode: orderSession.accessCode,
        onSuccess: async (transaction) => {
          try {
            toast({
              title: 'Verifying payment...',
              description: 'Confirming order with Paystack gateway...',
              variant: 'info'
            });
            await api.get(`/api/payments/verify/${orderSession.reference}`);
            toast({
              title: 'Payment successful!',
              description: `Order confirmed. Gate pass ready!`,
              variant: 'success'
            });
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
          toast({
            title: 'Payment cancelled',
            description: 'The checkout transaction was cancelled.',
            variant: 'destructive'
          });
        }
      });

    } catch (err: any) {
      setIsPaystackLoading(false);
      console.error('Checkout initialization failed:', err);
      toast({
        title: 'Checkout failed',
        description: err.response?.data?.message || err.message || 'Failed to start transaction',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      className="!bg-[#f4f1e9] !border-2 !border-[#161713] !text-[#161713] !p-6 shadow-[8px_8px_0px_#161713] rounded-3xl"
    >
      <form onSubmit={handleCheckout} className="flex flex-col gap-5 font-['DM_Sans',sans-serif] text-[#161713] bg-[#f4f1e9]">

        {/* Modal Header */}
        <div className="border-b-2 border-[#161713] pb-3">
          <div className="text-[9px] font-black uppercase tracking-wider text-[#ff5a24]">
            VYBETIX ✳ TICKET CHECKOUT
          </div>
          <h2 className="font-['Barlow_Condensed',Impact,sans-serif] font-black uppercase text-2xl sm:text-3xl tracking-tight text-[#161713] leading-none mt-1 truncate">
            {event.title}
          </h2>
        </div>

        {/* 1. Ticket Tier Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#737568]">
            Choose Admission Tier
          </label>
          <div className="flex flex-col gap-2">
            {availableTiers.map((tier) => {
              const isSelected = tier.id === selectedTierId;
              const soldCount = tier.sold || 0;
              const isSoldOut = soldCount >= tier.quantity;

              return (
                <button
                  key={tier.id}
                  type="button"
                  disabled={isSoldOut}
                  onClick={() => {
                    setSelectedTierId(tier.id);
                    handleQuantityChange(1);
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed ${isSelected
                      ? 'border-[#161713] bg-[#ffffff] shadow-[3px_3px_0px_#ff5a24]'
                      : 'border-[#d5d2c6] bg-[#e9e6dd] hover:border-[#161713]'
                    }`}
                >
                  <div>
                    <span className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-lg uppercase tracking-tight text-[#161713] block">
                      {tier.name}
                    </span>
                    <span className="text-[10px] text-[#606257] font-medium">
                      {tier.description || 'Standard Gate Access'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-xl text-[#161713]">
                      {tier.price === 0 ? 'FREE' : formatNaira(tier.price)}
                    </span>
                    {isSoldOut && (
                      <span className="block text-[8px] font-black uppercase text-red-600">SOLD OUT</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Quantity selector */}
        {activeTier && (
          <div className="flex items-center justify-between bg-[#e9e6dd] border border-[#d5d2c6] rounded-xl p-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#161713]">
              Pass Quantity
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-[#ffffff] border-2 border-[#161713] text-[#161713] font-black flex items-center justify-center hover:bg-[#ff5a24] transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-2xl w-6 text-center text-[#161713]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => handleQuantityChange(Math.min(5, activeTier.quantity - (activeTier.sold || 0), quantity + 1))}
                className="w-8 h-8 rounded-lg bg-[#ffffff] border-2 border-[#161713] text-[#161713] font-black flex items-center justify-center hover:bg-[#ff5a24] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 3. Attendees form */}
        <div className="flex flex-col gap-3 max-h-[35vh] overflow-y-auto pr-1">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#c4db59]/25 border border-[#c4db59] text-[11px] font-semibold text-[#161713]">
            <ShieldCheck className="h-4 w-4 text-[#161713] shrink-0" />
            <span>Permanent passes with gate QR codes sent straight to your email.</span>
          </div>

          {attendees.map((attendee, index) => (
            <div key={index} className="p-3.5 rounded-xl border border-[#d5d2c6] bg-[#ffffff] space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#ff5a24] block">
                Attendee {index + 1} {index === 0 && '(Primary Buyer)'}
              </span>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-[#737568] block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  required
                  value={attendee.name}
                  onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                  className="w-full bg-[#f4f1e9] border border-[#393a32] rounded-lg px-3 py-2 text-xs text-[#161713] font-medium focus:outline-none focus:border-[#ff5a24]"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-[#737568] block mb-1">
                  Email Address (Pass Delivery)
                </label>
                <input
                  type="email"
                  placeholder="alex@example.com"
                  required
                  value={attendee.email}
                  onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                  className="w-full bg-[#f4f1e9] border border-[#393a32] rounded-lg px-3 py-2 text-xs text-[#161713] font-medium focus:outline-none focus:border-[#ff5a24]"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-[#737568] block mb-1">
                  Nigerian Phone (+234...)
                </label>
                <div className="flex items-center bg-[#f4f1e9] border border-[#393a32] rounded-lg px-3 py-2">
                  <span className="text-xs font-bold text-[#737568] mr-1.5">+234</span>
                  <input
                    type="tel"
                    placeholder="801 234 5678"
                    required
                    value={attendee.phone.replace(/^\+234/, '').replace(/^0/, '')}
                    onChange={(e) => {
                      const numeric = e.target.value.replace(/\D/g, '');
                      updateAttendee(index, 'phone', numeric ? `+234${numeric}` : '');
                    }}
                    className="w-full bg-transparent border-0 text-xs text-[#161713] font-medium focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 4. Total & Submit */}
        <div className="pt-3 border-t-2 border-[#161713] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#737568]">Total Due</span>
            <span className="font-['Barlow_Condensed',Impact,sans-serif] font-black text-3xl text-[#161713]">
              {formatNaira(totalAmountKobo)}
            </span>
          </div>

          <button
            type="submit"
            disabled={purchaseMutation.isPending || isPaystackLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#ff5a24] hover:bg-[#e04a1a] text-[#161713] text-xs font-black uppercase tracking-wider transition-all border-2 border-[#161713] shadow-[3px_3px_0px_#161713]"
          >
            {(purchaseMutation.isPending || isPaystackLoading) ? (
              <>
                <Disc className="h-4 w-4 animate-spin" />
                Connecting to Checkout...
              </>
            ) : totalAmountKobo === 0 ? (
              <>CLAIM FREE PASSES ↗</>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                PAY WITH PAYSTACK ↗
              </>
            )}
          </button>
        </div>

      </form>
    </Dialog>
  );
}
