import { api } from '@/lib/api';
import { PageHeader } from '@/components/admin/presentation';
import { LogViewer } from '@/components/admin/log-viewer';

export const dynamic = 'force-dynamic';

type SearchParams = { level?: string; since?: string; request_id?: string };

export default async function AdminSystemLogsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const logs = await api.admin.system.logs({
    level: searchParams.level,
    since: searchParams.since,
    request_id: searchParams.request_id,
    limit: 200,
  });

  return (
    <div>
      <PageHeader
        eyebrow="System · Logs"
        title="Structured backend logs"
        description="Tails backend/logs/app.log (structlog JSONL). Filter by level, since, or a specific request_id."
      />
      <LogViewer
        initial={logs}
        search={{
          level: searchParams.level ?? '',
          since: searchParams.since ?? '',
          request_id: searchParams.request_id ?? '',
        }}
      />
    </div>
  );
}
