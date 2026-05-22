import cron from 'node-cron';
import { supabase } from '../config/supabase';
import { sendEventReminderEmail } from '../utils/mailer';
import { sendEventReminderWhatsApp } from '../utils/whatsapp';

/**
 * Initializes all automated background jobs for the API.
 */
export function initCronJobs() {
  console.log('[Cron] Initializing automated background jobs...');

  // Run every hour at minute 0 (e.g., 1:00, 2:00, etc.)
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running 24-hour event reminder check...');

    try {
      // 1. Calculate time windows
      // We want events starting between 23 and 24 hours from now
      // Actually, to be safe and catch all events within the next 24 hours that haven't been reminded:
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // 2. Fetch events that are within 24 hours AND haven't sent reminders yet
      const { data: events, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('reminder_sent', false)
        .lte('event_date', next24Hours.toISOString())
        .gt('event_date', now.toISOString()); // don't remind for events already past

      if (eventError) {
        throw new Error(`Failed to fetch upcoming events: ${eventError.message}`);
      }

      if (!events || events.length === 0) {
        console.log('[Cron] No events require reminders at this time.');
        return;
      }

      // 3. Process each event
      for (const event of events) {
        console.log(`[Cron] Dispatching reminders for event: ${event.title}`);

        // Fetch all successful tickets for this event
        const { data: tickets, error: ticketError } = await supabase
          .from('tickets')
          .select('*, orders!inner(paystack_status)')
          .eq('orders.paystack_status', 'success');
          // Wait, we need to join ticket_tiers to filter by event_id. PostgREST makes this tricky.
          // Let's just fetch ticket_tiers for this event, then fetch tickets.
          
        const { data: tiers } = await supabase
          .from('ticket_tiers')
          .select('id')
          .eq('event_id', event.id);

        if (!tiers || tiers.length === 0) continue;

        const tierIds = tiers.map(t => t.id);

        const { data: validTickets } = await supabase
          .from('tickets')
          .select('*, orders!inner(paystack_status)')
          .in('tier_id', tierIds)
          .eq('orders.paystack_status', 'success');

        if (!validTickets || validTickets.length === 0) {
          console.log(`[Cron] No valid tickets found for event: ${event.title}. Marking as reminded.`);
          await supabase.from('events').update({ reminder_sent: true }).eq('id', event.id);
          continue;
        }

        // Group by email to avoid sending duplicate emails/messages to the same person
        const attendeesMap = new Map<string, { name: string, phone: string }>();

        for (const t of validTickets) {
          if (!attendeesMap.has(t.holder_email)) {
            attendeesMap.set(t.holder_email, { name: t.holder_name, phone: t.holder_phone });
          }
        }

        // Dispatch notifications
        let emailsSent = 0;
        let whatsappSent = 0;

        for (const [email, attendee] of attendeesMap.entries()) {
          // Email
          try {
            await sendEventReminderEmail(email, attendee.name, event.title, event.venue, event.event_date);
            emailsSent++;
          } catch (e) {
            console.error(`[Cron] Failed to send reminder email to ${email}:`, e);
          }

          // WhatsApp
          if (attendee.phone) {
            try {
              await sendEventReminderWhatsApp(attendee.phone, attendee.name, event.title);
              whatsappSent++;
            } catch (e) {
              console.error(`[Cron] Failed to send reminder WhatsApp to ${attendee.phone}:`, e);
            }
          }
        }

        console.log(`[Cron] Dispatched ${emailsSent} emails and ${whatsappSent} WhatsApp reminders for "${event.title}".`);

        // 4. Mark event as reminded
        await supabase
          .from('events')
          .update({ reminder_sent: true })
          .eq('id', event.id);
      }
    } catch (err) {
      console.error('[Cron] Error running reminder job:', err);
    }
  });

  console.log('[Cron] Automated jobs active.');
}
