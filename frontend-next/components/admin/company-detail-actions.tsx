'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';
import {
  deleteCompany,
  reindexCompany,
  updateCompany,
} from '@/app/(dashboard)/admin/_actions';
import type { CompanyOut, ReindexResult } from '@/lib/api/schemas';

export function CompanyDetailActions({ company }: { company: CompanyOut }) {
  const router = useRouter();
  const [savePending, startSave] = useTransition();
  const [delPending, startDel] = useTransition();
  const [reindexPending, startReindex] = useTransition();
  const [name, setName] = useState(company.name);
  const [description, setDescription] = useState(company.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const [reindexed, setReindexed] = useState<ReindexResult | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function onSave() {
    setError(null);
    setSavedAt(null);
    startSave(async () => {
      const res = await updateCompany(company.id, { name, description });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  async function onReindex() {
    setError(null);
    setReindexed(null);
    startReindex(async () => {
      const res = await reindexCompany(company.id);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setReindexed(res.data);
    });
  }

  async function onDelete() {
    if (
      !confirm(
        `Delete ${company.name}? This permanently removes its products, queries, activity log, ` +
          `and assignments. Users keep their accounts but lose access.`,
      )
    )
      return;
    startDel(async () => {
      const res = await deleteCompany(company.id);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.push('/admin/companies');
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-xl border border-ink/10 bg-paper p-6">
        <h2 className="font-display text-lg">Profile</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input"
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            {savedAt && (
              <span className="text-xs text-emerald-700">
                Saved at {new Date(savedAt).toLocaleTimeString()}
              </span>
            )}
            <button onClick={onSave} disabled={savePending} className="brand-button">
              {savePending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-ink/10 bg-paper p-6">
          <h3 className="font-display text-lg">RAG corpus</h3>
          <p className="muted mt-2 text-sm">
            Rebuild the per-tenant vector collection from this company's product documents. The
            embedding service is a stub today — the endpoint returns counts only.
          </p>
          <button
            onClick={onReindex}
            disabled={reindexPending}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium hover:border-ink/40"
          >
            {reindexPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Reindex this tenant
          </button>
          {reindexed && (
            <pre className="mt-3 overflow-auto rounded-md bg-paper-2 p-3 font-mono text-[11px] text-ink">
              {JSON.stringify(reindexed, null, 2)}
            </pre>
          )}
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/60 p-6">
          <h3 className="font-display text-lg text-red-900">Danger zone</h3>
          <p className="mt-2 text-sm text-red-800">
            Deletes the company and cascades products, queries, activity log, and assignments.
            Users are detached but kept.
          </p>
          <button
            onClick={onDelete}
            disabled={delPending}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            {delPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete company
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="error-text lg:col-span-3">
          {error}
        </p>
      )}
    </div>
  );
}
