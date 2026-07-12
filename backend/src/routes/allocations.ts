import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const checkoutSchema = z.object({
  assetId: z.number().int('Asset ID must be an integer'),
  expectedReturnDate: z.string().datetime().optional().nullable().transform(val => val ? new Date(val) : null),
  notes: z.string().optional().nullable()
});

const assignSchema = z.object({
  assetId: z.number().int('Asset ID must be an integer'),
  employeeId: z.number().int().optional().nullable(),
  departmentId: z.number().int().optional().nullable(),
  expectedReturnDate: z.string().datetime().optional().nullable().transform(val => val ? new Date(val) : null),
  notes: z.string().optional().nullable()
});

const returnSchema = z.object({
  conditionAtReturn: z.string().min(1, 'Condition is required'),
  notes: z.string().optional().nullable()
});

// GET /api/allocations/my - Fetch allocations for currently logged-in user
router.get('/my', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const caller = req.user;
    if (!caller) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const allocations = await prisma.assetAllocation.findMany({
      where: {
        employeeId: caller.id
      },
      include: {
        asset: {
          include: {
            category: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(allocations);
  } catch (error) {
    console.error('Error fetching user allocations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/allocations - List all allocations (Admin & Asset Manager only)
router.get('/', authenticateJWT, requireRole(['ADMIN', 'ASSET_MANAGER']), async (req, res): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const whereClause: Prisma.AssetAllocationWhereInput = {};

    if (status) {
      whereClause.status = status as any;
    }

    const allocations = await prisma.assetAllocation.findMany({
      where: whereClause,
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        employee: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        allocatedBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/allocations/checkout - Self-Checkout (All authenticated users)
router.post('/checkout', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const caller = req.user;
    if (!caller) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const body = checkoutSchema.parse(req.body);

    // Retrieve asset inside a transaction scope to prevent race conditions
    const allocation = await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({
        where: { id: body.assetId }
      });

      if (!asset) {
        throw new Error('Asset not found');
      }

      if (asset.status !== 'AVAILABLE') {
        throw new Error(`Asset is not available for checkout (current status: ${asset.status})`);
      }

      // Create checkout log
      const newAllocation = await tx.assetAllocation.create({
        data: {
          assetId: body.assetId,
          employeeId: caller.id,
          expectedReturnDate: body.expectedReturnDate,
          status: 'ACTIVE',
          conditionAtAllocation: asset.condition,
          returnNotes: body.notes || null
        }
      });

      // Update asset status
      await tx.asset.update({
        where: { id: body.assetId },
        data: { status: 'ALLOCATED' }
      });

      return newAllocation;
    });

    res.status(201).json(allocation);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    console.error('Error processing checkout:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/allocations/assign - Assign Asset (Admin & Asset Manager only)
router.post('/assign', authenticateJWT, requireRole(['ADMIN', 'ASSET_MANAGER']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const caller = req.user;
    if (!caller) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const body = assignSchema.parse(req.body);

    if (!body.employeeId && !body.departmentId) {
      res.status(400).json({ error: 'Either Employee ID or Department ID must be specified' });
      return;
    }

    if (body.employeeId && body.departmentId) {
      res.status(400).json({ error: 'Cannot assign to both an Employee and a Department simultaneously' });
      return;
    }

    const allocation = await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({
        where: { id: body.assetId }
      });

      if (!asset) {
        throw new Error('Asset not found');
      }

      if (asset.status !== 'AVAILABLE') {
        throw new Error(`Asset is not available for assignment (current status: ${asset.status})`);
      }

      // Create allocation log
      const newAllocation = await tx.assetAllocation.create({
        data: {
          assetId: body.assetId,
          employeeId: body.employeeId || null,
          departmentId: body.departmentId || null,
          expectedReturnDate: body.expectedReturnDate,
          status: 'ACTIVE',
          conditionAtAllocation: asset.condition,
          returnNotes: body.notes || null
        }
      });

      // Update asset status
      await tx.asset.update({
        where: { id: body.assetId },
        data: { status: 'ALLOCATED' }
      });

      return newAllocation;
    });

    res.status(201).json(allocation);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    console.error('Error processing assignment:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/allocations/:id/return - Return Asset (Admin, Manager, or Assignee employee)
router.post('/:id/return', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const caller = req.user;
    if (!caller) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const allocationId = parseInt(req.params.id as string);
    if (isNaN(allocationId)) {
      res.status(400).json({ error: 'Invalid allocation ID' });
      return;
    }

    const body = returnSchema.parse(req.body);

    const updatedAllocation = await prisma.$transaction(async (tx) => {
      const allocation = await tx.assetAllocation.findUnique({
        where: { id: allocationId }
      });

      if (!allocation) {
        throw new Error('Allocation record not found');
      }

      if (allocation.status !== 'ACTIVE') {
        throw new Error('This allocation is not active');
      }

      // Verify permission: caller is admin, asset manager, or the assignee employee
      const isAuthorized = 
        caller.role === 'ADMIN' || 
        caller.role === 'ASSET_MANAGER' || 
        allocation.employeeId === caller.id;

      if (!isAuthorized) {
        throw new Error('You are not authorized to return this asset');
      }

      // Update Allocation log
      const returnedAlloc = await tx.assetAllocation.update({
        where: { id: allocationId },
        data: {
          actualReturnDate: new Date(),
          status: 'RETURNED',
          conditionAtReturn: body.conditionAtReturn,
          returnNotes: body.notes ? `${allocation.returnNotes || ''} | Return note: ${body.notes}` : allocation.returnNotes
        }
      });

      // Update Asset Status back to AVAILABLE and set returned condition
      await tx.asset.update({
        where: { id: allocation.assetId },
        data: {
          status: 'AVAILABLE',
          condition: body.conditionAtReturn
        }
      });

      return returnedAlloc;
    });

    res.json(updatedAllocation);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    console.error('Error processing return:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
