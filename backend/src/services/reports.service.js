import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';

export async function getReports() {
  const [statusGroups, departments, maintenance, bookings, assets] = await Promise.all([
    prisma.asset.groupBy({ by: ['status'], _count: true }),
    prisma.department.findMany({ include: { assets: true, allocations: { where: { isActive: true }, include: { asset: true } } } }),
    prisma.maintenanceRequest.findMany({ include: { asset: { include: { category: true } } } }),
    prisma.resourceBooking.findMany({ include: { resource: true } }),
    prisma.asset.findMany({ include: { category: true, department: true, maintenanceRequests: { orderBy: { createdAt: 'desc' } } } })
  ]);
  const maintenanceByCategory = Object.values(maintenance.reduce((acc, item) => {
    const key = item.asset.category.name;
    acc[key] ||= { category: key, count: 0, highPriority: 0, resolved: 0 };
    acc[key].count += 1;
    if (item.priority === 'HIGH') acc[key].highPriority += 1;
    if (item.status === 'RESOLVED') acc[key].resolved += 1;
    return acc;
  }, {}));
  const maintenanceByAsset = Object.values(maintenance.reduce((acc, item) => {
    const key = item.assetId;
    acc[key] ||= { assetTag: item.asset.tag, assetName: item.asset.name, category: item.asset.category.name, count: 0, latestStatus: item.status, latestDate: item.createdAt };
    acc[key].count += 1;
    if (new Date(item.createdAt) > new Date(acc[key].latestDate)) {
      acc[key].latestStatus = item.status;
      acc[key].latestDate = item.createdAt;
    }
    return acc;
  }, {})).sort((a, b) => b.count - a.count);
  const bookingHeatmap = Object.values(bookings.reduce((acc, item) => {
    const hour = new Date(item.startTime).getHours();
    acc[hour] ||= { hour, count: 0 };
    acc[hour].count += 1;
    return acc;
  }, {})).sort((a, b) => a.hour - b.hour);
  const riskCutoff = new Date();
  riskCutoff.setFullYear(riskCutoff.getFullYear() - 4);
  const assetRisk = assets
    .map((asset) => {
      const reasons = [];
      if (asset.status === 'UNDER_MAINTENANCE') reasons.push('Under maintenance');
      if (['LOST', 'RETIRED', 'DISPOSED'].includes(asset.status)) reasons.push(asset.status.replaceAll('_', ' '));
      if (/damaged|needs/i.test(asset.condition)) reasons.push(`Condition: ${asset.condition}`);
      if (asset.acquisitionDate && new Date(asset.acquisitionDate) < riskCutoff) reasons.push('Nearing retirement age');
      return {
        assetTag: asset.tag,
        assetName: asset.name,
        category: asset.category?.name || '-',
        department: asset.department?.name || '-',
        status: asset.status,
        condition: asset.condition,
        acquisitionDate: asset.acquisitionDate,
        reason: reasons.join('; ')
      };
    })
    .filter((row) => row.reason);
  return {
    utilization: statusGroups.map((g) => ({ status: g.status, count: g._count })),
    departmentSummary: departments.map((d) => ({
      department: d.name,
      allocated: d.allocations.length,
      totalAssets: d.assets.length,
      available: d.assets.filter((asset) => asset.status === 'AVAILABLE').length,
      underMaintenance: d.assets.filter((asset) => asset.status === 'UNDER_MAINTENANCE').length,
      inactiveLifecycle: d.assets.filter((asset) => ['LOST', 'RETIRED', 'DISPOSED'].includes(asset.status)).length,
      estimatedValue: d.assets.reduce((sum, asset) => sum + Number(asset.acquisitionCost || 0), 0)
    })),
    maintenanceByCategory,
    maintenanceByAsset,
    assetRisk,
    bookingHeatmap
  };
}

export function toCsv(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value) => {
    const text = value instanceof Date ? value.toISOString() : String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
}

export async function getReportExport(type) {
  const reports = await getReports();
  const allowed = ['departmentSummary', 'maintenanceByCategory', 'maintenanceByAsset', 'assetRisk'];
  if (!allowed.includes(type)) throw new ApiError(400, 'Unknown report export type');
  return toCsv(reports[type]);
}
