import { useParams } from 'react-router-dom';
import { assetApi } from '../services/api.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { Card, PageHeader, SimpleTable, StatusBadge } from '../components/ui.jsx';
import { formatDate } from '../lib/utils.js';

export default function AssetDetail() {
  const { id } = useParams();
  const { data: asset, loading, error } = useAsyncData(() => assetApi.detail(id), [id]);
  if (loading) return <p>Loading asset...</p>;
  if (error || !asset) return <p className="text-rose-600">{error || 'Asset not found'}</p>;
  return <div className="grid gap-6"><PageHeader eyebrow={asset.tag} title={asset.name} description={`${asset.category?.name || 'Asset'} · ${asset.location || 'No location'}`} /><Card className="grid gap-3 md:grid-cols-4"><div><b>Status</b><br /><StatusBadge value={asset.status} /></div><div><b>Holder</b><br />{asset.allocations?.find((a) => a.isActive)?.holderUser?.name || asset.allocations?.find((a) => a.isActive)?.holderDepartment?.name || 'Available'}</div><div><b>Department</b><br />{asset.department?.name || '-'}</div><div><b>Shared</b><br />{asset.isSharedResource ? 'Yes' : 'No'}</div></Card><Card><h2 className="mb-3 text-xl font-black">Allocation History</h2><SimpleTable columns={[{ key: 'allocatedAt', label: 'Allocated', render: (r) => formatDate(r.allocatedAt) }, { key: 'holder', label: 'Holder', render: (r) => r.holderUser?.name || r.holderDepartment?.name || '-' }, { key: 'expectedReturnDate', label: 'Expected Return', render: (r) => formatDate(r.expectedReturnDate) }, { key: 'returnedAt', label: 'Returned', render: (r) => formatDate(r.returnedAt) }, { key: 'returnConditionNotes', label: 'Notes' }]} rows={asset.allocations || []} /></Card><Card><h2 className="mb-3 text-xl font-black">Maintenance History</h2><SimpleTable columns={[{ key: 'issueDescription', label: 'Issue' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> }, { key: 'createdAt', label: 'Raised', render: (r) => formatDate(r.createdAt) }]} rows={asset.maintenanceRequests || []} /></Card></div>;
}
