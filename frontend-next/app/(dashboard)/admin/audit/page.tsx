import Link from 'next/link';
import { api } from '@/lib/api';
import { PageHeader, Pill } from '@/components/admin/presentation';

export const dynamic = 'force-dynamic';

type SearchParams = { kind?: 'ACTIVITY' | 'AUTH'; company?: string; actor?: string };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const items = await api.admin.audit.list({
    kind: searchParams.kind,
    company: searchParams.company,
    actor: searchParams.actor,
    limit: 200,
  });

  return (
    <div>
      <PageHeader
        eyebrow="Audit"
        title="Unified audit feed"
        description="Merges ActivityLog (tenant lifecycle events) and AuthEvent (login/role-change/etc.). Most recent first."
        action={
          <div className="flex gap-1.5">
            <Filter href="/admin/audit" label="All" active={!searchParams.kind} />
            <Filter
              href="/admin/audit?kind=ACTIVITY"
              label="Activity"
              active={searchParams.kind === 'ACTIVITY'}
            />
            <Filter
              href="/admin/audit?kind=AUTH"
              label="Auth"
              active={searchParams.kind === 'AUTH'}
            />
          </div>
        }
      />

      {items.length === 0 ? (
        <p className="muted">No audit entries match.</p>
      ) : (
        <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 bg-paper">
          {items.map((row) => (
            <li key={row.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Pill>{row.kind}</Pill>
                  {row.entity_type && (
                    <span className="font-mono text-[11px] text-ink-mute">
                      {row.entity_type}
                    </span>
                  )}
                  {row.company_id && (
                    <span className="font-mono text-[11px] text-ink-mute">
                      · co={row.company_id}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink">{row.summary}</p>
                {row.actor_email && (
                  <p className="font-mono text-[11px] text-ink-mute">by {row.actor_email}</p>
                )}
                {row.details ? (
                  <pre className="mt-1 max-w-3xl overflow-auto font-mono text-[11px] text-ink-mute">
                    {JSON.stringify(row.details, null, 0) ?? ''}
                  </pre>
                ) : null}
              </div>
              <time className="shrink-0 font-mono text-[11px] text-ink-mute">
                {new Date(row.timestamp).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Filter({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'rounded-full bg-ink px-3 py-1.5 text-xs text-paper'
          : 'rounded-full border border-ink/15 px-3 py-1.5 text-xs text-ink-soft hover:border-ink/40'
      }
    >
      {label}
    </Link>
  );
}
