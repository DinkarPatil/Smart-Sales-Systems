'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Building2,
  LayoutDashboard,
  Logs,
  Network,
  ScrollText,
  Settings,
  Users,
} from 'lucide-react';
import { clsx } from 'clsx';

const items = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/companies', label: 'Companies', icon: Building2 },
  { href: '/admin/assignments', label: 'Assignments', icon: Network },
  { href: '/admin/system/diagnostics', label: 'Diagnostics', icon: Activity },
  { href: '/admin/system/logs', label: 'System logs', icon: Logs },
  { href: '/admin/audit', label: 'Audit', icon: ScrollText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

function isActive(pathname: string, href: string, end?: boolean) {
  if (end) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-56 shrink-0 border-r border-ink/10 bg-paper/60 md:block">
      <nav className="sticky top-[57px] flex flex-col gap-1 px-3 py-6">
        <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
          Platform
        </p>
        {items.map((it) => {
          const active = isActive(pathname, it.href, it.end);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={clsx(
                'group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition',
                active
                  ? 'bg-ink text-paper'
                  : 'text-ink-soft hover:bg-ink/5 hover:text-ink',
              )}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
