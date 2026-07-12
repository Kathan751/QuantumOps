import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';
import { listActivityLogs, listNotifications, markRead } from '../services/notifications.service.js';

const router = Router();
router.use(authenticate);
router.get('/notifications', asyncHandler(async (req, res) => res.json(await listNotifications(req.user))));
router.patch('/notifications/:id/read', asyncHandler(async (req, res) => res.json(await markRead(req.user, req.params.id))));
router.get('/activity-logs', asyncHandler(async (req, res) => res.json(await listActivityLogs(req.user))));
export default router;
