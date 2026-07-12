import { describe, expect, it } from 'vitest';

describe('AssetFlow business rules', () => {
  it('signup always creates an Employee role', async () => {
    const { normalizeSignupRole } = await import('../services/auth.service.js');
    expect(normalizeSignupRole('ADMIN')).toBe('EMPLOYEE');
    expect(normalizeSignupRole('ASSET_MANAGER')).toBe('EMPLOYEE');
  });

  it('booking overlap treats touching endpoints as allowed', async () => {
    const { rangesOverlap } = await import('../services/bookings.service.js');
    expect(rangesOverlap(new Date('2026-01-01T09:00:00Z'), new Date('2026-01-01T10:00:00Z'), new Date('2026-01-01T09:30:00Z'), new Date('2026-01-01T10:30:00Z'))).toBe(true);
    expect(rangesOverlap(new Date('2026-01-01T09:00:00Z'), new Date('2026-01-01T10:00:00Z'), new Date('2026-01-01T10:00:00Z'), new Date('2026-01-01T11:00:00Z'))).toBe(false);
  });

  it('maintenance cannot start unless approved', async () => {
    const { canStartMaintenance } = await import('../services/maintenance.service.js');
    expect(canStartMaintenance('PENDING')).toBe(false);
    expect(canStartMaintenance('APPROVED')).toBe(true);
    expect(canStartMaintenance('TECHNICIAN_ASSIGNED')).toBe(true);
  });

  it('asset search includes category and department names', async () => {
    const { buildAssetWhere } = await import('../services/assets.service.js');
    const where = buildAssetWhere({ q: 'Engineering' });

    expect(where.OR).toContainEqual({ category: { name: { contains: 'Engineering' } } });
    expect(where.OR).toContainEqual({ department: { name: { contains: 'Engineering' } } });
  });

  it('exports report rows as CSV with escaped values', async () => {
    const { toCsv, getReportExport } = await import('../services/reports.service.js');
    expect(toCsv([{ department: 'R&D', allocated: 2 }, { department: 'Sales, West', allocated: 1 }])).toContain('"Sales, West",1');
    await expect(getReportExport('not-a-report')).rejects.toThrow('Unknown report export type');
  });
});
