import { Response } from 'express';
import { supabase } from '../../config/supabase';
import { success, error } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';
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
   * Compiles global, high-level administrative platform-wide performance metrics.
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

      // 2. Count events and tickets
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // 3. Sum up platform revenue in kobo
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('total_amount, paystack_status')
        .eq('paystack_status', 'success');

      if (ordersErr) {
        return error(res, 'Admin stats failed', ordersErr.message, 400);
      }

      const totalRevenueKobo = orders.reduce((sum, o) => sum + o.total_amount, 0);

      // 4. Fetch pending payout requests needing manual approval
      const { data: pendingPayouts } = await supabase
        .from('payouts')
        .select('*, organizer:users(full_name, email)')
        .eq('status', 'pending');

      // 5. Gather outstanding security fraud triggers
      const { count: activeFraudFlags } = await supabase
        .from('fraud_flags')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', false);

      return success(res, {
        totalUsers: users.length,
        totalBuyers: users.filter(u => u.role === 'buyer').length,
        totalOrganizers: users.filter(u => u.role === 'organizer').length,
        totalBannedUsers: users.filter(u => u.is_banned).length,
        totalEvents: eventsCount || 0,
        totalSuccessfulOrders: orders.length,
        totalRevenueKobo,
        activeFraudFlags: activeFraudFlags || 0,
        pendingPayoutRequests: pendingPayouts || []
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
  }
};

