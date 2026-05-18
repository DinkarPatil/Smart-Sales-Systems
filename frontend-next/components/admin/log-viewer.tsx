'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { SystemLogEntry } from '@/lib/api/schemas';

const LEVEL_COLOURS: Record<string, string> = {
  DEBUG: 'bg-zinc-200 text-zinc-800',
  INFO: 'bg-sky-100 text-sky-900',
  WARN: 'bg-amber-100 text-amber-900',
  WARNING: 'bg-amber-100 text-amber-900',
  ERROR: 'bg-red-100 text-red-900',
  CRITICAL: 'bg-red-200 text-red-950',
};

export function LogViewer({
  initial,
  search,
}: {
  initial: SystemLogEntry[];
  search: { level: string; since: string; request_id: string };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [level, setLevel] = useState(search.level);
  const [since, setSince] = useState(search.since);
  const [reqId, setReqId] = useState(search.request_id);
  const [expanded, setExpanded] = useState<string | null>(null);

  function applyFilters() {
    start(() => {
      const params = new URLSearchParams();
      if (level) params.set('level', level);
      if (since) params.set('since', since);
      if (reqId) params.set('request_id', reqId);
      router.push(`/admin/system/logs?${params.toString()}`);
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-ink/10 bg-paper p-3">
        <div>
          <label className="label text-[10px] uppercase tracking-wider">Level</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="input">
            <option value="">All</option>
            {Object.keys(LEVEL_COLOURS).map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label text-[10px] uppercase tracking-wider">Since</label>
          <input
            type="datetime-local"
            value={since}
            onChange={(e) => setSince(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label text-[10px] uppercase tracking-wider">Request ID</label>
          <input
            type="text"
            value={reqId}
            onChange={(e) => setReqId(e.target.value)}
            placeholder="uuid…"
            className="input font-mono text-[11px]"
          />
        </div>
        <button onClick={applyFilters} disabled={pending} className="brand-button h-[38px] self-end">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
        </button>
        <span className="ml-auto self-end font-mono text-xs text-ink-mute">
          {initial.length} entries
        </span>
      </div>

      {initial.length === 0 ? (
        <p className="muted">
          No log entries yet. The backend writes JSONL to <code>backend/logs/app.log</code>; run a
          few requests to populate it.
        </p>
      ) : (
        <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 bg-paper">
          {initial.map((row, i) => {
            const key = `${row.timestamp}-${i}`;
            const isOpen = expanded === key;
            const cls = LEVEL_COLOURS[row.level.toUpperCase()] ?? 'bg-ink/10 text-ink';
            return (
              <li key={key} className="p-3">
                <button
                  onClick={() => setExpanded(isOpen ? null : key)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span
                    className={clsx(
                      'mt-0.5 inline-flex w-16 justify-center rounded px-1.5 py-0.5 font-mono text-[10px]',
                      cls,
                    )}
                  >
                    {row.level.toUpperCase()}
                  </span>
                  <span className="flex-1 text-sm text-ink">{row.message}</span>
                  {row.request_id && (
                    <span className="hidden font-mono text-[10px] text-ink-mute md:inline">
                      {row.request_id.slice(0, 8)}…
                    </span>
                  )}
                  <time className="font-mono text-[10px] text-ink-mute">
                    {new Date(row.timestamp).toLocaleTimeString()}
                  </time>
                </button>
                {isOpen && row.extra ? (
                  <pre className="mt-2 overflow-auto rounded-md bg-paper-2 p-3 font-mono text-[11px] text-ink">
                    {JSON.stringify(row.extra, null, 2) ?? ''}
                  </pre>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
