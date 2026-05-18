'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { roleToPath } from '@/lib/role-redirect';

type State = { status: 'idle' | 'submitting'; error?: string };

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<State>({ status: 'idle' });
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const errorParam = params.get('error');
  const banner = (() => {
    switch (errorParam) {
      case 'wrong_role':
        return 'You signed in with an account that does not have access to that page.';
      case 'session_expired':
        return 'Your session expired. Please sign in again.';
      case 'backend_down':
        return 'We could not reach the backend. Confirm it is running, then try again.';
      case 'schema_drift':
        return "The backend's response did not match what the UI expects. This usually means the server was just updated — refresh and try again.";
      case 'layout_failed':
        return 'The dashboard could not load. Sign in again; if it persists, check the browser console.';
      default:
        return null;
    }
  })();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: 'submitting' });
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') ?? '');
    const password = String(fd.get('password') ?? '');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = (await res.json()) as { ok?: boolean; role?: string; error?: { message?: string } };
      if (!res.ok || !body.ok || !body.role) {
        setState({ status: 'idle', error: body.error?.message ?? 'Sign-in failed.' });
        return;
      }
      const next = params.get('next');
      router.push(next ?? roleToPath(body.role));
    } catch {
      setState({ status: 'idle', error: 'Could not reach the server.' });
    }
  }

  return (
    <div className="card">
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Sign in</h2>
      <p className="muted mb-6">Welcome back. Pick up where you left off.</p>

      {banner && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {banner}
        </div>
      )}

      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className="input"
            aria-describedby={state.error ? 'login-error' : undefined}
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="label">Password</label>
            <Link href="/forgot-password" className="text-xs font-medium text-brand-700 hover:text-brand-800">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
            aria-describedby={state.error ? 'login-error' : undefined}
          />
        </div>

        {state.error && (
          <p id="login-error" role="alert" className="error-text">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={state.status === 'submitting'} className="brand-button w-full">
          {state.status === 'submitting' ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-slate-600">
        <p>
          New customer?{' '}
          <Link href="/register/customer" className="font-medium text-brand-700 hover:text-brand-800">
            Create a customer account
          </Link>
        </p>
        <p>
          Bootstrapping the platform?{' '}
          <Link href="/register" className="font-medium text-brand-700 hover:text-brand-800">
            Register as admin
          </Link>
        </p>
      </div>
    </div>
  );
}
