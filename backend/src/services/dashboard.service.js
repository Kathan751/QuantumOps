import { prisma } from '../lib/prisma.js';

function scopeForUser(user) {
  if (user.role === 'DEPARTMENT_HEAD') return { departmentId: user.departmentId || -1 };
  if (user.role === 'EMPLOYEE') return { holderUserId: user.id };
  return {};
}

export async function getDashboard(user) {
  const allocationScope = scopeForUser(user);
  const assetWhere = user.role === 'DEPARTMENT_HEAD' ? { departmentId: user.departmentId || -1 } : {};
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const now = new Date();
  const [available, allocated, maintenanceToday, activeBookings, pendingTransfers, upcomingReturns, overdueReturns, recentNotifications] = await Promise.all([
    prisma.asset.count({ where: { ...assetWhere, status: 'AVAILABLE' } }),
    prisma.asset.count({ where: { ...assetWhere, status: 'ALLOCATED' } }),
    prisma.maintenanceRequest.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.resourceBooking.count({ where: { status: { in: ['UPCOMING', 'ONGOING'] }, ...(user.role === 'EMPLOYEE' ? { bookedByUserId: user.id } : {}) } }),
    prisma.transferRequest.count({ where: { status: 'REQUESTED' } }),
    prisma.assetAllocation.count({ where: { ...allocationScope, isActive: true, expectedReturnDate: { gte: now } } }),
    prisma.assetAllocation.findMany({ where: { ...allocationScope, isActive: true, expectedReturnDate: { lt: now } }, include: { asset: true, holderUser: true, holderDepartment: true } }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 6 })
  ]);
  return { available, allocated, maintenanceToday, activeBookings, pendingTransfers, upcomingReturns, overdueReturns: overdueReturns.length, overdueItems: overdueReturns, recentNotifications };
}
