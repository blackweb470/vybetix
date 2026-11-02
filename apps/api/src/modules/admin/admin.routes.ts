import { Router } from 'express';
import { adminController } from './admin.controller';
import { authMiddleware } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';

const router = Router();

// Administrative routes are locked to authenticating as admin role
router.get('/stats', authMiddleware, requireRole(['admin']), adminController.getPlatformStats);
router.post('/ban', authMiddleware, requireRole(['admin']), adminController.banUser);
router.get('/fraud', authMiddleware, requireRole(['admin']), adminController.getFraudFlags);
router.post('/resolve-flag', authMiddleware, requireRole(['admin']), adminController.resolveFlag);
router.post('/payouts/process', authMiddleware, requireRole(['admin']), adminController.processPayout);

// Paystack subaccounts auto-sync
router.get('/paystack/subaccounts', authMiddleware, requireRole(['admin']), adminController.listPaystackSubaccounts);
router.post('/paystack/sync-subaccounts', authMiddleware, requireRole(['admin']), adminController.syncPaystackSubaccounts);

export default router;
