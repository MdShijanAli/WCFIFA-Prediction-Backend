import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  initiatePayment,
  confirmDemoPayment,
  paymentIPN,
  getPaymentStatus,
} from '../controllers/payment.controller';

const router = Router();

router.post('/initiate', authenticate, initiatePayment);
router.post('/confirm-demo', authenticate, confirmDemoPayment);
router.post('/ipn', paymentIPN);
router.get('/status', authenticate, getPaymentStatus);

export default router;
