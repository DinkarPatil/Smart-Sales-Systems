import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/api/http';
import { PageHeader, RoleBadge, StatusChip } from '@/components/admin/presentation';
import { UserEditCard } from '@/components/admin/user-edit-card';
import { AssignmentsPanel } from '@/components/admin/assignments-panel';

export const dynamic = 'force-dynamic';

export default async function AdminUserDetailPage({
  params,
}: {
  params: { userId: string };
}) {
  const [users, companies, assignments, auth] = await Promise.all([
    api.admin.users.list({ search: '' }),
    api.admin.companies.list(),
    api.admin.users.assignments.list(params.userId).catch((e) => {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }),
    api.admin.audit.list({ actor: params.userId, kind: 'AUTH', limit: 25 }).catch(() => []),
  ]);

  const user = users.find((u) => u.id === params.userId);
  if (!user || !assignments) notFound();

  const managers = users.filter((u) => u.role === 'Manager');

  return (
    <div>
      <Link
        href="/admin/users"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All users
      </Link>
      <PageHeader
        eyebrow="User"
        title={user.full_name || user.email}
        description={user.email}
        action={
          <div className="flex items-center gap-2">
            <RoleBadge role={user.role} />
            <StatusChip active={user.is_active} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <UserEditCard user={user} companies={companies} />
        <AssignmentsPanel
          userId={user.id}
          initial={assignments}
          companies={companies}
          managers={managers}
        />
      </div>

      <section className="mt-6 rounded-xl border border-ink/10 bg-paper p-6">
        <h2 className="font-display text-lg">Recent auth activity</h2>
        {auth.length === 0 ? (
          <p className="muted mt-2">No auth events yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink/10">
            {auth.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                <div>
                  <p>{row.summary}</p>
                  {row.details ? (
                    <pre className="mt-1 max-w-3xl overflow-auto font-mono text-[11px] text-ink-mute">
                      {JSON.stringify(row.details, null, 0) ?? ''}
                    </pre>
                  ) : null}
                </div>
                <time className="font-mono text-[11px] text-ink-mute">
                  {new Date(row.timestamp).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
