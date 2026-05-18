import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/api/http';
import { PageHeader, StatTile } from '@/components/admin/presentation';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const [stats, diagnostics, recent] = await Promise.all([
    api.admin.stats(),
    api.admin.system.diagnostics().catch(() => null),
    api.admin.audit.list({ limit: 10 }).catch((e) => {
      if (e instanceof ApiError) return [];
      throw e;
    }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Platform health"
        description="A first look at users, companies, queries, and the RAG pipeline. Drill into any tile from the sidebar."
        action={
          <div className="flex gap-2">
            <Link
              href="/admin/users/new"
              className="rounded-full bg-ink px-4 py-2 text-sm text-paper hover:bg-ink-soft"
            >
              Provision user
            </Link>
            <Link
              href="/admin/companies/new"
              className="rounded-full border border-ink/20 px-4 py-2 text-sm text-ink hover:border-ink/50"
            >
              Create company
            </Link>
          </div>
        }
      />

      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Total users" value={stats.total_users} hint={`${stats.inactive_users} inactive`} />
        <StatTile label="Companies" value={stats.total_companies} />
        <StatTile label="Products" value={stats.total_products} />
        <StatTile label="Assignments" value={stats.total_assignments} hint="multi-tenant links" />
        <StatTile label="Queries" value={stats.total_queries} />
        <StatTile label="Pending" value={stats.pending_queries} />
        <StatTile label="Escalated" value={stats.escalated_queries} />
        <StatTile label="Resolved" value={stats.resolved_queries} />
        <StatTile label="Managers" value={stats.total_managers} />
        <StatTile label="Agents" value={stats.total_agents} hint="incl. legacy SalesRep" />
        <StatTile label="Customers" value={stats.total_customers} />
        <StatTile
          label="Vectors"
          value={diagnostics?.total_vectors ?? 0}
          hint={diagnostics?.vector_store ?? '—'}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-ink/10 bg-paper p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Recent activity</p>
              <h2 className="font-display text-xl">What happened in the last hours</h2>
            </div>
            <Link href="/admin/audit" className="inline-flex items-center gap-1 text-xs text-ink-soft hover:text-ink">
              Full feed <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="muted">Nothing recent. Provision a user or create a company to see entries here.</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {recent.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                  <div>
                    <p className="text-ink">{r.summary}</p>
                    <p className="font-mono text-[11px] text-ink-mute">
                      {r.kind}
                      {r.actor_email ? ` · ${r.actor_email}` : ''}
                      {r.company_id ? ` · co=${r.company_id}` : ''}
                    </p>
                  </div>
                  <time className="font-mono text-[11px] text-ink-mute">
                    {new Date(r.timestamp).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-ink/10 bg-paper p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">RAG</p>
          <h2 className="font-display text-xl">Vector pipeline</h2>
          {diagnostics ? (
            <dl className="mt-4 space-y-2 text-sm">
              <Row k="Embedding" v={diagnostics.embedding_model} />
              <Row k="Store" v={diagnostics.vector_store} />
              <Row k="Collections" v={diagnostics.per_tenant_collections} />
              <Row k="Vectors" v={diagnostics.total_vectors} />
              <Row k="Last hour" v={`${diagnostics.last_hour_queries} queries`} />
              <Row k="Cache hit" v={`${(diagnostics.cache_hit_rate * 100).toFixed(0)}%`} />
            </dl>
          ) : (
            <p className="muted mt-4">Diagnostics endpoint unreachable.</p>
          )}
          <Link
            href="/admin/system/diagnostics"
            className="mt-5 inline-flex items-center gap-1 text-xs text-ink-soft hover:text-ink"
          >
            Open diagnostics <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-mute">{k}</dt>
      <dd className="text-ink">{v}</dd>
    </div>
  );
}
