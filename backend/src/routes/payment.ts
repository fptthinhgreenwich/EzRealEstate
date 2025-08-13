import express from 'express';
import { vnpayController } from '../controllers/vnpayController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// VNPay routes
router.post('/vnpay/create-payment', authMiddleware, vnpayController.createTopupPayment);
router.get('/vnpay-return', vnpayController.vnpayReturn);  // Match the URL VNPAY is using
router.get('/vnpay/return', vnpayController.vnpayReturn);  // Keep both for compatibility
router.get('/vnpay-ipn', vnpayController.vnpayIpn);
router.get('/vnpay/ipn', vnpayController.vnpayIpn);
router.get('/vnpay/check-status/:orderId', authMiddleware, vnpayController.checkTransactionStatus);

export default router;
