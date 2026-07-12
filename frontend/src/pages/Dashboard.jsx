import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Boxes, CalendarCheck, CheckCircle2, Clock, Repeat, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { insightApi } from '../services/api.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { Card, StatusBadge } from '../components/ui.jsx';
import { MetricCard, PageHeader, SectionHeader } from '../components/ui.jsx';
import { formatDate } from '../lib/utils.js';

export default function Dashboard() {
  const { data, loading, error } = useAsyncData(insightApi.dashboard, [], 15000);
  const cards = [
    ['Assets Available', data?.available, Boxes, 'text-emerald-600'],
    ['Assets Allocated', data?.allocated, CheckCircle2, 'text-blue-600'],
    ['Maintenance Today', data?.maintenanceToday, Wrench, 'text-amber-600'],
    ['Active Bookings', data?.activeBookings, CalendarCheck, 'text-purple-600'],
    ['Pending Transfers', data?.pendingTransfers, Repeat, 'text-orange-600'],
    ['Upcoming Returns', data?.upcomingReturns, Clock, 'text-slate-600']
  ];
  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p className="text-rose-600">{error}</p>;
  return <div className="grid gap-6">
    <PageHeader eyebrow="AssetFlow Command Center" title="Operational Intelligence Dashboard" description="A live ERP cockpit for asset lifecycle, custody, maintenance, resource capacity, transfer approvals, and risk signals." actions={<div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-cyan-100 backdrop-blur"><Sparkles className="mr-2 inline" size={16} /> Demo-ready seeded telemetry</div>} />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value, Icon], index) => <MetricCard key={label} label={label} value={value} icon={Icon} tone={['green', 'blue', 'amber', 'purple', 'slate', 'red'][index]} />)}</div>
    <SectionHeader title="Quick actions" description="Jump directly into the workflows judges will want to see." />
    <div className="grid gap-4 lg:grid-cols-3"><ActionTile to="/assets" title="Register Asset" text="Create tagged lifecycle records" tone="from-brand-600 to-cyan-500" /><ActionTile to="/bookings" title="Book Resource" text="Prevent time-slot conflicts" tone="from-slate-950 to-blue-950" /><ActionTile to="/maintenance" title="Raise Maintenance" text="Approval before work starts" tone="from-violet-600 to-fuchsia-600" /></div>
    <Card className={data.overdueReturns ? 'border-rose-200 bg-gradient-to-br from-rose-50 to-white' : ''}>
      <div className="mb-4 flex items-center gap-2"><div className="rounded-2xl bg-rose-100 p-2"><AlertTriangle className="text-rose-600" /></div><h2 className="text-xl font-black">Overdue Return Risk Monitor</h2><StatusBadge value={`${data.overdueReturns} overdue`} /></div>
      <div className="grid gap-2">{data.overdueItems?.length ? data.overdueItems.map((item) => <div key={item.id} className="rounded-2xl border border-rose-100 bg-white p-4 text-sm shadow-sm"><b>{item.asset.name}</b> held by {item.holderUser?.name || item.holderDepartment?.name} · due {formatDate(item.expectedReturnDate)}</div>) : <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><ShieldCheck className="mr-2 inline" size={16} /> No overdue returns right now.</div>}</div>
    </Card>
  </div>;
}

function ActionTile({ to, title, text, tone }) {
  return <Link to={to} className={`lift group relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${tone} p-6 font-black text-white soft-glow`}><div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15 blur-sm" /><span className="relative block">{title}</span><span className="relative mt-2 block text-sm font-medium text-white/75">{text}</span><ArrowRight className="relative mt-5 transition group-hover:translate-x-1" /></Link>;
}
