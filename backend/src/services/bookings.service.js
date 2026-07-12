import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { logActivity, notify } from '../lib/audit.js';

export function rangesOverlap(existingStart, existingEnd, requestedStart, requestedEnd) {
  return requestedStart < existingEnd && requestedEnd > existingStart;
}

export async function listResources() {
  return prisma.bookableResource.findMany({ include: { bookings: { include: { bookedBy: true }, orderBy: { startTime: 'asc' } } } });
}

export async function createBooking(user, data) {
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);
  if (!(startTime < endTime)) throw new ApiError(400, 'End time must be after start time');
  return prisma.$transaction(async (tx) => {
    const conflicts = await tx.resourceBooking.findMany({
      where: {
        resourceId: Number(data.resourceId),
        status: { not: 'CANCELLED' },
        startTime: { lt: endTime },
        endTime: { gt: startTime }
      },
      include: { bookedBy: true, resource: true }
    });
    if (conflicts.length) throw new ApiError(409, 'Booking overlaps with an existing reservation', { conflict: conflicts[0] });
    const booking = await tx.resourceBooking.create({
      data: {
        resourceId: Number(data.resourceId),
        bookedByUserId: user.id,
        departmentId: data.departmentId ? Number(data.departmentId) : null,
        startTime,
        endTime
      },
      include: { resource: true, bookedBy: true }
    });
    await notify({ userId: user.id, type: 'BOOKING_CONFIRMED', message: `Booking confirmed for ${booking.resource.name}`, relatedEntityType: 'ResourceBooking', relatedEntityId: booking.id }, tx);
    await logActivity({ actorUserId: user.id, action: 'BOOKING_CREATED', entityType: 'ResourceBooking', entityId: booking.id, afterState: booking }, tx);
    return booking;
  });
}

export async function updateBooking(user, id, data) {
  const booking = await prisma.resourceBooking.findUnique({ where: { id: Number(id) } });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.bookedByUserId !== user.id && !['ADMIN', 'ASSET_MANAGER'].includes(user.role)) throw new ApiError(403, 'Cannot modify this booking');
  if (data.status === 'CANCELLED') {
    const updated = await prisma.resourceBooking.update({ where: { id: Number(id) }, data: { status: 'CANCELLED' }, include: { resource: true } });
    await notify({ userId: booking.bookedByUserId, type: 'BOOKING_CANCELLED', message: `Booking cancelled for ${updated.resource.name}`, relatedEntityType: 'ResourceBooking', relatedEntityId: updated.id });
    await logActivity({ actorUserId: user.id, action: 'BOOKING_CANCELLED', entityType: 'ResourceBooking', entityId: updated.id, beforeState: booking, afterState: updated });
    return updated;
  }
  return createBooking(user, { ...booking, ...data, resourceId: booking.resourceId });
}
