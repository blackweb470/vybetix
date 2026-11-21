'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEvent, useEvents } from '../../../../hooks/useEvents';
import CheckoutModal from '../../../../components/tickets/CheckoutModal';
import { formatNaira, formatDate } from '../../../../lib/utils';
import { useToast } from '../../../../components/ui/toast';
import Link from 'next/link';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const id = (params?.id as string) || '';
  const { data: event, isLoading: isLoadingSingle, error } = useEvent(id);
  const { data: allEvents = [] } = useEvents();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // If id is an index like 0, 1 or a slug, resolve from live events list
  const currentEvent = React.useMemo(() => {
    if (event) return event;
    if (!allEvents || allEvents.length === 0) return null;
    const byId = allEvents.find((e) => e.id === id);
    if (byId) return byId;
    const bySlug = allEvents.find((e) => e.slug === id);
    if (bySlug) return bySlug;
    const num = Number(id);
    if (!isNaN(num) && allEvents[num]) return allEvents[num];
    return null;
  }, [event, allEvents, id]);

  const isLoading = isLoadingSingle && !currentEvent;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#10100f] text-[#f1ede4] font-['DM_Sans',sans-serif] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm tracking-widest uppercase opacity-70 mb-4">VYBETIX / EVENT VERIFICATION</p>
          <h2 className="text-2xl font-bold mb-4">Loading real event details…</h2>
          <div className="w-8 h-8 border-2 border-[#ff5a24] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-[#10100f] text-[#f1ede4] font-['DM_Sans',sans-serif] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center border border-[#262624] p-8 rounded-lg bg-[#181816]">
          <p className="text-xs uppercase tracking-widest text-[#ff5a24] font-bold mb-2">404 / NOT FOUND</p>
          <h1 className="text-2xl font-black mb-3">Event Not Found</h1>
          <p className="text-sm opacity-70 mb-6">
            The event you are looking for does not exist in our live database or may have been unlisted.
          </p>
          <Link href="/events" className="btn inline-flex justify-center w-full">
            Browse All Events ↗
          </Link>
        </div>
      </div>
    );
  }

  const coverImage =
    currentEvent.cover_image_url ||
    currentEvent.art ||
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200';
  const activeTiers = currentEvent.ticket_tiers || currentEvent.tiers || [];
  const startingPrice =
    activeTiers.length > 0 ? Math.min(...activeTiers.map((t: any) => t.price)) : 0;

  return (
    <div className="min-h-screen bg-[#10100f] text-[#f1ede4] font-['DM_Sans',sans-serif] selection:bg-[#ff5a24] selection:text-[#10100f]">
      <div className="wrap">
        {/* Flow Header */}
        <div className="flowheader flow-context">
          <span>VYBETIX / THE NEXT SCENE</span>
          <Link href="/events" className="flowback">
            ← Back to the lineup
          </Link>
        </div>

        {/* Top Strip */}
        <div className="flowtop">
          <span>THE LINEUP / {(currentEvent.category || 'MUSIC').toUpperCase()}</span>
          <span>VYBETIX VERIFIED MOMENTS / 01</span>
        </div>

        {/* Hero Section */}
        <section className="detailhero">
          <div
            className="detailphoto"
            style={{ backgroundImage: `url(${coverImage})` }}
          />
          <div className="detailtitle">
            <span className="eventlabel">{(currentEvent.category || 'MUSIC').toUpperCase()} / LIVE PASS</span>
            <h1 tabIndex={-1}>{currentEvent.title}</h1>
            <div className="detailstrip">
              {formatDate(currentEvent.event_date)} &nbsp; / &nbsp; {currentEvent.city || 'Lagos'}, Nigeria
            </div>
          </div>
        </section>

        {/* 2-Column Content */}
        <div className="detailcolumns">
          <div className="detailcontent">
            <div className="floweyebrow">THE STORY / YOUR NIGHT</div>
            <h2>Some nights deserve<br />more than a recap.</h2>
            <p>
              {currentEvent.description ||
                'Front-row moments, dance-floor friendships. Turn it all the way up with this live experience.'}
            </p>
            <p>
              Authentic gate verification powered by Vybetix HMAC cryptographic tickets. Passes transfer immediately to your wallet upon checkout confirmation.
            </p>

            <div className="detailfacts">
              <div>
                <span>WHEN</span>
                <strong>{formatDate(currentEvent.event_date)}</strong>
              </div>
              <div>
                <span>WHERE</span>
                <strong>{currentEvent.venue || currentEvent.city || 'Lagos'}, Nigeria<br />Doors open on time</strong>
              </div>
              <div>
                <span>ADMISSION</span>
                <strong>Digital pass / QR Scan at gate</strong>
              </div>
              <div>
                <span>THE DETAILS</span>
                <strong>
                  {activeTiers.length > 0
                    ? `${activeTiers.length} Ticket Tier${activeTiers.length > 1 ? 's' : ''} Available`
                    : 'Standard Entry'}
                </strong>
              </div>
            </div>

            <h2>Before you show up.</h2>
            <details>
              <summary>How do I receive my pass?</summary>
              <p>Your pass is issued instantaneously to your digital vault upon successful Paystack payment. You also receive an email confirmation with your QR code.</p>
            </details>
            <details>
              <summary>Can I transfer my ticket to a friend?</summary>
              <p>Yes. Tickets in your vault can be transferred directly to another user’s email address or phone number with HMAC integrity.</p>
            </details>
            <details>
              <summary>What is the refund and cancellation policy?</summary>
              <p>Refunds are governed by the event organizer’s verified terms. In the event of a postponement or cancellation, automatic reversals are processed.</p>
            </details>
          </div>

          {/* Sticky Booking Stub */}
          <aside className="bookingstub">
            <div className="floweyebrow">YOUR PASS TO THE NIGHT</div>
            <span className="pricebig">
              {startingPrice > 0 ? formatNaira(startingPrice) : 'Free Admission'}
            </span>
            <p>Starting tier per person.<br />Choose ticket tiers and proceed to checkout.</p>
            <button
              className="btn !w-full justify-center"
              onClick={() => setIsCheckoutOpen(true)}
            >
              Choose your ticket <span className="arrow">↗</span>
            </button>
            <div className="stubnote">
              INSTANT DIGITAL ISSUANCE<br />Verified Paystack gateway. Secure HMAC pass.
            </div>
          </aside>
        </div>

        {/* Flow Footer */}
        <div className="flowfooter">
          <span>VYBETIX / OFFICIAL EVENT EXPERIENCE</span>
          <span>Instant issuance. Zero ticket fraud. Verified payouts.</span>
        </div>
      </div>

      {/* Paystack Live Checkout Modal */}
      {currentEvent && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          event={currentEvent}
        />
      )}
    </div>
  );
}
