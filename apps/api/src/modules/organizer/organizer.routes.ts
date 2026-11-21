import { Router } from 'express';
import { organizerController } from './organizer.controller';
import { authMiddleware } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';

const router = Router();

// Require authenticated session (organizer, admin, or buyer viewing their creator portal)
router.get('/dashboard', authMiddleware, requireRole(['organizer', 'admin', 'buyer']), organizerController.getDashboard);
router.get('/events', authMiddleware, requireRole(['organizer', 'admin', 'buyer']), organizerController.getMyEvents);
router.get('/attendees/:eventId', authMiddleware, requireRole(['organizer', 'admin']), organizerController.getAttendees);
router.post('/payout', authMiddleware, requireRole(['organizer', 'admin']), organizerController.requestPayout);

export default router;

