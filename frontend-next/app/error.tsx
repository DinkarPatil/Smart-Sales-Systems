'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

/**
 * Default error boundary for any page outside a more-specific error.tsx.
 * Renders a small panel inside the existing layout (header etc.).
 */
export default function RootRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[root error boundary]', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-xl border border-red-200 bg-red-50/70 p-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
          <AlertTriangle className="h-3.5 w-3.5" /> Something went wrong
        </div>
        <h1 className="font-display text-2xl text-red-900">We hit an unexpected error.</h1>
        <p className="mt-2 text-sm text-red-800">
          The page you opened failed to render. Try again, head home, or sign in.
        </p>
        <pre className="mt-4 max-h-48 overflow-auto rounded-md border border-red-200 bg-white p-3 font-mono text-[11px] text-red-900">
          {error.message}
          {error.digest ? `\n\ndigest: ${error.digest}` : ''}
        </pre>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 rounded-full bg-red-700 px-4 py-2 text-sm text-white hover:bg-red-800"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-red-300 bg-white px-4 py-2 text-sm text-red-800 hover:bg-red-100"
          >
            Home
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-full border border-red-300 bg-white px-4 py-2 text-sm text-red-800 hover:bg-red-100"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
