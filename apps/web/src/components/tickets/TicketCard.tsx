'use client';

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import QRDisplay from './QRDisplay';
import { BuyerTicket } from '../../types';
import { formatDate, formatNaira } from '../../lib/utils';
import { Calendar, MapPin, QrCode, User, CreditCard, ShieldAlert } from 'lucide-react';

interface TicketCardProps {
  ticket: BuyerTicket;
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const [showQR, setShowQR] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleRevealClick = async () => {
    if (showQR) {
      setShowQR(false);
      return;
    }

    if (!window.PublicKeyCredential) {
      // Browser does not support WebAuthn
      setShowQR(true);
      return;
    }

    setIsAuthenticating(true);
    try {
      const hasBiometricSetup = localStorage.getItem('vibetix_biometric_setup');
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      if (!hasBiometricSetup) {
        // First time setup - create a credential
        const userId = new Uint8Array(16);
        window.crypto.getRandomValues(userId);

        const credential = await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: 'VibeTix Secure Tickets', id: window.location.hostname },
            user: {
              id: userId,
              name: ticket.holder_name || 'Buyer',
              displayName: ticket.holder_name || 'Buyer',
            },
            pubKeyCredParams: [
              { type: 'public-key', alg: -7 },
              { type: 'public-key', alg: -257 },
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
            },
            timeout: 60000,
          },
        });

        if (credential) {
          localStorage.setItem('vibetix_biometric_setup', 'true');
          setShowQR(true);
        }
      } else {
        // Subsequent unlocks - request assertion
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge,
            rpId: window.location.hostname,
            userVerification: 'required',
            timeout: 60000,
          },
        });

        if (assertion) {
          setShowQR(true);
        }
      }
    } catch (error) {
      console.error('Biometric auth failed:', error);
      alert('Biometric verification (FaceID / Fingerprint) is required to view your secure ticket.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Extract relational metadata
  const event = ticket.ticket_tiers?.events;
  const tierName = ticket.ticket_tiers?.name || 'Standard Tier';
  const eventTitle = event?.title || 'Unknown Vibes Session';
  const coverImage = event?.cover_image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600';
  const venue = event?.venue || 'Virtual/Pending venue';

  return (
    <Card className="flex flex-col border-zinc-800 bg-[#121212]/40 overflow-hidden font-outfit">
      
      {/* Visual background image stub */}
      <div className="relative h-32 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImage}
          alt={eventTitle}
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/45 to-transparent" />
        
        {/* Status flags */}
        <Badge className="absolute top-4 right-4 bg-[#E8441A] font-bold">
          {tierName}
        </Badge>
        {ticket.status === 'used' ? (
          <Badge variant="warning" className="absolute top-4 left-4">USED / SCANNED</Badge>
        ) : ticket.status === 'cancelled' ? (
          <Badge variant="danger" className="absolute top-4 left-4">CANCELLED</Badge>
        ) : ticket.is_device_mismatch ? (
          <Badge variant="danger" className="absolute top-4 left-4 flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5" /> DEVICE LOCKED
          </Badge>
        ) : ticket.device_locked ? (
          <Badge variant="success" className="absolute top-4 left-4 flex items-center gap-1">
            DEVICE BOUND
          </Badge>
        ) : (
          <Badge variant="secondary" className="absolute top-4 left-4">
            UNBOUND
          </Badge>
        )}
      </div>

      {/* Details body */}
      <div className="p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold text-white uppercase tracking-wide font-syne line-clamp-1">
            {eventTitle}
          </h3>
          
          <span className="text-xxs font-bold text-[#E8441A] uppercase tracking-widest flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {event?.event_date ? formatDate(event.event_date) : 'Pending Schedule'}
          </span>

          <span className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
            <MapPin className="h-3.5 w-3.5 text-zinc-550 shrink-0" />
            <span className="truncate">{venue}</span>
          </span>
        </div>

        {/* Holder and payment references table */}
        <div className="border-t border-b border-zinc-800/60 py-3.5 flex flex-col gap-1.5 text-xs text-zinc-400">
          <div className="flex justify-between">
            <span className="font-semibold text-zinc-550 flex items-center gap-1 uppercase tracking-wider text-[10px]">
              <User className="h-3 w-3" />
              Holder
            </span>
            <span className="text-zinc-200 font-bold uppercase">{ticket.holder_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-zinc-550 flex items-center gap-1 uppercase tracking-wider text-[10px]">
              <CreditCard className="h-3 w-3" />
              Ref ID
            </span>
            <span className="text-zinc-300 font-mono tracking-tighter text-[10px] uppercase truncate max-w-[150px]">
              {ticket.id.split('-')[0]}-{ticket.order_id.split('-')[0]}
            </span>
          </div>
        </div>

        {/* Dynamic rotating QR overlay */}
        {showQR && ticket.status === 'active' && !ticket.is_device_mismatch && ticket.qr_token && (
          <div className="border-t border-zinc-850 pt-4 animate-in fade-in-40 duration-300">
            <QRDisplay ticketId={ticket.id} staticToken={ticket.qr_token} />
          </div>
        )}

        {/* Device mismatch warning */}
        {ticket.status === 'active' && ticket.is_device_mismatch && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-200 text-xs mt-1 animate-in fade-in-30">
            <ShieldAlert className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div className="flex flex-col gap-0.5 text-left">
              <p className="font-bold uppercase tracking-wider text-[10px] text-red-400">Device Lock Active</p>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                This ticket is cryptographically locked to the first device it was opened on. Access on this device is restricted.
              </p>
            </div>
          </div>
        )}

        {/* Reveal QR CTA Button */}
        {ticket.status === 'active' && !ticket.is_device_mismatch && (
          <Button
            variant={showQR ? 'outline' : 'default'}
            onClick={handleRevealClick}
            disabled={isAuthenticating}
            className="w-full uppercase tracking-widest text-[10px] h-10 mt-1"
          >
            {isAuthenticating ? (
              <><ShieldAlert className="mr-2 h-4 w-4 animate-pulse text-[#E8441A]" /> Verifying Identity...</>
            ) : (
              <><QrCode className="mr-2 h-4 w-4" /> {showQR ? 'Hide Ticket Gate' : 'Reveal Gate Entry (Biometric)'}</>
            )}
          </Button>
        )}

        {ticket.status === 'used' && (
          <div className="text-center py-2 bg-zinc-900 border border-zinc-850 rounded-xl text-xxs font-semibold uppercase tracking-wider text-zinc-500">
            Checked in on {ticket.scanned_at ? formatDate(ticket.scanned_at, 'MMM d, h:mm a') : 'Gate Scan'}
          </div>
        )}
      </div>

    </Card>
  );
}
