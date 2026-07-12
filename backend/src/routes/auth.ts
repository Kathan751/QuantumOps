import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-hackathon';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  departmentId: z.number().int().optional().nullable()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// POST /api/auth/signup
router.post('/signup', async (req, res): Promise<void> => {
  try {
    const body = signupSchema.parse(req.body);

    const existingUser = await prisma.employee.findUnique({
      where: { email: body.email }
    });

    if (existingUser) {
      res.status(400).json({ error: 'Email already in use' });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const newEmployee = await prisma.employee.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: 'EMPLOYEE', // Hardcoded to prevent self-elevation
        departmentId: body.departmentId || null,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        status: true,
        createdAt: true
      }
    });

    const token = jwt.sign(
      { id: newEmployee.id, email: newEmployee.email, role: newEmployee.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: newEmployee
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error during signup' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const body = loginSchema.parse(req.body);

    const employee = await prisma.employee.findUnique({
      where: { email: body.email },
      include: { department: true }
    });

    if (!employee || employee.status === 'INACTIVE') {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(body.password, employee.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: employee.id, email: employee.email, role: employee.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { passwordHash, ...userWithoutPassword } = employee;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  
  const { passwordHash, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

export default router;
