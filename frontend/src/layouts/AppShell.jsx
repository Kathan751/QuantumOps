import { NavLink, Outlet } from 'react-router-dom';
import { Activity, BarChart3, Bell, Boxes, Building2, CalendarDays, ClipboardCheck, Command, Home, LogOut, Search, ShieldCheck, Sparkles, Wrench, Zap } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import { Badge } from '../components/ui.jsx';

const nav = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/org', label: 'Organization', icon: Building2, roles: ['ADMIN'] },
  { to: '/assets', label: 'Assets', icon: Boxes },
  { to: '/allocations', label: 'Allocation', icon: ShieldCheck },
  { to: '/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/audits', label: 'Audits', icon: ClipboardCheck },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'] },
  { to: '/notifications', label: 'Logs & Alerts', icon: Bell }
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const visible = nav.filter((item) => !item.roles || item.roles.includes(user.role));
  return <div className="command-grid min-h-screen lg:flex">
    <aside className="sticky top-0 z-20 border-b border-white/10 bg-slate-950 p-4 text-white shadow-2xl lg:h-screen lg:w-80 lg:border-b-0 lg:border-r">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.28),transparent_18rem),radial-gradient(circle_at_bottom,rgba(37,99,235,0.18),transparent_20rem)]" />
      <div className="relative">
        <div className="mb-8 flex items-center gap-3 rounded-[1.75rem] border border-white/10 bg-white/8 p-3 shadow-soft backdrop-blur"><div className="grid h-13 w-13 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 via-brand-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20"><Activity /></div><div><h1 className="text-2xl font-black tracking-tight">QuantumOps</h1><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">ERP Command OS</p></div></div>
        <div className="mb-5 rounded-[1.5rem] border border-cyan-300/20 bg-cyan-300/10 p-4 text-xs font-semibold text-cyan-100 backdrop-blur"><div className="mb-2 flex items-center gap-2 text-white"><Sparkles size={16} /> Demo Intelligence Layer</div>Seeded workflows, role-aware controls, and live operational telemetry.</div>
        <nav className="grid gap-1.5">{visible.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition ${isActive ? 'bg-white text-slate-950 shadow-xl shadow-cyan-500/10' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/8 text-cyan-200 transition group-hover:bg-cyan-300/20"><Icon size={18} /></span>{label}</NavLink>)}</nav>
      </div>
    </aside>
    <main className="min-w-0 flex-1">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/70 bg-white/72 px-6 py-4 shadow-sm backdrop-blur-2xl">
        <div className="hidden min-w-0 max-w-xl flex-1 items-center gap-3 rounded-2xl border border-white/70 bg-slate-950/5 px-4 py-2.5 text-sm text-slate-400 md:flex"><Search size={16} /> Search assets, users, bookings... <span className="ml-auto rounded-lg bg-white px-2 py-1 text-xs font-black text-slate-400"><Command size={12} className="inline" /> K</span></div>
        <div className="flex items-center gap-3 md:ml-4"><div className="hidden items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 lg:flex"><Zap size={14} /> Live</div><div className="text-right"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Signed in as</p><h2 className="font-black">{user.name}</h2></div><Badge tone="blue">{user.role.replaceAll('_', ' ')}</Badge><button onClick={logout} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100"><LogOut size={18} /></button></div>
      </header>
      <section className="p-6"><Outlet /></section>
    </main>
  </div>;
}
