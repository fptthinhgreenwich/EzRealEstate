import { Router } from 'express';
import { walletController } from '../controllers/walletController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get wallet balance
router.get('/balance', walletController.getBalance);

// Get transaction history
router.get('/transactions', walletController.getTransactions);

// Deposit money
router.post('/deposit', walletController.deposit);

// Withdraw money
router.post('/withdraw', walletController.withdraw);

export default router;