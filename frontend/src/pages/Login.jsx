import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { Button, Field, Input } from '../components/ui.jsx';

export const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@assetflow.demo', password: 'Password123!' },
  { role: 'Asset Manager', email: 'manager@assetflow.demo', password: 'Password123!' },
  { role: 'Department Head', email: 'depthead@assetflow.demo', password: 'Password123!' },
  { role: 'Employee', email: 'employee@assetflow.demo', password: 'Password123!' }
];

export function getDemoCredentials(account) {
  return { email: account.email, password: account.password };
}

function InlineError({ children }) {
  if (!children) return null;
  return (
    <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm">
      {children}
    </p>
  );
}

function DemoAccountGrid({ onSelect }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Demo shortcuts</p>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-emerald-700">
          Real login
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.email}
            type="button"
            onClick={() => onSelect(account)}
            className="group rounded-2xl border border-slate-200/80 bg-white/80 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 hover:shadow-lg hover:shadow-blue-100"
          >
            <p className="text-sm font-black text-slate-900 group-hover:text-brand-800">{account.role}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{account.email}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@assetflow.demo', password: 'Password123!' });
  const [error, setError] = useState('');

  function updateForm(next) {
    setForm((current) => ({ ...current, ...next }));
    if (error) setError('');
  }

  async function submit(e) {
    e.preventDefault();
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthFrame title="Welcome back" subtitle="Sign in to your AssetFlow control center">
      <form onSubmit={submit} className="grid gap-4">
        <InlineError>{error}</InlineError>
        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => updateForm({ email: e.target.value })}
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => updateForm({ password: e.target.value })}
          />
        </Field>
        <Button className="mt-1 w-full py-3 text-base">Enter command center</Button>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link className="font-bold text-brand-600 hover:text-brand-800" to="/signup">Create employee account</Link>
          <Link className="font-semibold text-slate-500 hover:text-slate-800" to="/forgot-password">Forgot password?</Link>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        <DemoAccountGrid onSelect={(account) => updateForm(getDemoCredentials(account))} />
      </form>
    </AuthFrame>
  );
}

function TrustPill({ children }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
      {children}
    </span>
  );
}

function HeroMetric({ label, value, helper }) {
  return (
    <div className="aurora-border rounded-3xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-300">{helper}</p>
    </div>
  );
}

export function AuthFrame({ title, subtitle, children, mode = 'login' }) {
  return (
    <main className="command-grid relative min-h-screen overflow-hidden bg-slate-950 p-4 text-slate-950 sm:p-6">
      <div className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-blue-500/25 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-16 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl" />

      <section className="relative z-10 mx-auto grid soft-glow min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/35 backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative flex min-h-[34rem] flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8 text-white sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.22),transparent_26rem),radial-gradient(circle_at_85%_15%,rgba(37,99,235,0.22),transparent_24rem)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 shadow-lg shadow-blue-950/30 backdrop-blur">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-400 text-sm font-black text-white">AF</span>
              <div>
                <p className="text-sm font-black leading-none">AssetFlow</p>
                <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-cyan-200">Command Center</p>
              </div>
            </div>

            <div className="mt-12 max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">Enterprise Asset Operations</p>
              <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
                Control assets, bookings, maintenance, and audits from one secure cockpit.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
                Demo-ready ERP workflows with backend RBAC, conflict prevention, lifecycle tracking, and immutable activity visibility.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <TrustPill>RBAC secured</TrustPill>
              <TrustPill>Audit-ready</TrustPill>
              <TrustPill>JWT protected</TrustPill>
              <TrustPill>Demo seeded</TrustPill>
            </div>
          </div>

          <div className="relative z-10 mt-10 grid gap-3 sm:grid-cols-3">
            <HeroMetric label="Assets tracked" value="248" helper="Tags, holders, condition, and lifecycle state." />
            <HeroMetric label="Overlap control" value="0" helper="Strict booking conflict checks before confirmation." />
            <HeroMetric label="Audit trail" value="Live" helper="Every key workflow creates logs and notifications." />
          </div>
        </div>

        <div className="relative flex items-center justify-center bg-slate-50/95 p-6 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.16),transparent_24rem),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.13),transparent_24rem)]" />
          <div className="aurora-border glass relative z-10 w-full max-w-xl rounded-[2rem] border border-white/80 bg-white/86 p-6 shadow-soft ring-1 ring-slate-900/5 backdrop-blur-2xl sm:p-8">
            <div className="mb-7">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-600">{mode === 'login' ? 'Secure access' : 'AssetFlow access'}</p>
              <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
