import { Router } from 'express';
import { whatsappController } from './whatsapp.controller';

const router = Router();

// GET — Meta verification handshake (called once when you register the webhook)
router.get('/webhook', whatsappController.verifyWebhook);

// POST — Incoming delivery status updates & user replies from Meta
router.post('/webhook', whatsappController.receiveMessage);

export default router;

