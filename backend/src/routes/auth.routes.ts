import { Router } from 'express';
import {
  register,
  login,
  verifyPhone,
  resendOTP,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getProfile,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-phone', verifyPhone);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', authenticate, verifyEmail);
router.get('/profile', authenticate, getProfile);

export default router;
