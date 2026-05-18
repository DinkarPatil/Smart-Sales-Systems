'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export function RegisterCustomerForm() {
  const [state, setState] = useState<{ status: 'idle' | 'submitting' | 'sent'; error?: string }>({
    status: 'idle',
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: 'submitting' });

    const fd = new FormData(e.currentTarget);
    const full_name = String(fd.get('full_name') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim();
    const password = String(fd.get('password') ?? '');
    const confirm = String(fd.get('confirm') ?? '');

    if (password.length < 8) {
      setState({ status: 'idle', error: 'Password must be at least 8 characters.' });
      return;
    }
    if (password !== confirm) {
      setState({ status: 'idle', error: 'Passwords do not match.' });
      return;
    }

    try {
      const res = await fetch('/api/auth/register-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: full_name || undefined }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: { message?: string } };
      if (!res.ok || !body.ok) {
        setState({ status: 'idle', error: body.error?.message ?? 'Registration failed.' });
        return;
      }
      setState({ status: 'sent' });
    } catch {
      setState({ status: 'idle', error: 'Could not reach the server.' });
    }
  }

  if (state.status === 'sent') {
    return (
      <div className="card text-center">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Check your inbox</h2>
        <p className="muted mb-4">
          We just sent a verification link. Click it to activate your account — the link expires in 24 hours.
        </p>
        <Link href="/login" className="text-sm font-medium text-brand-700 hover:text-brand-800">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Create your customer account</h2>
      <p className="muted mb-6">Track your queries, run scheduled chats, rate resolutions.</p>

      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="label">Full name <span className="text-slate-400">(optional)</span></label>
          <input id="full_name" name="full_name" type="text" autoComplete="name" className="input" />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="confirm" className="label">Confirm password</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} className="input" />
        </div>

        {state.error && <p role="alert" className="error-text">{state.error}</p>}

        <button type="submit" disabled={state.status === 'submitting'} className="brand-button w-full">
          {state.status === 'submitting' ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
            </span>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Staff account?{' '}
        <Link href="/login" className="font-medium text-brand-700 hover:text-brand-800">
          Sign in instead
        </Link>
      </p>
    </div>
  );
}
