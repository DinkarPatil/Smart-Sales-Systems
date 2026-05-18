'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  createAssignment,
  deleteAssignment,
  updateAssignment,
} from '@/app/(dashboard)/admin/_actions';
import type {
  AssignmentRoleInCompany,
  CompanyOut,
  UserCompanyAssignmentOut,
  UserOut,
} from '@/lib/api/schemas';

const ROLES: AssignmentRoleInCompany[] = ['Manager', 'Agent', 'Reviewer', 'Curator'];

export function AssignmentsPanel({
  userId,
  initial,
  companies,
  managers,
}: {
  userId: string;
  initial: UserCompanyAssignmentOut[];
  companies: CompanyOut[];
  managers: UserOut[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    company_id: string;
    role_in_company: AssignmentRoleInCompany;
    manager_id: string;
    is_primary: boolean;
  }>({
    company_id: '',
    role_in_company: 'Agent',
    manager_id: '',
    is_primary: false,
  });

  const needsManager = form.role_in_company === 'Agent' || form.role_in_company === 'Reviewer';

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await createAssignment(userId, {
        user_id: userId,
        company_id: form.company_id,
        role_in_company: form.role_in_company,
        manager_id: needsManager ? form.manager_id || null : null,
        is_primary: form.is_primary,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setShowForm(false);
      setForm({ company_id: '', role_in_company: 'Agent', manager_id: '', is_primary: false });
      router.refresh();
    });
  }

  async function onToggleStatus(a: UserCompanyAssignmentOut) {
    const next = a.status === 'active' ? 'paused' : 'active';
    start(async () => {
      const res = await updateAssignment(a.id, { status: next });
      if (!res.ok) setError(res.message);
      router.refresh();
    });
  }

  async function onRemove(a: UserCompanyAssignmentOut) {
    if (!confirm(`Remove assignment to ${a.company_name}?`)) return;
    start(async () => {
      const res = await deleteAssignment(a.id);
      if (!res.ok) setError(res.message);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-paper p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg">Multi-company assignments</h2>
          <p className="muted">
            For Manager / Agent / Reviewer / Curator roles. Owners and Admins use the primary
            company field above instead.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink hover:border-ink/40"
        >
          <Plus className="h-3.5 w-3.5" /> {showForm ? 'Cancel' : 'Add assignment'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={onCreate}
          className="mb-4 grid gap-3 rounded-lg border border-ink/10 bg-paper-2/40 p-4 sm:grid-cols-2"
        >
          <div>
            <label className="label">Company</label>
            <select
              required
              value={form.company_id}
              onChange={(e) => setForm({ ...form, company_id: e.target.value })}
              className="input"
            >
              <option value="">— Select —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Role in company</label>
            <select
              value={form.role_in_company}
              onChange={(e) =>
                setForm({ ...form, role_in_company: e.target.value as AssignmentRoleInCompany })
              }
              className="input"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          {needsManager && (
            <div className="sm:col-span-2">
              <label className="label">Reporting Manager</label>
              <select
                required
                value={form.manager_id}
                onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
                className="input"
              >
                <option value="">— Select Manager —</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name ?? m.email}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-ink-mute">
                Must be a Manager already assigned to the same company.
              </p>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.is_primary}
              onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
              className="h-4 w-4 rounded border-ink/30"
            />
            Mark as primary company (clears the previous primary)
          </label>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" disabled={pending} className="brand-button">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create assignment'}
            </button>
          </div>
        </form>
      )}

      {error && <p role="alert" className="error-text mb-3">{error}</p>}

      {initial.length === 0 ? (
        <p className="muted">No assignments yet.</p>
      ) : (
        <ul className="divide-y divide-ink/10">
          {initial.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-ink">
                  {a.company_name}{' '}
                  <span className="font-mono text-[11px] text-ink-mute">· {a.role_in_company}</span>
                  {a.is_primary && (
                    <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
                      primary
                    </span>
                  )}
                </p>
                <p className="font-mono text-[11px] text-ink-mute">
                  status={a.status}
                  {a.manager_full_name ? ` · mgr=${a.manager_full_name}` : ''}
                  {a.assigned_at
                    ? ` · since ${new Date(a.assigned_at).toLocaleDateString()}`
                    : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleStatus(a)}
                  className="rounded-full border border-ink/15 px-3 py-1 text-xs text-ink-soft hover:border-ink/40"
                >
                  {a.status === 'active' ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={() => onRemove(a)}
                  className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" /> Revoke
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
