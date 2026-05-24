import { Response } from 'express';
import { supabase } from '../../config/supabase';
import { success, error } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';
import { verifyQRToken } from '../../utils/qrcode';

export const scannerController = {
  /**
   * Performs real-time scanning of the decoded base64 QR token.
   * Checks cryptographic integrity, catches counterfeits/duplicates/cancellations,
   * updates the ticket status to 'used', and registers scan timestamp.
   */
  scanTicket: async (req: AuthRequest, res: Response) => {
    try {
      const { qrToken } = req.params;
      
      if (!qrToken) {
        return error(res, 'Scan failed', 'Missing QR token parameter', 400);
      }

      // 1. Decode and verify the cryptographic signature
      const decoded = verifyQRToken(qrToken);
      if (!decoded) {
        // Cryptographical failure: Fake ticket!
        return res.status(200).json({
          success: true,
          data: {
            status: 'INVALID',
            message: 'Fake ticket - cryptographical signature verification failed'
          }
        });
      }

      // 2. Fetch the corresponding ticket from the database
      const { data: ticket, error: queryError } = await supabase
        .from('tickets')
        .select(`
          id, status, holder_name, scanned_at,
          ticket_tiers:ticket_tiers!inner(
            name,
            event_id,
            events:events(title, organizer_id, end_date)
          )
        `)
        .eq('id', decoded.ticketId)
        .single() as any;

      if (queryError || !ticket) {
        return res.status(200).json({
          success: true,
          data: {
            status: 'INVALID',
            message: 'Fake ticket - ticket record not found in database registry'
          }
        });
      }

      // 3. Authorization Check: Ensure active staff/organizer belongs to this event or is admin
      if (req.user?.role !== 'admin' && ticket.ticket_tiers.events.organizer_id !== req.user?.id) {
        return error(res, 'Forbidden', 'You are not authorized to scan tickets for this event', 403);
      }

      // 4. Check status constraints & Expiration
      const eventEndDate = new Date(ticket.ticket_tiers.events.end_date);
      if (new Date() > eventEndDate) {
        return res.status(200).json({
          success: true,
          data: {
            status: 'EXPIRED',
            message: 'This event has officially ended. Tickets can no longer be scanned.'
          }
        });
      }

      const isReEntry = ticket.status === 'used';

      if (ticket.status === 'cancelled') {
        return res.status(200).json({
          success: true,
          data: {
            status: 'CANCELLED',
            holder_name: ticket.holder_name
          }
        });
      }

      // 5. Update status to Used and record timestamp
      const nowStr = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'used',
          scanned_at: nowStr
        })
        .eq('id', ticket.id);

      if (updateError) {
        return error(res, 'Database error', 'Failed to check in ticket status', 500);
      }

      return res.status(200).json({
        success: true,
        data: {
          status: 'VALID',
          is_re_entry: isReEntry,
          holder_name: ticket.holder_name,
          tier_name: ticket.ticket_tiers.name,
          event_title: ticket.ticket_tiers.events.title
        }
      });

    } catch (err: any) {
      console.error('Scan ticket controller failure:', err);
      return error(res, 'Server error executing scan', err.message, 500);
    }
  },

  /**
   * Retrieves active check-in statistics for an event.
   */
  getEventScanStats: async (req: AuthRequest, res: Response) => {
    try {
      const { eventId } = req.params;
      if (!req.user) {
        return error(res, 'Unauthorized', 'Session required', 401);
      }

      // Check ownership
      const { data: event } = await supabase
        .from('events')
        .select('organizer_id, title')
        .eq('id', eventId)
        .single();

      if (!event) {
        return error(res, 'Event not found', 'Target event missing', 404);
      }

      if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
        return error(res, 'Forbidden', 'You do not own this event', 403);
      }

      // Query ticket details joining tiers
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('status, ticket_tiers!inner(event_id)')
        .eq('ticket_tiers.event_id', eventId);

      if (ticketsError) {
        return error(res, 'Stats query failed', ticketsError.message, 400);
      }

      const totalSold = tickets.length;
      const totalScanned = tickets.filter(t => t.status === 'used').length;
      const totalActive = tickets.filter(t => t.status === 'active').length;
      const totalCancelled = tickets.filter(t => t.status === 'cancelled').length;

      return success(res, {
        eventTitle: event.title,
        totalSold,
        totalScanned,
        totalActive,
        totalCancelled,
        scanRate: totalSold > 0 ? (totalScanned / totalSold) * 100 : 0
      }, 'Scan statistics fetched successfully');

    } catch (err: any) {
      console.error('Get scan stats error:', err);
      return error(res, 'Server error fetching statistics', err.message, 500);
    }
  }
};

