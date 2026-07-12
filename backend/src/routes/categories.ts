import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticateJWT, requireRole } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const customFieldDefSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  type: z.enum(['string', 'number', 'boolean']),
  required: z.boolean().default(false)
});

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional().nullable(),
  customFieldsSchema: z.array(customFieldDefSchema).nullable().optional()
});

// GET /api/categories - View categories (All authenticated users)
router.get('/', authenticateJWT, async (req, res): Promise<void> => {
  try {
    const categories = await prisma.assetCategory.findMany({
      include: {
        _count: {
          select: { assets: true }
        }
      }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/categories - Create (Admin only)
router.post('/', authenticateJWT, requireRole(['ADMIN']), async (req, res): Promise<void> => {
  try {
    const body = categorySchema.parse(req.body);

    const newCategory = await prisma.assetCategory.create({
      data: {
        name: body.name,
        description: body.description || null,
        customFieldsSchema: body.customFieldsSchema ? (body.customFieldsSchema as any) : Prisma.DbNull
      }
    });

    res.status(201).json(newCategory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    // Handle Prisma unique constraint error
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(400).json({ error: 'A category with this name already exists' });
      return;
    }
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/categories/:id - Update (Admin only)
router.put('/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid category ID' });
      return;
    }

    const body = categorySchema.partial().parse(req.body);

    const updatedCategory = await prisma.assetCategory.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description !== undefined ? body.description : undefined,
        customFieldsSchema: body.customFieldsSchema !== undefined 
          ? (body.customFieldsSchema ? (body.customFieldsSchema as any) : Prisma.DbNull)
          : undefined
      }
    });

    res.json(updatedCategory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(400).json({ error: 'A category with this name already exists' });
      return;
    }
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/categories/:id - Delete (Admin only)
router.delete('/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid category ID' });
      return;
    }

    // Check if category has any registered assets
    const assetsCount = await prisma.asset.count({
      where: { categoryId: id }
    });
    if (assetsCount > 0) {
      res.status(400).json({ error: 'Cannot delete category that contains registered assets' });
      return;
    }

    await prisma.assetCategory.delete({ where: { id } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
