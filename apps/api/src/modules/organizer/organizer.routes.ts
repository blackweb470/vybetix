import { Router } from 'express';
import { organizerController } from './organizer.controller';
import { authMiddleware } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';

const router = Router();

// Require authenticated session belonging to either an active organizer or system administrator
router.get('/dashboard', authMiddleware, requireRole(['organizer', 'admin']), organizerController.getDashboard);
router.get('/events', authMiddleware, requireRole(['organizer', 'admin']), organizerController.getMyEvents);
router.get('/attendees/:eventId', authMiddleware, requireRole(['organizer', 'admin']), organizerController.getAttendees);
router.post('/payout', authMiddleware, requireRole(['organizer', 'admin']), organizerController.requestPayout);

export default router;

