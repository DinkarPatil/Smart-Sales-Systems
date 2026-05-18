from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel


class AuditEntry(BaseModel):
    """Unified shape for the Admin / Auditor audit feed.
    Sources:
      - `ActivityLog` rows (tenant-scoped lifecycle events) → kind="ACTIVITY"
      - `AuthEvent` rows (login/logout/role-change/etc.)     → kind="AUTH"
    """

    id: str
    timestamp: datetime
    kind: Literal["ACTIVITY", "AUTH"]
    actor_user_id: Optional[str] = None
    actor_email: Optional[str] = None
    company_id: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    summary: str
    details: Optional[Any] = None


class AuthEventOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    kind: str
    metadata: Optional[Any] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SystemLogEntry(BaseModel):
    timestamp: datetime
    level: str
    message: str
    request_id: Optional[str] = None
    extra: Optional[Any] = None


class RagDiagnostics(BaseModel):
    embedding_model: str
    vector_store: str
    per_tenant_collections: int
    total_vectors: int
    avg_query_latency_ms: float
    cache_hit_rate: float
    last_hour_queries: int
    failed_queries_24h: int
    judge_block_rate_24h: float
    rebuilding_collections: list[str] = []


class ReindexResult(BaseModel):
    company_id: str
    chunks_indexed: int
    documents_seen: int
    duration_ms: int
    note: Optional[str] = None
