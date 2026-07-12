import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/locations - Fetch all locations for lookup (All authenticated users)
router.get('/', authenticateJWT, async (req, res): Promise<void> => {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
