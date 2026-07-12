import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../lib/auth.js';
import { ApiError } from '../lib/errors.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Authentication required');
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      include: { department: true }
    });
    if (!user || user.status !== 'ACTIVE') throw new ApiError(401, 'Invalid session');
    req.user = user;
    next();
  } catch (error) {
    next(error.status ? error : new ApiError(401, 'Invalid session'));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) return next(new ApiError(403, 'Insufficient permissions'));
    return next();
  };
}

export function canManageOperations(req, res, next) {
  return requireRole('ADMIN', 'ASSET_MANAGER')(req, res, next);
}
