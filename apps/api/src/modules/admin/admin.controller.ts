import { Response } from 'express';
import { supabase } from '../../config/supabase';
import { success, error } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';
import { paystackClient } from '../../config/paystack';
import { z } from 'zod';

const banUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  ban: z.boolean().default(true)
});

const resolveFlagSchema = z.object({
  flagId: z.string().uuid('Invalid fraud flag ID'),
  resolvedStatus: z.enum(['resolved', 'dismissed'] as const).default('resolved'),
  adminNotes: z.string().min(5, 'Notes must be at least 5 characters long')
});

export const adminController = {
  /**
   * Compiles global, high-level administrative platform-wide performance metrics,
   * including active vs non-active events, revenue generated vs not generated,
   * and financial allocations (Organizer 96% vs Platform 4% Commission + ₦100 Service Fee).
   */
  getPlatformStats: async (req: AuthRequest, res: Response) => {
    try {
      // 1. Sum up all users by role
      const { data: users, error: usersErr } = await supabase
        .from('users')
        .select('role, is_banned');

      if (usersErr) {
        return error(res, 'Admin stats failed', usersErr.message, 400);
      }

      // 2. Fetch successful orders first to map to events
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('id, event_id, total_amount, paystack_status')
        .eq('paystack_status', 'success');

      if (ordersErr) {
        return error(res, 'Admin stats failed fetching orders', ordersErr.message, 400);
      }

      const eventOrdersMap = new Map<string, any[]>();
      for (const o of (orders || [])) {
        if (!eventOrdersMap.has(o.event_id)) {
          eventOrdersMap.set(o.event_id, []);
        }
        eventOrdersMap.get(o.event_id)!.push(o);
      }

      // 3. Fetch all events with ticket tiers and organizer details
      const { data: eventsList, error: eventsErr } = await supabase
        .from('events')
        .select(`
          id,
          title,
          slug,
          event_date,
          end_date,
          status,
          venue,
          city,
          organizer_id,
          created_at,
          organizer:users(full_name, email),
          ticket_tiers(id, name, price, quantity, sold)
        `)
        .order('created_at', { ascending: false });

      if (eventsErr) {
        console.error('Error fetching events in admin stats:', eventsErr);
        return error(res, 'Admin stats failed fetching events', eventsErr.message, 400);
      }

      const now = new Date();
      let totalActiveEvents = 0;
      let totalInactiveEvents = 0;

      // Financial allocation sums
      let platformTotalGrossCollectedKobo = 0;
      let platformTotalTicketSalesKobo = 0;
      let platformTotalOrganizerAllocationsKobo = 0;
      let platformTotal4PercentCommissionKobo = 0;
      let platformTotalServiceFeesKobo = 0;
      let platformTotalVybetixEarningsKobo = 0;

      let totalNotGeneratedRevenueKobo = 0;
      let activeGeneratedRevenueKobo = 0;
      let activeNotGeneratedRevenueKobo = 0;
      let inactiveGeneratedRevenueKobo = 0;
      let inactiveNotGeneratedRevenueKobo = 0;

      const eventsBreakdown = (eventsList || []).map((ev: any) => {
        const isPastDate = new Date(ev.end_date || ev.event_date) <= now;
        const isEndedStatus = ev.status === 'completed' || ev.status === 'cancelled';
        const isActive = !isPastDate && !isEndedStatus;

        if (isActive) {
          totalActiveEvents++;
        } else {
          totalInactiveEvents++;
        }

        const tiers = ev.ticket_tiers || [];
        const totalCapacity = tiers.reduce((acc: number, t: any) => acc + (t.quantity || 0), 0);
        const totalSold = tiers.reduce((acc: number, t: any) => acc + (t.sold || 0), 0);

        // Orders metrics for this event
        const eventOrders = eventOrdersMap.get(ev.id) || [];
        const paidOrdersCount = eventOrders.filter((o: any) => o.total_amount > 0).length;

        // Gross ticket sales (face value)
        const grossTicketSalesKobo = tiers.reduce((acc: number, t: any) => acc + ((t.sold || 0) * (t.price || 0)), 0);

        // Flat service fee: 100 Naira (10,000 kobo) per paid order
        const serviceFeesKobo = paidOrdersCount * 10000;

        // Total collected from buyers = ticket sales + service fees
        const grossCollectedKobo = grossTicketSalesKobo + serviceFeesKobo;

        // Vybetix 4% platform commission on ticket face value
        const commission4PercentKobo = Math.round(grossTicketSalesKobo * 0.04);

        // Total Vybetix take = 4% commission + service fees
        const platformTotalTakeKobo = commission4PercentKobo + serviceFeesKobo;

        // Net amount allocated to organizer = gross ticket sales - 4% commission (96% of ticket sales)
        const organizerAllocationKobo = Math.max(0, grossTicketSalesKobo - commission4PercentKobo);

        // Unsold tickets * price (Revenue not yet generated)
        const notGeneratedRevenueKobo = tiers.reduce((acc: number, t: any) => {
          const unsold = Math.max(0, (t.quantity || 0) - (t.sold || 0));
          return acc + (unsold * (t.price || 0));
        }, 0);

        // Potential organizer payout if all remaining tickets sell (96%)
        const potentialOrganizerAllocationKobo = Math.round(notGeneratedRevenueKobo * 0.96);

        // Accumulate platform-wide totals
        platformTotalGrossCollectedKobo += grossCollectedKobo;
        platformTotalTicketSalesKobo += grossTicketSalesKobo;
        platformTotalOrganizerAllocationsKobo += organizerAllocationKobo;
        platformTotal4PercentCommissionKobo += commission4PercentKobo;
        platformTotalServiceFeesKobo += serviceFeesKobo;
        platformTotalVybetixEarningsKobo += platformTotalTakeKobo;
        totalNotGeneratedRevenueKobo += notGeneratedRevenueKobo;

        if (isActive) {
          activeGeneratedRevenueKobo += grossTicketSalesKobo;
          activeNotGeneratedRevenueKobo += notGeneratedRevenueKobo;
        } else {
          inactiveGeneratedRevenueKobo += grossTicketSalesKobo;
          inactiveNotGeneratedRevenueKobo += notGeneratedRevenueKobo;
        }

        return {
          id: ev.id,
          title: ev.title,
          slug: ev.slug,
          eventDate: ev.event_date,
          endDate: ev.end_date,
          venue: ev.venue,
          city: ev.city,
          isActive,
          status: ev.status,
          organizer: ev.organizer ? (() => {
            const o = Array.isArray(ev.organizer) ? ev.organizer[0] : ev.organizer;
            return o ? { name: o.full_name || 'Unnamed Organizer', email: o.email || '' } : null;
          })() : null,
          totalCapacity,
          totalSold,
          paidOrdersCount,
          fillRate: totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0,

          // Exact Financial Allocations
          grossTicketSalesKobo,
          serviceFeesKobo,
          grossCollectedKobo,
          commission4PercentKobo,
          platformTotalTakeKobo,
          organizerAllocationKobo,
          notGeneratedRevenueKobo,
          potentialOrganizerAllocationKobo,
          totalPotentialRevenueKobo: grossTicketSalesKobo + notGeneratedRevenueKobo
        };
      });

      // 4. Fetch pending payout requests needing manual approval (safe fallback)
      let pendingPayoutRequests: any[] = [];
      try {
        const { data: pData } = await supabase
          .from('payouts')
          .select('*, organizer:users(full_name, email)')
          .eq('status', 'pending');
        pendingPayoutRequests = pData || [];
      } catch (pErr) {
        pendingPayoutRequests = [];
      }

      // 5. Gather outstanding security fraud triggers (safe fallback)
      let activeFraudFlags = 0;
      try {
        const { count: fCount } = await supabase
          .from('fraud_flags')
          .select('*', { count: 'exact', head: true })
          .eq('resolved', false);
        activeFraudFlags = fCount || 0;
      } catch (fErr) {
        activeFraudFlags = 0;
      }

      return success(res, {
        totalUsers: users.length,
        totalBuyers: users.filter(u => u.role === 'buyer').length,
        totalOrganizers: users.filter(u => u.role === 'organizer').length,
        totalBannedUsers: users.filter(u => u.is_banned).length,
        totalEvents: eventsList?.length || 0,
        activeEvents: totalActiveEvents,
        inactiveEvents: totalInactiveEvents,
        totalSuccessfulOrders: orders.length,

        // Financial Allocations Platform-wide
        platformTotalGrossCollectedKobo,
        platformTotalTicketSalesKobo,
        platformTotalOrganizerAllocationsKobo,
        platformTotal4PercentCommissionKobo,
        platformTotalServiceFeesKobo,
        platformTotalVybetixEarningsKobo,

        // Generated vs Unsold
        totalGeneratedRevenueKobo: platformTotalTicketSalesKobo,
        totalNotGeneratedRevenueKobo,
        activeGeneratedRevenueKobo,
        activeNotGeneratedRevenueKobo,
        inactiveGeneratedRevenueKobo,
        inactiveNotGeneratedRevenueKobo,

        // Per-event list
        eventsBreakdown,

        activeFraudFlags: activeFraudFlags || 0,
        pendingPayoutRequests: pendingPayoutRequests || []
      }, 'Global platform stats compiled successfully!');

    } catch (err: any) {
      console.error('Get platform stats error:', err);
      return error(res, 'Server error building platform metrics', err.message, 500);
    }
  },

  /**
   * Suspends (bans) or reactivates a user's account profile in the database.
   */
  banUser: async (req: AuthRequest, res: Response) => {
    try {
      const parsedData = banUserSchema.parse(req.body);

      // Prevent banning yourself
      if (parsedData.userId === req.user?.id) {
        return error(res, 'Forbidden', 'Self-suspension is blocked', 403);
      }

      const { data: user, error: updateErr } = await supabase
        .from('users')
        .update({ is_banned: parsedData.ban })
        .eq('id', parsedData.userId)
        .select()
        .single();

      if (updateErr) {
        return error(res, 'Ban failed', updateErr.message, 400);
      }

      // If banning an active user, terminate any active Auth sessions from Supabase
      if (parsedData.ban) {
        await supabase.auth.admin.signOut(parsedData.userId);
      }

      return success(
        res,
        user,
        `User profile has been successfully ${parsedData.ban ? 'suspended (banned)' : 'reactivated'}`
      );

    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return error(res, 'Validation failed', err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), 400);
      }
      console.error('Ban user error:', err);
      return error(res, 'Server error toggling user ban', err.message, 500);
    }
  },

  /**
   * Retrieves security and fraud logs recorded in the fraud_flags audit table.
   */
  getFraudFlags: async (req: AuthRequest, res: Response) => {
    try {
      const { data: flags, error: queryError } = await supabase
        .from('fraud_flags')
        .select('*, tickets(*, ticket_tiers(name, events(title)))')
        .order('created_at', { ascending: false });

      if (queryError) {
        return error(res, 'Query failed', queryError.message, 400);
      }

      return success(res, flags, 'Fraud flags logs fetched successfully');
    } catch (err: any) {
      console.error('Get fraud flags error:', err);
      return error(res, 'Server error loading fraud audit logs', err.message, 500);
    }
  },

  /**
   * Resolves or dismisses an active security threat flag from the logs.
   */
  resolveFlag: async (req: AuthRequest, res: Response) => {
    try {
      const parsedData = resolveFlagSchema.parse(req.body);

      const { data: flag, error: updateError } = await supabase
        .from('fraud_flags')
        .update({
          resolved: true,
          resolution_notes: parsedData.adminNotes,
          resolved_at: new Date().toISOString()
        })
        .eq('id', parsedData.flagId)
        .select()
        .single();

      if (updateError) {
        return error(res, 'Resolution update failed', updateError.message, 400);
      }

      return success(res, flag, `Security flag successfully resolved: Status set to ${parsedData.resolvedStatus}`);

    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return error(res, 'Validation failed', err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), 400);
      }
      console.error('Resolve fraud flag error:', err);
      return error(res, 'Server error resolving audit flag', err.message, 500);
    }
  },

  /**
   * Approves and processes an organizer's pending payout request.
   */
  processPayout: async (req: AuthRequest, res: Response) => {
    try {
      const { payoutId, status } = req.body;
      if (!payoutId) {
        return error(res, 'Validation error', 'payoutId is required', 400);
      }

      const newStatus = status || 'paid';

      const { data: payout, error: updateErr } = await supabase
        .from('payouts')
        .update({
          status: newStatus,
          paid_at: new Date().toISOString()
        })
        .eq('id', payoutId)
        .select('*, organizer:users(full_name, email)')
        .single();

      if (updateErr) {
        return error(res, 'Payout processing failed', updateErr.message, 400);
      }

      return success(res, payout, `Payout request approved and status set to ${newStatus}`);
    } catch (err: any) {
      console.error('Process payout error:', err);
      return error(res, 'Server error processing payout', err.message, 500);
    }
  },

  /**
   * Retrieves all live subaccounts directly from Paystack.
   */
  listPaystackSubaccounts: async (req: AuthRequest, res: Response) => {
    try {
      const subaccounts = await paystackClient.listSubaccounts();
      return success(res, subaccounts, 'Paystack subaccounts fetched successfully');
    } catch (err: any) {
      console.error('List Paystack subaccounts error:', err);
      return error(res, 'Failed to fetch Paystack subaccounts', err.message, 500);
    }
  },

  /**
   * Automatically scans Paystack for existing subaccounts and synchronizes
   * the subaccount codes into Supabase organizer_profiles.
   */
  syncPaystackSubaccounts: async (req: AuthRequest, res: Response) => {
    try {
      const remoteSubaccounts = await paystackClient.listSubaccounts();
      if (!remoteSubaccounts || remoteSubaccounts.length === 0) {
        const isTestKey = (process.env.PAYSTACK_SECRET_KEY || '').startsWith('sk_test_');
        const hint = isTestKey
          ? 'No subaccounts found under your Paystack TEST key. If your subaccounts are in Live Mode, update PAYSTACK_SECRET_KEY in apps/api/.env with your sk_live_... key, or create a test subaccount on Paystack.'
          : 'No subaccounts found on your Paystack merchant account. Please create a subaccount on Paystack first.';
        return error(res, 'No subaccounts found', hint, 404);
      }

      // Fetch all organizers
      const { data: organizers, error: orgErr } = await supabase
        .from('organizer_profiles')
        .select('*, user:users(id, full_name, email)');

      if (orgErr) {
        return error(res, 'Failed to fetch organizer profiles', orgErr.message, 500);
      }

      // 1. Automatically update percentage_charge to 4% on Paystack for ALL remote subaccounts
      // so your Paystack dashboard shows 4% instead of 100% or 0%
      for (const s of remoteSubaccounts) {
        if (s.percentage_charge !== 4) {
          try {
            await paystackClient.updateSubaccountPercentage(s.subaccount_code, 4);
            console.log(`[Sync] Updated Paystack dashboard percentage for ${s.subaccount_code} to 4%`);
          } catch (pUpdErr: any) {
            console.warn(`[Sync] Could not update percentage for ${s.subaccount_code}:`, pUpdErr.message);
          }
        }
      }

      const updates: any[] = [];

      for (const org of (organizers || [])) {
        // Try to match by account number or business name, prioritizing VERIFIED subaccounts
        const matchingCandidates = remoteSubaccounts.filter(s =>
          (org.account_number && s.account_number === org.account_number) ||
          (org.business_name && s.business_name?.toLowerCase() === org.business_name?.toLowerCase())
        );

        matchingCandidates.sort((a, b) => {
          if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1;
          if (a.active !== b.active) return a.active ? -1 : 1;
          return b.id - a.id;
        });

        const matched = matchingCandidates[0] || (remoteSubaccounts.length === 1 ? remoteSubaccounts[0] : null);

        if (matched) {
          const { error: updateErr } = await supabase
            .from('organizer_profiles')
            .update({
              paystack_subaccount_code: matched.subaccount_code,
              bank_name: org.bank_name || matched.settlement_bank,
              account_number: org.account_number || matched.account_number,
              business_name: org.business_name || matched.business_name,
              verified: true
            })
            .eq('id', org.id);

          if (!updateErr) {
            const orgUser = Array.isArray(org.user) ? org.user[0] : org.user;
            updates.push({
              organizerId: org.user_id,
              organizerName: orgUser?.full_name || org.business_name,
              subaccountCode: matched.subaccount_code,
              businessName: matched.business_name,
              accountNumber: matched.account_number
            });
          }
        }
      }

      // Also check all events and ensure the organizer has a linked subaccount
      const { data: eventsList } = await supabase
        .from('events')
        .select('organizer_id, title, organizer:users(full_name, email)');

      for (const ev of (eventsList || [])) {
        if (!ev.organizer_id) continue;
        const existing = (organizers || []).find(o => o.user_id === ev.organizer_id);
        if ((!existing || !existing.paystack_subaccount_code) && remoteSubaccounts.length >= 1) {
          // If there's a verified subaccount, prefer it
          const s = remoteSubaccounts.find(x => x.is_verified) || remoteSubaccounts[0];
          await supabase
            .from('organizer_profiles')
            .upsert({
              user_id: ev.organizer_id,
              business_name: s.business_name,
              bank_name: s.settlement_bank,
              account_number: s.account_number,
              account_name: s.business_name,
              paystack_subaccount_code: s.subaccount_code,
              verified: true
            }, { onConflict: 'user_id' });

          const evOrgUser = Array.isArray(ev.organizer) ? ev.organizer[0] : ev.organizer;
          updates.push({
            organizerId: ev.organizer_id,
            organizerName: evOrgUser?.full_name || s.business_name,
            subaccountCode: s.subaccount_code,
            businessName: s.business_name,
            accountNumber: s.account_number
          });
        }
      }

      return success(res, {
        remoteSubaccountsCount: remoteSubaccounts.length,
        syncedCount: updates.length,
        syncedOrganizers: updates
      }, `Successfully synced ${updates.length} organizer profile(s) with Paystack subaccounts!`);

    } catch (err: any) {
      console.error('Sync Paystack subaccounts error:', err);
      return error(res, 'Failed to sync Paystack subaccounts', err.message, 500);
    }
  }
};
// Subaccount sync and live key bindings active
