'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createCompany } from '@/app/(dashboard)/admin/_actions';

export function NewCompanyForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [configRaw, setConfigRaw] = useState('{\n  "timezone": "UTC"\n}');

  async function onSubmit(formData: FormData) {
    setError(null);
    let config: Record<string, unknown> = {};
    try {
      config = configRaw.trim() ? JSON.parse(configRaw) : {};
    } catch {
      setError('Config must be valid JSON.');
      return;
    }
    start(async () => {
      const res = await createCompany({
        name: String(formData.get('name')),
        description: String(formData.get('description') || '') || null,
        config,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.push(`/admin/companies/${res.data.id}`);
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="card max-w-2xl space-y-4">
      <div>
        <label htmlFor="name" className="label">Name</label>
        <input id="name" name="name" required className="input" />
        <p className="mt-1 text-xs text-ink-mute">
          The ID is the first 16 hex chars of <code className="font-mono">sha256(name)</code>; two
          companies with the same name will collide.
        </p>
      </div>
      <div>
        <label htmlFor="description" className="label">Description</label>
        <textarea id="description" name="description" rows={3} className="input" />
      </div>
      <div>
        <label htmlFor="config" className="label">Config (JSON)</label>
        <textarea
          id="config"
          value={configRaw}
          onChange={(e) => setConfigRaw(e.target.value)}
          rows={6}
          spellCheck={false}
          className="input font-mono text-xs"
        />
      </div>
      {error && <p role="alert" className="error-text">{error}</p>}
      <div className="flex items-center justify-end">
        <button type="submit" disabled={pending} className="brand-button">
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Creating…
            </span>
          ) : (
            'Create company'
          )}
        </button>
      </div>
    </form>
  );
}
