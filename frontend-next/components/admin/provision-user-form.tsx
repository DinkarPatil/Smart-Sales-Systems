'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { provisionUser } from '@/app/(dashboard)/admin/_actions';
import type { CompanyOut } from '@/lib/api/schemas';

const ROLES = [
  'Admin',
  'Auditor',
  'Billing',
  'Owner',
  'Curator',
  'Manager',
  'Reviewer',
  'Agent',
];

export function ProvisionUserForm({ companies }: { companies: CompanyOut[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState('Agent');

  // Tenant-scoped roles. Owner uses users.company_id; Manager/Agent/Reviewer/Curator
  // also accept it as a "primary company" hint at creation time.
  const needsCompany = ['Owner', 'Manager', 'Agent', 'Reviewer', 'Curator'].includes(role);

  async function onSubmit(formData: FormData) {
    setError(null);
    start(async () => {
      const res = await provisionUser({
        email: String(formData.get('email')),
        full_name: String(formData.get('full_name') || '') || null,
        password: String(formData.get('password')),
        // Cast to the same enum the backend expects.
        role: role as
          | 'Admin'
          | 'Auditor'
          | 'Billing'
          | 'Owner'
          | 'Curator'
          | 'Manager'
          | 'Reviewer'
          | 'Agent',
        company_id: needsCompany ? String(formData.get('company_id') || '') || null : null,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.push(`/admin/users/${res.data.id}`);
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="card max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" required className="input" />
        </div>
        <div className="col-span-2">
          <label htmlFor="full_name" className="label">Full name</label>
          <input id="full_name" name="full_name" className="input" />
        </div>
        <div>
          <label htmlFor="password" className="label">Temporary password</label>
          <input id="password" name="password" type="text" required minLength={8} className="input" />
          <p className="mt-1 text-xs text-ink-mute">Emailed to the user; they should rotate immediately.</p>
        </div>
        <div>
          <label htmlFor="role" className="label">Role</label>
          <select
            id="role"
            name="role"
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
        {needsCompany && (
          <div className="col-span-2">
            <label htmlFor="company_id" className="label">Primary company</label>
            <select id="company_id" name="company_id" className="input" required={role === 'Owner'}>
              <option value="">— None (assign later) —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {role !== 'Owner' && (
              <p className="mt-1 text-xs text-ink-mute">
                Optional — multi-company access is managed via assignments.
              </p>
            )}
          </div>
        )}
      </div>

      {error && <p role="alert" className="error-text">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button type="submit" disabled={pending} className="brand-button">
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Provisioning…
            </span>
          ) : (
            'Provision user'
          )}
        </button>
      </div>
    </form>
  );
}
