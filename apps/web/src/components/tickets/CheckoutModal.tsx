'use client';

import React, { useState } from 'react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { TicketTier, EventDetail } from '../../types';
import { usePurchaseTicket } from '../../hooks/useTickets';
import { formatNaira } from '../../lib/utils';
import { openPaystackCheckout } from '../../lib/paystack';
import { api } from '../../lib/api';
import { useToast } from '../ui/toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { ShoppingBag, Minus, Plus, CreditCard, Mail, User, Phone } from 'lucide-react';

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

  // Tier select states
  const availableTiers = event.ticket_tiers || event.tiers || [];
  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    availableTiers.length > 0 ? availableTiers[0].id : null
  );
  const [quantity, setQuantity] = useState(1);

  // Attendee details state
  const [attendees, setAttendees] = useState<{name: string, email: string, phone: string}[]>([
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

  const updateAttendee = (index: number, field: 'name'|'email'|'phone', value: string) => {
    const newAttendees = [...attendees];
    newAttendees[index][field] = value;
    setAttendees(newAttendees);
  };

  const activeTier = availableTiers.find((t) => t.id === selectedTierId);
  const baseAmountKobo = activeTier ? activeTier.price * quantity : 0;
  const platformFeeKobo = baseAmountKobo > 0 ? 50000 : 0; // 500 Naira (50000 kobo) flat fee for paid transactions
  const totalAmountKobo = baseAmountKobo + platformFeeKobo;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTierId || !activeTier) {
      toast({ title: 'Select ticket tier', description: 'Please choose a ticket tier to proceed', variant: 'destructive' });
      return;
    }

    // Check if all attendees have completed details
    const incompleteAttendee = attendees.find(a => !a.name || !a.email || !a.phone);
    if (incompleteAttendee) {
      toast({ title: 'Missing details', description: 'Please complete all attendee registration details', variant: 'destructive' });
      return;
    }

    // Phone regex check
    const invalidPhone = attendees.find(a => !/^\+234[789][01]\d{8}$/.test(a.phone));
    if (invalidPhone) {
      toast({
        title: 'Invalid phone format',
        description: 'Phone numbers must be a valid Nigerian number in the format +23480...',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsPaystackLoading(true);
      // 1. Fire purchase request to backend API to initialize order
      const orderSession = await purchaseMutation.mutateAsync({
        tierId: selectedTierId,
        quantity,
        attendees
      });

      if (orderSession.amount === 0 || !orderSession.accessCode) {
        toast({
          title: 'Tickets Claimed!',
          description: 'Your free tickets have been successfully generated.',
          variant: 'success'
        });
        setIsPaystackLoading(false);
        onClose();
        window.location.href = '/tickets';
        return;
      }

      toast({
        title: 'Checkout initialized',
        description: 'Connecting to Paystack checkout portal...',
        variant: 'success'
      });

      // 2. Open Paystack Inline browser checkout dialog
      openPaystackCheckout({
        email: attendees[0].email, // Primary buyer email for Paystack receipt
        amount: orderSession.amount,
        reference: orderSession.reference,
        accessCode: orderSession.accessCode,
        onSuccess: async (transaction) => {
          try {
            toast({
              title: 'Verifying payment...',
              description: 'Please wait while we verify your transaction with Paystack.',
              variant: 'info'
            });
            await api.get(`/api/payments/verify/${orderSession.reference}`);
            toast({
              title: 'Payment successful!',
              description: `Order ${orderSession.reference} has been successfully completed.`,
              variant: 'success'
            });
          } catch (error: any) {
            console.error('Payment verification failed:', error);
            toast({
              title: 'Verification status',
              description: error.response?.data?.message || 'Payment is processing. Please check your tickets tab.',
              variant: 'info'
            });
          } finally {
            setIsPaystackLoading(false);
            onClose();
            window.location.href = '/tickets';
          }
        },
        onCancel: () => {
          setIsPaystackLoading(false);
          toast({
            title: 'Payment cancelled',
            description: 'The transaction checkout has been cancelled.',
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
    <Dialog isOpen={isOpen} onClose={onClose} title="Secure Checkout">
      <form onSubmit={handleCheckout} className="flex flex-col gap-6 font-outfit text-zinc-100">
        
        {/* Event quick details */}
        <div className="flex flex-col border-b border-zinc-800 pb-4 mb-2">
          <span className="text-xxs font-bold text-zinc-500 uppercase tracking-widest">
            Ordering tickets for
          </span>
          <h3 className="text-base font-bold text-white tracking-wide uppercase font-syne truncate">
            {event.title}
          </h3>
        </div>

        {/* 1. Ticket Tier Selection */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Select Ticket Type
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
                    handleQuantityChange(1); // Reset qty on change
                  }}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected
                      ? 'border-[#E8441A] bg-[#E8441A]/5 shadow-md shadow-[#E8441A]/5'
                      : 'border-zinc-800 bg-[#121212] hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold uppercase tracking-wide text-zinc-100">{tier.name}</span>
                    <span className="text-xxs text-zinc-400 font-medium line-clamp-1">{tier.description || 'Standard Gate access'}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-extrabold text-[#E8441A]">{formatNaira(tier.price)}</span>
                    {isSoldOut ? (
                      <Badge variant="danger">SOLD OUT</Badge>
                    ) : (
                      <span className="text-xxs text-zinc-500 font-semibold">{tier.quantity - soldCount} left</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Quantity selection counter */}
        {activeTier && (
          <div className="flex items-center justify-between border-t border-b border-zinc-800/60 py-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Quantity
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-base font-extrabold text-white w-6 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => handleQuantityChange(Math.min(5, activeTier.quantity - (activeTier.sold || 0), quantity + 1))}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* 3. Ticket Holder registration details */}
        <div className="flex flex-col gap-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-yellow-200 text-xs">
            <div className="flex flex-col gap-1">
              <p className="font-bold uppercase tracking-wider text-[10px] text-yellow-400">⚠️ Anti-Fraud Device Lock</p>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Tickets are permanently locked to the first phone they are opened on. If buying for friends, they must log in on their own phones to claim their tickets. Do not open a friend's ticket on your phone unless you plan to scan them in at the gate together.
              </p>
            </div>
          </div>

          {attendees.map((attendee, index) => (
            <div key={index} className="flex flex-col gap-4 p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#E8441A] flex items-center gap-2">
                <User className="h-4 w-4" />
                Attendee {index + 1} {index === 0 && "(Primary Buyer)"}
              </h4>
              
              <Input
                label="Full Name"
                placeholder="John Doe"
                required
                value={attendee.name}
                onChange={(e) => updateAttendee(index, 'name', e.target.value)}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="johndoe@example.com"
                required
                value={attendee.email}
                onChange={(e) => updateAttendee(index, 'email', e.target.value)}
              />

              <Input
                label="Phone Number"
                placeholder="803 123 4567"
                required
                prefixElement="+234"
                value={attendee.phone.replace(/^\+234/, '').replace(/^0/, '')}
                onChange={(e) => {
                  const numeric = e.target.value.replace(/\D/g, '');
                  updateAttendee(index, 'phone', numeric ? `+234${numeric}` : '');
                }}
              />
            </div>
          ))}
        </div>

        {/* Total & Action Button */}
        <div className="flex flex-col gap-4 pt-4 border-t border-zinc-800">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Subtotal</span>
              <span className="text-sm font-semibold text-zinc-300">{formatNaira(baseAmountKobo)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Platform Fee</span>
              <span className="text-sm font-semibold text-zinc-300">{formatNaira(platformFeeKobo)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-800/50 pt-2 mt-1">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Total Amount
              </span>
              <span className="text-xl font-extrabold text-[#E8441A]">
                {formatNaira(totalAmountKobo)}
              </span>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={purchaseMutation.isPending || isPaystackLoading}
            className="w-full flex items-center justify-center gap-2 uppercase tracking-widest text-xs h-12"
          >
            {totalAmountKobo === 0 ? (
              <>Claim Free Tickets</>
            ) : (
              <>
                <CreditCard className="h-4.5 w-4.5" />
                Pay with Paystack
              </>
            )}
          </Button>
        </div>

      </form>
    </Dialog>
  );
}

