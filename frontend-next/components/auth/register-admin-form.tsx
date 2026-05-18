'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ShieldCheck } from 'lucide-react';
import { roleToPath } from '@/lib/role-redirect';

export function RegisterAdminForm() {
  const router = useRouter();
  const [state, setState] = useState<{ status: 'idle' | 'submitting'; error?: string }>({
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
    const admin_secret_key = String(fd.get('admin_secret_key') ?? '').trim();

    if (password.length < 8) {
      setState({ status: 'idle', error: 'Password must be at least 8 characters.' });
      return;
    }
    if (password !== confirm) {
      setState({ status: 'idle', error: 'Passwords do not match.' });
      return;
    }
    if (!admin_secret_key) {
      setState({ status: 'idle', error: 'Admin secret key is required for staff registration.' });
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: full_name || null,
          admin_secret_key,
        }),
      });
      const body = (await res.json()) as { ok?: boolean; role?: string; error?: { message?: string } };
      if (!res.ok || !body.ok || !body.role) {
        setState({ status: 'idle', error: body.error?.message ?? 'Registration failed.' });
        return;
      }
      // Active Admin — no verification step, go straight to the dashboard.
      router.push(roleToPath(body.role));
      router.refresh();
    } catch {
      setState({ status: 'idle', error: 'Could not reach the server.' });
    }
  }

  return (
    <div className="card">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
        <ShieldCheck className="h-3.5 w-3.5" />
        Admin self-register
      </div>
      <h2 className="text-lg font-semibold text-slate-900">Create the first admin</h2>
      <p className="muted mb-6">
        Provide the platform's admin secret key. Your account is activated immediately and you'll
        be signed in.
      </p>

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
        <div>
          <label htmlFor="admin_secret_key" className="label">Admin secret key</label>
          <input
            id="admin_secret_key"
            name="admin_secret_key"
            type="password"
            required
            className="input font-mono text-xs"
            placeholder="••••••••••••••••"
          />
          <p className="mt-1 text-xs text-slate-500">
            Lives in <code className="font-mono text-[10px]">backend/.env</code> as <code className="font-mono text-[10px]">ADMIN_SECRET_KEY</code>.
            Rotate it after onboarding your first admin.
          </p>
        </div>

        {state.error && <p role="alert" className="error-text">{state.error}</p>}

        <button type="submit" disabled={state.status === 'submitting'} className="brand-button w-full">
          {state.status === 'submitting' ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Creating admin…
            </span>
          ) : (
            'Create admin & sign in'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Need a customer account?{' '}
        <Link href="/register/customer" className="font-medium text-brand-700 hover:text-brand-800">
          Sign up as a customer
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand-700 hover:text-brand-800">
          Sign in
        </Link>
      </p>
    </div>
  );
}
