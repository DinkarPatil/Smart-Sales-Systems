import Link from 'next/link';
import { api } from '@/lib/api';
import { EmptyState, PageHeader, Pill } from '@/components/admin/presentation';

export const dynamic = 'force-dynamic';

export default async function AdminAssignmentsPage() {
  // No dedicated "list all assignments" endpoint — derive the cross-tenant view by walking users.
  // (Cheap for now; if scale demands, add a backend endpoint.)
  const users = await api.admin.users.list();
  const all = (
    await Promise.all(
      users.map((u) => api.admin.users.assignments.list(u.id).catch(() => [])),
    )
  ).flat();
  // newest first
  all.sort((a, b) => +new Date(b.assigned_at) - +new Date(a.assigned_at));

  return (
    <div>
      <PageHeader
        eyebrow="Assignments"
        title="Multi-company memberships"
        description="Every Manager / Agent / Reviewer / Curator row in user_company_assignments. Edit individual rows from each user's detail page."
      />

      {all.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          body="Open a user, attach them to a company with a role-in-company, and the row will appear here."
          cta={{ href: '/admin/users', label: 'Pick a user' }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink/10 bg-paper">
          <table className="min-w-full divide-y divide-ink/10 text-sm">
            <thead className="bg-paper-2/60">
              <tr className="text-left">
                <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-ink-mute">
                  User
                </th>
                <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-ink-mute">
                  Company
                </th>
                <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-ink-mute">
                  Role
                </th>
                <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-ink-mute">
                  Manager
                </th>
                <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-ink-mute">
                  Status
                </th>
                <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-ink-mute">
                  Assigned
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {all.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${a.user_id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {a.user_full_name || a.user_email}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/companies/${a.company_id}`}
                      className="text-ink-soft hover:text-ink hover:underline"
                    >
                      {a.company_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Pill>{a.role_in_company}</Pill>
                    {a.is_primary && <span className="ml-2 text-[10px] text-accent">primary</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{a.manager_full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-soft">{a.status}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ink-mute">
                    {new Date(a.assigned_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
