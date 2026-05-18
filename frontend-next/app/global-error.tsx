'use client';

import { useEffect } from 'react';

/**
 * Absolute last-resort error boundary. Renders its own <html> + <body>
 * because the root layout may itself have failed.
 *
 * Only triggers when error.tsx and the layout BOTH fail to render.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global error boundary]', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          background: '#fff7f5',
          color: '#3f0a0a',
          padding: '4rem 1.5rem',
          margin: 0,
        }}
      >
        <div
          style={{
            maxWidth: 600,
            margin: '0 auto',
            background: '#fff',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: 32,
          }}
        >
          <h1 style={{ fontSize: 22, marginTop: 0 }}>The whole app crashed.</h1>
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>
            This is the last-resort error screen — it means even the layout failed to render.
            Try a hard refresh; if the problem persists, the page-level error message below
            usually points at the cause.
          </p>
          <pre
            style={{
              marginTop: 16,
              maxHeight: 220,
              overflow: 'auto',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: 12,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              fontSize: 12,
              color: '#7f1d1d',
            }}
          >
            {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ''}
          </pre>
          <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => reset()}
              style={{
                background: '#b91c1c',
                color: '#fff',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: 999,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                background: '#fff',
                color: '#7f1d1d',
                padding: '0.5rem 1rem',
                border: '1px solid #fecaca',
                borderRadius: 999,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
