import Link from 'next/link';
import { api } from '@/lib/api';
import { EmptyState, PageHeader } from '@/components/admin/presentation';

export const dynamic = 'force-dynamic';

export default async function AdminCompaniesPage() {
  const companies = await api.admin.companies.list();
  return (
    <div>
      <PageHeader
        eyebrow="Companies"
        title="Tenants on the platform"
        description="Each company owns its own product catalogue, RAG corpus, and team. Click a card to open the detail page."
        action={
          <Link
            href="/admin/companies/new"
            className="rounded-full bg-ink px-4 py-2 text-sm text-paper hover:bg-ink-soft"
          >
            Create company
          </Link>
        }
      />

      {companies.length === 0 ? (
        <EmptyState
          title="No companies yet"
          body="Create the first tenant — Owners and Managers can then be provisioned and attached."
          cta={{ href: '/admin/companies/new', label: 'Create company' }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <Link
              key={c.id}
              href={`/admin/companies/${c.id}`}
              className="group rounded-xl border border-ink/10 bg-paper p-5 transition hover:border-ink/30 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-display text-xl">{c.name}</h3>
                <code className="font-mono text-[10px] text-ink-mute">{c.id}</code>
              </div>
              {c.description && (
                <p className="muted mt-1 line-clamp-2">{c.description}</p>
              )}
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Mini k="Products" v={c.product_count ?? 0} />
                <Mini k="Users" v={c.user_count ?? 0} />
                <Mini k="Agents" v={c.sales_rep_count ?? 0} />
              </dl>
              <p className="mt-4 flex items-center justify-between text-[11px] text-ink-mute">
                <span>Manager: {c.manager_name || 'Unassigned'}</span>
                <span>
                  {c.is_active ? (
                    <span className="text-emerald-700">Active</span>
                  ) : (
                    <span className="text-red-700">Suspended</span>
                  )}
                </span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Mini({ k, v }: { k: string; v: number }) {
  return (
    <div className="rounded-md bg-paper-2 px-2 py-1.5">
      <p className="font-mono text-[10px] uppercase text-ink-mute">{k}</p>
      <p className="font-display text-lg tabular-nums">{v}</p>
    </div>
  );
}
