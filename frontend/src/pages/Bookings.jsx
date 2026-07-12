import { useState } from 'react';
import { workflowApi } from '../services/api.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { Button, Card, Field, Input, PageHeader, Select, SimpleTable, StatusBadge } from '../components/ui.jsx';
import { formatDate } from '../lib/utils.js';

export default function Bookings() {
  const { data: resources = [], refresh } = useAsyncData(workflowApi.resources, [], 30000, []);
  const [form, setForm] = useState({ resourceId: '', startTime: '', endTime: '' });
  const [message, setMessage] = useState('');
  async function submit(e) {
    e.preventDefault();
    try { await workflowApi.book(form); setMessage('Booking confirmed.'); refresh(); } catch (err) { setMessage(err.message); }
  }
  const bookings = resources.flatMap((r) => (r.bookings || []).map((b) => ({ ...b, resourceName: r.name })));
  return <div className="grid gap-6"><PageHeader eyebrow="Shared Resources" title="Resource Booking" description="Book rooms, transport, labs, and equipment with strict overlap prevention." /><Card><form onSubmit={submit} className="grid gap-3 md:grid-cols-4"><Field label="Resource"><Select required value={form.resourceId} onChange={(e) => setForm({ ...form, resourceId: e.target.value })}><option value="">Select</option>{resources.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.location}</option>)}</Select></Field><Field label="Start"><Input required type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></Field><Field label="End"><Input required type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></Field><Button className="self-end">Book Resource</Button></form>{message && <p className="mt-3 rounded-2xl bg-blue-50 p-3 text-sm font-semibold text-blue-800">{message}</p>}</Card><Card><h2 className="mb-3 text-xl font-black">Calendar View</h2><SimpleTable columns={[{ key: 'resourceName', label: 'Resource' }, { key: 'bookedBy', label: 'Booked By', render: (r) => r.bookedBy?.name }, { key: 'startTime', label: 'Start', render: (r) => formatDate(r.startTime) }, { key: 'endTime', label: 'End', render: (r) => formatDate(r.endTime) }, { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> }]} rows={bookings} renderActions={(r) => r.status !== 'CANCELLED' && <Button variant="secondary" onClick={() => workflowApi.updateBooking(r.id, { status: 'CANCELLED' }).then(refresh)}>Cancel</Button>} /></Card></div>;
}
