import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { logActivity, notify } from '../lib/audit.js';

export async function listAllocations() {
  return prisma.assetAllocation.findMany({ include: { asset: true, holderUser: true, holderDepartment: true }, orderBy: { allocatedAt: 'desc' } });
}

export async function getActiveAllocation(assetId, tx = prisma) {
  return tx.assetAllocation.findFirst({
    where: { assetId: Number(assetId), isActive: true },
    include: { holderUser: true, holderDepartment: true, asset: true }
  });
}

export async function createAllocation(user, data) {
  return prisma.$transaction(async (tx) => {
    const active = await getActiveAllocation(data.assetId, tx);
    if (active) {
      const holder = active.holderUser?.name || active.holderDepartment?.name || 'Unknown holder';
      throw new ApiError(409, `Asset is already allocated to ${holder}`, { currentHolder: holder, allocationId: active.id });
    }
    const allocation = await tx.assetAllocation.create({
      data: {
        assetId: Number(data.assetId),
        holderUserId: data.holderUserId ? Number(data.holderUserId) : null,
        holderDepartmentId: data.holderDepartmentId ? Number(data.holderDepartmentId) : null,
        expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null
      },
      include: { asset: true, holderUser: true, holderDepartment: true }
    });
    await tx.asset.update({ where: { id: allocation.assetId }, data: { status: 'ALLOCATED' } });
    if (allocation.holderUserId) await notify({ userId: allocation.holderUserId, type: 'ASSET_ASSIGNED', message: `${allocation.asset.name} assigned to you`, relatedEntityType: 'AssetAllocation', relatedEntityId: allocation.id }, tx);
    await logActivity({ actorUserId: user.id, action: 'ASSET_ALLOCATED', entityType: 'AssetAllocation', entityId: allocation.id, afterState: allocation }, tx);
    return allocation;
  });
}

export async function returnAllocation(user, id, notes) {
  if (!notes) throw new ApiError(400, 'Condition notes are required on return');
  return prisma.$transaction(async (tx) => {
    const before = await tx.assetAllocation.findUnique({ where: { id: Number(id) }, include: { asset: true, holderUser: true } });
    if (!before || !before.isActive) throw new ApiError(404, 'Active allocation not found');
    const allocation = await tx.assetAllocation.update({ where: { id: before.id }, data: { isActive: false, returnedAt: new Date(), returnConditionNotes: notes }, include: { asset: true, holderUser: true, holderDepartment: true } });
    await tx.asset.update({ where: { id: before.assetId }, data: { status: 'AVAILABLE' } });
    await logActivity({ actorUserId: user.id, action: 'ASSET_RETURNED', entityType: 'AssetAllocation', entityId: allocation.id, beforeState: before, afterState: allocation }, tx);
    return allocation;
  });
}

export async function listTransfers() {
  return prisma.transferRequest.findMany({ include: { asset: true, fromAllocation: true, requestedBy: true, approvedBy: true }, orderBy: { requestedAt: 'desc' } });
}

export async function requestTransfer(user, data) {
  const active = await getActiveAllocation(data.assetId);
  if (!active) throw new ApiError(400, 'Asset is not currently allocated');
  const transfer = await prisma.transferRequest.create({
    data: {
      assetId: Number(data.assetId),
      fromAllocationId: active.id,
      toUserId: data.toUserId ? Number(data.toUserId) : null,
      toDepartmentId: data.toDepartmentId ? Number(data.toDepartmentId) : null,
      requestedByUserId: user.id
    },
    include: { asset: true, requestedBy: true }
  });
  await logActivity({ actorUserId: user.id, action: 'TRANSFER_REQUESTED', entityType: 'TransferRequest', entityId: transfer.id, afterState: transfer });
  return transfer;
}

export async function decideTransfer(user, id, approved, reason = null) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.transferRequest.findUnique({ where: { id: Number(id) }, include: { asset: true, fromAllocation: true } });
    if (!before || before.status !== 'REQUESTED') throw new ApiError(404, 'Pending transfer request not found');
    if (!approved) {
      const rejected = await tx.transferRequest.update({ where: { id: before.id }, data: { status: 'REJECTED', approvedByUserId: user.id, rejectionReason: reason, decidedAt: new Date() } });
      await logActivity({ actorUserId: user.id, action: 'TRANSFER_REJECTED', entityType: 'TransferRequest', entityId: rejected.id, beforeState: before, afterState: rejected }, tx);
      return rejected;
    }
    await tx.assetAllocation.update({ where: { id: before.fromAllocationId }, data: { isActive: false, returnedAt: new Date(), returnConditionNotes: 'Transferred' } });
    const allocation = await tx.assetAllocation.create({ data: { assetId: before.assetId, holderUserId: before.toUserId, holderDepartmentId: before.toDepartmentId }, include: { holderUser: true, holderDepartment: true, asset: true } });
    const transfer = await tx.transferRequest.update({ where: { id: before.id }, data: { status: 'APPROVED', approvedByUserId: user.id, decidedAt: new Date() } });
    if (allocation.holderUserId) await notify({ userId: allocation.holderUserId, type: 'TRANSFER_APPROVED', message: `${allocation.asset.name} transferred to you`, relatedEntityType: 'TransferRequest', relatedEntityId: transfer.id }, tx);
    await logActivity({ actorUserId: user.id, action: 'TRANSFER_APPROVED', entityType: 'TransferRequest', entityId: transfer.id, beforeState: before, afterState: { transfer, allocation } }, tx);
    return transfer;
  });
}
