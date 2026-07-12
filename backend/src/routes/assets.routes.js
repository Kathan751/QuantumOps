import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';
import { createAsset, getAsset, listAssets } from '../services/assets.service.js';

const router = Router();
router.use(authenticate);
router.get('/', asyncHandler(async (req, res) => res.json(await listAssets(req.query))));
router.post('/', requireRole('ADMIN', 'ASSET_MANAGER'), asyncHandler(async (req, res) => res.status(201).json(await createAsset(req.user, req.body))));
router.get('/:id', asyncHandler(async (req, res) => res.json(await getAsset(req.params.id))));
export default router;
