'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

/**
 * Catches any error thrown inside an /admin/* page render (server or client).
 * Layout errors are handled by the layout's own try/catch + redirect; this
 * is the safety net for failures inside individual pages.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin error boundary]', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50/70 p-8">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
        <AlertTriangle className="h-3.5 w-3.5" /> Page error
      </div>
      <h1 className="font-display text-2xl text-red-900">Something broke on this page.</h1>
      <p className="mt-2 text-sm text-red-800">
        The Admin layout is fine — only this view crashed, so your session is still good.
      </p>
      <pre className="mt-4 max-h-64 overflow-auto rounded-md border border-red-200 bg-white p-3 font-mono text-[11px] text-red-900">
        {error.message}
        {error.digest ? `\n\ndigest: ${error.digest}` : ''}
      </pre>
      <div className="mt-5 flex gap-2">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-1.5 rounded-full bg-red-700 px-4 py-2 text-sm text-white hover:bg-red-800"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Try again
        </button>
        <Link
          href="/admin"
          className="inline-flex items-center rounded-full border border-red-300 bg-white px-4 py-2 text-sm text-red-800 hover:bg-red-100"
        >
          Back to overview
        </Link>
      </div>
    </div>
  );
}
