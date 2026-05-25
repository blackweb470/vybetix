import { Router } from 'express';
import { ticketsController } from './tickets.controller';
import { authMiddleware } from '../../middleware/auth';
import { checkoutLimiter } from '../../middleware/rateLimiter';
import { requireRole } from '../../middleware/roleGuard';

const router = Router();

// Buyers can request checkouts and access their ticket collections
router.post('/checkout', authMiddleware, checkoutLimiter, ticketsController.initCheckout);
router.get('/my', authMiddleware, ticketsController.getMyTickets);
router.post('/:id/request-unlock', authMiddleware, ticketsController.requestUnlock);
router.post('/:id/verify-unlock', authMiddleware, ticketsController.verifyUnlock);
router.get('/:id/qr-token', authMiddleware, ticketsController.refreshQR);

// Organizer and gate staff QR decoding and validation endpoints
router.get('/organizer', authMiddleware, requireRole(['organizer', 'admin']), ticketsController.getOrganizerTickets);
router.get('/decode', authMiddleware, requireRole(['organizer', 'admin', 'gate_staff']), ticketsController.getTicketByQR);
router.post('/validate', authMiddleware, requireRole(['organizer', 'admin', 'gate_staff']), ticketsController.validateTicket);

export default router;

