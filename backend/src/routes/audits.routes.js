import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';
import { closeAudit, createAudit, listAudits, markAuditItem } from '../services/audits.service.js';

const router = Router();
router.use(authenticate);
router.get('/', asyncHandler(async (req, res) => res.json(await listAudits())));
router.post('/', requireRole('ADMIN', 'ASSET_MANAGER'), asyncHandler(async (req, res) => res.status(201).json(await createAudit(req.user, req.body))));
router.patch('/items/:id', asyncHandler(async (req, res) => res.json(await markAuditItem(req.user, req.params.id, req.body))));
router.patch('/:id/close', requireRole('ADMIN', 'ASSET_MANAGER'), asyncHandler(async (req, res) => res.json(await closeAudit(req.user, req.params.id))));
export default router;
