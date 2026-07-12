import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/errors.js';
import { authenticate } from '../middleware/auth.js';
import { forgotPassword, login, signup, currentUser } from '../services/auth.service.js';

const router = Router();
const signupSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8), phone: z.string().optional(), departmentId: z.coerce.number().optional(), role: z.string().optional() });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post('/signup', asyncHandler(async (req, res) => res.status(201).json(await signup(signupSchema.parse(req.body)))));
router.post('/login', asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body);
  res.json(await login(body.email, body.password));
}));
router.get('/me', authenticate, (req, res) => res.json(currentUser(req.user)));
router.post('/forgot-password', asyncHandler(async (req, res) => res.json(await forgotPassword(z.object({ email: z.string().email() }).parse(req.body).email))));

export default router;
