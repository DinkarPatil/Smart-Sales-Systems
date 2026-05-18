'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

export function Topbar({ email, role }: { email: string; role: string }) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-3">
        <Link href="/" className="font-display text-lg tracking-tight">
          <span className="font-semibold italic">Smart</span>{' '}
          <span className="font-light">Sales</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-ink-mute sm:inline">{email}</span>
          <span className="rounded-full bg-ink/8 px-2.5 py-1 font-mono text-[11px] tracking-wider text-ink-soft">
            {role.toUpperCase()}
          </span>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-ink-soft transition hover:border-ink/40 hover:text-ink"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
