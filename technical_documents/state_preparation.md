# Smart Sales Systems — State & Preparation

> Snapshot of **current state** vs the **target state** defined in [roles_and_access.md](./roles_and_access.md) + [query_intake_channels.md](./query_intake_channels.md), plus the **preparation tasks** that must complete before each migration phase can ship.

Status legend: ✅ done · 🟡 partial / buggy · ⭐ planned · ⛔ blocked

---

## 1. Current state — one-page snapshot

### 1.1 What runs today

| Area                | Reality                                                                                          | Verdict |
| ------------------- | ------------------------------------------------------------------------------------------------ | :-----: |
| Backend             | FastAPI 0.115 (async) + uvicorn; auto-reload dev only.                                          |   ✅    |
| Database            | SQLite via aiosqlite, one file (`sales_chatbot.db`).                                            |   ✅    |
| Auth                | HS256 JWT (7-day), bcrypt password hashing, password-reset JWT.                                 |   ✅    |
| Frontend            | React 18 + Vite (single SPA), JWT in `localStorage`, 4 role dashboards in monolithic files.    |   🟡    |
| Roles in code       | `Admin`, `Owner`, `Manager`, `SalesRep` only.                                                    |   🟡    |
| Intake channel      | Google Forms webhook only.                                                                       |   ✅    |
| RAG                 | Per-request rebuilt `VectorStoreIndex` (no persistence); Groq Llama-3-70B; template fallback.   |   🟡    |
| OCR                 | PyMuPDF + Ollama VLM (works); rebuilds `manual_content` aggregate on every upload/delete.       |   ✅    |
| Email               | Resend; HTML templates inline in handlers.                                                       |   ✅    |
| Migrations          | None (no Alembic). `db/ensure_columns.py` ALTERs on startup; one-shot `migrate_*.py` scripts.   |   🟡    |
| Observability       | Global exception handler dumps to `error.txt`. Two stubbed diagnostics endpoints.               |   🟡    |
| Tests               | None checked in.                                                                                 |   ⛔    |
| CORS                | Wide-open (`allow_origins=["*"]`).                                                              |   🟡    |
| Containerisation    | None; `start_all.bat` launches uvicorn + Vite together on Windows.                              |   🟡    |

### 1.2 Known correctness bugs (must-fix during prep)

These are blockers for the role rework — fix as part of the prep phases below.

| # | Bug                                                                                          | Where |
|---|----------------------------------------------------------------------------------------------|-------|
| B1| `Query.assigned_to` referenced in manager/sales endpoints; real column is `sales_rep_id`     | `endpoints/manager.py`, parts of `endpoints/sales_rep.py` |
| B2| Path params typed `int` while PKs are UUID strings → 422s                                    | Multiple routers |
| B3| Sentiment vocab mismatch (`+ve/-ve` vs `Positive/Very Positive`)                              | `endpoints/manager.py:get_manager_stats` |
| B4| `TeamMemberOut` schema lacks `is_active`; manager populates it anyway                         | `schemas/schemas.py` |
| B5| `admin.delete_company` doesn't unlink `users.company_id`, leaves `lead_stats` + `activity_logs` orphan; doesn't drop vector collection | `endpoints/admin.py` |
| B6| ManagerDashboard frontend reads JWT from `localStorage`                                       | `frontend/src/pages/ManagerDashboard.jsx` |
| B7| Stats schema mismatch: frontend expects `active_sales_reps` / `sentiment_score`; backend returns `pending_queries` / `positive_sentiment_pct` | both ends |

---

## 2. Current vs Target — gap matrix

| Capability                                       | Current | Target                                                                       | Δ           |
| ------------------------------------------------ | :-----: | ---------------------------------------------------------------------------- | ----------- |
| **Roles in DB**                                  |    4    | 9 human + 2 system + 1 pseudo (Guest)                                        | +5 human, +2 system |
| **Multi-company per user**                       |   no    | yes for Manager / Agent / Reviewer / Curator                                 | new table   |
| **Intake channels**                              |    1    | 10 (Google Form + portal + email + widget + WhatsApp/SMS + voice + social + partner API + QR + in-portal) | +9 |
| **Vector store**                                 |  none (in-mem) | ChromaDB (dev) / Qdrant (prod), per-tenant collection                   | new service |
| **Embedding model**                              |  per-request | HF sentence-transformers (`all-MiniLM-L6-v2` default), configurable     | new service |
| **Email-thread continuity**                      |   no    | `email_thread_id` + Message-ID chaining + inbound email adapter              | new path    |
| **2-strike auto-escalation**                     |   no    | counters + auto-flip on reply #3                                             | new logic   |
| **Scheduled chat room with secret keys**         |   no    | `chat_rooms` + `chat_messages` + WS/SSE + key-hash auth                       | new feature |
| **Discount cascade** (Rep → Manager → Owner)     |  Rep cap only | `discount_approvals` + middle tier                                      | new feature |
| **Reply / Retrieval judges**                     |   no    | system token + scores tables + per-tenant rubric                              | new feature |
| **Frontend framework**                           | React+Vite SPA | Next.js 14 (App Router, RSC) + TS + TanStack Query + Tailwind          | rewrite     |
| **Auth transport**                               | `localStorage` | HttpOnly cookie + Next.js middleware                                    | swap        |
| **Customer accounts**                            |   no    | Customer role + portal + verification                                         | new role    |
| **Billing / invoicing**                          |   no    | Billing role + invoices + triple-lock suspension                              | new role    |
| **Auditor**                                      |   no    | read-only cross-tenant compliance role                                       | new role    |
| **Tests**                                        |   no    | pytest + Playwright smoke                                                     | bootstrap   |
| **Migrations**                                   |   ad hoc | Alembic + seed scripts                                                       | adopt       |
| **CORS**                                         |   open   | locked to `FRONTEND_URL`                                                     | tighten     |
| **Logs / diagnostics**                           |  `error.txt` + stubs | structured logging + real RAG diagnostics                          | replace     |

---

## 3. Preparation phases

Six sequential phases, each landing safely before the next. Bug fixes from §1.2 are folded into the earliest phase that touches the affected file.

### Phase 0 — Stabilise (1–2 days)

**Goal:** make current code reliable before adding anything new.

- [ ] **B1**: rename `assigned_to` → `sales_rep_id` in manager + sales endpoints; add tests around reassign.
- [ ] **B2**: change all `int` path params to `str`.
- [ ] **B3**: pick one sentiment vocabulary; backfill via a `migrate_sentiment.py` script.
- [ ] **B4**: add `is_active: bool` to `TeamMemberOut`.
- [ ] **B5**: fix `delete_company` cascade gaps.
- [ ] **B7**: align manager stats schema both ends.
- [ ] Add a tiny `pytest` harness + first 5 happy-path tests (login + each role's stats endpoint).
- [ ] Lock CORS to env-driven `FRONTEND_URL`.

**Exit criteria:** existing dashboards run with no console errors and no 500s on the happy path.

---

### Phase 1 — Adopt Alembic + structured logging (2–3 days)

**Goal:** migrations and observability are prerequisites for everything else.

- [ ] Install `alembic`; capture current schema as the baseline revision; delete `ensure_columns.py` (or keep it idempotent in parallel for one release).
- [ ] Replace `print(traceback)` + `error.txt` with `structlog` JSON logging at INFO/ERROR.
- [ ] Add `request_id` middleware (UUID per request) so log lines correlate.
- [ ] Real `/admin/system/logs?since=…` endpoint (paginated, role=Admin only).

**Exit criteria:** `alembic upgrade head` recreates the DB; logs render JSON in dev and ship cleanly in prod.

---

### Phase 2 — Multi-company + cookie auth + role rename (3–5 days)

**Goal:** unblock all subsequent role work.

- [ ] **D1**: create `user_company_assignments` table via Alembic.
- [ ] Rewrite Manager/Agent/Reviewer/Curator scope helpers to JOIN through `user_company_assignments`.
- [ ] Add Admin endpoints to manage assignments.
- [ ] Add Manager endpoints to invite Agents + assign them to companies (subset of own assignments).
- [ ] **Role rename**: `UserRole.SALES_REP` value `"SalesRep"` → `"Agent"`; one-shot `migrate_role_rename.py` updates existing rows.
- [ ] **D6**: backend issues JWT in HttpOnly + Secure cookie; old `Authorization: Bearer` continues to work for one release.
- [ ] Next.js `middleware.ts` reads cookie + role-gates routes.

**Exit criteria:** an Agent can log in, see a company switcher, and queries from their assigned tenants only.

---

### Phase 3 — Persistent RAG + inbound email + 2-strike (4–6 days)

**Goal:** the AI pipeline becomes production-shaped.

- [ ] **D5**: introduce `services/embedding_service.py` + `services/vector_store.py` (ChromaDB driver to start). Per-company collections.
- [ ] Webhook + Owner doc upload/delete trigger embed/purge through the new services (no more per-request index build).
- [ ] Add `EMBEDDING_MODEL`, `VECTOR_STORE`, `CHROMA_PATH`, `RAG_TOP_K`, `RAG_SIMILARITY_FLOOR` to `core/config.py`.
- [ ] **D2**: create `query_messages`, add `email_thread_id`, `reply_count`, `rep_reply_count`, `auto_escalated`.
- [ ] **D8**: stand up an inbound email adapter (Resend Inbound or Postmark) → `POST /api/v1/webhook/inbound-email`. Parser links by Message-ID/In-Reply-To.
- [ ] Implement 2-strike auto-escalation in the inbound handler.
- [ ] Backfill existing `Query` rows: `reply_count=0`, `rep_reply_count=0`.

**Exit criteria:** a real customer email reply chain reaches strike 3 and auto-escalates to Owner with no Agent action.

---

### Phase 4 — Customer portal + scheduled chat (5–7 days)

**Goal:** customers get a real account, threads, and the chat room.

- [ ] **D7**: `/auth/register/customer` + email-verification token; new `get_current_active_customer` guard.
- [ ] **D9**: scaffold `app/(customer)/customer/*` routes in Next.js (queries list, thread, profile, NPS rating).
- [ ] Add Channel 2 + Channel 10 from [query_intake_channels.md](./query_intake_channels.md) (portal + in-portal reply).
- [ ] **D3**: create `chat_rooms` + `chat_messages`; secret-key generation + hashed storage; emails to both participants; WebSocket (or SSE) channel for live messages; transition states (`scheduled` → `open` → `closed`).
- [ ] Schedule-chat UI for Agent; entry UI for Owner + Customer.
- [ ] Read-only transcript for Agent / Manager / Auditor.

**Exit criteria:** Customer registers, creates a query, gets escalated, schedules a chat, both sides enter with their keys, messages exchanged + archived.

---

### Phase 5 — Judges + discount cascade + new roles (5–8 days)

**Goal:** quality automation + remaining roles.

- [ ] **D4**: tables `judge_scores`, `retriever_scores`, `judge_rubrics`. System-token role `"System"`.
- [ ] `services/judge_service.py` (ReplyJudge — pre-send advisory + post-send eval).
- [ ] `services/retrieval_judge_service.py` (cross-encoder reranker online; LLM judge async).
- [ ] Per-company rubric editor under Owner settings.
- [ ] **Discount cascade**: `discount_approvals` table, Agent request endpoint, Manager approve/deny endpoints, auto-escalation above ceiling.
- [ ] Add `Reviewer` role + `query_reviews` table + Manager-triggered sampling.
- [ ] Add `Curator` role + scoped endpoints (corpus mutations + retrieval traces).
- [ ] Add `Auditor` role (read-only across tenants).
- [ ] Add `Billing` role + `invoices` table + `billing_suspended` flag + triple-lock effective-state.

**Exit criteria:** every role in [roles_and_access.md](./roles_and_access.md) can log in and exercise its core capability matrix from §13.

---

### Phase 6 — Additional intake channels + production hardening (ongoing)

- [ ] Channel 4 (chat widget) — JS bundle + public WS endpoint.
- [ ] Channel 5 (WhatsApp / SMS via Twilio).
- [ ] Channel 6 (voice via Twilio Voice + Whisper/Deepgram).
- [ ] Channel 7 (social DM webhooks).
- [ ] Channel 8 (partner API + scoped API keys).
- [ ] Channel 9 (QR → portal).
- [ ] Move from SQLite to Postgres (with pgvector option for D5).
- [ ] Containerise (Dockerfiles for backend + Next.js); compose for dev; production deploy target.
- [ ] Playwright smoke suite per role.
- [ ] Backup + restore runbook for DB + vector store.

---

## 4. Environment variables — current vs target

### 4.1 Current (`backend/app/core/config.py`)

```
SECRET_KEY, ADMIN_SECRET_KEY, DATABASE_URL,
GROQ_API_KEY, RESEND_API_KEY, MAIL_FROM, FRONTEND_URL
```

### 4.2 Target additions ⭐

```
# RAG / Embeddings / Vector store
EMBEDDING_MODEL          (default sentence-transformers/all-MiniLM-L6-v2)
VECTOR_STORE             (chroma | qdrant | pgvector)
CHROMA_PATH              (default ./chroma_data)
QDRANT_URL               (prod)
RAG_TOP_K                (default 4)
RAG_SIMILARITY_FLOOR     (default 0.25)

# OCR
OLLAMA_BASE_URL, OLLAMA_MODEL

# Judges
JUDGE_MODEL              (default same as generator; recommend different)
JUDGE_BLOCK_THRESHOLD    (default 2.0)
JUDGE_WARN_THRESHOLD     (default 3.5)
JUDGE_SAMPLE_RATE        (default 0.25 for retrieval)

# System token (for Reply/Retrieval judges)
SYSTEM_TOKEN_SECRET

# Cookies / sessions
COOKIE_DOMAIN, COOKIE_SECURE (true in prod)

# Inbound email
INBOUND_EMAIL_PROVIDER   (resend | postmark | ses)
INBOUND_EMAIL_WEBHOOK_SECRET

# Billing
DEFAULT_PLAN_TIER, MONTHLY_TOKEN_ALLOWANCE_DEFAULT
```

---

## 5. Risk register

| Risk                                                         | Mitigation                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Role rename `"SalesRep" → "Agent"` breaks live JWTs / sessions | Migration script + accept both values in the guard for one release; rotate `SECRET_KEY` after cutover. |
| Vector store rebuild loses corpus during the swap            | Build the new store **in parallel**, dual-write for one release, cut traffic after diff is 0. |
| Cookie auth + cross-origin in dev (Vite or Next on a different port) | `COOKIE_DOMAIN` + Next.js `rewrites` proxy to FastAPI; document in README.                  |
| Email-thread parsing edge cases (`Re: Re:` chains, no `In-Reply-To`) | Conservative fallback: if neither Message-ID nor In-Reply-To matches, create a new query rather than mis-thread. |
| Judges flag too aggressively, blocking real drafts            | Start with `warn` thresholds only; promote to `block` per-tenant after 2 weeks of telemetry. |
| Inbound email spoofing → fake escalations                    | DKIM/SPF verification at the provider; reject unverified.                                   |
| ChromaDB single-process limits in prod                       | Don't deploy ChromaDB to prod — only dev. Cut to Qdrant before going live with judges.      |

---

## 6. Definition of "ready to ship" per phase

For each phase to be considered done:

1. **Tests pass** — at least one happy-path pytest per new endpoint + one Playwright smoke per new page.
2. **Docs updated** — relevant sections of `api_contracts.md`, `crud_operations.md`, `db_schema.md`, `architecture.md` reflect what shipped. Phase moves from `⭐` to `✅` in the corresponding entry of [roles_checklist.md](./roles_checklist.md).
3. **Migration green** — `alembic upgrade head` from the previous tag works on a copy of prod.
4. **Logs clean** — no unhandled exceptions in 100 sample requests.
5. **Backwards-compat note** in the changelog if the phase introduces a breaking shape.

---

## 7. References

- Role taxonomy: [./roles_and_access.md](./roles_and_access.md)
- Intake channels: [./query_intake_channels.md](./query_intake_channels.md)
- Roles backlog: [./roles_checklist.md](./roles_checklist.md)
- Current API: [./api_contracts.md](./api_contracts.md)
- CRUD ops: [./crud_operations.md](./crud_operations.md)
- DB schema: [./db_schema.md](./db_schema.md)
- Architecture: [./architecture.md](./architecture.md)
