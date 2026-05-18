import { api } from '@/lib/api';
import { PageHeader } from '@/components/admin/presentation';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const me = await api.auth.me();
  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Personal preferences"
        description="Your own profile. Mutations to other users live under /admin/users."
      />

      <div className="card max-w-xl">
        <h2 className="font-display text-lg">Profile</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row k="Email" v={me.email} />
          <Row k="Full name" v={me.full_name ?? '—'} />
          <Row k="Role" v={me.role} />
          <Row k="Theme" v={me.theme ?? 'system'} />
          <Row k="Created" v={me.created_at ? new Date(me.created_at).toLocaleDateString() : '—'} />
        </dl>
        <p className="muted mt-4">
          Theme + name editing UI ships with the customer / staff settings refresh later. For now,
          update via <code className="font-mono">PUT /api/v1/auth/me</code>.
        </p>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink/5 pb-2 last:border-b-0">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-mute">{k}</dt>
      <dd className="text-ink">{v}</dd>
    </div>
  );
}
