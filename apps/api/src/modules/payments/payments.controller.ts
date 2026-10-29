import { Request, Response } from 'express';
import { supabase } from '../../config/supabase';
import { success, error } from '../../utils/response';
import { paystackClient } from '../../config/paystack';
import { generateQRToken, generateQRImage } from '../../utils/qrcode';
import { sendTicketConfirmationEmail } from '../../utils/mailer';
import { sendTicketWhatsAppNotification } from '../../utils/whatsapp';
import crypto from 'crypto';
import { cache } from '../../utils/cache';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock_secret_key_12345';

/**
 * Helper to create ticket instances, update capacities, generate base64 QR codes,
 * and dispatch confirmation emails.
 */
export async function fulfillOrder(orderId: string, tierId: string, attendees: { name: string, email: string, phone: string }[]) {
  try {
    // 1. Parallelize order, tier, and existing tickets checks
    const [orderRes, tierRes, existingTicketsRes] = await Promise.all([
      supabase.from('orders').select('*, events(*)').eq('id', orderId).single(),
      supabase.from('ticket_tiers').select('*').eq('id', tierId).single(),
      supabase.from('tickets').select('id').eq('order_id', orderId)
    ]);

    const order = orderRes.data;
    const tier = tierRes.data;
    const existingTickets = existingTicketsRes.data;

    if (!order) {
      throw new Error(`Order #${orderId} not found during fulfillment`);
    }

    if (!tier) {
      throw new Error(`Ticket tier #${tierId} not found during fulfillment`);
    }

    // 2. Double-check if tickets have already been generated for this order to prevent duplication
    if (existingTickets && existingTickets.length > 0) {
      console.log(`[Order Fulfill] Tickets already generated for Order #${orderId}. Skipping fulfillment.`);
      return;
    }

    const ticketInserts = [];
    const emailTicketsData = [];

    // 3. Group tickets by attendee email so we can send one email per person
    const emailsToSend = new Map<string, { name: string, phone: string, tickets: any[] }>();

    // 4. Generate tickets loop
    for (const attendee of attendees) {
      const ticketId = crypto.randomUUID();
      const qrToken = generateQRToken(ticketId);

      ticketInserts.push({
        id: ticketId,
        order_id: orderId,
        tier_id: tierId,
        holder_name: attendee.name,
        holder_email: attendee.email,
        holder_phone: attendee.phone,
        qr_token: qrToken,
        status: 'active'
      });

      const emailTicketData = {
        id: ticketId,
        tierName: tier.name,
        price: tier.price
      };

      if (!emailsToSend.has(attendee.email)) {
        emailsToSend.set(attendee.email, { name: attendee.name, phone: attendee.phone, tickets: [] });
      }
      emailsToSend.get(attendee.email)!.tickets.push(emailTicketData);
    }

    // 4. Insert tickets to DB
    const { error: insertError } = await supabase
      .from('tickets')
      .insert(ticketInserts);

    if (insertError) {
      throw new Error(`Failed to insert tickets: ${insertError.message}`);
    }

    // 5. Update ticket tier sold quantities
    const { error: tierUpdateError } = await supabase
      .from('ticket_tiers')
      .update({ sold: tier.sold + attendees.length })
      .eq('id', tierId);

    if (tierUpdateError) {
      console.error('[Warning] Failed to update ticket tier sales counter:', tierUpdateError);
    }

    // 6. Send transactional emails & WhatsApp notifications asynchronously (fire-and-forget)
    // We don't await this so that the API responds instantly
    (async () => {
      for (const [email, data] of emailsToSend.entries()) {
        try {
          await sendTicketConfirmationEmail({
            email: email,
            holderName: data.name,
            eventTitle: order.events.title,
            venue: order.events.venue,
            eventDate: order.events.event_date,
            tickets: data.tickets
          });
        } catch (mailError) {
          console.error(`[Fulfillment Warning] Email dispatch failed for ${email}:`, mailError);
        }

        try {
          await sendTicketWhatsAppNotification(data.phone, data.name, order.events.title);
        } catch (waError) {
          console.error(`[Fulfillment Warning] WhatsApp dispatch failed for ${data.phone}:`, waError);
        }
      }
    })().catch(err => console.error("[Fulfillment Warning] Background notification loop failed:", err));

    cache.delPrefix('events:');
    console.log(`[Order Fulfill] Success! Fulfilling completed for Order #${orderId}`);
  } catch (err: any) {
    console.error('Fulfillment execution failure:', err);
    throw err;
  }
}

export const paymentsController = {
  /**
   * Cryptographically verifies Paystack webhook signature headers,
   * updates orders to success on charge.success event, and triggers fulfillment.
   */
  paystackWebhook: async (req: Request, res: Response) => {
    try {
      const signature = req.headers['x-paystack-signature'];
      if (!signature) {
        return res.status(401).send('Missing Paystack signature header');
      }

      // 1. Verify Signature
      const expectedSignature = crypto
        .createHmac('sha256', PAYSTACK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('[Webhook Audit] Signature verification failed!');
        return res.status(401).send('Invalid cryptographic signature');
      }

      const payload = req.body;
      console.log(`[Webhook Event Received] type: ${payload.event}`);

      // 2. Handle successful charges
      if (payload.event === 'charge.success' && payload.data.status === 'success') {
        const reference = payload.data.reference;
        const metadata = payload.data.metadata;

        // Fetch matched order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('paystack_reference', reference)
          .single();

        if (orderError || !order) {
          console.error(`[Webhook Fulfill] Order not found for reference: ${reference}`);
          return res.status(200).send('Order not found but signature verified');
        }

        // Avoid double processing (idempotency checks)
        if (order.paystack_status === 'success') {
          console.log(`[Webhook Fulfill] Order ${reference} was already successfully processed. Skipping.`);
          return res.status(200).send('Order already processed');
        }

        // 3. Update order record to Success
        const { error: updateError } = await supabase
          .from('orders')
          .update({ paystack_status: 'success' })
          .eq('id', order.id);

        if (updateError) {
          console.error(`[Webhook Fulfill] Failed to update order status to success: ${updateError.message}`);
          return res.status(500).send('Database error updating order');
        }

        // Parse metadata if it comes back as string
        let parsedMetadata = metadata;
        if (typeof metadata === 'string') {
          try {
            parsedMetadata = JSON.parse(metadata);
          } catch (e) {
            console.error('Failed to parse Paystack webhook metadata JSON string:', e);
          }
        }

        // 4. Generate tickets and email buyer
        if (parsedMetadata && parsedMetadata.tier_id) {
          let attendees = [];
          
          if (parsedMetadata.attendees) {
             attendees = typeof parsedMetadata.attendees === 'string' 
               ? JSON.parse(parsedMetadata.attendees) 
               : parsedMetadata.attendees;
          } else if (parsedMetadata.holder_name) {
             // Fallback for older orders before checkout array upgrade
             for (let i = 0; i < Number(parsedMetadata.quantity || 1); i++) {
                attendees.push({
                   name: parsedMetadata.holder_name,
                   email: parsedMetadata.holder_email,
                   phone: parsedMetadata.holder_phone
                });
             }
          }

          if (attendees.length > 0) {
            await fulfillOrder(
              order.id,
              parsedMetadata.tier_id,
              attendees
            );
          } else {
            console.error(`[Webhook Fulfill] Error: No attendees mapped for reference: ${reference}`);
          }
        } else {
          // If somehow metadata is absent, lookup default tier info or log alert
          console.error(`[Webhook Fulfill] Warning: Paystack metadata is missing for reference: ${reference}`);
        }
      }

      return res.status(200).send('Webhook handled successfully');
    } catch (err: any) {
      console.error('Webhook processing failure:', err);
      return res.status(500).send(`Server error: ${err.message}`);
    }
  },

  /**
   * Forces manual verification checks by reference (typically for front-end redirection sync).
   */
  verifyPayment: async (req: Request, res: Response) => {
    try {
      const { reference } = req.params;
      if (!reference) {
        return error(res, 'Verification error', 'Order transaction reference parameter is missing', 400);
      }

      // 1. Fast check: See if webhook already processed this order
      const { data: order, error: queryError } = await supabase
        .from('orders')
        .select('*, events(*)')
        .eq('paystack_reference', reference)
        .single();

      if (queryError || !order) {
        return error(res, 'Order missing', 'No matching order details found in Vybetix registries', 404);
      }

      // If webhook already processed it, return instantly!
      if (order.paystack_status === 'success') {
        const { data: tickets } = await supabase
          .from('tickets')
          .select('*, ticket_tiers(name, price)')
          .eq('order_id', order.id);

        return success(res, { order, tickets }, 'Payment successfully verified via webhook!');
      }

      // 2. Fallback: Call Paystack API only if the webhook hasn't updated it yet
      let paystackData;
      try {
        paystackData = await paystackClient.verifyTransaction(reference);
      } catch (err) {
        return error(res, 'Verification failed', 'Could not reach Paystack verification server', 500);
      }

      if (paystackData.status === 'success') {
        // Update order status in database
        await supabase
          .from('orders')
          .update({ paystack_status: 'success' })
          .eq('id', order.id);

        // Fetch matching metadata (from DB or retrieve from Paystack payload)
        // Paystack returns metadata under response object
        let parsedMetadata = paystackData.metadata;
        if (typeof parsedMetadata === 'string') {
          try {
            parsedMetadata = JSON.parse(parsedMetadata);
          } catch (e) {
            console.error('Failed to parse Paystack verification metadata JSON string:', e);
          }
        }

        if (parsedMetadata && parsedMetadata.tier_id) {
          let attendees = [];
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
            await fulfillOrder(
              order.id,
              parsedMetadata.tier_id,
              attendees
            );
          }
        }

        const { data: tickets } = await supabase
          .from('tickets')
          .select('*, ticket_tiers(name, price)')
          .eq('order_id', order.id);

        return success(res, { order: { ...order, paystack_status: 'success' }, tickets }, 'Payment verified and tickets generated!');
      } else {
        // Update order status to failed
        await supabase
          .from('orders')
          .update({ paystack_status: 'failed' })
          .eq('id', order.id);

        return error(res, 'Payment failed', `Transaction status: ${paystackData.status}`, 400);
      }
    } catch (err: any) {
      console.error('Verify payment error:', err);
      return error(res, 'Verification check failed', err.message, 500);
    }
  },

  /**
   * Fetches supported Nigerian banks from Paystack API.
   */
  getBanks: async (req: Request, res: Response) => {
    try {
      const response = await fetch('https://api.paystack.co/bank?country=nigeria', {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (!result.status) {
        return error(res, 'Failed to fetch banks', result.message, 400);
      }
      return success(res, result.data, 'Banks fetched successfully');
    } catch (err: any) {
      console.error('Fetch banks error:', err);
      return error(res, 'Server error fetching banks', err.message, 500);
    }
  },

  /**
   * Resolves account number and bank code to fetch account name
   */
  resolveAccount: async (req: Request, res: Response) => {
    try {
      const { account_number, bank_code } = req.body;
      if (!account_number || !bank_code) {
        return error(res, 'Missing parameters', 'account_number and bank_code are required', 400);
      }
      
      const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      });
      
      const result = await response.json();
      
      if (!result.status) {
        return error(res, 'Account resolution failed', result.message, 400);
      }
      
      return success(res, result.data, 'Account resolved successfully');
    } catch (err: any) {
      console.error('Resolve account error:', err);
      return error(res, 'Server error resolving account', err.message, 500);
    }
  }
};

