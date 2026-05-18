'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

type State = { status: 'pending' | 'success' | 'error'; message?: string };

export function VerifyEmailClient() {
  const params = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>({ status: 'pending' });

  useEffect(() => {
    if (!token) {
      setState({ status: 'error', message: 'Missing verification token.' });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const body = (await res.json()) as { ok?: boolean; error?: { message?: string } };
        if (cancelled) return;
        if (res.ok && body.ok) {
          setState({ status: 'success' });
        } else {
          setState({ status: 'error', message: body.error?.message ?? 'Verification failed.' });
        }
      } catch {
        if (!cancelled) setState({ status: 'error', message: 'Could not reach the server.' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.status === 'pending') {
    return (
      <div className="card text-center">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-brand-700" />
        <p className="muted">Verifying your email…</p>
      </div>
    );
  }
  if (state.status === 'success') {
    return (
      <div className="card text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Email verified</h2>
        <p className="muted mb-4">Your account is active.</p>
        <Link href="/login" className="brand-button">
          Sign in
        </Link>
      </div>
    );
  }
  return (
    <div className="card text-center">
      <XCircle className="mx-auto mb-3 h-10 w-10 text-red-600" />
      <h2 className="mb-2 text-lg font-semibold text-slate-900">Verification failed</h2>
      <p className="muted mb-4">{state.message}</p>
      <Link href="/register/customer" className="text-sm font-medium text-brand-700 hover:text-brand-800">
        Try registering again
      </Link>
    </div>
  );
}
