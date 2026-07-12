import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { logActivity, notify } from '../lib/audit.js';

export async function listAudits() {
  return prisma.auditCycle.findMany({ include: { assignments: { include: { auditor: true } }, items: { include: { asset: true, checkedBy: true } }, createdBy: true }, orderBy: { createdAt: 'desc' } });
}

export async function createAudit(user, data) {
  return prisma.$transaction(async (tx) => {
    const where = data.scopeType === 'DEPARTMENT' ? { departmentId: Number(data.scopeValue) } : { location: data.scopeValue };
    const assets = await tx.asset.findMany({ where });
    const audit = await tx.auditCycle.create({
      data: {
        name: data.name,
        scopeType: data.scopeType,
        scopeValue: String(data.scopeValue),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        createdByUserId: user.id,
        assignments: { create: (data.auditorUserIds || []).map((auditorUserId) => ({ auditorUserId: Number(auditorUserId) })) },
        items: { create: assets.map((asset) => ({ assetId: asset.id })) }
      },
      include: { assignments: true, items: true }
    });
    await logActivity({ actorUserId: user.id, action: 'AUDIT_CREATED', entityType: 'AuditCycle', entityId: audit.id, afterState: audit }, tx);
    return audit;
  });
}

export async function markAuditItem(user, id, data) {
  const item = await prisma.auditItem.findUnique({ where: { id: Number(id) }, include: { auditCycle: true, asset: true } });
  if (!item) throw new ApiError(404, 'Audit item not found');
  if (item.auditCycle.status === 'CLOSED') throw new ApiError(400, 'Closed audit cycles are locked');
  const updated = await prisma.auditItem.update({ where: { id: item.id }, data: { result: data.result, notes: data.notes || null, checkedAt: new Date(), checkedByUserId: user.id }, include: { asset: true } });
  if (['MISSING', 'DAMAGED'].includes(updated.result)) {
    await notify({ userId: user.id, type: 'AUDIT_DISCREPANCY_FLAGGED', message: `${updated.asset.name} flagged as ${updated.result}`, relatedEntityType: 'AuditItem', relatedEntityId: updated.id });
  }
  await logActivity({ actorUserId: user.id, action: 'AUDIT_ITEM_MARKED', entityType: 'AuditItem', entityId: updated.id, beforeState: item, afterState: updated });
  return updated;
}

export async function closeAudit(user, id) {
  return prisma.$transaction(async (tx) => {
    const audit = await tx.auditCycle.findUnique({ where: { id: Number(id) }, include: { items: true } });
    if (!audit || audit.status === 'CLOSED') throw new ApiError(400, 'Audit cycle is already closed or missing');
    for (const item of audit.items) {
      if (item.result === 'MISSING') await tx.asset.update({ where: { id: item.assetId }, data: { status: 'LOST' } });
      if (item.result === 'DAMAGED') await tx.asset.update({ where: { id: item.assetId }, data: { status: 'UNDER_MAINTENANCE' } });
    }
    const closed = await tx.auditCycle.update({ where: { id: audit.id }, data: { status: 'CLOSED' }, include: { items: { include: { asset: true } } } });
    await logActivity({ actorUserId: user.id, action: 'AUDIT_CLOSED', entityType: 'AuditCycle', entityId: closed.id, beforeState: audit, afterState: closed }, tx);
    return closed;
  });
}
