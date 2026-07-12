import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';
import { createBooking, listResources, updateBooking } from '../services/bookings.service.js';

const router = Router();
router.use(authenticate);
router.get('/resources', asyncHandler(async (req, res) => res.json(await listResources())));
router.post('/bookings', asyncHandler(async (req, res) => res.status(201).json(await createBooking(req.user, req.body))));
router.patch('/bookings/:id', asyncHandler(async (req, res) => res.json(await updateBooking(req.user, req.params.id, req.body))));
export default router;
