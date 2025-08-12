import { Router } from 'express';
import { premiumController } from '../controllers/premiumController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get premium pricing (public)
router.get('/pricing', premiumController.getPricing);

// Upgrade to premium (requires auth)
router.post('/upgrade', authMiddleware, premiumController.upgradeToPremium);

export default router;