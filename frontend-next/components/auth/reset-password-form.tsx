'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [state, setState] = useState<{ status: 'idle' | 'submitting' | 'done'; error?: string }>({
    status: 'idle',
  });

  if (!token) {
    return (
      <div className="card text-center">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Missing reset token</h2>
        <p className="muted mb-4">
          This page must be opened from the link in your password-reset email.
        </p>
        <Link href="/forgot-password" className="text-sm font-medium text-brand-700 hover:text-brand-800">
          Request a new link
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: 'submitting' });
    const fd = new FormData(e.currentTarget);
    const pw1 = String(fd.get('password') ?? '');
    const pw2 = String(fd.get('confirm') ?? '');

    if (pw1.length < 8) {
      setState({ status: 'idle', error: 'Password must be at least 8 characters.' });
      return;
    }
    if (pw1 !== pw2) {
      setState({ status: 'idle', error: 'Passwords do not match.' });
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: pw1 }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: { message?: string } };
      if (!res.ok || !body.ok) {
        setState({ status: 'idle', error: body.error?.message ?? 'Reset failed.' });
        return;
      }
      setState({ status: 'done' });
      setTimeout(() => router.push('/login'), 1200);
    } catch {
      setState({ status: 'idle', error: 'Could not reach the server.' });
    }
  }

  if (state.status === 'done') {
    return (
      <div className="card text-center">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Password updated</h2>
        <p className="muted">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Set a new password</h2>
      <p className="muted mb-6">Pick something at least 8 characters long.</p>

      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="label">New password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" />
        </div>
        <div>
          <label htmlFor="confirm" className="label">Confirm new password</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} className="input" />
        </div>
        {state.error && <p role="alert" className="error-text">{state.error}</p>}
        <button type="submit" disabled={state.status === 'submitting'} className="brand-button w-full">
          {state.status === 'submitting' ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Updating…
            </span>
          ) : (
            'Update password'
          )}
        </button>
      </form>
    </div>
  );
}
