import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';
import { getReportExport, getReports } from '../services/reports.service.js';

const router = Router();
router.use(authenticate, requireRole('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'));
router.get('/', asyncHandler(async (req, res) => res.json(await getReports(req.user))));
router.get('/export', asyncHandler(async (req, res) => {
  const type = String(req.query.type || '');
  const csv = await getReportExport(type);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${type}.csv"`);
  res.send(csv);
}));
export default router;
