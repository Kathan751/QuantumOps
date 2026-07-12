import { Link } from 'react-router-dom';
import { useState } from 'react';
import { assetApi, orgApi } from '../services/api.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { Button, Card, Field, Input, PageHeader, Select, SimpleTable, StatusBadge, Toolbar } from '../components/ui.jsx';

export default function Assets() {
  const [filters, setFilters] = useState({ q: '', categoryId: '', departmentId: '', status: '', location: '' });
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
  const { data: assets = [], refresh } = useAsyncData(() => assetApi.list(query ? `?${query}` : ''), [query], 0, []);
  const { data: categories = [] } = useAsyncData(orgApi.categories, [], 0, []);
  const { data: departments = [] } = useAsyncData(orgApi.departments, [], 0, []);
  const emptyForm = { name: '', categoryId: '', departmentId: '', serialNumber: '', acquisitionDate: '', condition: 'Good', location: '', acquisitionCost: '', isSharedResource: false };
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  async function submit(e) {
    e.preventDefault();
    try {
      await assetApi.create(form);
      setForm(emptyForm);
      setMessage('Asset registered successfully.');
      refresh();
    } catch (err) {
      setMessage(err.message);
    }
  }
  function setFilter(key, value) { setFilters((current) => ({ ...current, [key]: value })); }
  return <div className="grid gap-6"><PageHeader eyebrow="Asset Registry" title="Asset Directory" description="Register, search, filter, and inspect asset lifecycle status with audit-ready histories." /><Card><form onSubmit={submit} className="grid gap-3 md:grid-cols-4"><Field label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Category"><Select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Select</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field><Field label="Department"><Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}><option value="">Unassigned</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field><Field label="Serial"><Input required value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} /></Field><Field label="Acquisition date"><Input type="date" value={form.acquisitionDate} onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })} /></Field><Field label="Cost"><Input type="number" min="0" step="0.01" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} /></Field><Field label="Condition"><Select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}><option>Excellent</option><option>Good</option><option>Needs inspection</option><option>Damaged</option></Select></Field><Field label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field><label className="flex items-end gap-2 text-sm font-semibold"><input type="checkbox" checked={form.isSharedResource} onChange={(e) => setForm({ ...form, isSharedResource: e.target.checked })} />Shared/bookable</label><Button className="self-end">Register Asset</Button></form>{message && <p className="mt-3 rounded-2xl bg-blue-50 p-3 text-sm font-semibold text-blue-800">{message}</p>}</Card><Card><Toolbar><div className="grid flex-1 gap-3 md:grid-cols-5"><Input placeholder="Search tag, name, serial, category, department..." value={filters.q} onChange={(e) => setFilter('q', e.target.value)} /><Select value={filters.categoryId} onChange={(e) => setFilter('categoryId', e.target.value)}><option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select><Select value={filters.departmentId} onChange={(e) => setFilter('departmentId', e.target.value)}><option value="">All departments</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select><Select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}><option value="">All statuses</option><option>AVAILABLE</option><option>ALLOCATED</option><option>RESERVED</option><option>UNDER_MAINTENANCE</option><option>LOST</option><option>RETIRED</option><option>DISPOSED</option></Select><Input placeholder="Location" value={filters.location} onChange={(e) => setFilter('location', e.target.value)} /></div><div className="flex items-center gap-2"><Button variant="secondary" onClick={() => setFilters({ q: '', categoryId: '', departmentId: '', status: '', location: '' })}>Reset</Button><span className="text-sm font-bold text-slate-500">{assets.length} assets</span></div></Toolbar><SimpleTable columns={[{ key: 'tag', label: 'Tag' }, { key: 'name', label: 'Name', render: (r) => <Link className="font-semibold text-brand-600" to={`/assets/${r.id}`}>{r.name}</Link> }, { key: 'serialNumber', label: 'Serial' }, { key: 'category', label: 'Category', render: (r) => r.category?.name }, { key: 'department', label: 'Department', render: (r) => r.department?.name || '-' }, { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> }, { key: 'location', label: 'Location' }]} rows={assets} /></Card></div>;
}
