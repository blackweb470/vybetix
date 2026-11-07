import { Response, Request } from 'express';
import { supabase } from '../../config/supabase';
import { success, error } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';
import { paystackClient, paystackConfig } from '../../config/paystack';
import { verifyQRToken, generateQRToken, generatePermanentQRToken, generateQRImage } from '../../utils/qrcode';
import { fulfillOrder } from '../payments/payments.controller';
import crypto from 'crypto';
import { z } from 'zod';

// --- In-Memory Caching for Gate Staff Authorization ---
// This reduces database queries drastically during rapid gate scanning by caching 
// the staff's authorization status for an event for 5 minutes.
const staffAuthCache = new Map<string, { authorized: boolean, expiresAt: number }>();

async function checkStaffAuthorization(userId: string, eventId: string): Promise<boolean> {
  const cacheKey = `${userId}:${eventId}`;
  const cached = staffAuthCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.authorized;
  }

  const { data: staffData } = await supabase
    .from('event_staff')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  const isAuthorized = !!staffData;
  // Cache the result for 5 minutes (300000 ms)
  staffAuthCache.set(cacheKey, { authorized: isAuthorized, expiresAt: Date.now() + 300000 });

  return isAuthorized;
}

// 1. Zod Validation Schemas
const attendeeSchema = z.object({
  name: z.string().min(2, 'Holder name must be at least 2 characters'),
  email: z.string().email('Holder email must be valid'),
  phone: z.string().regex(/^\+234[789][01]\d{8}$/, 'Holder phone must be a valid Nigerian number (+23480...)')
});

export const checkoutSchema = z.object({
  tierId: z.string().uuid('Invalid ticket tier ID'),
  quantity: z.number().int().positive('Quantity must be at least 1').max(5, 'Maximum of 5 tickets per order'),
  attendees: z.array(attendeeSchema).min(1, 'At least one attendee is required')
});

export const ticketsController = {
  /**
   * Initializes order checkouts. Performs tier checks, campus domain audits, calculates totals,
   * inserts a pending order, and retrieves the Paystack payment gateway URL.
   */
  initCheckout: async (req: AuthRequest, res: Response) => {
    try {
      const parsedData = checkoutSchema.parse(req.body);

      // Support both authenticated users and guest checkouts
      let buyerId: string;
      let buyerEmail: string;

      if (req.user) {
        buyerId = req.user.id;
        buyerEmail = req.user.email;
      } else {
        // Guest checkout — resolve or provision from primary attendee
        const primaryAttendee = parsedData.attendees[0];
        if (!primaryAttendee || !primaryAttendee.email) {
          return error(res, 'Guest checkout requires email', 'Primary attendee email is required for ticket delivery', 400);
        }

        buyerEmail = primaryAttendee.email.toLowerCase().trim();
        const buyerName = primaryAttendee.name.trim();
        const buyerPhone = primaryAttendee.phone?.trim() || '';

        // Check if an existing account exists with this email
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, email, is_banned')
          .ilike('email', buyerEmail)
          .maybeSingle();

        if (existingUser) {
          if (existingUser.is_banned) {
            return error(res, 'Account suspended', 'This account has been banned from purchasing tickets', 403);
          }
          buyerId = existingUser.id;
        } else {
          // Provision guest account in Supabase auth and public.users
          try {
            const { data: newAuthUser } = await supabase.auth.admin.createUser({
              email: buyerEmail,
              email_confirm: true,
              user_metadata: { full_name: buyerName }
            });

            if (newAuthUser?.user) {
              buyerId = newAuthUser.user.id;
              await supabase
                .from('users')
                .upsert({
                  id: buyerId,
                  email: buyerEmail,
                  full_name: buyerName,
                  phone: buyerPhone,
                  role: 'buyer'
                }, { onConflict: 'id' });
            } else {
              throw new Error('Could not create auth user');
            }
          } catch (provisionErr) {
            // Fallback: standalone row in public.users
            const fallbackId = crypto.randomUUID();
            const { data: fallbackUser, error: fbErr } = await supabase
              .from('users')
              .insert({
                id: fallbackId,
                email: buyerEmail,
                full_name: buyerName,
                phone: buyerPhone,
                role: 'buyer'
              })
              .select('id')
              .single();

            if (fbErr || !fallbackUser) {
              return error(res, 'Guest checkout failed', 'Could not provision guest account for ticket delivery', 500);
            }
            buyerId = fallbackUser.id;
          }
        }
      }

      // 1. Retrieve Ticket Tier Details
      const { data: tier, error: tierError } = await supabase
        .from('ticket_tiers')
        .select('*, events(*)')
        .eq('id', parsedData.tierId)
        .single();

      if (tierError || !tier) {
        return error(res, 'Tier not found', 'The specified ticket tier does not exist', 404);
      }

      const event = tier.events;

      // 2. Block purchases for events that have already ended
      if (event.end_date && new Date(event.end_date) < new Date()) {
        return error(res, 'Event has ended', 'Ticket sales are closed — this event has already ended.', 400);
      }

      // 3. Calculate total amount in kobo
      const baseAmount = tier.price * parsedData.quantity;
      const totalAmount = baseAmount > 0 ? baseAmount + 10000 : 0; // Add 100 Naira service charge for Paystack

      // 4. Parallelize secondary validation checks
      const [ticketsCountRes, uniRes, orgProfileRes] = await Promise.all([
        supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('tier_id', parsedData.tierId),
        (event.is_university_only && event.university_id) ? supabase.from('universities').select('email_domain').eq('id', event.university_id).single() : Promise.resolve({ data: null }),
        totalAmount > 0 ? supabase.from('organizer_profiles').select('*').eq('user_id', event.organizer_id).maybeSingle() : Promise.resolve({ data: null })
      ]);

      const soldCount = ticketsCountRes.count || 0;
      const remainingCapacity = tier.quantity - soldCount;
      if (remainingCapacity < parsedData.quantity) {
        return error(res, 'Sold out', `Only ${remainingCapacity} tickets are left for the "${tier.name}" tier`, 400);
      }

      // Campus restriction audit
      if (event.is_university_only && event.university_id) {
        const university = uniRes.data;
        if (university) {
          const emailDomain = university.email_domain.toLowerCase();

          const invalidAttendee = parsedData.attendees.find(a => {
            const userEmail = a.email.toLowerCase();
            return !userEmail.endsWith(`@${emailDomain}`) && !userEmail.endsWith(`.${emailDomain}`);
          });

          if (invalidAttendee) {
            return error(res, 'Access restricted', `This event is locked to students of this campus. All tickets must be assigned to an @${emailDomain} email address.`, 403);
          }
        }
      }

      // 5. Generate unique Paystack reference
      const reference = `TIX-${crypto.randomUUID()}`;
      const callbackUrl = `${process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://vybetix.com' : 'http://localhost:3000')}/dashboard/orders/verify`;

      // 6. Create pending order in DB first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: buyerId,
          event_id: event.id,
          total_amount: totalAmount,
          paystack_reference: reference,
          paystack_status: totalAmount === 0 ? 'success' : 'pending'
        })
        .select()
        .single();

      if (orderError || !order) {
        return error(res, 'Order creation failed', orderError?.message || 'Failed to persist order', 400);
      }

      // If total amount is 0, bypass paystack completely and fulfill the order
      if (totalAmount === 0) {
        await fulfillOrder(order.id, tier.id, parsedData.attendees);
        return success(res, {
          orderId: order.id,
          reference,
          amount: 0,
          accessCode: null,
          authorizationUrl: null
        }, 'Free tickets claimed successfully!');
      }

      let organizerProfile = orgProfileRes.data;
      let subaccountCode = organizerProfile?.paystack_subaccount_code;

      // Auto-resolution: If subaccountCode is missing in DB, query Paystack directly to find and link the subaccount
      if (!subaccountCode && totalAmount > 0) {
        try {
          const remoteSubaccounts = await paystackClient.listSubaccounts();
          if (remoteSubaccounts && remoteSubaccounts.length > 0) {
            // Match by account number, business name, prioritizing VERIFIED subaccounts
            const matchingCandidates = remoteSubaccounts.filter(s =>
              (organizerProfile?.account_number && s.account_number === organizerProfile.account_number) ||
              (organizerProfile?.business_name && s.business_name?.toLowerCase() === organizerProfile.business_name?.toLowerCase())
            );
            matchingCandidates.sort((a, b) => {
              if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1;
              if (a.active !== b.active) return a.active ? -1 : 1;
              return b.id - a.id;
            });
            const matched = matchingCandidates[0] || (remoteSubaccounts.length === 1 ? remoteSubaccounts[0] : null);

            if (matched) {
              subaccountCode = matched.subaccount_code;
              console.log(`[Paystack Split Auto-Link] Found subaccount ${subaccountCode} on Paystack, syncing to organizer ${event.organizer_id}`);

              if (organizerProfile?.id) {
                await supabase
                  .from('organizer_profiles')
                  .update({ paystack_subaccount_code: subaccountCode })
                  .eq('id', organizerProfile.id);
              } else {
                await supabase
                  .from('organizer_profiles')
                  .upsert({
                    user_id: event.organizer_id,
                    business_name: matched.business_name || 'Event Organizer',
                    bank_name: matched.settlement_bank || 'Settlement Bank',
                    account_number: matched.account_number || '0000000000',
                    account_name: matched.business_name || 'Organizer',
                    paystack_subaccount_code: subaccountCode,
                    verified: true
                  }, { onConflict: 'user_id' });
              }
            }
          }
        } catch (linkErr: any) {
          console.warn('[Paystack Split Auto-Link] Could not auto-query subaccounts from Paystack:', linkErr.message);
        }
      }

      // Calculate platform fee: 100 Naira flat service fee + 4% organizer commission on ticket sale
      const platformFlatFeeKobo = 10000;
      const organizerPercentChargeKobo = Math.round(baseAmount * 0.04);
      const totalTransactionChargeKobo = platformFlatFeeKobo + organizerPercentChargeKobo;

      // 7. Initialize Paystack transaction with split payload
      // Platform gets totalTransactionChargeKobo; Organizer gets the remaining share directly to subaccount
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: paystackConfig.headers,
        body: JSON.stringify({
          email: buyerEmail, // Use buyer's email for the Paystack receipt
          amount: totalAmount,
          reference: reference,
          callback_url: callbackUrl,
          ...(subaccountCode ? {
            subaccount: subaccountCode,
            transaction_charge: totalTransactionChargeKobo,
            bearer: 'account' // Platform explicitly bears all Paystack processing fees
          } : {}),
          metadata: {
            order_id: order.id,
            tier_id: tier.id,
            quantity: parsedData.quantity,
            attendees: JSON.stringify(parsedData.attendees)
          }
        })
      });

      const paystackData = await paystackResponse.json();

      if (!paystackResponse.ok || !paystackData.status) {
        // Rollback pending order on gateway failure
        await supabase.from('orders').delete().eq('id', order.id);
        return error(res, 'Payment gateway error', paystackData.message || 'Failed to initialize Paystack', 500);
      }

      return success(res, {
        orderId: order.id,
        reference,
        amount: totalAmount,
        accessCode: paystackData.data.access_code,
        authorizationUrl: paystackData.data.authorization_url
      }, 'Checkout initialized successfully!');

    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return error(res, 'Validation failed', err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), 400);
      }
      console.error('Checkout error:', err);
      return error(res, 'Checkout error', err.message, 500);
    }
  },

  /**
   * Retrieves all verified tickets belonging to the active logged-in buyer.
   */
  getMyTickets: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return error(res, 'Unauthorized', 'User session required', 401);
      }

      const deviceFingerprint = req.headers['x-device-fingerprint'] as string;

      // Step 0: Auto-reconcile recent pending orders for this user in case webhook dropped or browser closed early
      try {
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
        const { data: pendingOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('buyer_id', req.user.id)
          .eq('paystack_status', 'pending')
          .gt('created_at', fortyEightHoursAgo);

        if (pendingOrders && pendingOrders.length > 0) {
          for (const pendingOrder of pendingOrders) {
            try {
              const paystackData = await paystackClient.verifyTransaction(pendingOrder.paystack_reference);
              if (paystackData.status === 'success') {
                await supabase
                  .from('orders')
                  .update({ paystack_status: 'success' })
                  .eq('id', pendingOrder.id);

                let parsedMetadata = paystackData.metadata;
                if (typeof parsedMetadata === 'string') {
                  try { parsedMetadata = JSON.parse(parsedMetadata); } catch (_) { }
                }

                if (parsedMetadata && parsedMetadata.tier_id) {
                  let attendees: any[] = [];
                  if (parsedMetadata.attendees) {
                    attendees = typeof parsedMetadata.attendees === 'string'
                      ? JSON.parse(parsedMetadata.attendees)
                      : parsedMetadata.attendees;
                  } else if (parsedMetadata.holder_name) {
                    for (let i = 0; i < Number(parsedMetadata.quantity || 1); i++) {
                      attendees.push({
                        name: parsedMetadata.holder_name,
                        email: parsedMetadata.holder_email,
                        phone: parsedMetadata.holder_phone
                      });
                    }
                  }

                  if (attendees.length > 0) {
                    await fulfillOrder(pendingOrder.id, parsedMetadata.tier_id, attendees);
                  }
                }
              }
            } catch (pErr) {
              // Non-blocking: transaction may still be pending or unpaid
            }
          }
        }
      } catch (reconErr) {
        console.error('Pending orders auto-reconciliation error:', reconErr);
      }

      // Step 1: Fetch the user's successful order IDs
      const { data: myOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_id', req.user.id)
        .eq('paystack_status', 'success');

      if (ordersError) {
        console.error('Failed to fetch orders:', ordersError);
        return error(res, 'Failed to fetch orders', ordersError.message, 400);
      }

      const myOrderIds = (myOrders || []).map((o: any) => o.id);

      // Step 2a: Fetch tickets from the user's own orders (already verified as paid)
      let buyerTickets: any[] = [];
      if (myOrderIds.length > 0) {
        const { data, error: err } = await supabase
          .from('tickets')
          .select(`
            *,
            ticket_tiers(name, price, events(title, cover_image_url, venue, event_date, end_date))
          `)
          .in('order_id', myOrderIds);
        // Removed .eq('status', 'active') so we get used/cancelled tickets too!

        if (err) {
          console.error('Failed to fetch buyer tickets:', err);
          return error(res, 'Failed to fetch tickets', err.message, 400);
        }
        buyerTickets = data || [];
      }

      // Step 2b: Fetch tickets assigned to the user's email (bought by someone else for them)
      // We avoid joining orders here to prevent PostgREST from traversing the
      // orders.buyer_id → auth.users FK, which causes a permission error.
      const { data: assignedTicketsRaw, error: assignedError } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_tiers(name, price, events(title, cover_image_url, venue, event_date, end_date))
        `)
        .ilike('holder_email', req.user.email);
      // Removed .eq('status', 'active') here too
      if (assignedError) {
        console.error('Failed to fetch assigned tickets:', assignedError);
        return error(res, 'Failed to fetch assigned tickets', assignedError.message, 400);
      }

      // Fetch all paid order IDs so we can filter out unpaid assigned tickets
      const rawAssigned = assignedTicketsRaw || [];
      let assignedTickets: any[] = [];
      if (rawAssigned.length > 0) {
        const assignedOrderIds = [...new Set(rawAssigned.map((t: any) => t.order_id))];
        const { data: paidOrders } = await supabase
          .from('orders')
          .select('id')
          .in('id', assignedOrderIds)
          .eq('paystack_status', 'success');

        const paidSet = new Set((paidOrders || []).map((o: any) => o.id));
        assignedTickets = rawAssigned.filter((t: any) => paidSet.has(t.order_id));
      }

      // Merge and deduplicate by ticket ID
      const allTicketsMap = new Map();
      [...buyerTickets, ...assignedTickets].forEach((t: any) => {
        allTicketsMap.set(t.id, t);
      });
      const tickets = Array.from(allTicketsMap.values());

      // Standard ticketing: every active ticket receives its official entry pass token (no device locking)
      const processedTickets = tickets.map((ticket: any) => {
        if (ticket.status === 'active') {
          ticket.qr_token = ticket.qr_token || generatePermanentQRToken(ticket.id);
        }
        ticket.is_device_mismatch = false;
        ticket.device_locked = false;
        return ticket;
      });

      return success(res, processedTickets, 'Buyer tickets fetched successfully');
    } catch (err: any) {
      console.error('Get my tickets error:', err);
      return error(res, 'Server error getting tickets', err.message, 500);
    }
  },


  /**
   * Fetches ticket by securely decoding the scanned QR token (Admins/Organizers only).
   */
  getTicketByQR: async (req: AuthRequest, res: Response) => {
    try {
      const { qrToken } = req.query;
      if (!qrToken) {
        return error(res, 'Scan error', 'QR token parameter is missing', 400);
      }

      const decoded = verifyQRToken(String(qrToken));
      if (!decoded) {
        return error(res, 'Verification failed', 'Fake or invalid ticket QR token signature', 400);
      }

      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('*, ticket_tiers(*, events(*))')
        .eq('id', decoded.ticketId)
        .single();

      if (ticketError || !ticket) {
        return error(res, 'Ticket missing', 'No matching ticket found in database', 404);
      }

      const event = ticket.ticket_tiers.events;

      // Ensure user is authorized to scan for this event
      if (req.user?.role !== 'admin' && event.organizer_id !== req.user?.id) {
        if (!req.user?.id) {
          return error(res, 'Forbidden', 'User ID missing', 403);
        }

        const isAuthorized = await checkStaffAuthorization(req.user.id, event.id);

        if (!isAuthorized) {
          return error(res, 'Forbidden', 'You are not authorized to scan tickets for this event', 403);
        }
      }

      return success(res, ticket, 'Ticket identified successfully');
    } catch (err: any) {
      console.error('Get ticket by QR error:', err);
      return error(res, 'Server error decoding ticket', err.message, 500);
    }
  },

  /**
   * Performs quick validation checks on a ticket without marking it as scanned.
   */
  validateTicket: async (req: AuthRequest, res: Response) => {
    try {
      const { qrToken } = req.body;
      if (!qrToken) {
        return error(res, 'Validation error', 'Missing QR token parameter', 400);
      }

      const decoded = verifyQRToken(String(qrToken));
      if (!decoded) {
        return success(res, { status: 'INVALID', message: 'Fake or corrupt ticket QR seal' });
      }

      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('*, ticket_tiers(*, events(*))')
        .eq('id', decoded.ticketId)
        .single();

      if (ticketError || !ticket) {
        return success(res, { status: 'INVALID', message: 'Ticket record not found' });
      }

      const event = ticket.ticket_tiers.events;

      // Ensure user is authorized to scan for this event
      if (req.user?.role !== 'admin' && event.organizer_id !== req.user?.id) {
        if (!req.user?.id) {
          return error(res, 'Forbidden', 'User ID missing', 403);
        }

        const isAuthorized = await checkStaffAuthorization(req.user.id, event.id);

        if (!isAuthorized) {
          return error(res, 'Forbidden', 'You are not authorized to validate tickets for this event', 403);
        }
      }

      const now = new Date();
      const eventEndDate = new Date(event.end_date);

      if (now > eventEndDate) {
        return success(res, {
          status: 'EXPIRED',
          message: 'The event for this ticket has already ended.'
        });
      }

      if (ticket.status === 'used') {
        return success(res, {
          status: 'VALID',
          is_re_entry: true,
          scannedAt: ticket.scanned_at,
          ticketId: ticket.id,
          holderName: ticket.holder_name,
          tierName: ticket.ticket_tiers.name,
          eventTitle: event.title,
          message: 'Ticket is valid (RE-ENTRY)'
        });
      }

      if (ticket.status === 'cancelled') {
        return success(res, { status: 'CANCELLED' });
      }

      return success(res, {
        status: 'VALID',
        ticketId: ticket.id,
        holderName: ticket.holder_name,
        tierName: ticket.ticket_tiers.name,
        eventTitle: ticket.ticket_tiers.events.title
      }, 'Ticket is valid and active!');

    } catch (err: any) {
      console.error('Validate ticket error:', err);
      return error(res, 'Server error validating ticket', err.message, 500);
    }
  },

  /**
   * Retrieves all tickets sold for events owned by the organizer.
   */
  getOrganizerTickets: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return error(res, 'Unauthorized', 'User session required', 401);
      }

      // 1. Get all events for this organizer
      const { data: myEvents, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('organizer_id', req.user.id);

      if (eventsError) {
        console.error('Failed to fetch organizer events:', eventsError);
        return error(res, 'Failed to fetch events', eventsError.message, 400);
      }

      const eventIds = (myEvents || []).map((e: any) => e.id);
      if (eventIds.length === 0) {
        return success(res, [], 'No events found');
      }

      // 2. Get all tiers for those events
      const { data: myTiers, error: tiersError } = await supabase
        .from('ticket_tiers')
        .select('id')
        .in('event_id', eventIds);

      if (tiersError) {
        console.error('Failed to fetch organizer tiers:', tiersError);
        return error(res, 'Failed to fetch tiers', tiersError.message, 400);
      }

      const tierIds = (myTiers || []).map((t: any) => t.id);
      if (tierIds.length === 0) {
        return success(res, [], 'No ticket tiers found');
      }

      // 3. Get all tickets for those tiers
      // We only fetch tickets associated with successful orders
      const { data: allTicketsRaw, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_tiers(name, price, events(title, event_date, end_date))
        `)
        .in('tier_id', tierIds)
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('Failed to fetch organizer tickets:', ticketsError);
        return error(res, 'Failed to fetch tickets', ticketsError.message, 400);
      }

      // 4. Ensure these tickets belong to paid orders
      const rawTickets = allTicketsRaw || [];
      let finalTickets: any[] = [];
      if (rawTickets.length > 0) {
        const orderIds = [...new Set(rawTickets.map((t: any) => t.order_id))];
        const { data: paidOrders } = await supabase
          .from('orders')
          .select('id')
          .in('id', orderIds)
          .eq('paystack_status', 'success');

        const paidSet = new Set((paidOrders || []).map((o: any) => o.id));
        finalTickets = rawTickets.filter((t: any) => paidSet.has(t.order_id));
      }

      return success(res, finalTickets, 'Organizer tickets fetched successfully');
    } catch (err: any) {
      console.error('Get organizer tickets error:', err);
      return error(res, 'Server error getting organizer tickets', err.message, 500);
    }
  },

  /**
   * Request device unlock (No-op: device binding is disabled)
   */
  requestUnlock: async (req: AuthRequest, res: Response) => {
    return success(res, null, 'Device binding is disabled. Your ticket is accessible from any device.');
  },

  /**
   * Verify device unlock (No-op: device binding is disabled)
   */
  verifyUnlock: async (req: AuthRequest, res: Response) => {
    return success(res, null, 'Device binding is disabled. Your ticket is accessible from any device.');
  },

  /**
   * Refreshes a ticket's QR token
   */
  refreshQR: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return error(res, 'Unauthorized', 'User session required', 401);
      }

      const { id } = req.params;

      const { data: ticket, error: err } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (err || !ticket) {
        return error(res, 'Not found', 'Ticket not found', 404);
      }

      if (ticket.holder_email?.toLowerCase() !== req.user.email?.toLowerCase()) {
        return error(res, 'Forbidden', 'Not authorized to view this ticket', 403);
      }

      const token = generatePermanentQRToken(ticket.id);
      return success(res, { qr_token: token }, 'QR token refreshed');
    } catch (err: any) {
      console.error('Refresh QR error:', err);
      return error(res, 'Server error', err.message, 500);
    }
  },

  /**
   * Retrieves ticket details for public guest pass viewing.
   * Allows buyers to view, save, or present their ticket at the gate without signing in.
   */
  getPublicTicket: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { token } = req.query;

      if (!id) {
        return error(res, 'Ticket ID required', 'Please provide a valid ticket ID', 400);
      }

      // 1. Fetch ticket from database with tier and event information
      const { data: ticket, error: ticketErr } = await supabase
        .from('tickets')
        .select(`
          id,
          holder_name,
          holder_email,
          holder_phone,
          status,
          scanned_at,
          created_at,
          qr_token,
          ticket_tiers:ticket_tiers!inner(
            name,
            price,
            event_id,
            events:events(
              id,
              title,
              venue,
              city,
              event_date,
              end_date,
              cover_image_url
            )
          )
        `)
        .eq('id', id)
        .single();

      if (ticketErr || !ticket) {
        return error(res, 'Ticket not found', 'This ticket does not exist or has been removed', 404);
      }

      // 2. Validate cryptographic seal if provided
      if (token) {
        const decoded = verifyQRToken(String(token));
        if (!decoded || decoded.ticketId !== id) {
          return error(res, 'Invalid ticket pass', 'Cryptographic verification failed for this ticket link', 403);
        }
      }

      const tierObj: any = (ticket as any).ticket_tiers;
      const eventObj: any = Array.isArray(tierObj?.events) ? tierObj.events[0] : tierObj?.events;

      // Generate a sealed QR code image for this ticket
      const passToken = ticket.qr_token || generatePermanentQRToken(ticket.id);
      const qrDataUrl = await generateQRImage(passToken);

      return success(res, {
        id: ticket.id,
        holderName: ticket.holder_name,
        holderEmail: ticket.holder_email,
        status: ticket.status,
        scannedAt: ticket.scanned_at,
        tierName: tierObj?.name,
        price: tierObj?.price,
        event: {
          title: eventObj?.title,
          venue: eventObj?.venue,
          city: eventObj?.city,
          eventDate: eventObj?.event_date,
          endDate: eventObj?.end_date,
          coverImageUrl: eventObj?.cover_image_url
        },
        qrImage: qrDataUrl,
        passToken: passToken
      }, 'Ticket pass retrieved successfully');
    } catch (err: any) {
      console.error('Get public ticket error:', err);
      return error(res, 'Server error loading ticket pass', err.message, 500);
    }
  }
};

