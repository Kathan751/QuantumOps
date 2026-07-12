import { cn } from '../lib/utils.js';

export function Button({ className, variant = 'primary', ...props }) {
  return <button className={cn('inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black shadow-sm transition duration-200 disabled:opacity-50', variant === 'primary' ? 'bg-gradient-to-r from-brand-600 via-blue-600 to-cyan-500 text-white shadow-blue-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-200' : variant === 'danger' ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white hover:shadow-lg hover:shadow-rose-200' : 'border border-slate-200/80 bg-white/85 text-slate-700 backdrop-blur hover:border-brand-200 hover:bg-brand-50 hover:text-brand-900', className)} {...props} />;
}

export function Card({ className, ...props }) {
  return <div className={cn('lift rounded-[1.75rem] border border-white/70 bg-white/82 p-6 shadow-soft ring-1 ring-slate-900/5 backdrop-blur-xl', className)} {...props} />;
}

export function Input(props) {
  return <input className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...props} />;
}

export function Textarea(props) {
  return <textarea className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...props} />;
}

export function Select({ children, ...props }) {
  return <select className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...props}>{children}</select>;
}

export function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700'
  };
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone] || tones.slate)}>{children}</span>;
}

export function StatusBadge({ value }) {
  const text = String(value || '-').replaceAll('_', ' ');
  const tone = /AVAILABLE|APPROVED|VERIFIED|ACTIVE|RESOLVED/.test(value) ? 'green' : /PENDING|REQUESTED|UPCOMING|ONGOING|UNDER/.test(value) ? 'amber' : /REJECTED|LOST|CANCELLED|MISSING/.test(value) ? 'red' : 'slate';
  return <Badge tone={tone}>{text}</Badge>;
}

export function Field({ label, children }) {
  return <label className="grid gap-1 text-sm font-medium text-slate-700"><span>{label}</span>{children}</label>;
}

export function EmptyState({ title, text }) {
  return <div className="aurora-border rounded-[1.5rem] bg-white/70 p-10 text-center shadow-soft backdrop-blur"><div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-400 opacity-90" /><p className="font-black text-slate-900">{title}</p><p className="mt-1 text-sm text-slate-500">{text}</p></div>;
}

export function SimpleTable({ columns, rows, renderActions, emptyTitle = 'No records found', emptyText = 'Try changing filters or create a new record.' }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length) return <EmptyState title={emptyTitle} text={emptyText} />;
  return <div className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/80 shadow-soft backdrop-blur-xl"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200/80 text-sm"><thead className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white"><tr>{columns.map((c) => <th key={c.key} className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-white/70">{c.label}</th>)}{renderActions && <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-[0.16em] text-white/70">Actions</th>}</tr></thead><tbody className="divide-y divide-slate-100/80 bg-white/85">{safeRows.map((row, index) => <tr key={row.id || index} className="transition hover:bg-blue-50/70">{columns.map((c) => <td key={c.key} className="px-5 py-4 text-slate-700">{c.render ? c.render(row) : row[c.key]}</td>)}{renderActions && <td className="px-5 py-4 text-right">{renderActions(row)}</td>}</tr>)}</tbody></table></div></div>;
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return <div className="aurora-border command-grid mb-6 flex flex-col gap-4 overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-soft lg:flex-row lg:items-center lg:justify-between"><div className="relative z-10"><p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">{eyebrow || 'QuantumOps'}</p><h1 className="mt-2 text-4xl font-black tracking-tight">{title}</h1>{description && <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{description}</p>}</div>{actions && <div className="relative z-10 flex flex-wrap gap-2">{actions}</div>}<div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" /><div className="pointer-events-none absolute right-24 top-10 h-36 w-36 rounded-full bg-blue-500/20 blur-2xl" /></div>;
}

export function SectionHeader({ title, description, actions }) {
  return <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{actions}</div>;
}

export function MetricCard({ label, value, icon: Icon, tone = 'blue', helper }) {
  const tones = { blue: 'from-blue-600 via-indigo-600 to-slate-950', green: 'from-emerald-500 via-teal-600 to-slate-950', amber: 'from-amber-500 via-orange-600 to-slate-950', purple: 'from-purple-500 via-fuchsia-600 to-slate-950', slate: 'from-slate-700 via-slate-900 to-black', red: 'from-rose-500 via-red-600 to-slate-950' };
  return <div className={cn('aurora-border lift relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br p-5 text-white soft-glow', tones[tone])}><div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/12 blur-sm" /><div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-white/10 via-cyan-300/70 to-white/10" /><div className="relative flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-white/72">{label}</p><p className="mt-2 text-5xl font-black tracking-tight">{value ?? 0}</p>{helper && <p className="mt-2 text-xs text-white/75">{helper}</p>}</div>{Icon && <div className="rounded-2xl bg-white/12 p-3 ring-1 ring-white/20"><Icon className="text-white/90" size={32} /></div>}</div></div>;
}

export function AlertBanner({ children, tone = 'blue' }) {
  const tones = { blue: 'border-blue-200 bg-blue-50 text-blue-800', red: 'border-rose-200 bg-rose-50 text-rose-800', amber: 'border-amber-200 bg-amber-50 text-amber-900', green: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
  return <div className={cn('rounded-2xl border px-4 py-3 text-sm font-medium', tones[tone])}>{children}</div>;
}

export function Toolbar({ children }) {
  return <div className="mb-4 flex flex-col gap-3 rounded-[1.35rem] border border-white/70 bg-white/72 p-3 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">{children}</div>;
}
