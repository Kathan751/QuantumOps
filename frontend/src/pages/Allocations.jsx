import { useState } from 'react';
import { assetApi, orgApi } from '../services/api.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { Button, Card, Field, Input, PageHeader, Select, SimpleTable, StatusBadge } from '../components/ui.jsx';
import { formatDate } from '../lib/utils.js';

export default function Allocations() {
  const { data: allocations = [], refresh } = useAsyncData(assetApi.allocations, [], 0, []);
  const { data: transfers = [], refresh: refreshTransfers } = useAsyncData(assetApi.transfers, [], 0, []);
  const { data: assets = [] } = useAsyncData(() => assetApi.list(), [], 0, []);
  const { data: users = [] } = useAsyncData(orgApi.users, [], 0, []);
  const [form, setForm] = useState({ assetId: '', holderUserId: '', expectedReturnDate: '' });
  const [message, setMessage] = useState('');
  async function allocate(e) {
    e.preventDefault();
    try { await assetApi.allocate(form); setMessage('Asset allocated successfully.'); refresh(); } catch (err) { setMessage(err.message); }
  }
  async function requestTransfer(assetId, allocationId) {
    const target = users.find((u) => u.role === 'EMPLOYEE');
    await assetApi.requestTransfer({ assetId, fromAllocationId: allocationId, toUserId: target?.id });
    refreshTransfers();
  }
  return <div className="grid gap-6"><PageHeader eyebrow="Custody Control" title="Allocation & Transfer Control" description="Prevent double allocation, route transfers through approval, and capture return condition notes." /><Card><form onSubmit={allocate} className="grid gap-3 md:grid-cols-4"><Field label="Asset"><Select required value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })}><option value="">Select</option>{assets.map((a) => <option key={a.id} value={a.id}>{a.tag} · {a.name} ({a.status})</option>)}</Select></Field><Field label="Employee holder"><Select value={form.holderUserId} onChange={(e) => setForm({ ...form, holderUserId: e.target.value })}><option value="">Select</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field><Field label="Expected return"><Input type="date" value={form.expectedReturnDate} onChange={(e) => setForm({ ...form, expectedReturnDate: e.target.value })} /></Field><Button className="self-end">Allocate</Button></form>{message && <p className="mt-3 rounded-2xl bg-blue-50 p-3 text-sm font-semibold text-blue-800">{message}</p>}</Card><Card><h2 className="mb-3 text-xl font-black">Allocation History</h2><SimpleTable columns={[{ key: 'asset', label: 'Asset', render: (r) => `${r.asset.tag} ${r.asset.name}` }, { key: 'holder', label: 'Holder', render: (r) => r.holderUser?.name || r.holderDepartment?.name || '-' }, { key: 'expectedReturnDate', label: 'Expected', render: (r) => formatDate(r.expectedReturnDate) }, { key: 'isActive', label: 'Status', render: (r) => <StatusBadge value={r.isActive ? 'ACTIVE' : 'RETURNED'} /> }]} rows={allocations} renderActions={(r) => r.isActive && <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => assetApi.returnAllocation(r.id, { returnConditionNotes: 'Checked in good condition' }).then(refresh)}>Return</Button><Button variant="secondary" onClick={() => requestTransfer(r.assetId, r.id)}>Transfer</Button></div>} /></Card><Card><h2 className="mb-3 text-xl font-black">Transfer Requests</h2><SimpleTable columns={[{ key: 'asset', label: 'Asset', render: (r) => r.asset?.name }, { key: 'requestedBy', label: 'Requested By', render: (r) => r.requestedBy?.name }, { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> }]} rows={transfers} renderActions={(r) => r.status === 'REQUESTED' && <div className="flex justify-end gap-2"><Button onClick={() => assetApi.approveTransfer(r.id).then(refreshTransfers)}>Approve</Button><Button variant="danger" onClick={() => assetApi.rejectTransfer(r.id, { rejectionReason: 'Not approved' }).then(refreshTransfers)}>Reject</Button></div>} /></Card></div>;
}
