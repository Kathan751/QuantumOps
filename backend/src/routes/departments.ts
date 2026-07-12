import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  parentDepartmentId: z.number().int().optional().nullable(),
  departmentHeadId: z.number().int().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE')
});

// GET /api/departments - View directory (All authenticated employees)
router.get('/', authenticateJWT, async (req, res): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        departmentHead: {
          select: { id: true, name: true, email: true, role: true }
        },
        parentDepartment: {
          select: { id: true, name: true }
        },
        childDepartments: {
          select: { id: true, name: true }
        },
        _count: {
          select: { employees: true }
        }
      }
    });
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/departments - Create (Admin only)
router.post('/', authenticateJWT, requireRole(['ADMIN']), async (req, res): Promise<void> => {
  try {
    const body = departmentSchema.parse(req.body);

    const newDept = await prisma.department.create({
      data: {
        name: body.name,
        parentDepartmentId: body.parentDepartmentId || null,
        departmentHeadId: body.departmentHeadId || null,
        status: body.status
      },
      include: {
        departmentHead: {
          select: { id: true, name: true, email: true }
        },
        parentDepartment: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json(newDept);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/departments/:id - Update (Admin only)
router.put('/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid department ID' });
      return;
    }

    const body = departmentSchema.partial().parse(req.body);

    // Prevent circular hierarchy
    if (body.parentDepartmentId === id) {
      res.status(400).json({ error: 'A department cannot be its own parent' });
      return;
    }

    const updatedDept = await prisma.department.update({
      where: { id },
      data: {
        name: body.name,
        parentDepartmentId: body.parentDepartmentId !== undefined ? body.parentDepartmentId : undefined,
        departmentHeadId: body.departmentHeadId !== undefined ? body.departmentHeadId : undefined,
        status: body.status
      },
      include: {
        departmentHead: {
          select: { id: true, name: true, email: true }
        },
        parentDepartment: {
          select: { id: true, name: true }
        }
      }
    });

    res.json(updatedDept);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/departments/:id - Delete (Admin only)
router.delete('/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid department ID' });
      return;
    }

    // 1. Check for child departments
    const childrenCount = await prisma.department.count({
      where: { parentDepartmentId: id }
    });
    if (childrenCount > 0) {
      res.status(400).json({ error: 'Cannot delete department that has sub-departments' });
      return;
    }

    // 2. Check for assigned employees
    const employeesCount = await prisma.employee.count({
      where: { departmentId: id }
    });
    if (employeesCount > 0) {
      res.status(400).json({ error: 'Cannot delete department that has active employees' });
      return;
    }

    await prisma.department.delete({ where: { id } });
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
