import { api } from '@/lib/api';
import { PageHeader, StatTile } from '@/components/admin/presentation';

export const dynamic = 'force-dynamic';

export default async function AdminDiagnosticsPage() {
  const d = await api.admin.system.diagnostics();
  const rebuilding = d.rebuilding_collections ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="System · Diagnostics"
        title="RAG pipeline"
        description="Embedding model, vector store, and request-level health. Numbers are zeros today — the embedding service is staged behind the vector store work."
      />

      {rebuilding.length > 0 && (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Reindex in progress for: <strong>{rebuilding.join(', ')}</strong>
        </div>
      )}

      <section className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Per-tenant collections" value={d.per_tenant_collections} />
        <StatTile label="Total vectors" value={d.total_vectors} />
        <StatTile label="Last hour queries" value={d.last_hour_queries} />
        <StatTile label="Avg latency (ms)" value={d.avg_query_latency_ms.toFixed(0)} />
        <StatTile label="Cache hit" value={`${(d.cache_hit_rate * 100).toFixed(0)}%`} />
        <StatTile label="Failed 24h" value={d.failed_queries_24h} />
        <StatTile label="Judge block 24h" value={`${(d.judge_block_rate_24h * 100).toFixed(0)}%`} />
        <StatTile label="Backend" value={d.vector_store} />
      </section>

      <section className="rounded-xl border border-ink/10 bg-paper p-6">
        <h2 className="font-display text-lg">Configuration</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <Row k="Embedding model" v={d.embedding_model} />
          <Row k="Vector store backend" v={d.vector_store} />
          <Row k="RAG mode" v={d.vector_store === 'in_memory' ? 'Per-request rebuild (legacy)' : 'Persistent'} />
          <Row k="Rebuild jobs" v={rebuilding.length} />
        </dl>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="rounded-md bg-paper-2 px-3 py-2.5">
      <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-mute">{k}</dt>
      <dd className="mt-0.5 text-sm text-ink">{v}</dd>
    </div>
  );
}
