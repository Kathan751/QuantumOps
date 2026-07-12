import { prisma } from '../lib/prisma.js';
import { logActivity } from '../lib/audit.js';

export function buildAssetWhere(filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.categoryId) where.categoryId = Number(filters.categoryId);
  if (filters.departmentId) where.departmentId = Number(filters.departmentId);
  if (filters.location) where.location = { contains: filters.location };
  if (filters.q) {
    where.OR = [
      { tag: { contains: filters.q } },
      { name: { contains: filters.q } },
      { serialNumber: { contains: filters.q } },
      { location: { contains: filters.q } },
      { category: { name: { contains: filters.q } } },
      { department: { name: { contains: filters.q } } }
    ];
  }
  return where;
}

export async function listAssets(filters = {}) {
  const where = buildAssetWhere(filters);
  return prisma.asset.findMany({
    where,
    include: { category: true, department: true, allocations: { include: { holderUser: true, holderDepartment: true }, orderBy: { allocatedAt: 'desc' } }, maintenanceRequests: { orderBy: { createdAt: 'desc' } } },
    orderBy: { id: 'desc' }
  });
}

export async function getAsset(id) {
  return prisma.asset.findUnique({
    where: { id: Number(id) },
    include: { category: true, department: true, files: true, allocations: { include: { holderUser: true, holderDepartment: true }, orderBy: { allocatedAt: 'desc' } }, maintenanceRequests: { include: { raisedBy: true, approvedBy: true }, orderBy: { createdAt: 'desc' } }, auditItems: { include: { auditCycle: true, checkedBy: true } } }
  });
}

export async function createAsset(user, data) {
  const count = await prisma.asset.count();
  const asset = await prisma.asset.create({
    data: {
      tag: `AF-${String(count + 1).padStart(4, '0')}`,
      name: data.name,
      categoryId: Number(data.categoryId),
      serialNumber: data.serialNumber,
      acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : null,
      acquisitionCost: data.acquisitionCost || null,
      condition: data.condition || 'Good',
      location: data.location || 'Main Office',
      isSharedResource: Boolean(data.isSharedResource),
      departmentId: data.departmentId ? Number(data.departmentId) : null,
      photoPath: data.photoPath || null
    },
    include: { category: true, department: true }
  });
  await logActivity({ actorUserId: user.id, action: 'ASSET_CREATED', entityType: 'Asset', entityId: asset.id, afterState: asset });
  return asset;
}
