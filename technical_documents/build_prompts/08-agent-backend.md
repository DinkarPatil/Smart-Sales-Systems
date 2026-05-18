# Build Prompt — 08 — Agent (Backend)

> Paste everything below into your AI coding assistant. The assistant should produce a working, tested FastAPI implementation that satisfies every Acceptance Criterion. **Depends on `00-single-login.md` and `01-admin-backend.md`** — auth, cookie, middleware, `user_company_assignments`, structured logging, and Admin provisioning must already be in place.

---

## Role

You are a senior backend engineer working on **Smart Sales Systems** (FastAPI 0.115 + SQLAlchemy 2.x async + SQLite/aiosqlite + JWT + Resend + LlamaIndex/Groq + Chroma vector store). Your task is to build the **complete Agent backend surface** (formerly SalesRep): every endpoint, schema, guard, side effect, and migration the Agent role needs to verify AI drafts, send customer-facing replies, run the email thread, escalate via the 2-strike rule, schedule the Owner↔Customer chat, and apply discounts under the cascade.

---

## Goal

Deliver an Agent module that lets a customer-facing executor: see their **multi-company** queue, view AI drafts grounded in tenant RAG (with judge badge), edit + send replies (channel-aware outbound), bump reply counters on inbound replies, **automatically escalate** on customer reply #3, **manually escalate** with a reason, apply discounts within the per-product ceiling, **request elevated discounts** that flow to the Manager (then Owner), schedule chat rooms with secret-key unlock, and view their personal stats.

---

## Foundational context (read before writing code)

- Agent role definition + permissions: [`../roles_and_access.md`](../roles_and_access.md) §9 + master matrix §13.
- Agent workflow visuals: [`../role_workflows.md`](../role_workflows.md) §8 + [`../visuals/08-agent-formerly-salesrep__82-returning-happy-path.png`](../visuals/08-agent-formerly-salesrep__82-returning-happy-path.png) + [`../visuals/08-agent-formerly-salesrep__83-returning-customer-unhappy-2-strike-escalation.png`](../visuals/08-agent-formerly-salesrep__83-returning-customer-unhappy-2-strike-escalation.png).
- Intake + outbound channel design: [`../query_intake_channels.md`](../query_intake_channels.md) (all 10 channels — Agent sees them all unified via `query_messages`).
- Current Agent (`sales_rep`) API surface: [`../api_contracts.md`](../api_contracts.md) §6 + planned additions §11.9.
- CRUD specs (Query, QueryMessage, DiscountApproval, ChatRoom): [`../crud_operations.md`](../crud_operations.md) §§5, 14.2, 14.5, 14.6.
- Schema additions (channels, threading, counters, judge scores): [`../db_schema.md`](../db_schema.md) §9.
- 2-strike state machine: [`../role_workflows.md`](../role_workflows.md) §§5.6, 16.
- Integration / wiring rules: [`../skills/integration_skill.md`](../skills/integration_skill.md).
- Implementation tracker: [`../roles_checklist.md`](../roles_checklist.md) §8.

---

## Flexibility & Adaptation

> This prompt is a **starting blueprint**, not a contract. Read the [Adaptive Development Principles](./README.md#adaptive-development-principles) in the README before you start. Tl;dr:
>
> - **🟢 Safe** to deviate on: internal function names; the exact SQL for the stats query (return the right shape); pytest fixture organisation; the `outbound_dispatcher` retry policy (3 attempts is a starting suggestion); the in-template HTML for outbound emails; the exact bcrypt cost factor for chat keys.
> - **🟡 Flag in PR description** if you diverge on: table column names (must keep the Zod mirror in sync); the path `services/outbound_dispatcher.py`; using a different hashing lib for chat keys (argon2 over bcrypt is fine if you note it); auto-resolve heuristic on `/send` (the current spec says "don't auto-resolve unless ?mark_resolved=true" — diverging changes the UX and must be flagged); the SLA defaults (12h high / 48h normal — Owner may want to override via `companies.config.sla.*`).
> - **🔴 Update foundational docs first** if you discover: the 2-strike rule should count *unhappy* customer replies vs. all replies (the current spec is "every inbound bumps the counter" — that's a design call); `QueryMessage.direction` needs a third value (e.g. `"system"` for AI drafts vs. `"outbound"` for rep-sent — that ripples into `crud_operations.md` and the frontend); the discount cascade needs a fourth tier (e.g. Owner→CFO above some ceiling); the chat-room state machine needs a `cancelled_by_customer` state.
>
> **Non-negotiables** (do not adapt): every Agent endpoint requires `Depends(get_current_active_agent)` and scopes by `authed.company_ids`; chat-room secret keys are stored only as hashes and shown plaintext **once** in the outbound email; outbound dispatcher is channel-aware (no hard-coded email-only assumption); `query_messages` is append-only.

---

## Scope

### In scope
- New router `backend/app/api/endpoints/agent.py` mounted at `/api/v1/agent/*` (mirrors and replaces `/api/v1/sales/*` per the rename plan).
- Keep `/api/v1/sales/*` working for one release with a `Deprecation: true` header and 308 redirects where safe; both routers call the same handlers.
- New columns on `queries`: `channel`, `channel_metadata`, `external_thread_id`, `email_thread_id`, `customer_user_id`, `reply_count`, `rep_reply_count`, `auto_escalated`, `escalated_by`, `priority_set_by`, `last_reassigned_at`, `nps_rating`.
- New table `query_messages` (D2) — every inbound and outbound message of a query is one row.
- New table `discount_approvals` — request → Manager queue → Owner negotiation on overflow.
- New table `chat_rooms` + `chat_messages` — Agent creates the room; entry + WS handled in later prompts (D3). Schema + creation endpoint go here.
- `services/outbound_dispatcher.py` — channel-aware outbound (email via Resend today; widget/SMS/WhatsApp adapters are no-ops with TODO).
- `services/email_inbound.py` — minimal stub that, given a parsed inbound message, bumps `reply_count` and fires the 2-strike escalation. Full inbound parser is `03-inbound-email.md` (later); this prompt only writes the bump-and-escalate logic so unit tests can drive it.
- Bug fixes B1, B2 in everything you touch (see [`../state_preparation.md`](../state_preparation.md) §1.2).
- `response_model=` on every route; tenant-scope via the `AuthorisedUser` wrapper from `01-admin-backend.md` (the Agent guard returns the list of `company_ids` derived from `user_company_assignments`).

### Out of scope
- Inbound email parser (full version) — `03-inbound-email.md`.
- WS / SSE endpoints for chat rooms — `09-chat-rooms.md`.
- Reply/Retrieval judges actually scoring drafts — `10-judges.md`. Agent shows a placeholder badge until judge tables have data.
- Customer portal / `/customer/*` endpoints — `09-customer-backend.md`.

---

## Deliverables (file-level)

### 1. Migrations (Alembic)

Single revision adding:

- Columns on `queries` listed in Scope.
- Tables `query_messages`, `discount_approvals`, `chat_rooms`, `chat_messages` per DDL in [`../db_schema.md`](../db_schema.md) §9.2.
- Composite indexes:
  - `queries(company_id, status)`
  - `queries(sales_rep_id, status)` *(legacy column name — keep until rename window closes)*
  - `queries(channel, created_at)`
  - `query_messages(query_id, created_at)`
  - `query_messages(email_message_id)`, `query_messages(in_reply_to)`
  - `discount_approvals(status)`
  - `chat_rooms(state, start_at)`
  - `chat_messages(room_id, created_at)`
- Backfill: every existing `queries` row gets `reply_count=0, rep_reply_count=0, channel='google_form'`. If `final_answer` is non-null, insert a synthetic `query_messages` row with `direction='outbound', author_id=sales_rep_id`.

### 2. ORM — `backend/app/models/models.py`

Add `QueryMessage`, `DiscountApproval`, `ChatRoom`, `ChatMessage` per the DDL. Use the existing UUID-PK convention. Set up relationships: `Query.messages`, `Query.discount_approvals`, `Query.chat_rooms`, `ChatRoom.messages`.

### 3. Pydantic schemas — `backend/app/schemas/schemas.py`

Add:

```python
class QueryMessageOut(BaseModel):
    id: str
    direction: Literal["inbound", "outbound"]
    channel: str
    author_id: Optional[str]
    body: str
    html_body: Optional[str] = None
    created_at: datetime
    judge_score_id: Optional[str] = None
    class Config: from_attributes = True

class QueryDetail(QueryOut):
    messages: list[QueryMessageOut] = []
    customer_history_count: int = 0       # other queries from the same complainant_email
    judge_pre_send: Optional["JudgeScoreSummary"] = None
    judge_post_send: Optional["JudgeScoreSummary"] = None
    discount_approvals: list["DiscountApprovalOut"] = []
    chat_rooms: list["ChatRoomOut"] = []

class JudgeScoreSummary(BaseModel):
    overall: float
    groundedness: Optional[float] = None
    relevance: Optional[float] = None
    hallucination_flag: Optional[bool] = None
    pii_leak_flag: Optional[bool] = None
    block: bool = False
    warn: bool = False

class AgentSendRequest(BaseModel):
    body: str
    html_body: Optional[str] = None       # if absent, server wraps body in standard template

class AgentSendResult(BaseModel):
    query: QueryDetail
    delivered_via: str                    # 'email' | 'widget' | 'whatsapp' | etc.

class AgentDraftResult(BaseModel):
    body: str
    judge: Optional[JudgeScoreSummary]    # advisory pre-send score; may be None

class AgentEscalateRequest(BaseModel):
    reason: str
    priority: Literal["normal", "high"] = "normal"

class DiscountRequest(BaseModel):
    product_id: str
    requested_pct: int
    note: Optional[str] = None

class DiscountApprovalOut(BaseModel):
    id: str
    query_id: str
    product_id: str
    requested_by: str
    requested_pct: int
    approved_pct: Optional[int]
    status: Literal["pending", "approved", "denied", "escalated_to_owner"]
    decision_by: Optional[str]
    note: Optional[str] = None
    created_at: datetime
    decided_at: Optional[datetime] = None
    class Config: from_attributes = True

class ChatRoomScheduleRequest(BaseModel):
    start_at: datetime
    duration_min: int = Field(ge=10, le=180)

class ChatRoomOut(BaseModel):
    id: str
    query_id: str
    state: Literal["scheduled", "open", "closed", "cancelled"]
    start_at: datetime
    duration_min: int
    created_by: str
    owner_entered_at: Optional[datetime] = None
    customer_entered_at: Optional[datetime] = None
    created_at: datetime
    closed_at: Optional[datetime] = None
    # NOTE: keys are never serialised — only their hashes are stored
    class Config: from_attributes = True

class AgentCompanyOut(BaseModel):
    id: str
    name: str
    role_in_company: str
    is_primary: bool
    queue_pending: int
    queue_escalated: int

class AgentStats(BaseModel):
    active_queries: int
    resolved_queries: int
    escalated_queries: int
    avg_response_min: float
    efficiency_pct: float
    last_30d_resolved: int
    last_30d_avg_response_min: float
```

Tighten existing `QueryOut` to include `channel`, `customer_user_id`, `reply_count`, `rep_reply_count`, `auto_escalated` (default-safe).

### 4. Guard — `backend/app/api/deps.py`

Promote `get_current_active_agent` from stub to real:

```python
class AuthorisedUser:
    user: User
    company_ids: list[str]

async def get_current_active_agent(...) -> AuthorisedUser:
    # 1. resolve user (role must be 'Agent' or legacy 'SalesRep')
    # 2. fetch active user_company_assignments rows for this user where role_in_company='Agent'
    # 3. return AuthorisedUser
```

Add a helper `assert_company_in_scope(authed: AuthorisedUser, company_id: str)` raising 403 with `code="OUTSIDE_TENANT_SCOPE"`.

### 5. Router — `backend/app/api/endpoints/agent.py`

All routes require `Depends(get_current_active_agent)`. Scope every read/write to `authed.company_ids` (or a single `company_id` query param that must be in `authed.company_ids`).

| Method | Path                                              | Behaviour |
| ------ | ------------------------------------------------- | --------- |
| GET    | `/api/v1/agent/companies`                         | Returns `list[AgentCompanyOut]`. Drives the multi-company switcher in the UI. |
| GET    | `/api/v1/agent/stats?company=`                    | Returns `AgentStats`. If `company` omitted, aggregated across all companies. |
| GET    | `/api/v1/agent/queries?company=&status=&page=&page_size=` | List of `QueryOut` (paginated). Filter by `company_id` (must be in scope), `status` (Pending/Escalated/Resolved), simple search via `q` param matches `complaint_id` or `complainant_email`. Default sort: `created_at DESC` for Pending, `escalated_at ASC` for Escalated. |
| GET    | `/api/v1/agent/queries/{query_id}`                | Returns `QueryDetail` — includes full thread via `query_messages`, customer history count, latest pre/post-send judge summary, any discount approvals, any chat rooms. 404 if out of scope. |
| POST   | `/api/v1/agent/queries/{query_id}/draft`          | Re-runs RAG for this query (fresh draft). Persists draft into a new `query_messages` row with `direction='outbound'` and `author_id=null` (system) **only as a preview** — actual sending happens via `/send`. Returns `AgentDraftResult` (advisory judge score is included if the table has data; else `None`). |
| POST   | `/api/v1/agent/queries/{query_id}/send`           | Sends the final reply on the channel of origin. Body = `AgentSendRequest`. Steps: (1) insert `query_messages(direction='outbound', author_id=me, channel=query.channel)`; (2) increment `rep_reply_count`; (3) call `outbound_dispatcher.dispatch(query, body, html_body)`; (4) set `Query.final_answer = body` (compat field; deprecated); (5) if `Query.status == 'Pending'` and the customer hasn't replied since the last rep send, **don't auto-resolve** — leave as Pending. Only auto-resolve if `query.reply_count == 0` *and* explicit `?mark_resolved=true` query param is true. Returns `AgentSendResult`. |
| POST   | `/api/v1/agent/queries/{query_id}/escalate`       | Manual escalation. Body = `AgentEscalateRequest`. Sets `is_escalated=True, status='Escalated', escalated_by=me, escalation_reason=reason, priority=priority, escalated_at=now()`. Computes `deadline_at = now + (12h if high else 48h)`. Sends Owner notification email via BackgroundTasks. 400 if already escalated. |
| POST   | `/api/v1/agent/queries/{query_id}/discount-request` | Body = `DiscountRequest`. Validation: `product_id` must belong to `query.company_id`; if `requested_pct <= product.max_discount_pct`, **skip the cascade** and write the formatted final_answer directly (existing apply-discount behaviour). If above the cap, INSERT `discount_approvals` row with `status='pending'`; **do not** change query status. Notify Manager via email. Returns the created `DiscountApprovalOut`. |
| POST   | `/api/v1/agent/queries/{query_id}/schedule-chat`  | Body = `ChatRoomScheduleRequest`. Allowed only if `query.is_escalated == True`. Steps: (1) generate two URL-safe 32-byte tokens (`owner_secret_key`, `customer_secret_key`); (2) hash both with `bcrypt`; (3) INSERT `chat_rooms` with `state='scheduled'`; (4) send two emails — one to Owner of `query.company_id`, one to `query.complainant_email` — each containing the room URL + the **plaintext** key (one-time send) + start time; (5) return `ChatRoomOut` (no keys exposed). |
| GET    | `/api/v1/agent/queries/{query_id}/chat-rooms`     | List rooms for this query. |
| GET    | `/api/v1/agent/queries/{query_id}/chat-rooms/{room_id}/transcript` | Read-only chat messages — only accessible after `state='closed'`. Returns `list[ChatMessageOut]` (define a minimal schema). |
| GET    | `/api/v1/agent/products?company=`                 | Read-only product list for one of the Agent's companies. Required for the discount UI. |

**Legacy mirrors at `/api/v1/sales/*`:** keep the existing endpoints, mark `Deprecation: true`, route handlers re-dispatch to the new agent handlers. Drop after one release.

### 6. Outbound dispatcher — `backend/app/services/outbound_dispatcher.py`

```python
async def dispatch(query: Query, body: str, html_body: str | None) -> str:
    """Return delivered_via channel name."""
    ch = query.channel or "google_form"
    if ch in ("google_form", "email", "portal"):
        await email_service.send_response_email(
            email_to=query.complainant_email,
            subject=f"Re: Inquiry #{query.complaint_id}",
            body=html_body or _html_template(body),
            references=[query.email_thread_id] if query.email_thread_id else None,
        )
        return "email"
    if ch == "widget":
        # TODO: ws push (will be filled by 04-widget.md)
        return "widget_pending"
    if ch in ("whatsapp", "sms"):
        # TODO (05-whatsapp.md)
        return f"{ch}_pending"
    return "unknown"
```

Extend `email_service.send_response_email` to accept an `references: list[str] | None` parameter and set `Message-ID` / `In-Reply-To` / `References` headers correctly so customer replies thread back to the right query.

### 7. Inbound email bump-and-escalate — `backend/app/services/email_inbound.py`

```python
async def ingest_inbound_message(
    *, db: AsyncSession, query: Query, body: str, html_body: str | None,
    email_message_id: str, in_reply_to: str | None,
) -> None:
    db.add(QueryMessage(
        query_id=query.id, direction="inbound", channel="email",
        body=body, html_body=html_body,
        email_message_id=email_message_id, in_reply_to=in_reply_to,
    ))
    query.reply_count = (query.reply_count or 0) + 1
    if query.reply_count >= 3 and not query.is_escalated:
        await auto_escalate_two_strike(db, query)
```

`auto_escalate_two_strike` sets the same fields as the manual escalate handler but with `escalated_by=None, auto_escalated=True, escalation_reason="2-strike rule (3 unsatisfied customer replies)", priority="high", deadline_at=now+12h`. Sends Owner email.

The actual inbound webhook (`POST /webhook/inbound-email`) is built in `03-inbound-email.md`. Here, just expose this service function for tests to call directly.

### 8. Stats query — efficiency + avg response

```python
# avg_response_min = mean of (resolved_at - created_at) over the rep's resolved queries
# efficiency_pct  = 100 * resolved / (active + resolved)
# last_30d_*       = same windowed to created_at >= now - 30 days
```

Reuse the existing `sales_rep.get_rep_stats` logic; just extend to multi-company (filter by `Query.company_id.in_(authed.company_ids)`).

---

## §9 — Side effects + audit

| Operation                                        | ActivityLog action          | Email                                           |
| ------------------------------------------------ | --------------------------- | ----------------------------------------------- |
| `POST /agent/queries/{id}/send`                  | `QUERY_REPLY_SENT`          | to customer (channel-aware)                     |
| `POST /agent/queries/{id}/escalate`              | `QUERY_ESCALATED`           | to Owner of tenant                              |
| `auto_escalate_two_strike` (2-strike)            | `QUERY_AUTO_ESCALATED`      | to Owner of tenant                              |
| `POST /agent/queries/{id}/discount-request`      | `DISCOUNT_REQUESTED` (if cascade) or `DISCOUNT_APPLIED` (if within cap) | to Manager (cascade only) |
| `POST /agent/queries/{id}/schedule-chat`         | `CHAT_SCHEDULED`            | to Owner + Customer (secret keys)               |

Always log to the tenant scope of the query (`activity_logs.company_id = query.company_id`). Use `BackgroundTasks` for every email so the HTTP request returns promptly.

---

## §10 — Acceptance criteria (must all pass)

Backend (pytest):

- [ ] Agent A from tenants {X, Y} can list queries for X and Y, but NOT for Z → 404 (not 403, to avoid leaking).
- [ ] `GET /agent/queries/{id}` returns the full thread in chronological order, with the synthetic outbound row from migration backfill present.
- [ ] `POST /agent/queries/{id}/draft` returns a new draft body; if `judge_scores` table is empty, `judge` is `None`; if populated, returns the latest pre-send score for that query.
- [ ] `POST /agent/queries/{id}/send` inserts an outbound `query_messages` row, increments `rep_reply_count`, calls `outbound_dispatcher.dispatch`, and returns `delivered_via='email'` for a Google-Forms-origin query.
- [ ] `POST /agent/queries/{id}/escalate` flips `is_escalated`, sets `priority`, computes `deadline_at` correctly (12h high, 48h normal); a follow-up call returns 400.
- [ ] `email_inbound.ingest_inbound_message` called 3× bumps `reply_count` to 3, fires `auto_escalate_two_strike`, sets `auto_escalated=True`, writes `ActivityLog(QUERY_AUTO_ESCALATED)`, and sends one email to the Owner.
- [ ] `POST /agent/queries/{id}/discount-request` with `requested_pct <= product.max_discount_pct` applies in place (no row in `discount_approvals`); with `requested_pct >` cap, creates a pending `discount_approvals` row and emails the Manager.
- [ ] `POST /agent/queries/{id}/schedule-chat` on a non-escalated query → 400 `code="QUERY_NOT_ESCALATED"`. On an escalated query: creates a `chat_rooms` row with hashed keys (never returns plaintext in the API response), and sends exactly two emails with distinct keys.
- [ ] Multi-company `GET /agent/stats` aggregates correctly when no `company` filter; single-company filter returns scoped numbers.
- [ ] `/api/v1/sales/queries` still works for one release; response includes `Deprecation: true` header.
- [ ] Bug B1 fixed: all manager/agent code now references `sales_rep_id` (or `query.assigned_user`) consistently.
- [ ] Bug B2 fixed: every path param is `str`; UUIDs no longer 422.
- [ ] Alembic upgrade on a clean copy of legacy `sales_chatbot.db` succeeds; backfill row counts match `queries WHERE final_answer IS NOT NULL`.

---

## §11 — Implementation notes (gotchas)

- **Channel-aware outbound** must respect `email_thread_id`. When sending the first reply, set `Message-ID: <generated>` and store it on `query.email_thread_id`. Every subsequent send uses the same `email_thread_id` in `References`.
- **Threading inbound** needs `in_reply_to` matching → look up via `query_messages.email_message_id`. The inbound webhook prompt will wire this; expose it as a helper here so tests can stub it.
- **`final_answer`** is now derived data — keep writing it for backwards-compat readers, but the source of truth is `query_messages`.
- The chat-room **secret keys** must be cryptographically random (`secrets.token_urlsafe(32)`) and stored only as bcrypt hashes. The plaintext is included **once** in the outbound email and **never** in any API response.
- `outbound_dispatcher.dispatch` returns a string for the API response but is also the right place to introduce **retry on transient SMTP failures** (use `tenacity` with exponential backoff). Today: 3 attempts, 2s/4s/8s.
- The `discount-request` handler must lock the `Query` row (or at least re-fetch with `with_for_update()` semantics — SQLite is single-writer so this is a defensive convention) to avoid two reps requesting at once.
- When `query.channel == 'google_form'` and the customer never set up a thread, the first outbound email *creates* the thread; subsequent inbound parsing relies on `In-Reply-To`. Make sure the dispatcher always saves the generated `Message-ID` back on the query.
- Do not include the Owner secret key in the Agent-facing schedule-chat response. The Agent must not see either key.
- `GET /agent/queries/{id}` for an Escalated query should still be accessible to the originating Agent so they can see the outcome — read-only after escalation; mutations rejected with `code="QUERY_NOT_OWNED"`.
- `Channel='google_form'` queries created before this migration have no `email_thread_id`. First reply on those queries should still set one.
- When the rename window closes (per [`../state_preparation.md`](../state_preparation.md) Phase 2), drop the `SalesRep` enum value support in a follow-up PR — not now.

---

## §12 — Test plan (paste-ready)

```bash
# Apply migrations
cd backend
alembic upgrade head

# Run pytest
pytest tests/test_agent.py -v
pytest tests/test_agent_threading.py -v
pytest tests/test_agent_discount.py -v
pytest tests/test_agent_chat_schedule.py -v
pytest tests/test_email_inbound_bump.py -v

# Manual smoke (requires an Agent fixture)
uvicorn app.main:app --reload
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -d "username=agent@example.com&password=agent-pass" | jq -r .access_token)

# Companies
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/api/v1/agent/companies | jq

# Queue
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:8000/api/v1/agent/queries?status=Pending&page=1" | jq

# Send a reply
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  http://127.0.0.1:8000/api/v1/agent/queries/<QID>/send \
  -d '{"body":"Hello, here is your answer."}' | jq
```

---

## §13 — Update docs in the same PR

- [`../api_contracts.md`](../api_contracts.md) — promote §11.9 (Agent additions) into the current §6; mark `/sales/*` as deprecated mirrors.
- [`../crud_operations.md`](../crud_operations.md) — `QueryMessage`, `DiscountApproval`, `ChatRoom`, `ChatMessage` move from "planned" §14 into current sections (Agent column populated).
- [`../db_schema.md`](../db_schema.md) — promote the new tables + columns from §9 into the current schema (§§2.5, 2.x).
- [`../roles_checklist.md`](../roles_checklist.md) §8 (Agent) — flip ⭐ → ✅ for backend rows #3, #4, #6, #7, #8, #10.

---

## §14 — What "done" looks like

An Agent can log in, see all their assigned companies in `/agent/companies`, pick one (or "All"), pull a queue, request a fresh draft, send a reply that goes out on the right channel and threads correctly, request a high discount that lands in the Manager queue, escalate a tough query, schedule an Owner↔Customer chat with secret-key emails, and watch the 2-strike rule fire automatically when a customer replies for the third time. All audit + email side-effects fire. All acceptance tests pass. The legacy `/sales/*` paths still work for one release with `Deprecation` headers.
