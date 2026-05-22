import { Request, Response } from 'express';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'tixwave_whatsapp_verify';

export const whatsappController = {

  /**
   * GET /api/whatsapp/webhook
   * Meta calls this endpoint to verify your webhook URL is real.
   * It sends hub.mode, hub.verify_token, and hub.challenge.
   * We must return hub.challenge if the token matches.
   */
  verifyWebhook: (req: Request, res: Response) => {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('[WhatsApp Webhook] Verification request received:', { mode, token });

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[WhatsApp Webhook] ✅ Verified successfully.');
      return res.status(200).send(challenge);
    }

    console.warn('[WhatsApp Webhook] ❌ Verification failed — token mismatch.');
    return res.status(403).json({ error: 'Forbidden: verify token mismatch' });
  },

  /**
   * POST /api/whatsapp/webhook
   * Meta sends message delivery status updates here (sent, delivered, read, failed).
   * Also receives incoming replies from users if enabled.
   */
  receiveMessage: (req: Request, res: Response) => {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') {
      return res.status(404).json({ error: 'Not a WhatsApp event' });
    }

    try {
      const entries = body.entry || [];

      for (const entry of entries) {
        const changes = entry.changes || [];

        for (const change of changes) {
          const value = change.value;

          // Handle delivery/read status updates
          const statuses = value?.statuses || [];
          for (const status of statuses) {
            console.log(`[WhatsApp] Message ${status.id} → status: ${status.status} for ${status.recipient_id}`);
            // You can log to DB here if you want delivery receipts stored
          }

          // Handle incoming replies from ticket holders (optional)
          const messages = value?.messages || [];
          for (const msg of messages) {
            const from = msg.from;
            const text = msg.text?.body || '[non-text message]';
            console.log(`[WhatsApp] Incoming reply from ${from}: "${text}"`);
            // Future: auto-reply with support info or ticket link
          }
        }
      }

      // Always return 200 quickly — Meta retries if you don't
      return res.sendStatus(200);

    } catch (err) {
      console.error('[WhatsApp Webhook] Error processing message:', err);
      return res.sendStatus(200); // Still return 200 to prevent Meta retries
    }
  }
};

