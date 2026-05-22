import { Response } from 'express';
import { supabase } from '../../config/supabase';
import { success, error } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';
import { z } from 'zod';

const payoutRequestSchema = z.object({
  amount: z.number().int().positive('Payout request amount must be positive and in kobo')
});

export const organizerController = {
  /**
   * Retrieves high-fidelity metrics for the organizer's dashboard.
   * Compiles total sales in kobo, tickets sold, attendance scanning ratios,
   * active payout requests, and lists upcoming vs completed events.
   */
  getDashboard: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return error(res, 'Unauthorized', 'Session required', 401);
      }

      const organizerId = req.user.id;

      // 1. Fetch organizer profile details
      const { data: profile } = await supabase
        .from('organizer_profiles')
        .select('*')
        .eq('user_id', organizerId)
        .single();

      // 2. Fetch all events owned by organizer
      const { data: eventsList, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', organizerId);

      if (eventsError) {
        return error(res, 'Dashboard query failed', eventsError.message, 400);
      }

      const eventIds = eventsList.map(e => e.id);

      if (eventIds.length === 0) {
        // Return blank default dashboard metrics
        return success(res, {
          profile,
          totalEvents: 0,
          totalTicketsSold: 0,
          totalRevenueKobo: 0,
          totalAttendeesScanned: 0,
          events: []
        }, 'Empty organizer dashboard loaded');
      }

      // 3. Fetch successful tickets for these events
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, status, ticket_tiers(price)')
        .in('ticket_tiers.event_id', eventIds);

      if (ticketsError) {
        return error(res, 'Dashboard query failed', ticketsError.message, 400);
      }

      const totalTicketsSold = tickets.length;
      const totalRevenueKobo = tickets.reduce((sum, t: any) => {
        const price = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0]?.price : t.ticket_tiers?.price;
        return sum + (price || 0);
      }, 0);
      const totalAttendeesScanned = tickets.filter(t => t.status === 'used').length;

      // 4. Fetch total processed payouts to date
      const { data: payouts } = await supabase
        .from('payouts')
        .select('amount, status')
        .eq('organizer_id', organizerId);

      const paidOutKobo = payouts
        ?.filter(p => p.status === 'processed')
        .reduce((sum, p) => sum + p.amount, 0) || 0;

      const pendingPayoutKobo = payouts
        ?.filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0) || 0;

      return success(res, {
        profile,
        totalEvents: eventsList.length,
        totalTicketsSold,
        totalRevenueKobo,
        availablePayoutKobo: Math.max(0, totalRevenueKobo - paidOutKobo - pendingPayoutKobo),
        paidOutKobo,
        pendingPayoutKobo,
        totalAttendeesScanned,
        events: eventsList
      }, 'Organizer dashboard details loaded successfully!');

    } catch (err: any) {
      console.error('Organizer dashboard error:', err);
      return error(res, 'Server error loading dashboard', err.message, 500);
    }
  },

  /**
   * Retrieves events owned by this organizer.
   * Sold counts are computed from actual ticket rows (not the cached sold counter)
   * to ensure accuracy when the counter drifts.
   */
  getMyEvents: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return error(res, 'Unauthorized', 'Session required', 401);
      }

      const { data: eventsList, error: eventsError } = await supabase
        .from('events')
        .select('*, ticket_tiers(*)')
        .eq('organizer_id', req.user.id)
        .order('event_date', { ascending: false });

      if (eventsError) {
        return error(res, 'Failed to fetch events', eventsError.message, 400);
      }

      // Collect all tier IDs across all events
      const allTierIds = (eventsList || []).flatMap(e =>
        (e.ticket_tiers || []).map((t: any) => t.id)
      );

      // Count actual issued tickets per tier from the tickets table
      // This is the source of truth — the sold counter on ticket_tiers can drift
      let tierCountMap: Record<string, number> = {};
      if (allTierIds.length > 0) {
        const { data: ticketRows } = await supabase
          .from('tickets')
          .select('tier_id')
          .in('tier_id', allTierIds);

        (ticketRows || []).forEach((t: any) => {
          if (t.tier_id) {
            tierCountMap[t.tier_id] = (tierCountMap[t.tier_id] || 0) + 1;
          }
        });
      }

      // Merge real sold counts into each tier
      const eventsWithRealCounts = (eventsList || []).map(event => ({
        ...event,
        ticket_tiers: (event.ticket_tiers || []).map((tier: any) => ({
          ...tier,
          sold: tierCountMap[tier.id] || 0
        }))
      }));

      return success(res, eventsWithRealCounts, 'Organizer events list loaded');
    } catch (err: any) {
      console.error('Get my events error:', err);
      return error(res, 'Server error fetching events', err.message, 500);
    }
  },


  /**
   * Retrieves standard attendee rosters for organizer's events.
   */
  getAttendees: async (req: AuthRequest, res: Response) => {
    try {
      const { eventId } = req.params;
      if (!req.user) {
        return error(res, 'Unauthorized', 'Session required', 401);
      }

      // Check ownership
      const { data: event } = await supabase
        .from('events')
        .select('organizer_id')
        .eq('id', eventId)
        .single();

      if (!event) {
        return error(res, 'Event not found', 'Event does not exist', 404);
      }

      if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
        return error(res, 'Forbidden', 'You do not own this event', 403);
      }

      // Retrieve attendees from tickets joining orders
      const { data: attendees, error: queryError } = await supabase
        .from('tickets')
        .select(`
          id,
          holder_name,
          holder_email,
          holder_phone,
          status,
          created_at,
          scanned_at,
          ticket_tiers(name, price)
        `)
        .eq('ticket_tiers.event_id', eventId)
        .order('created_at', { ascending: false });

      if (queryError) {
        return error(res, 'Query failed', queryError.message, 400);
      }

      return success(res, attendees, 'Attendee roster loaded successfully');

    } catch (err: any) {
      console.error('Get attendees error:', err);
      return error(res, 'Server error loading attendee roster', err.message, 500);
    }
  },

  /**
   * Initializes a payout request in payouts table.
   */
  requestPayout: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return error(res, 'Unauthorized', 'Session required', 401);
      }

      const parsedData = payoutRequestSchema.parse(req.body);
      const organizerId = req.user.id;

      // 1. Audit organizer account details
      const { data: profile } = await supabase
        .from('organizer_profiles')
        .select('*')
        .eq('user_id', organizerId)
        .single();

      if (!profile) {
        return error(res, 'Profile missing', 'Organizer banking profile details not established', 400);
      }

      // 2. Fetch total successful revenue in kobo
      const { data: eventsList } = await supabase
        .from('events')
        .select('id')
        .eq('organizer_id', organizerId);

      const eventIds = eventsList?.map(e => e.id) || [];
      
      let totalRevenueKobo = 0;
      if (eventIds.length > 0) {
        const { data: tickets } = await supabase
          .from('tickets')
          .select('ticket_tiers(price)')
          .in('ticket_tiers.event_id', eventIds);
        
        totalRevenueKobo = tickets?.reduce((sum, t: any) => {
          const price = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0]?.price : t.ticket_tiers?.price;
          return sum + (price || 0);
        }, 0) || 0;
      }

      // 3. Fetch all current payouts to determine limits
      const { data: payouts } = await supabase
        .from('payouts')
        .select('amount')
        .eq('organizer_id', organizerId);

      const requestedTotalKobo = payouts?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const availablePayoutKobo = Math.max(0, totalRevenueKobo - requestedTotalKobo);

      if (parsedData.amount > availablePayoutKobo) {
        return error(res, 'Limit exceeded', `You cannot request a payout of ${parsedData.amount / 100} Naira. Your available payout balance is only ${availablePayoutKobo / 100} Naira.`, 400);
      }

      // 4. Create payout request in payouts
      const { data: payoutRequest, error: insertError } = await supabase
        .from('payouts')
        .insert({
          organizer_id: organizerId,
          amount: parsedData.amount,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        return error(res, 'Request failed', insertError.message, 400);
      }

      return success(res, payoutRequest, 'Payout request submitted successfully!', 201);

    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return error(res, 'Validation failed', err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), 400);
      }
      console.error('Request payout error:', err);
      return error(res, 'Server error creating payout request', err.message, 500);
    }
  }
};

