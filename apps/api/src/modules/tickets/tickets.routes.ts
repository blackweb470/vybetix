import { Router } from 'express';
import { ticketsController } from './tickets.controller';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth';
import { checkoutLimiter } from '../../middleware/rateLimiter';
import { requireRole } from '../../middleware/roleGuard';

const router = Router();

// Public ticket view pass (accessible via secure token from email / SMS without signing in)
router.get('/public/:id', ticketsController.getPublicTicket);

// Checkout supports both registered users AND guest buyers (no account required)
router.post('/checkout', optionalAuthMiddleware, checkoutLimiter, ticketsController.initCheckout);
router.get('/my', authMiddleware, ticketsController.getMyTickets);
router.post('/:id/request-unlock', authMiddleware, ticketsController.requestUnlock);
router.post('/:id/verify-unlock', authMiddleware, ticketsController.verifyUnlock);
router.get('/:id/qr-token', authMiddleware, ticketsController.refreshQR);

// Organizer and gate staff QR decoding and validation endpoints
router.get('/organizer', authMiddleware, requireRole(['organizer', 'admin']), ticketsController.getOrganizerTickets);
router.get('/decode', authMiddleware, requireRole(['organizer', 'admin', 'gate_staff']), ticketsController.getTicketByQR);
router.post('/validate', authMiddleware, requireRole(['organizer', 'admin', 'gate_staff']), ticketsController.validateTicket);

export default router;

