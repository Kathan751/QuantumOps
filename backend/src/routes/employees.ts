import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient, Role } from '@prisma/client';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const promoteSchema = z.object({
  role: z.enum(['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE']),
  departmentId: z.number().int().optional().nullable()
});

// GET /api/employees - Employee Directory (All authenticated users)
router.get('/', authenticateJWT, async (req, res): Promise<void> => {
  try {
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        status: true,
        createdAt: true,
        department: {
          select: { id: true, name: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/employees/:id/promote - Role Promotion (Admin only)
router.put('/:id/promote', authenticateJWT, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid employee ID' });
      return;
    }

    const caller = req.user;
    if (!caller) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Block self role changes (self-promotion / self-demotion)
    if (caller.id === id) {
      res.status(400).json({ error: 'You cannot promote, demote, or change your own role to protect organisation ownership' });
      return;
    }

    const body = promoteSchema.parse(req.body);

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        role: body.role,
        departmentId: body.departmentId !== undefined ? body.departmentId : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        status: true,
        createdAt: true,
        department: {
          select: { id: true, name: true }
        }
      }
    });

    res.json(updatedEmployee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    console.error('Error promoting employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
