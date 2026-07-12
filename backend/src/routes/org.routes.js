import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';
import { listCategories, listDepartments, listUsers, saveCategory, saveDepartment, updateUser } from '../services/org.service.js';

const router = Router();
router.get('/departments', asyncHandler(async (req, res) => res.json(await listDepartments())));
router.get('/categories', asyncHandler(async (req, res) => res.json(await listCategories())));
router.use(authenticate);
router.post('/departments', requireRole('ADMIN'), asyncHandler(async (req, res) => res.status(201).json(await saveDepartment(req.user, req.body))));
router.patch('/departments/:id', requireRole('ADMIN'), asyncHandler(async (req, res) => res.json(await saveDepartment(req.user, req.body, req.params.id))));
router.post('/categories', requireRole('ADMIN'), asyncHandler(async (req, res) => res.status(201).json(await saveCategory(req.user, req.body))));
router.patch('/categories/:id', requireRole('ADMIN'), asyncHandler(async (req, res) => res.json(await saveCategory(req.user, req.body, req.params.id))));
router.get('/users', requireRole('ADMIN', 'ASSET_MANAGER'), asyncHandler(async (req, res) => res.json(await listUsers())));
router.patch('/users/:id/role', requireRole('ADMIN'), asyncHandler(async (req, res) => res.json(await updateUser(req.user, req.params.id, req.body))));
export default router;
