import { Response } from 'express';
import { supabase } from '../../config/supabase';
import { success, error } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';
// paystackClient kept for future verifyTransaction usage if needed
import { verifyQRToken } from '../../utils/qrcode';
import crypto from 'crypto';
import { z } from 'zod';

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
      if (!req.user) {
        return error(res, 'Unauthorized', 'User session required', 401);
      }

      const parsedData = checkoutSchema.parse(req.body);
      const buyerId = req.user.id;

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

      // 2. Validate Tier Capacity Availability
      const { count: realSold } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('tier_id', parsedData.tierId);

      const soldCount = realSold || 0;
      const remainingCapacity = tier.quantity - soldCount;
      if (remainingCapacity < parsedData.quantity) {
        return error(res, 'Sold out', `Only ${remainingCapacity} tickets are left for the "${tier.name}" tier`, 400);
      }

      // 3. Campus restriction audit: is_university_only verification
      if (event.is_university_only && event.university_id) {
        // Fetch university details
        const { data: university } = await supabase
          .from('universities')
          .select('email_domain')
          .eq('id', event.university_id)
          .single();

        if (university) {
          const emailDomain = university.email_domain.toLowerCase();
          
          // Check all attendees for valid university email
          const invalidAttendee = parsedData.attendees.find(a => {
            const userEmail = a.email.toLowerCase();
            return !userEmail.endsWith(`@${emailDomain}`) && !userEmail.endsWith(`.${emailDomain}`);
          });

          if (invalidAttendee) {
            return error(res, 'Access restricted', `This event is locked to students of this campus. All tickets must be assigned to an @${emailDomain} email address.`, 403);
          }
        }
      }

      // 5. Calculate total amount in kobo
      const totalAmount = tier.price * parsedData.quantity;

      // 6. Generate unique Paystack reference
      const reference = `TIX-${crypto.randomUUID()}`;
      const callbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/orders/verify`;

      // 7. Create pending order in DB first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: buyerId,
          event_id: event.id,
          total_amount: totalAmount,
          paystack_reference: reference,
          paystack_status: 'pending'
        })
        .select()
        .single();

      if (orderError || !order) {
        return error(res, 'Order creation failed', orderError?.message || 'Failed to persist order', 400);
      }

      // 7.5. Fetch organizer profile to check for subaccount (for split payouts)
      const { data: organizerProfile } = await supabase
        .from('organizer_profiles')
        .select('paystack_subaccount_code')
        .eq('user_id', event.organizer_id)
        .maybeSingle();

      // 8. Initialize Paystack transaction with full metadata
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: req.user.email, // Use buyer's email for the Paystack receipt
          amount: totalAmount,
          reference: reference,
          callback_url: callbackUrl,
          ...(organizerProfile?.paystack_subaccount_code ? {
            subaccount: organizerProfile.paystack_subaccount_code,
            percentage_charge: 10 // Platform takes 10% commission
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

      // We need tickets bought by the user OR assigned to the user's email.
      // Since PostgREST OR across joins can be tricky, we'll fetch them in two queries and merge.
      
      // Query 1: Tickets bought by the user
      const { data: buyerTickets, error: queryError1 } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_tiers:ticket_tiers!inner(
            name,
            price,
            events:events(title, cover_image_url, venue, event_date)
          ),
          orders:orders!inner(id, buyer_id, paystack_status)
        `)
        .eq('orders.buyer_id', req.user.id)
        .eq('orders.paystack_status', 'success') as any;

      if (queryError1) {
        return error(res, 'Failed to fetch tickets', queryError1.message, 400);
      }

      // Query 2: Tickets assigned to the user's email (but maybe bought by someone else)
      const { data: assignedTickets, error: queryError2 } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_tiers:ticket_tiers!inner(
            name,
            price,
            events:events(title, cover_image_url, venue, event_date)
          ),
          orders:orders!inner(id, buyer_id, paystack_status)
        `)
        .eq('holder_email', req.user.email)
        .eq('orders.paystack_status', 'success') as any;

      if (queryError2) {
        return error(res, 'Failed to fetch assigned tickets', queryError2.message, 400);
      }

      // Merge and deduplicate by ticket ID
      const allTicketsMap = new Map();
      [...(buyerTickets || []), ...(assignedTickets || [])].forEach((t: any) => {
        allTicketsMap.set(t.id, t);
      });
      const tickets = Array.from(allTicketsMap.values());

      // Check device fingerprint binding
      const processedTickets = await Promise.all((tickets || []).map(async (ticket: any) => {
        // Only active tickets are checked for device binding
        if (ticket.status !== 'active') {
          return ticket;
        }

        // Bind ticket to the current device if it's the first time viewing
        if (!ticket.device_fingerprint && deviceFingerprint) {
          const { error: updateError } = await supabase
            .from('tickets')
            .update({
              device_fingerprint: deviceFingerprint,
              device_locked: true
            })
            .eq('id', ticket.id);

          if (!updateError) {
            ticket.device_fingerprint = deviceFingerprint;
            ticket.device_locked = true;
          }
        }

        // If the ticket is locked to a device, verify the fingerprint matches
        if (ticket.device_locked && ticket.device_fingerprint && ticket.device_fingerprint !== deviceFingerprint) {
          return {
            ...ticket,
            qr_token: null, // Hide the qr_token to secure it from screenshot theft / unauthorized viewing
            is_device_mismatch: true
          };
        }

        return ticket;
      }));

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

      if (ticket.status === 'used') {
        return success(res, {
          status: 'ALREADY_USED',
          scannedAt: ticket.scanned_at,
          holderName: ticket.holder_name
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
  }
};
