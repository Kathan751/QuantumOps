import { insightApi } from '../services/api.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { Button, Card, PageHeader, SimpleTable, StatusBadge } from '../components/ui.jsx';
import { getToken } from '../services/api.js';
import { formatDate } from '../lib/utils.js';

export default function Reports() {
  const { data, loading, error } = useAsyncData(insightApi.reports, []);
  if (loading) return <p>Loading reports...</p>;
  if (error) return <p className="text-rose-600">{error}</p>;
  return <div className="grid gap-6">
    <PageHeader eyebrow="Executive Analytics" title="Reports & Analytics" description="Exportable operational reports for allocation, maintenance frequency, and asset risk." />
    <div className="grid gap-4 lg:grid-cols-2"><Chart title="Asset Utilization" rows={data.utilization} labelKey="status" /><Chart title="Resource Peak Usage by Hour" rows={data.bookingHeatmap} labelKey="hour" /></div>
    <ReportSection title="Department-wise Allocation Summary" type="departmentSummary" rows={data.departmentSummary} columns={[{ key: 'department', label: 'Department' }, { key: 'allocated', label: 'Allocated' }, { key: 'totalAssets', label: 'Total Assets' }, { key: 'available', label: 'Available' }, { key: 'underMaintenance', label: 'Maintenance' }, { key: 'inactiveLifecycle', label: 'Lost/Retired' }, { key: 'estimatedValue', label: 'Value', render: (r) => `$${Number(r.estimatedValue || 0).toLocaleString()}` }]} />
    <ReportSection title="Maintenance Frequency by Category" type="maintenanceByCategory" rows={data.maintenanceByCategory} columns={[{ key: 'category', label: 'Category' }, { key: 'count', label: 'Requests' }, { key: 'highPriority', label: 'High Priority' }, { key: 'resolved', label: 'Resolved' }]} />
    <ReportSection title="Maintenance Frequency by Asset" type="maintenanceByAsset" rows={data.maintenanceByAsset} columns={[{ key: 'assetTag', label: 'Tag' }, { key: 'assetName', label: 'Asset' }, { key: 'category', label: 'Category' }, { key: 'count', label: 'Requests' }, { key: 'latestStatus', label: 'Latest Status', render: (r) => <StatusBadge value={r.latestStatus} /> }, { key: 'latestDate', label: 'Latest Date', render: (r) => formatDate(r.latestDate) }]} />
    <ReportSection title="Assets Due for Maintenance / Nearing Retirement" type="assetRisk" rows={data.assetRisk} columns={[{ key: 'assetTag', label: 'Tag' }, { key: 'assetName', label: 'Asset' }, { key: 'category', label: 'Category' }, { key: 'department', label: 'Department' }, { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> }, { key: 'condition', label: 'Condition' }, { key: 'reason', label: 'Reason' }]} />
  </div>;
}

function Chart({ title, rows, labelKey, valueKey = 'count' }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const max = Math.max(1, ...safeRows.map((r) => r[valueKey] || 0));
  return <Card><h2 className="mb-4 text-xl font-black">{title}</h2><div className="grid gap-3">{safeRows.map((row) => <div key={row[labelKey]}><div className="mb-1 flex justify-between text-sm"><span>{String(row[labelKey]).replaceAll('_', ' ')}</span><b>{row[valueKey]}</b></div><div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-brand-600" style={{ width: `${((row[valueKey] || 0) / max) * 100}%` }} /></div></div>)}</div></Card>;
}

function ReportSection({ title, type, rows, columns }) {
  async function download() {
    const response = await fetch(insightApi.exportReport(type), {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${type}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return <Card><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-black">{title}</h2><p className="text-sm text-slate-500">{rows?.length || 0} rows available for export</p></div><Button variant="secondary" onClick={download}>Export CSV</Button></div><SimpleTable rows={rows || []} columns={columns} emptyTitle="No report rows" emptyText="Seed data or workflow activity will populate this report." /></Card>;
}
