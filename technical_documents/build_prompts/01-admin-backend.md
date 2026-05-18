# Build Prompt — 01 — Admin (Backend)

> Paste everything below into your AI coding assistant. The assistant should produce a working, tested FastAPI implementation that satisfies every Acceptance Criterion. **Depends on `00-single-login.md`** — auth, role guards, and CORS must already be in place.

---

## Role

You are a senior backend engineer working on **Smart Sales Systems** (FastAPI 0.115 + SQLAlchemy 2.x async + SQLite/aiosqlite + JWT + Resend + LlamaIndex/Groq + Chroma vector store). Your task is to build the **complete Admin backend surface**: every endpoint, schema, guard, side effect, and migration the Admin role needs to govern the platform from day one.

---

## Goal

Deliver an Admin module that lets a platform operator: provision/manage every user and company, **manage multi-company assignments**, view **real** system logs + RAG diagnostics, trigger per-tenant vector re-index, run cross-tenant audit reads, and toggle company-level flags. Replace the stub diagnostics + audit endpoints with real implementations.

---

## Foundational context (read before writing code)

- Admin role definition + permissions: [`../roles_and_access.md`](../roles_and_access.md) §2 + master matrix §13.
- Implementation tracker (what's ✅ vs ⭐ for Admin today): [`../roles_checklist.md`](../roles_checklist.md) §1.
- Current Admin API surface: [`../api_contracts.md`](../api_contracts.md) §3 + planned additions §11.2.
- CRUD specs (existing + planned): [`../crud_operations.md`](../crud_operations.md) (Admin sections + §14 for new entities).
- Schema (existing + planned, including `user_company_assignments`, `auth_events`): [`../db_schema.md`](../db_schema.md) §9.
- Backend conventions (layer rules, guard chain, tenancy): [`../skills/integration_skill.md`](../skills/integration_skill.md) §§1, 4, 6.
- Integration / wiring rules: [`../skills/integration_skill.md`](../skills/integration_skill.md) entire doc.
- Bugs to fix while you're in this code: [`../state_preparation.md`](../state_preparation.md) §1.2 (B1–B7).

---

## Flexibility & Adaptation

> This prompt is a **starting blueprint**, not a contract. Read the [Adaptive Development Principles](./README.md#adaptive-development-principles) in the README before you start. Tl;dr:
>
> - **🟢 Safe** to deviate on: helper / private-function names; exact SQL phrasing of the diagnostics queries (return the right shape, however you compute it); structlog processor list; the in-memory job-dict implementation for reindex polling (swap for any in-process queue you prefer); pytest fixture organisation; the audit-CSV export delimiter.
> - **🟡 Flag in PR description** if you diverge on: `user_company_assignments` column names or constraint names; the exact path `backend/logs/app.log`; the `RagDiagnostics` field set (additions are fine, removals are 🔴); replacing structlog with another structured-logger; using a different vector store than Chroma for local dev.
> - **🔴 Update foundational docs first** if you discover: the UCA model needs a *different* shape (e.g. a separate `manager_assignments` table); `auth_events` is too noisy and should be a separate log sink instead of a table; the reindex op can't be synchronous (the entire endpoint shape changes — make it a job API surface in `api_contracts.md`); cascade semantics on `delete_company` need to be softer (e.g. soft-delete instead of hard) — that's a design decision, update `roles_and_access.md` and `db_schema.md`.
>
> **Non-negotiables** (do not adapt): Admin endpoints sit at `/api/v1/admin/*`; every endpoint goes through `Depends(get_current_active_admin)`; every mutation writes either an `ActivityLog` or an `AuthEvent` row (often both); `response_model=` on every route; no JWTs in logs.

---

## Scope

### In scope
- Every endpoint listed under `/api/v1/admin/*` in [`../api_contracts.md`](../api_contracts.md) §3 (existing) + §11.2 (planned).
- New table `user_company_assignments` (D1) — migration + ORM model + endpoints to manage rows.
- New table `auth_events` — for the Auditor role to read later, but Admin should be able to read its own slice too. Writes happen automatically on login / role-change / password-reset.
- Real structured logging (replace `error.txt` dump) + `GET /admin/system/logs`.
- Real RAG diagnostics endpoint (replace stub).
- `POST /admin/companies/{cid}/reindex` — triggers per-tenant vector store rebuild.
- Bug fixes B1–B5 (anything that lives in `admin.py` or its dependencies). B6/B7 are frontend-side.
- **Tests** — pytest happy-path + 403 + 404 for every endpoint.

### Out of scope
- Building Admin **frontend** — that's `01-admin-frontend.md`.
- Implementing other roles' endpoints (stubs only, per `00-single-login.md`).
- Inbound email / chat-room / judges — those are later prompts.
- Billing role's `invoices` table — that's `03-billing-backend.md`.

---

## Deliverables (file-level)

### 1. Schemas — `backend/app/schemas/schemas.py`

Add:

```python
class UserCompanyAssignmentCreate(BaseModel):
    user_id: str
    company_id: str
    role_in_company: Literal["Manager", "Agent", "Reviewer", "Curator"]
    manager_id: Optional[str] = None        # required for Agent/Reviewer rows
    is_primary: bool = False

class UserCompanyAssignmentOut(BaseModel):
    id: str
    user_id: str
    company_id: str
    company_name: Optional[str] = None
    role_in_company: str
    manager_id: Optional[str] = None
    assigned_by: Optional[str] = None
    assigned_at: datetime
    is_primary: bool
    status: str
    class Config: from_attributes = True

class UserCompanyAssignmentUpdate(BaseModel):
    status: Optional[Literal["active", "paused"]] = None
    is_primary: Optional[bool] = None

class SystemLogEntry(BaseModel):
    timestamp: datetime
    level: str
    message: str
    request_id: Optional[str] = None
    extra: Optional[dict] = None

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
    duration_ms: int

class AuditEntry(BaseModel):
    id: str
    timestamp: datetime
    actor_user_id: Optional[str]
    actor_email: Optional[str]
    kind: str           # ACTIVITY | AUTH | etc
    entity_type: Optional[str]
    entity_id: Optional[str]
    company_id: Optional[str]
    summary: str
    details: Optional[dict] = None
```

Tighten existing `AdminStats` to also include `total_managers`, `total_agents`, `total_customers`, `escalated_queries`, `chat_rooms_open`.

### 2. ORM — `backend/app/models/models.py`

Add:

```python
class UserCompanyAssignment(Base):
    __tablename__ = "user_company_assignments"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    role_in_company = Column(String, nullable=False)   # Manager|Agent|Reviewer|Curator
    manager_id = Column(String, ForeignKey("users.id"), nullable=True)
    assigned_by = Column(String, ForeignKey("users.id"), nullable=True)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    is_primary = Column(Boolean, default=False)
    status = Column(String, default="active")          # active|paused
    __table_args__ = (UniqueConstraint("user_id", "company_id"),)

class AuthEvent(Base):
    __tablename__ = "auth_events"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    kind = Column(String, nullable=False)              # login|login_fail|logout|role_change|password_reset
    ip = Column(String); user_agent = Column(String)
    metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
```

Extend `UserRole` enum to include `Auditor`, `Billing`, `Curator`, `Reviewer`, `Customer`, `System`, `Agent`. Keep `SalesRep` accepted in parallel for the rename window.

Add `users.last_seen_at` (DateTime, nullable) — populated by a tiny middleware.

### 3. Alembic migration

Create `backend/alembic/` if not already there (introduce Alembic per [`../state_preparation.md`](../state_preparation.md) Phase 1):
- Baseline revision capturing the current schema.
- Second revision adds `user_company_assignments`, `auth_events`, `users.last_seen_at`, and fixes the missing cascades on existing FKs from [`../state_preparation.md`](../state_preparation.md) §1.2 B5.
- Retire `backend/app/db/ensure_columns.py` (or leave it idempotent for one release).

### 4. Endpoints — `backend/app/api/endpoints/admin.py`

All endpoints require `Depends(get_current_active_admin)`. Add or fix:

| Method | Path                                            | Behaviour |
| ------ | ----------------------------------------------- | --------- |
| GET    | `/api/v1/admin/stats`                           | Existing — extend with new fields per §1 above. |
| GET    | `/api/v1/admin/users`                           | Existing — keep; add optional `?role=&active=&search=` filters. |
| POST   | `/api/v1/admin/users`                           | Existing — keep; ensure role validation accepts the expanded enum. |
| PUT    | `/api/v1/admin/users/{user_id}`                 | Existing — keep; when role changes, write `auth_events(kind="role_change")`. |
| DELETE | `/api/v1/admin/users/{user_id}`                 | Existing — keep; manually NULL `queries.sales_rep_id` for the deleted user; cascade `user_company_assignments` via FK. |
| POST   | `/api/v1/admin/companies`                       | Existing — keep. |
| GET    | `/api/v1/admin/companies`                       | Existing — keep aggregates; add `chat_rooms_open` and `judge_block_rate_24h` (best-effort 0 if judge tables empty). |
| DELETE | `/api/v1/admin/companies/{cid}`                 | Existing — extend cascade to NULL `users.company_id`, delete `user_company_assignments`, `lead_stats`, `activity_logs` for the tenant, and **drop the tenant vector collection** if it exists. |
| **NEW** GET  | `/api/v1/admin/users/{user_id}/assignments`     | List a user's UCA rows (with company name). |
| **NEW** POST | `/api/v1/admin/users/{user_id}/assignments`     | Body = `UserCompanyAssignmentCreate`. Validate: target user role compatible with `role_in_company`; `manager_id` required when `role_in_company in {Agent, Reviewer}`; `manager_id` user must be `Manager` and assigned to the same `company_id`. Reject duplicates (UNIQUE constraint). |
| **NEW** PATCH | `/api/v1/admin/assignments/{assignment_id}`    | Body = `UserCompanyAssignmentUpdate`. Toggle status/primary. |
| **NEW** DELETE| `/api/v1/admin/assignments/{assignment_id}`    | Hard delete (revoke). Returns 204. |
| **NEW** GET  | `/api/v1/admin/system/logs`                     | Query params: `since` (ISO datetime), `level` (DEBUG|INFO|WARN|ERROR), `limit` (default 200, max 1000), `request_id`. Returns `list[SystemLogEntry]`. Reads from a structured log file (JSON-lines) at `backend/logs/app.log` written by structlog. |
| **NEW** GET  | `/api/v1/admin/system/diagnostics`              | Returns `RagDiagnostics`. See §6 for derivation. |
| **NEW** POST | `/api/v1/admin/companies/{cid}/reindex`         | Trigger a synchronous re-embedding of every `product_documents.content` for the tenant. Returns `ReindexResult`. Use `BackgroundTasks` if expected to exceed 10s; in that case respond 202 with a job id and `GET /admin/system/jobs/{id}` to poll (introduce a tiny in-memory job dict; persistence is out of scope). |
| **NEW** GET  | `/api/v1/admin/audit`                           | Query params: `from`, `to`, `actor`, `company`, `kind`, `limit`. Returns `list[AuditEntry]` aggregated from `activity_logs` + `auth_events`. |
| **NEW** GET  | `/api/v1/admin/auth-events`                     | Same shape, filtered to `auth_events` only. |

**Remove the stubs** `/admin/audit-logs` and `/admin/neural-diagnostics`. The new endpoints replace them. Add `Deprecation: true` headers on the old paths for one release if any client still hits them.

### 5. Structured logging — `backend/app/core/logging.py` (new)

Switch from `print(traceback)` + `error.txt` to **structlog** writing JSON lines:
- Output to both stderr (for dev) and `backend/logs/app.log` (rotated daily; cap 30 days).
- Every request gets a `request_id` via a small ASGI middleware; logs include it.
- `app.main.global_exception_handler` logs the exception with `request_id` + full traceback; **no longer overwrites `error.txt`**.
- Provide a helper `get_logger(__name__)` used throughout.

### 6. RAG diagnostics derivation — `services/vector_store.py` helpers

You haven't built the vector store service yet, but the diagnostics endpoint must work today. Provide a thin façade that returns real values where possible and zeros where not:

```python
def diagnostics() -> RagDiagnostics:
    return RagDiagnostics(
        embedding_model=settings.EMBEDDING_MODEL or "sentence-transformers/all-MiniLM-L6-v2",
        vector_store=settings.VECTOR_STORE or "chroma",
        per_tenant_collections=count_collections(),       # 0 if chroma not initialised
        total_vectors=count_vectors(),                    # 0 if chroma not initialised
        avg_query_latency_ms=0.0,                         # plug into real metrics later
        cache_hit_rate=0.0,
        last_hour_queries=count_queries_since(timedelta(hours=1)),
        failed_queries_24h=0,
        judge_block_rate_24h=0.0,
        rebuilding_collections=list(_inflight_reindex_jobs.keys()),
    )
```

Add `EMBEDDING_MODEL`, `VECTOR_STORE`, `CHROMA_PATH` to `core/config.py:Settings` with safe defaults (per [`../state_preparation.md`](../state_preparation.md) §4.2).

### 7. Reindex implementation

```python
async def reindex_company(company_id: str) -> ReindexResult:
    # 1. Drop existing collection `tenant_<company_id>` if present
    # 2. Stream `product_documents` for the company
    # 3. Chunk, embed, upsert per Product
    # 4. Return totals
```

For now ChromaDB local + the existing `llama-index-embeddings-huggingface` config is fine. Persist to `${CHROMA_PATH}`.

### 8. UCA wiring into existing guards

In `backend/app/api/deps.py`, the **stubs** for `get_current_active_manager/agent/reviewer/curator` (added in `00-single-login.md`) must now **resolve the user's assigned companies** via `user_company_assignments` and attach the list to the returned object (e.g. a wrapper `AuthorisedUser(user=user, company_ids=[...])`). Persist no state; just a typed return.

This unblocks the role-specific prompts that need tenant scoping.

### 9. Bug fixes piggybacked

- **B1** (`Query.assigned_to` vs `sales_rep_id`) — fix everywhere in `manager.py` / `sales_rep.py` you touch while shipping this.
- **B2** (`int` vs `str` path params) — fix everywhere.
- **B3** (sentiment vocab) — pick `+ve/-ve` (matches schema); update `manager.get_manager_stats` accordingly + add a `migrate_sentiment.py` one-shot script.
- **B4** (`TeamMemberOut.is_active`) — add the field.
- **B5** — extend `delete_company` cascade as described in §4.

---

## §10 — Side effects to emit

| Operation                              | ActivityLog action            | AuthEvent kind     |
| -------------------------------------- | ----------------------------- | ------------------ |
| `POST /admin/users`                    | `USER_PROVISIONED`            | —                  |
| `PUT /admin/users/{id}` (role change)  | `USER_ROLE_CHANGED`           | `role_change`      |
| `PUT /admin/users/{id}` (activation)   | `USER_ACTIVATED` / `USER_DEACTIVATED` | —          |
| `DELETE /admin/users/{id}`             | `USER_DELETED`                | —                  |
| `POST /admin/companies`                | `COMPANY_CREATED` (no company scope — log under the company's own id) | — |
| `DELETE /admin/companies/{cid}`        | `COMPANY_DELETED`             | —                  |
| `POST /admin/users/{uid}/assignments`  | `ASSIGNMENT_CREATED`          | —                  |
| `DELETE /admin/assignments/{id}`       | `ASSIGNMENT_REVOKED`          | —                  |
| `POST /admin/companies/{cid}/reindex`  | `TENANT_REINDEXED`            | —                  |

`AuthEvent` rows are also written by `/auth/login` (existing endpoint) for `kind="login"` / `"login_fail"`. Add this to `endpoints/auth.py` in the same PR.

---

## §11 — Acceptance criteria (must all pass)

Backend (pytest):

- [ ] `GET /admin/stats` returns the extended `AdminStats` shape; numbers match a direct SQL aggregation across the fixtures.
- [ ] `POST /admin/users` rejects an unknown role enum value with 422.
- [ ] `PUT /admin/users/{id}` activating an inactive user writes `auth_events(kind="role_change")` only when the role actually changes; activation alone writes `ActivityLog(USER_ACTIVATED)`.
- [ ] `POST /admin/users/{uid}/assignments` rejects an Agent assignment whose `manager_id` is not assigned to the same `company_id` → 400 with a clear error code.
- [ ] Two assignments for the same `(user_id, company_id)` → 400 (UNIQUE).
- [ ] `DELETE /admin/companies/{cid}` actually nulls `users.company_id` for that tenant; subsequent `GET /admin/users` for those users shows `company_name: null`.
- [ ] `DELETE /admin/companies/{cid}` drops the Chroma collection `tenant_<cid>` (verify by checking it's absent in a follow-up reindex call).
- [ ] `GET /admin/system/logs?level=ERROR&since=...` returns only matching JSON-line entries.
- [ ] `GET /admin/system/diagnostics` returns valid `RagDiagnostics` even when no collections exist (zeros, not errors).
- [ ] `POST /admin/companies/{cid}/reindex` rebuilds the collection and returns matching `chunks_indexed` vs a direct collection count.
- [ ] `GET /admin/audit` merges `activity_logs` + `auth_events` ordered by timestamp DESC.
- [ ] Hitting any of the above as a non-Admin returns 403 with `code="ADMIN_REQUIRED"`.
- [ ] Alembic upgrade from a copy of the legacy `sales_chatbot.db` produces a fully-functioning DB.
- [ ] B1–B5 regression tests (e.g. PATCH /manager/queries/{uuid_str} now succeeds; sentiment % computed correctly).

---

## §12 — Implementation notes (gotchas)

- The `user_company_assignments` table must be created **before** any Manager/Agent/Reviewer/Curator endpoint can rely on scoping. Land the migration in this PR.
- Don't validate `manager_id` against `users.role` alone — also check that the manager has an active UCA row for the same `company_id`.
- For reindex, do **not** delete the collection until you've successfully embedded at least one chunk; otherwise a transient failure leaves the tenant with no RAG corpus.
- Structlog setup: `structlog.processors.JSONRenderer()` for file, `ConsoleRenderer()` for dev stderr.
- `request_id` middleware: generate a UUID, attach to `request.state`, set `X-Request-ID` response header, bind to structlog context.
- The `BackgroundTasks` reindex path: if you go async, return 202 + a job_id; do **not** block the HTTP request thread on a 30-second embed.
- When migrating the `UserRole` enum, write a `migrate_role_rename.py` script that updates `users.role = 'SalesRep'` rows to `'Agent'` *only if* the rename window has closed (configurable flag).
- `DELETE /admin/users/{id}` of an Admin who happens to be the last Admin: warn with a 400 + `code="LAST_ADMIN"`. Soft-check; not bulletproof but better than nothing.
- Never log `password`, `access_token`, or `secret_key` fields. Add a structlog filter that drops these keys.
- Reuse the existing `email_service.send_response_email` for any admin-side mail (e.g. credentials email to provisioned users).

---

## §13 — Test plan (paste-ready)

```bash
# 1. Apply migrations
cd backend
alembic upgrade head

# 2. Run pytest
pytest tests/test_admin.py -v
pytest tests/test_assignments.py -v
pytest tests/test_admin_diagnostics.py -v

# 3. Manual sanity
uvicorn app.main:app --reload
# In another terminal:
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -d "username=admin@example.com&password=admin-pass" | jq -r .access_token)

# Stats
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/api/v1/admin/stats | jq

# Provision a Manager
curl -s -X POST http://127.0.0.1:8000/api/v1/admin/users \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"email":"mgr@a.com","password":"x","full_name":"Mgr","role":"Manager"}' | jq

# Assign Manager to a company
curl -s -X POST http://127.0.0.1:8000/api/v1/admin/users/<MGR_UID>/assignments \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"user_id":"<MGR_UID>","company_id":"<CID>","role_in_company":"Manager"}' | jq

# Reindex
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8000/api/v1/admin/companies/<CID>/reindex | jq
```

---

## §14 — Update docs in the same PR

- [`../api_contracts.md`](../api_contracts.md) — move new endpoints from the "planned" §11.2 into the current §3 list; remove the stub endpoints.
- [`../crud_operations.md`](../crud_operations.md) — `UserCompanyAssignment` and `AuthEvent` rows in their proper sections; mark Admin operations as ✅ in the roles checklist.
- [`../db_schema.md`](../db_schema.md) — promote `user_company_assignments` + `auth_events` from §9 (planned) into the current §2 tables; document the new cascade rules.
- [`../roles_checklist.md`](../roles_checklist.md) §1 (Admin) — flip ⭐ → ✅ for items #5, #6, #7, #8, #9.

---

## §15 — What "done" looks like

The Admin can log in (via `00-single-login.md`'s flow), open a (placeholder) `/admin` page, and **every** capability in the Admin row of the master permission matrix ([`../roles_and_access.md`](../roles_and_access.md) §13) is reachable via a working, tested, audit-logged API endpoint. Multi-company assignments work end-to-end. Logs are structured JSON. Diagnostics return real numbers. The vector store can be reindexed per tenant. The legacy `error.txt` dump is gone. All acceptance tests pass.
