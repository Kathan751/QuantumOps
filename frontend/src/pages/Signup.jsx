import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { orgApi } from '../services/api.js';
import { AuthFrame } from './Login.jsx';
import { Button, Field, Input, Select } from '../components/ui.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', departmentId: '' });
  const [error, setError] = useState('');
  useEffect(() => { orgApi.departments().then(setDepartments).catch(() => setDepartments([])); }, []);
  async function submit(e) {
    e.preventDefault();
    try { await signup(form); navigate('/'); } catch (err) { setError(err.message); }
  }
  return <AuthFrame title="Create employee account" subtitle="All new accounts start as Employee. Admins promote roles later.">
    <form onSubmit={submit} className="grid gap-4">
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <Field label="Full name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Email"><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
      <Field label="Password"><Input required minLength={8} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
      <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
      <Field label="Department"><Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}><option value="">Unassigned</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
      <Button>Create Employee account</Button>
      <Link className="text-sm text-brand-600" to="/login">Back to login</Link>
    </form>
  </AuthFrame>;
}
