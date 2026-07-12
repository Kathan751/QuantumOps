import { prisma } from './prisma.js';

export async function logActivity({ actorUserId, action, entityType, entityId, beforeState, afterState }, tx = prisma) {
  return tx.activityLog.create({
    data: {
      actorUserId: actorUserId || null,
      action,
      entityType,
      entityId: entityId || null,
      beforeState: beforeState || undefined,
      afterState: afterState || undefined
    }
  });
}

export async function notify({ userId, type, message, relatedEntityType, relatedEntityId }, tx = prisma) {
  if (!userId) return null;
  return tx.notification.create({
    data: {
      userId,
      type,
      message,
      relatedEntityType: relatedEntityType || null,
      relatedEntityId: relatedEntityId || null
    }
  });
}
