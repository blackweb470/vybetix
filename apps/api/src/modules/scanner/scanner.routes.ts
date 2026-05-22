import { Router } from 'express';
import { scannerController } from './scanner.controller';
import { authMiddleware } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';
import { scanLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Restrict QR scanning to organizers and administrators. Incorporates rate-limiting protection.
router.post('/scan/:qrToken', authMiddleware, requireRole(['organizer', 'admin']), scanLimiter, scannerController.scanTicket);

// Fetch scans breakdown metrics
router.get('/stats/:eventId', authMiddleware, requireRole(['organizer', 'admin']), scannerController.getEventScanStats);

export default router;

