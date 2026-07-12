import { prisma } from '../lib/prisma.js';

export async function listNotifications(user) {
  return prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
}

export async function markRead(user, id) {
  return prisma.notification.update({ where: { id: Number(id), userId: user.id }, data: { isRead: true } });
}

export async function listActivityLogs(user) {
  const where = ['ADMIN', 'ASSET_MANAGER'].includes(user.role) ? {} : { actorUserId: user.id };
  return prisma.activityLog.findMany({ where, include: { actor: true }, orderBy: { createdAt: 'desc' }, take: 200 });
}
