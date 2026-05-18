'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export function ForgotPasswordForm() {
  const [state, setState] = useState<{ status: 'idle' | 'submitting' | 'sent'; error?: string }>({
    status: 'idle',
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: 'submitting' });
    const email = String(new FormData(e.currentTarget).get('email') ?? '').trim();
    if (!email) return setState({ status: 'idle', error: 'Please enter your email.' });

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Always present as "sent" — never confirm whether the email exists (info leak).
      if (res.status >= 500) {
        setState({ status: 'idle', error: 'Something went wrong. Try again in a moment.' });
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
          If an account exists for that email, we just sent a password-reset link. The link expires in 1 hour.
        </p>
        <Link href="/login" className="text-sm font-medium text-brand-700 hover:text-brand-800">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Forgot your password?</h2>
      <p className="muted mb-6">Enter the email on your account and we'll send a reset link.</p>

      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        {state.error && <p role="alert" className="error-text">{state.error}</p>}
        <button type="submit" disabled={state.status === 'submitting'} className="brand-button w-full">
          {state.status === 'submitting' ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </span>
          ) : (
            'Send reset link'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Remembered it?{' '}
        <Link href="/login" className="font-medium text-brand-700 hover:text-brand-800">
          Sign in
        </Link>
      </p>
    </div>
  );
}
