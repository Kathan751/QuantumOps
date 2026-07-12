import { useState } from 'react';
import { orgApi } from '../services/api.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { Button, Card, Field, Input, PageHeader, Select, SimpleTable, StatusBadge, Toolbar } from '../components/ui.jsx';

export default function OrganizationSetup() {
  const [tab, setTab] = useState('departments');
  const { data: departments = [], refresh: refreshDepts } = useAsyncData(orgApi.departments, [], 0, []);
  const { data: categories = [], refresh: refreshCats } = useAsyncData(orgApi.categories, [], 0, []);
  const { data: users = [], refresh: refreshUsers } = useAsyncData(orgApi.users, [], 0, []);
  return <div className="grid gap-6">
    <PageHeader eyebrow="Admin Workspace" title="Organization Setup" description="Manage departments, reusable asset categories, and the only approved role-promotion surface in AssetFlow." />
    <Toolbar>{['departments', 'categories', 'employees'].map((t) => <Button key={t} variant={tab === t ? 'primary' : 'secondary'} onClick={() => setTab(t)}>{t}</Button>)}</Toolbar>
    {tab === 'departments' && <Departments departments={departments} users={users} refresh={refreshDepts} />}
    {tab === 'categories' && <Categories categories={categories} refresh={refreshCats} />}
    {tab === 'employees' && <Employees users={users} departments={departments} refresh={refreshUsers} />}
  </div>;
}

function Departments({ departments, users, refresh }) {
  const [form, setForm] = useState({ name: '', parentDepartmentId: '', headUserId: '', status: 'ACTIVE' });
  async function submit(e) { e.preventDefault(); await orgApi.saveDepartment(form, form.id); setForm({ name: '', parentDepartmentId: '', headUserId: '', status: 'ACTIVE' }); refresh(); }
  function edit(row) { setForm({ id: row.id, name: row.name, parentDepartmentId: row.parentDepartmentId || '', headUserId: row.headUserId || '', status: row.status }); }
  async function setStatus(row, status) { await orgApi.saveDepartment({ ...row, status, parentDepartmentId: row.parentDepartmentId || '', headUserId: row.headUserId || '' }, row.id); refresh(); }
  return <Card><form onSubmit={submit} className="mb-5 grid gap-3 md:grid-cols-5"><Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field><Field label="Parent"><Select value={form.parentDepartmentId} onChange={(e) => setForm({ ...form, parentDepartmentId: e.target.value })}><option value="">None</option>{departments.filter((d) => d.id !== form.id).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field><Field label="Head"><Select value={form.headUserId} onChange={(e) => setForm({ ...form, headUserId: e.target.value })}><option value="">None</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field><Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>ACTIVE</option><option>INACTIVE</option></Select></Field><div className="flex gap-2 self-end"><Button>{form.id ? 'Update' : 'Create'}</Button>{form.id && <Button type="button" variant="secondary" onClick={() => setForm({ name: '', parentDepartmentId: '', headUserId: '', status: 'ACTIVE' })}>Cancel</Button>}</div></form><SimpleTable columns={[{ key: 'name', label: 'Department' }, { key: 'head', label: 'Head', render: (r) => r.head?.name || '-' }, { key: 'parent', label: 'Parent', render: (r) => r.parent?.name || '-' }, { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> }]} rows={departments} renderActions={(r) => <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => edit(r)}>Edit</Button><Button variant={r.status === 'ACTIVE' ? 'danger' : 'secondary'} onClick={() => setStatus(r, r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}>{r.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}</Button></div>} /></Card>;
}

function Categories({ categories, refresh }) {
  const [form, setForm] = useState({ name: '', customFieldsSchema: {} });
  async function submit(e) { e.preventDefault(); await orgApi.saveCategory(form, form.id); setForm({ name: '', customFieldsSchema: {}, status: 'ACTIVE', customFieldName: '' }); refresh(); }
  function edit(row) { const field = Object.keys(row.customFieldsSchema || {})[0] || ''; setForm({ id: row.id, name: row.name, customFieldsSchema: row.customFieldsSchema || {}, customFieldName: field, status: row.status }); }
  async function setStatus(row, status) { await orgApi.saveCategory({ name: row.name, customFieldsSchema: row.customFieldsSchema || {}, status }, row.id); refresh(); }
  return <Card><form onSubmit={submit} className="mb-5 grid gap-3 md:grid-cols-4"><Field label="Category"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field><Field label="Optional field"><Input placeholder="warrantyMonths" value={form.customFieldName || ''} onChange={(e) => setForm({ ...form, customFieldName: e.target.value, customFieldsSchema: e.target.value ? { [e.target.value]: true } : {} })} /></Field><Field label="Status"><Select value={form.status || 'ACTIVE'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>ACTIVE</option><option>INACTIVE</option></Select></Field><div className="flex gap-2 self-end"><Button>{form.id ? 'Update category' : 'Create category'}</Button>{form.id && <Button type="button" variant="secondary" onClick={() => setForm({ name: '', customFieldsSchema: {}, status: 'ACTIVE', customFieldName: '' })}>Cancel</Button>}</div></form><SimpleTable columns={[{ key: 'name', label: 'Category' }, { key: 'customFieldsSchema', label: 'Custom Fields', render: (r) => Object.keys(r.customFieldsSchema || {}).join(', ') || '-' }, { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> }]} rows={categories} renderActions={(r) => <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => edit(r)}>Edit</Button><Button variant={r.status === 'ACTIVE' ? 'danger' : 'secondary'} onClick={() => setStatus(r, r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}>{r.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}</Button></div>} /></Card>;
}

function Employees({ users, departments, refresh }) {
  const [editing, setEditing] = useState({});
  function patch(id, values) { setEditing((current) => ({ ...current, [id]: { ...current[id], ...values } })); }
  async function save(user) { await orgApi.updateUser(user.id, { role: editing[user.id]?.role || user.role, status: editing[user.id]?.status || user.status, departmentId: editing[user.id]?.departmentId ?? user.departmentId }); setEditing((current) => ({ ...current, [user.id]: undefined })); refresh(); }
  return <Card><SimpleTable columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'department', label: 'Department', render: (u) => <Select value={editing[u.id]?.departmentId ?? u.departmentId ?? ''} onChange={(e) => patch(u.id, { departmentId: e.target.value })}><option value="">Unassigned</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select> }, { key: 'role', label: 'Role', render: (u) => <Select value={editing[u.id]?.role || u.role} onChange={(e) => patch(u.id, { role: e.target.value })}><option>EMPLOYEE</option><option>DEPARTMENT_HEAD</option><option>ASSET_MANAGER</option><option>ADMIN</option></Select> }, { key: 'status', label: 'Status', render: (u) => <Select value={editing[u.id]?.status || u.status} onChange={(e) => patch(u.id, { status: e.target.value })}><option>ACTIVE</option><option>INACTIVE</option></Select> }]} rows={users} renderActions={(u) => <Button onClick={() => save(u)}>Save</Button>} /></Card>;
}
