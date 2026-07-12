import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { logActivity, notify } from '../lib/audit.js';

export function canStartMaintenance(status) {
  return status === 'APPROVED' || status === 'TECHNICIAN_ASSIGNED';
}

export async function listMaintenance(user) {
  const where = user.role === 'EMPLOYEE' ? { raisedByUserId: user.id } : {};
  return prisma.maintenanceRequest.findMany({ where, include: { asset: true, raisedBy: true, approvedBy: true }, orderBy: { createdAt: 'desc' } });
}

export async function createMaintenance(user, data) {
  const request = await prisma.maintenanceRequest.create({
    data: {
      assetId: Number(data.assetId),
      raisedByUserId: user.id,
      issueDescription: data.issueDescription,
      priority: data.priority || 'MEDIUM',
      photoPath: data.photoPath || null
    },
    include: { asset: true, raisedBy: true }
  });
  await logActivity({ actorUserId: user.id, action: 'MAINTENANCE_REQUESTED', entityType: 'MaintenanceRequest', entityId: request.id, afterState: request });
  return request;
}

export async function transitionMaintenance(user, id, action, data = {}) {
  const request = await prisma.maintenanceRequest.findUnique({ where: { id: Number(id) }, include: { asset: true, raisedBy: true } });
  if (!request) throw new ApiError(404, 'Maintenance request not found');
  const update = {};
  const assetUpdate = {};
  if (action === 'approve') {
    update.status = 'APPROVED'; update.approvedByUserId = user.id; update.approvedAt = new Date(); assetUpdate.status = 'UNDER_MAINTENANCE';
  } else if (action === 'reject') {
    update.status = 'REJECTED'; update.rejectionReason = data.rejectionReason || 'Rejected by approver';
  } else if (action === 'assign') {
    if (request.status !== 'APPROVED') throw new ApiError(400, 'Technician can be assigned only after approval');
    update.status = 'TECHNICIAN_ASSIGNED'; update.technicianName = data.technicianName || 'Demo Technician';
  } else if (action === 'start') {
    if (!canStartMaintenance(request.status)) throw new ApiError(400, 'Maintenance must be approved before work starts');
    update.status = 'IN_PROGRESS';
  } else if (action === 'resolve') {
    update.status = 'RESOLVED'; update.resolvedAt = new Date(); assetUpdate.status = 'AVAILABLE';
  }
  const result = await prisma.$transaction(async (tx) => {
    if (Object.keys(assetUpdate).length) await tx.asset.update({ where: { id: request.assetId }, data: assetUpdate });
    const updated = await tx.maintenanceRequest.update({ where: { id: request.id }, data: update, include: { asset: true, raisedBy: true, approvedBy: true } });
    if (action === 'approve') await notify({ userId: request.raisedByUserId, type: 'MAINTENANCE_APPROVED', message: `Maintenance approved for ${request.asset.name}`, relatedEntityType: 'MaintenanceRequest', relatedEntityId: request.id }, tx);
    if (action === 'reject') await notify({ userId: request.raisedByUserId, type: 'MAINTENANCE_REJECTED', message: `Maintenance rejected for ${request.asset.name}`, relatedEntityType: 'MaintenanceRequest', relatedEntityId: request.id }, tx);
    await logActivity({ actorUserId: user.id, action: `MAINTENANCE_${action.toUpperCase()}`, entityType: 'MaintenanceRequest', entityId: request.id, beforeState: request, afterState: updated }, tx);
    return updated;
  });
  return result;
}
