'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { deleteUser, updateUser } from '@/app/(dashboard)/admin/_actions';
import type { CompanyOut, UserOut } from '@/lib/api/schemas';

const ROLES = [
  'Admin',
  'Auditor',
  'Billing',
  'Owner',
  'Curator',
  'Manager',
  'Reviewer',
  'Agent',
  'SalesRep',
  'Customer',
];

export function UserEditCard({
  user,
  companies,
}: {
  user: UserOut;
  companies: CompanyOut[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [removing, startRemove] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.is_active);
  const [companyId, setCompanyId] = useState(user.company_id ?? '');
  const [fullName, setFullName] = useState(user.full_name ?? '');
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function onSave() {
    setError(null);
    setSavedAt(null);
    start(async () => {
      const res = await updateUser(user.id, {
        full_name: fullName || null,
        role: role as 'Admin' | 'Auditor' | 'Billing' | 'Owner' | 'Curator' | 'Manager' | 'Reviewer' | 'Agent' | 'SalesRep' | 'Customer',
        is_active: isActive,
        company_id: companyId || null,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  async function onDelete() {
    if (!confirm(`Delete ${user.email}? This is irreversible and detaches any queries they owned.`))
      return;
    startRemove(async () => {
      const res = await deleteUser(user.id);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.push('/admin/users');
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-paper p-6">
      <h2 className="font-display text-lg">Profile</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Email</label>
          <input value={user.email} readOnly disabled className="input cursor-not-allowed bg-paper-2" />
          <p className="mt-1 text-xs text-ink-mute">Email is immutable from this screen.</p>
        </div>
        <div>
          <label htmlFor="full_name" className="label">Full name</label>
          <input
            id="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="role" className="label">Role</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="company_id" className="label">Primary company</label>
          <select
            id="company_id"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="input"
          >
            <option value="">— Unassigned —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-ink/30"
            />
            Account is active (can sign in)
          </label>
        </div>
      </div>

      {error && <p role="alert" className="error-text mt-4">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onDelete}
          disabled={removing}
          className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
        >
          {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Delete user
        </button>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-emerald-700">
              Saved at {new Date(savedAt).toLocaleTimeString()}
            </span>
          )}
          <button onClick={onSave} disabled={pending} className="brand-button">
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </span>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
