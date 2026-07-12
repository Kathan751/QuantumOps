import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';
import { createMaintenance, listMaintenance, transitionMaintenance } from '../services/maintenance.service.js';

const router = Router();
router.use(authenticate);
router.get('/', asyncHandler(async (req, res) => res.json(await listMaintenance(req.user))));
router.post('/', asyncHandler(async (req, res) => res.status(201).json(await createMaintenance(req.user, req.body))));
router.patch('/:id/:action', requireRole('ADMIN', 'ASSET_MANAGER'), asyncHandler(async (req, res) => res.json(await transitionMaintenance(req.user, req.params.id, req.params.action, req.body))));
export default router;
