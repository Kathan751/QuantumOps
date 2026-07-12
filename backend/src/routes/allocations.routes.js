import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';
import { createAllocation, decideTransfer, listAllocations, listTransfers, requestTransfer, returnAllocation } from '../services/allocations.service.js';

const router = Router();
router.use(authenticate);
router.get('/allocations', asyncHandler(async (req, res) => res.json(await listAllocations())));
router.post('/allocations', requireRole('ADMIN', 'ASSET_MANAGER'), asyncHandler(async (req, res) => res.status(201).json(await createAllocation(req.user, req.body))));
router.post('/allocations/:id/return', requireRole('ADMIN', 'ASSET_MANAGER'), asyncHandler(async (req, res) => res.json(await returnAllocation(req.user, req.params.id, req.body.returnConditionNotes))));
router.get('/transfers', asyncHandler(async (req, res) => res.json(await listTransfers())));
router.post('/transfers', asyncHandler(async (req, res) => res.status(201).json(await requestTransfer(req.user, req.body))));
router.patch('/transfers/:id/approve', requireRole('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), asyncHandler(async (req, res) => res.json(await decideTransfer(req.user, req.params.id, true))));
router.patch('/transfers/:id/reject', requireRole('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), asyncHandler(async (req, res) => res.json(await decideTransfer(req.user, req.params.id, false, req.body.rejectionReason))));
export default router;
