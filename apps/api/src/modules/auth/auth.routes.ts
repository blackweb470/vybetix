import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/google', authController.googleOAuth);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.getCurrentUser);
router.patch('/profile', authMiddleware, authController.updateProfile);

export default router;

