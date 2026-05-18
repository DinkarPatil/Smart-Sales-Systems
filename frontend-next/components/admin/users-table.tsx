'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { UserOut } from '@/lib/api/schemas';
import { RoleBadge, StatusChip } from './presentation';

export function UsersTable({ initialUsers }: { initialUsers: UserOut[] }) {
  const [role, setRole] = useState<string>('');
  const [active, setActive] = useState<string>('all');
  const [q, setQ] = useState<string>('');

  const filtered = initialUsers.filter((u) => {
    if (role && u.role !== role) return false;
    if (active === 'active' && !u.is_active) return false;
    if (active === 'inactive' && u.is_active) return false;
    if (q) {
      const needle = q.toLowerCase();
      if (
        !u.email.toLowerCase().includes(needle) &&
        !(u.full_name ?? '').toLowerCase().includes(needle)
      )
        return false;
    }
    return true;
  });

  const roles = Array.from(new Set(initialUsers.map((u) => u.role))).sort();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-ink/10 bg-paper p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email or name…"
          className="min-w-[220px] flex-1 rounded-md border border-ink/15 bg-paper-2 px-3 py-1.5 text-sm placeholder:text-ink-mute focus:border-ink/50 focus:outline-none"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-md border border-ink/15 bg-paper-2 px-3 py-1.5 text-sm focus:border-ink/50 focus:outline-none"
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={active}
          onChange={(e) => setActive(e.target.value)}
          className="rounded-md border border-ink/15 bg-paper-2 px-3 py-1.5 text-sm focus:border-ink/50 focus:outline-none"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="ml-auto font-mono text-xs text-ink-mute">
          {filtered.length} / {initialUsers.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink/10 bg-paper">
        <table className="min-w-full divide-y divide-ink/10 text-sm">
          <thead className="bg-paper-2/60">
            <tr className="text-left">
              <Th>Email</Th>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Companies</Th>
              <Th>Created</Th>
              <Th aria-label="actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-ink/[0.025]">
                <Td>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="font-medium text-ink hover:underline"
                  >
                    {u.email}
                  </Link>
                </Td>
                <Td className="text-ink-soft">{u.full_name ?? '—'}</Td>
                <Td>
                  <RoleBadge role={u.role} />
                </Td>
                <Td>
                  <StatusChip active={u.is_active} />
                </Td>
                <Td className="text-ink-soft">
                  {(u.assigned_companies ?? []).length === 0
                    ? '—'
                    : (u.assigned_companies ?? []).map((c) => c.name).join(', ')}
                </Td>
                <Td className="font-mono text-[11px] text-ink-mute">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </Td>
                <Td>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="text-xs font-medium text-ink-soft hover:text-ink"
                  >
                    Edit →
                  </Link>
                </Td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-ink-mute">
                  No users match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...rest}
      className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-ink-mute"
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
