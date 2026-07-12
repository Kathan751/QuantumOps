import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient, AssetStatus, Prisma } from '@prisma/client';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const assetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  categoryId: z.number().int('Category ID must be an integer'),
  serialNumber: z.string().optional().nullable(),
  acquisitionDate: z.string().datetime({ precision: 3 }).or(z.string().datetime()).optional().nullable().transform(val => val ? new Date(val) : null),
  acquisitionCost: z.number().nonnegative().optional().nullable(),
  condition: z.string().default('Good'),
  locationId: z.number().int().optional().nullable(),
  status: z.enum([
    'AVAILABLE',
    'ALLOCATED',
    'RESERVED',
    'UNDER_MAINTENANCE',
    'LOST',
    'RETIRED',
    'DISPOSED'
  ]).default('AVAILABLE'),
  isBookable: z.boolean().default(false),
  customFieldValues: z.record(z.string(), z.any()).optional().nullable(),
  nextMaintenanceDueDate: z.string().datetime({ precision: 3 }).or(z.string().datetime()).optional().nullable().transform(val => val ? new Date(val) : null)
});

// Helper function to validate dynamic custom fields against category schema
async function validateCustomFields(categoryId: number, values: any): Promise<string | null> {
  const category = await prisma.assetCategory.findUnique({
    where: { id: categoryId }
  });

  if (!category) {
    return 'Asset category not found';
  }

  const schema = category.customFieldsSchema as any[];
  if (!schema || !Array.isArray(schema)) {
    return null; // No schema defined, skip validation
  }

  const inputValues = values || {};

  for (const field of schema) {
    const value = inputValues[field.name];

    // Check required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      return `Custom field "${field.name}" is required`;
    }

    if (value !== undefined && value !== null && value !== '') {
      // Validate types
      if (field.type === 'string' && typeof value !== 'string') {
        return `Custom field "${field.name}" must be a string`;
      }
      if (field.type === 'number' && typeof value !== 'number' && isNaN(Number(value))) {
        return `Custom field "${field.name}" must be a number`;
      }
      if (field.type === 'boolean' && typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return `Custom field "${field.name}" must be a boolean`;
      }
    }
  }

  return null;
}

// GET /api/assets - List, Search, Page, and Filter Assets (All logged in users)
router.get('/', authenticateJWT, async (req, res): Promise<void> => {
  try {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    const locationId = req.query.locationId ? parseInt(req.query.locationId as string) : undefined;
    const status = req.query.status ? (req.query.status as AssetStatus) : undefined;
    const search = req.query.search ? (req.query.search as string).trim() : '';

    const whereClause: Prisma.AssetWhereInput = {};

    if (categoryId && !isNaN(categoryId)) {
      whereClause.categoryId = categoryId;
    }
    if (locationId && !isNaN(locationId)) {
      whereClause.locationId = locationId;
    }
    if (status) {
      whereClause.status = status;
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { assetTag: { contains: search } },
        { serialNumber: { contains: search } }
      ];
    }

    const assets = await prisma.asset.findMany({
      where: whereClause,
      include: {
        category: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } }
      },
      orderBy: { id: 'desc' }
    });

    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/assets/:id - Get Details (All logged in users)
router.get('/:id', authenticateJWT, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid asset ID' });
      return;
    }

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        location: true,
        registeredBy: { select: { id: true, name: true, email: true } },
        allocations: {
          include: {
            employee: { select: { id: true, name: true, email: true } },
            department: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        maintenanceRequests: {
          include: {
            raisedBy: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    res.json(asset);
  } catch (error) {
    console.error('Error fetching asset details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/assets - Create (Asset Manager & Admin only)
router.post('/', authenticateJWT, requireRole(['ADMIN', 'ASSET_MANAGER']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const caller = req.user;
    if (!caller) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const body = assetSchema.parse(req.body);

    // Validate Category-defined custom fields
    const customFieldsError = await validateCustomFields(body.categoryId, body.customFieldValues);
    if (customFieldsError) {
      res.status(400).json({ error: customFieldsError });
      return;
    }

    // Auto-generate Asset Tag sequentially
    const lastAsset = await prisma.asset.findFirst({
      orderBy: { id: 'desc' }
    });

    let nextNum = 1;
    if (lastAsset && lastAsset.assetTag && lastAsset.assetTag.startsWith('AF-')) {
      const lastNum = parseInt(lastAsset.assetTag.replace('AF-', ''));
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }
    const assetTag = `AF-${String(nextNum).padStart(4, '0')}`;

    const newAsset = await prisma.asset.create({
      data: {
        assetTag,
        name: body.name,
        categoryId: body.categoryId,
        serialNumber: body.serialNumber || null,
        acquisitionDate: body.acquisitionDate || null,
        acquisitionCost: body.acquisitionCost !== null && body.acquisitionCost !== undefined 
          ? new Prisma.Decimal(body.acquisitionCost) 
          : null,
        condition: body.condition,
        locationId: body.locationId || null,
        status: body.status,
        isBookable: body.isBookable,
        qrCodeValue: assetTag, // default QR code matches tag
        customFieldValues: body.customFieldValues ? (body.customFieldValues as any) : Prisma.DbNull,
        nextMaintenanceDueDate: body.nextMaintenanceDueDate || null,
        registeredById: caller.id
      },
      include: {
        category: { select: { name: true } },
        location: { select: { name: true } }
      }
    });

    res.status(201).json(newAsset);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/assets/:id - Update (Asset Manager & Admin only)
router.put('/:id', authenticateJWT, requireRole(['ADMIN', 'ASSET_MANAGER']), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid asset ID' });
      return;
    }

    const body = assetSchema.partial().parse(req.body);

    if (body.categoryId !== undefined) {
      const customFieldsError = await validateCustomFields(body.categoryId, body.customFieldValues);
      if (customFieldsError) {
        res.status(400).json({ error: customFieldsError });
        return;
      }
    }

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        name: body.name,
        categoryId: body.categoryId,
        serialNumber: body.serialNumber !== undefined ? body.serialNumber : undefined,
        acquisitionDate: body.acquisitionDate !== undefined ? body.acquisitionDate : undefined,
        acquisitionCost: body.acquisitionCost !== undefined 
          ? (body.acquisitionCost !== null ? new Prisma.Decimal(body.acquisitionCost) : null) 
          : undefined,
        condition: body.condition,
        locationId: body.locationId !== undefined ? body.locationId : undefined,
        status: body.status,
        isBookable: body.isBookable,
        customFieldValues: body.customFieldValues !== undefined
          ? (body.customFieldValues ? (body.customFieldValues as any) : Prisma.DbNull)
          : undefined,
        nextMaintenanceDueDate: body.nextMaintenanceDueDate !== undefined ? body.nextMaintenanceDueDate : undefined
      },
      include: {
        category: { select: { name: true } },
        location: { select: { name: true } }
      }
    });

    res.json(updatedAsset);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    console.error('Error updating asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/assets/:id - Delete (Asset Manager & Admin only)
router.delete('/:id', authenticateJWT, requireRole(['ADMIN', 'ASSET_MANAGER']), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid asset ID' });
      return;
    }

    // Check if the asset has active allocations
    const activeAllocationsCount = await prisma.assetAllocation.count({
      where: {
        assetId: id,
        status: 'ACTIVE'
      }
    });

    if (activeAllocationsCount > 0) {
      res.status(400).json({ error: 'Cannot delete an asset that is currently allocated' });
      return;
    }

    // Cascade delete logs that can cause foreign key issues, or standard delete
    await prisma.asset.delete({ where: { id } });
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
