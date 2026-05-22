import { Router } from 'express';
import { paymentsController } from './payments.controller';

const router = Router();

// Hook triggered directly by Paystack servers. Does not require user auth.
router.post('/webhook', paymentsController.paystackWebhook);

// Transaction reference manual verifications (buyer dashboard redirects)
router.get('/verify/:reference', paymentsController.verifyPayment);

// Fetch supported banks from Paystack API
router.get('/banks', paymentsController.getBanks);

// Resolve bank account name
router.post('/resolve-account', paymentsController.resolveAccount);

export default router;

