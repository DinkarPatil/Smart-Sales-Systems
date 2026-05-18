import Link from 'next/link';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/admin/presentation';
import { UsersTable } from '@/components/admin/users-table';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const users = await api.admin.users.list();
  return (
    <div>
      <PageHeader
        eyebrow="Users"
        title="Everyone with access"
        description="Provision and govern every user across every tenant. Click a row to edit, manage assignments, and view auth activity."
        action={
          <Link
            href="/admin/users/new"
            className="rounded-full bg-ink px-4 py-2 text-sm text-paper hover:bg-ink-soft"
          >
            Provision user
          </Link>
        }
      />
      <UsersTable initialUsers={users} />
    </div>
  );
}
