import Link from 'next/link';
import { clsx } from 'clsx';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-paper p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">{label}</p>
      <p className="mt-2 font-display text-3xl tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}

const ROLE_COLOURS: Record<string, string> = {
  Admin: 'bg-violet-100 text-violet-900',
  Auditor: 'bg-slate-100 text-slate-900',
  Billing: 'bg-amber-100 text-amber-900',
  Owner: 'bg-rose-100 text-rose-900',
  Curator: 'bg-emerald-100 text-emerald-900',
  Manager: 'bg-sky-100 text-sky-900',
  Reviewer: 'bg-teal-100 text-teal-900',
  Agent: 'bg-blue-100 text-blue-900',
  SalesRep: 'bg-blue-100 text-blue-900',
  Customer: 'bg-fuchsia-100 text-fuchsia-900',
  System: 'bg-zinc-200 text-zinc-900',
};

export function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_COLOURS[role] ?? 'bg-ink/10 text-ink';
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', cls)}>
      {role}
    </span>
  );
}

export function StatusChip({ active }: { active: boolean }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px]',
        active ? 'bg-emerald-100 text-emerald-900' : 'bg-zinc-200 text-zinc-700',
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', active ? 'bg-emerald-600' : 'bg-zinc-500')} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body?: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="rounded-xl border border-dashed border-ink/20 bg-paper-2/40 p-10 text-center">
      <h3 className="font-display text-xl">{title}</h3>
      {body && <p className="muted mt-2">{body}</p>}
      {cta && (
        <Link
          href={cta.href}
          className="mt-5 inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm text-paper hover:bg-ink-soft"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-ink/8 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
      {children}
    </span>
  );
}
