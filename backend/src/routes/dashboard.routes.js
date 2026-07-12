import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';
import { getDashboard } from '../services/dashboard.service.js';

const router = Router();
router.use(authenticate);
router.get('/', asyncHandler(async (req, res) => res.json(await getDashboard(req.user))));
export default router;
