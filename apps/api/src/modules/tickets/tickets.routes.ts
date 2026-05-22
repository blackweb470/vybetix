import { Router } from 'express';
import { ticketsController } from './tickets.controller';
import { authMiddleware } from '../../middleware/auth';
import { checkoutLimiter } from '../../middleware/rateLimiter';
import { requireRole } from '../../middleware/roleGuard';

const router = Router();

// Buyers can request checkouts and access their ticket collections
router.post('/checkout', authMiddleware, checkoutLimiter, ticketsController.initCheckout);
router.get('/my', authMiddleware, ticketsController.getMyTickets);

// Organizer and gate staff QR decoding and validation endpoints
router.get('/decode', authMiddleware, requireRole(['organizer', 'admin']), ticketsController.getTicketByQR);
router.post('/validate', authMiddleware, requireRole(['organizer', 'admin']), ticketsController.validateTicket);

export default router;

