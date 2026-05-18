# Smart Sales Systems — Roles & Access (Source of Truth)

> This document is the **foundational RBAC spec** for Smart Sales Systems. It supersedes any role description elsewhere in the codebase or older docs. Per-role design skills (`./skills/<role>_role.md`) and per-feature designs **must** conform to this document.

---

## 0. Why this exists

The four roles in the current code are a thin sketch. This document re-specifies them per the product owner's intent and **adds new roles** to cover real-world needs that are currently squeezed into existing roles or unhandled (customer accounts, compliance auditing, billing oversight, RAG-corpus curation, QA review of replies).

Status legend:
- ✅ **Implemented** — exists in code today (may need re-spec).
- 🟡 **Partial** — present but limited / broken.
- ⭐ **Planned** — designed here, not yet built.

---

## 1. The full role taxonomy at a glance

| Role                  | Tier        | One-liner                                                                  | Tenancy multiplicity                              | Status |
| --------------------- | ----------- | -------------------------------------------------------------------------- | ------------------------------------------------- | ------ |
| **Admin**             | Platform    | Developer / super-operator; logs, crashes, tenant provisioning.            | None (no `company_id`).                           | ✅     |
| **Auditor**           | Platform    | Read-only across all tenants; compliance & audit trails.                   | None.                                             | ⭐     |
| **Billing** | Platform | Read-only billing / token-usage / invoice oversight across tenants.        | None.                                             | ⭐     |
| **Owner**             | Tenant top  | Runs **one company**; owns catalogue, pricing, RAG corpus, escalations.    | One company per Owner; many Owners across system. | ✅     |
| **Curator**  | Tenant      | Specialist who curates the RAG corpus on behalf of an Owner.               | Many companies (assigned by their Owners).        | ⭐     |
| **Manager**           | Tenant team | Sales team lead; can lead teams across **multiple** companies.             | Many companies per Manager.                       | ✅ (single-co today) |
| **Reviewer**        | Tenant team | Quality reviewer of resolved replies; reports to Manager.                  | Many companies (within a Manager).                | ⭐     |
| **Agent**          | Tenant exec | Customer-facing; verifies AI replies, runs email threads, escalates.       | Many companies (assigned by their Manager).       | ✅ (single-co today) |
| **Customer**          | External    | End-user with a real account; query history, scheduled chat, satisfaction. | Cross-tenant (a customer can buy from many companies). | ⭐ |
| **Guest** (pseudo)    | External    | Anonymous query intake via Google Forms webhook (no account).              | n/a                                               | ✅     |
| **ReplyJudge**      | System agent| Auto-grades AI drafts + final replies on a rubric.                          | Background service; system token.                 | ⭐     |
| **RetrievalJudge**| System agent| Auto-grades whether retrieved chunks were relevant + sufficient.            | Background service; system token.                 | ⭐     |

> **Owner** and **Admin** continue to use the simple `users.company_id`/no-scope model. **Manager**, **Agent**, **Curator**, **Reviewer** all use the **new join table `user_company_assignments`** (§7) so they can span multiple companies.

---

## 2. Admin (Platform)

### 2.1 Identity
A developer / platform operator. Used to check logs, debug crashes, monitor system health, provision tenants, and intervene when things go wrong.

### 2.2 Creation
- Self-register via `POST /auth/register` with `ADMIN_SECRET_KEY`.
- Provisioned by another Admin via `POST /admin/users` (`role="Admin"`).
- `is_active=True` immediately.

### 2.3 Access (capabilities)

**Platform & tenancy**
- Create / list / delete companies.
- Create / list / update / delete any user of any role.
- Activate / deactivate any user.
- Assign Owners to companies; manage Manager/Agent/Reviewer/Curator assignments via the join table.
- Promote/demote across roles (with caution — see §11).

**Operations & observability** ⭐
- View **system logs** and crash traces (`error.txt` + structured logs once added).
- View neural / RAG diagnostics (LLM throughput, cache hit, vector-store status, embedding model health).
- View any company's audit trail.
- Trigger full re-index of any tenant's vector store.
- Read every entity in every tenant for debugging — **read-mostly**; mutations are rare and audit-logged.

**Hard boundaries**
- Does not author customer replies.
- Does not set prices or approve negotiations.
- Does not enter the customer ↔ Owner chat room (§6.7).

### 2.4 Mental model
*"Developer hat. I keep the lights on, I see everything, I touch as little as possible."*

---

## 3. Auditor (Platform, read-only) ⭐

### 3.1 Identity
A compliance / audit role. Read-only across every tenant. Cannot mutate anything. Designed for internal compliance officers, security reviewers, or external auditors during certification cycles.

### 3.2 Creation
- Provisioned only by Admin (`POST /admin/users` with `role="Auditor"`).
- `is_active=True`.

### 3.3 Access
- Read **all** `activity_logs` across all tenants.
- Read **all** queries (text + threads + outcomes).
- Read **all** `chat_rooms` + `chat_messages` (post-close only — cannot enter live rooms).
- Read user provisioning history.
- Export read-only reports (CSV / JSON).
- View RAG retrieval traces (which chunks were used for which answer) ⭐.
- View login / auth event log ⭐.

### 3.4 Hard boundaries
- **No writes** anywhere. The role's guard explicitly rejects any non-GET, non-export method.
- Cannot impersonate, decrypt PII beyond what's already plaintext, or enter live chat rooms.

### 3.5 Mental model
*"I look but never touch. I produce evidence."*

---

## 4. Billing (Platform, read-mostly) ⭐

### 4.1 Identity
A finance role responsible for tracking token consumption, generating invoices per tenant, monitoring plan limits, and freezing service on non-payment.

### 4.2 Creation
- Provisioned by Admin (`role="Billing"`).

### 4.3 Access
- Read per-company `total_tokens`, `weekly_tokens`, `monthly_tokens`.
- Read per-tenant usage breakdown (queries volume, chat-room minutes, doc storage MB).
- Create / list / void invoices (`invoices` table ⭐).
- Mark tenants as `billing_suspended` (third lock in addition to `admin_suspended` and `manager_suspended`) ⭐.
- Configure per-tenant plan: `plan_tier`, monthly token allowance, overage rate.

### 4.4 Hard boundaries
- No access to query content (sees counts and metadata only).
- No access to RAG corpus content.
- Cannot enter chat rooms.

### 4.5 Mental model
*"I count, I invoice, I pause when bills don't get paid."*

---

## 5. Owner (Tenant top)

### 5.1 Identity
A company's principal — the person trying to sell their company's products. Each Owner is tied to **one** company. Many Owners exist across the platform.

### 5.2 Creation
- Provisioned by Admin (`POST /admin/users` with `role="Owner"` + `company_id`).
- `is_active=True`.

### 5.3 Access

**Company profile**
- Read + update own company (`name`, `description`, `config`).
- Cannot delete the company (Admin-only).

**Catalogue & pricing**
- Full CRUD on Products in their company.
- Upload product documents (PDF / image / text) — OCR'd and embedded into the RAG corpus.
- Delete product documents — purges from the vector store.
- Set the **base price** and **maximum discount percentage** per product.
- Maintain promotional / discount offers (Product field or `companies.config`).

**Team visibility**
- See Managers, Reviewers, Agents, Curators assigned to their company.
- See per-team / per-rep performance stats scoped to their company.
- Invite a **Curator** to help maintain the corpus (the curator must be Admin-provisioned first; Owner only "attaches" them).

**Customer interaction**
- Receive escalation notifications when a query is escalated (per the 2-strike rule, §6.6).
- Decide outcomes on escalated negotiations (`POST /owner/negotiations/{id}/resolve`).
- Enter the **scheduled chat room** (§6.7) with their secret key.

**Audit**
- Read the company's activity log.

### 5.4 Hard boundaries
- Cross-tenant operations.
- Creating Managers/Agents/Admins directly (Admin does that; Manager invites Agents to the team).
- Editing billing / deleting the company.
- Joining a chat room of another company.

### 5.5 Mental model
*"I run this company's sales surface. I'm the final word on tough customer cases."*

---

## 6. Curator (Tenant specialist) ⭐

### 6.1 Identity
A specialist (often a content / technical-writing professional) who manages product documentation and the RAG corpus on behalf of one or more Owners. Cheaper / more focused than asking the Owner to do all knowledge maintenance themselves.

### 6.2 Creation
- Provisioned by Admin (`role="Curator"`).
- Attached to a company by that company's Owner via the join table (with `role_in_company="Curator"`).

### 6.3 Access (per assigned company)
- Upload / replace / delete product documents.
- Edit product `manual_content`.
- Trigger a re-index of the tenant's vector store.
- View RAG retrieval traces for recent queries (to gauge corpus coverage).
- View `KNOWLEDGE_*` activity-log entries.

### 6.4 Hard boundaries
- Cannot edit price, `max_discount_pct`, or business rules on products.
- Cannot see customer queries' full content (sees `query_text` truncated + which chunks were retrieved). The aim is to evaluate corpus coverage without exposing PII.
- Cannot resolve queries, send replies, or enter chat rooms.

### 6.5 Mental model
*"I make sure the AI has the right docs to answer well. I don't sell, negotiate, or talk to customers."*

---

## 7. Manager (Tenant team lead)

### 7.1 Identity
A sales team lead. **A Manager can lead teams across multiple companies** (e.g. agency-style manager serving multiple Owners).

### 7.2 Creation
- Provisioned by Admin (`role="Manager"`).
- Admin assigns one or more companies to the Manager via the join table.
- `is_active=True`.

### 7.3 Access (across assigned companies)

- Dashboard stats per-company or aggregated across all assigned companies.
- View team rosters (Agents + Reviewers) in assigned companies.
- **Invite / assign Agents** to the companies the Manager is assigned to (creates a `user_company_assignment`).
- Activate / deactivate Agents under their reportingline.
- Reassign queries between Agents (single + bulk + round-robin + weighted).
- Set query priority and override deadlines.
- Add internal notes to queries.
- Approve / deny discount requests up to `companies.config.manager_discount_ceiling` (Manager middle tier in the discount cascade — §6.8).
- View SLA breaches and at-risk queries.
- Trigger QA reviews; read QA reports.
- Toggle `manager_suspended` on a company they manage (dual-lock with Admin).
- Create / update products in assigned companies (audit-logged); **cannot delete** (Owner-only).
- Read assigned-company activity logs.
- Manage goals/KPIs, announcements, training assignments, shifts for assigned companies (planned features).

### 7.4 Hard boundaries
- Cross-company outside of assigned set.
- Creating Owners / Managers / Admins.
- Deleting products or mutating the RAG corpus.
- Resolving customer-facing negotiations (Owner-only).
- Joining customer ↔ Owner chat rooms.

### 7.5 Mental model
*"I run sales teams across one or more companies. I move work, watch performance, and approve middling discounts."*

---

## 8. Reviewer (Tenant team) ⭐

### 8.1 Identity
A quality-assurance reviewer who samples resolved queries and grades them. Reports to a Manager but can serve across multiple companies the Manager covers.

### 8.2 Creation
- Provisioned by Admin (`role="Reviewer"`).
- Manager attaches them to a subset of the Manager's assigned companies via the join table.

### 8.3 Access (per assigned company)
- Read all resolved queries (with thread).
- Create `QueryReview` rows (rating + comments).
- Read leaderboards and per-rep aggregates of their own reviews.
- Cannot reassign queries, edit products, or touch the corpus.

### 8.4 Mental model
*"I grade the work after the fact. My grades feed leaderboards and performance reviews."*

---

## 9. Agent (Tenant executor)

### 9.1 Identity
The customer-facing executor. **Each Agent reports to exactly one Manager** and **can be assigned to multiple companies** by that Manager.

### 9.2 Creation
- Self-register (`POST /auth/register`) → `role=Agent`, `is_active=False` until approved.
- Provisioned by Admin (`role="Agent"` + a `manager_id`).
- Invited by Manager (`POST /manager/team/invite` ⭐).
- Manager then assigns the Agent to one or more of the Manager's companies via the join table.

### 9.3 Access (per assigned company)
- Read product catalogue (read-only).
- Receive customer queries (auto-distributed via the auto-reassign strategy, or Manager-assigned).
- See AI-generated draft reply (RAG-grounded in that company's corpus).
- **Verify, edit, and send** the reply to the customer.
- Apply discounts up to `product.max_discount_pct` automatically; request higher discounts (creates a `DiscountApproval` for the Manager).
- Continue the email thread (see §9.5 for the 2-strike rule).
- **Escalate** a query to the Owner of that company (auto or manual).
- Set the **schedule** for a customer ↔ Owner chat room (§6.7), choosing time + duration.
- View own stats: active / resolved / escalated counts, average response time, efficiency.

### 9.4 Hard boundaries
- Touch products, prices, or the RAG corpus.
- Reassign queries to other reps (Manager does).
- Operate on companies they're not assigned to.
- Approve their own elevated discounts.
- Enter the scheduled chat room (they set it up, but don't enter — read-only transcript afterwards).

### 9.5 Reply workflow & 2-strike rule (canonical)

```
[Customer query enters via webhook]
        │
        ▼
RAG generates draft reply (from that company's vector corpus)
        │
        ▼
Query lands in Agent's queue (FCFS or Manager-assigned)
        │
        ▼
Agent reviews → edits → sends email (thread anchored by email_thread_id)
        │
        ├── Customer satisfied → status=Resolved
        └── Customer replies "still unhappy" (counter increments)
                  │
                  ├── reply #1 unhappy → Rep replies again (rep_reply #1)
                  ├── reply #2 unhappy → Rep replies again (rep_reply #2)
                  └── reply #3 unhappy → **2-strike rule fires**:
                                          status = Escalated, auto_escalated = True
                                          Owner notified, "Schedule chat" CTA enabled
```

- The 2-strike rule is **per-query**, **automatic**, and **non-overridable** by the rep.
- Reps may also manually escalate before strike 2 with a `reason`.
- Every message is persisted in `query_messages` keyed off the email Message-ID for thread continuity.

### 9.6 Mental model
*"I'm the human in the loop between the AI and the customer. The AI drafts, I send. If the customer pushes back twice and I still can't solve it, I escalate to the Owner and arrange a chat."*

---

## 10. Customer (External end-user) ⭐

### 10.1 Identity
An end-user account, optional but encouraged. The current "Guest" path (anonymous webhook intake) continues to work, but customers can also **register an account** to track their queries, see thread history, manage scheduled chats, and authenticate into chat rooms more conveniently.

### 10.2 Creation
- Self-register (`POST /auth/register/customer` ⭐) — separate from the staff `/auth/register` to keep the role pure.
- Activation: email verification link (no Admin approval required).
- One customer can have queries with many companies (cross-tenant by nature).

### 10.3 Access
- View own queries across all companies they've contacted.
- Read full thread for each of their queries.
- See status (Pending / Resolved / Escalated) and any scheduled chats.
- Enter the scheduled chat room using their **customer secret key** + (optionally) their logged-in session for convenience.
- Rate the resolution (NPS / 1-5 stars) — feeds back into the QA / sentiment system.
- Update own profile (name, contact email, communication preferences).
- Self-serve "request escalation" before the 2-strike rule fires (optional UX).

### 10.4 Hard boundaries
- No access to any company's catalogue, team, or backend.
- Cannot see other customers' queries.
- Cannot enter another customer's chat room.

### 10.5 Mental model
*"I'm the person buying things. I want to see my conversations, get answers, and talk to a real person when needed."*

---

## 11. Guest (pseudo-role, anonymous) ✅

Not a real DB role — represents the anonymous Google-Forms webhook path. Guests submit queries via `POST /api/v1/webhook/google-forms` and receive replies via email. They have no account, no portal, no chat-room access (but a Guest *can* enter a scheduled chat with just the customer secret key — no login required).

---

## 11A. Automated Evaluator agents (System) ⭐

Two **non-human, system-owned** components grade the AI pipeline and feed scores into dashboards, QA queues, and gating logic. They are not roles a person can log in as — they run as services, authenticated with a dedicated **system token** issued at deploy time.

| Agent                | Mode              | What it judges                                                | Surfaces to                                                                  |
| -------------------- | ----------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **ReplyJudge**     | Output evaluation | The quality of the AI-drafted reply *and* the final reply sent. | Reviewer queue, Agent coaching, Manager analytics, Auditor evidence.    |
| **RetrievalJudge** | Retrieval evaluation | Whether the vector store returned chunks actually relevant to the query. | Curator dashboard (corpus gaps), Admin RAG diagnostics, Auditor.    |

### 11A.1 ReplyJudge ⭐

**Purpose:** automatically grade every (or sampled) draft + final reply so humans don't have to read everything to catch quality drift.

**What it scores** (rubric is configurable per company under `companies.config.judge`):

| Dimension          | Scale | Definition                                                              |
| ------------------ | ----- | ----------------------------------------------------------------------- |
| `groundedness`     | 0–1   | Fraction of factual claims in the reply that are supported by the retrieved chunks. |
| `relevance`        | 0–1   | How well the reply addresses the customer's actual question.            |
| `tone`             | 0–1   | Matches the company's tone-of-voice guidelines.                         |
| `policy_compliance`| bool  | Does not violate forbidden-content rules (e.g. unauthorised promises, PII leaks). |
| `hallucination_flag` | bool | Reply contains claims with no chunk support.                            |
| `pii_leak_flag`    | bool  | Reply repeats sensitive customer data unnecessarily.                    |
| `overall`          | 0–5   | Weighted composite (weights in `companies.config.judge.weights`).        |

**When it runs**
- **Pre-send (advisory):** on every AI draft before it reaches the Agent — shows a "Judge says…" badge next to the draft.
- **Post-send (eval):** on the actual `final_answer` the rep sent — scores stored to `judge_scores`.
- **Batch sweep:** nightly job re-grades a random sample for trend tracking.

**Model**
- Default: same Groq Llama-3-70B used for generation (cheaper + already configured). Recommended: a *different* model than the generator to reduce blind-spot correlation — e.g. `gpt-4o-mini` or `claude-haiku` configured via `JUDGE_MODEL`.
- Prompt template lives in `services/judge_service.py` with system rubric + JSON-schema constrained output.

**Gating policy (configurable)**
- If `judge.overall < threshold_block`: draft is **hidden** from the rep with an error ("Draft failed quality bar — regenerating") and a new draft is requested. Three failures escalate.
- If `judge.overall < threshold_warn`: draft is shown with a warning chip.
- `hallucination_flag = true` → always block.
- `policy_compliance = false` → always block + log Auditor alert.

### 11A.2 RetrievalJudge ⭐

**Purpose:** automatically grade the **retrieval step** — were the chunks the vector store returned actually relevant to the customer's question? This is how we detect *"the AI gave a bad answer because the corpus is missing / mis-chunked content"* vs *"the AI gave a bad answer despite good retrieval"*.

**What it scores** (per retrieval, per chunk):

| Dimension          | Scale | Definition                                                                  |
| ------------------ | ----- | --------------------------------------------------------------------------- |
| `chunk_relevance`  | 0–1   | Per-chunk: would a human consider this chunk relevant to the query?         |
| `coverage`         | 0–1   | Together, do the top-k chunks contain the information needed to answer?     |
| `redundancy`       | 0–1   | Are chunks duplicative? Lower = more unique information.                    |
| `missing_info`     | bool  | The answer to the query is *not* in the retrieved set (corpus gap).         |
| `wrong_product`    | bool  | Retrieved chunks belong to the wrong product within the tenant.             |

**How it runs**
- **Online (lightweight):** at retrieval time, a cross-encoder reranker (e.g. `cross-encoder/ms-marco-MiniLM-L-6-v2`) scores each candidate chunk → cheap, deterministic. Stored as `chunk_relevance`.
- **Offline (LLM-backed):** asynchronous job sends the (query, top-k chunks) pair to a judge model and asks for the full rubric → stored to `retriever_scores`. Runs on every query in dev, sampled in prod (`companies.config.judge.retriever_sample_rate`).

**Why both:** the online reranker gives fast feedback and can re-order chunks before generation. The offline LLM judge gives a richer signal for analytics + corpus improvement.

**Downstream effects**
- `missing_info = true` on N consecutive queries about the same topic → automatic ticket on the **Curator** dashboard: *"Likely corpus gap: <topic>"*.
- `wrong_product = true` → flagged for chunking review (metadata tagging may be off).
- Aggregated `chunk_relevance` < threshold → triggers a re-embedding job (different chunk size / model).

### 11A.3 New tables (system-owned, append-only)

```
judge_scores(
  id (uuid PK),
  query_id        (FK queries, NOT NULL),
  target          ("ai_draft" | "final_reply"),
  model_name      (text),
  rubric_version  (text),
  groundedness    (real),
  relevance       (real),
  tone            (real),
  policy_compliance (bool),
  hallucination_flag (bool),
  pii_leak_flag   (bool),
  overall         (real),
  reasoning       (text),       -- judge's free-text rationale (truncated)
  created_at      (DateTime)
)

retriever_scores(
  id (uuid PK),
  query_id        (FK queries, NOT NULL),
  retrieved_chunks (json),      -- [{document_id, chunk_index, vector_score}]
  chunk_relevance (json),       -- parallel array of 0-1 scores
  coverage        (real),
  redundancy      (real),
  missing_info    (bool),
  wrong_product   (bool),
  reasoning       (text),
  created_at      (DateTime)
)

judge_rubrics(
  id, company_id (FK), version (text),
  weights (json), thresholds (json), policy_rules (json),
  created_by (FK users), created_at, active (bool)
)
```

### 11A.4 Authentication for the judges

The judges run as **server-side services** triggered by:
- the RAG pipeline (synchronous, advisory),
- a background worker (e.g. Celery / arq / Cloud Tasks) consuming from a queue (asynchronous, eval-only).

They authenticate with a **system token** (separate JWT issued at deploy time, role `"System"`, scoped to write `judge_scores` / `retriever_scores` only). This token is **never** exposed to a browser.

### 11A.5 Visibility (who sees what)

| Field                                      | Admin | Auditor | Owner | Curator | Manager | Reviewer | Agent | Customer |
| ------------------------------------------ | :---: | :-----: | :---: | :--------------: | :-----: | :--------: | :------: | :------: |
| Judge scores (rubric numbers, flags)        | R*    | R*      | R~    | R~ (retriever only) | R~  | R~         | R~ own   | —        |
| Judge free-text reasoning                  | R*    | R*      | R~    | R~ (retriever only) | R~  | R~         | —        | —        |
| Rubric config (`judge_rubrics`)             | CRUD  | R*      | RU~   | —                | R~      | —          | —        | —        |
| Retrieved chunks list                       | R*    | R*      | R~    | R~               | R~      | R~         | R~ (filename + score, no body) | — |

Customer never sees judge data. Agent sees the score badge on the draft, not the rubric details (avoid prompt-engineering rep workarounds).

### 11A.6 Configuration (per-company)

`companies.config.judge`:
```json
{
  "model": "groq:llama3-70b-8192",
  "rubric_version": "v3",
  "weights": { "groundedness": 0.4, "relevance": 0.3, "tone": 0.2, "policy_compliance": 0.1 },
  "thresholds": { "block_below": 2.0, "warn_below": 3.5 },
  "policy_rules": ["no_unauthorised_discounts", "no_legal_promises"],
  "retriever_sample_rate": 0.25,
  "online_reranker": "cross-encoder/ms-marco-MiniLM-L-6-v2"
}
```

### 11A.7 Mental model

> *"Judges are silent extra eyes on every AI step. They never talk to customers; they grade and surface findings. ReplyJudge watches what we say; RetrievalJudge watches whether we even pulled the right facts to say it. Together they're how we keep the AI honest at scale without hand-reviewing everything."*

---

## 12. Multi-company assignments (schema impact)

### 12.1 New table — `user_company_assignments`

```
id (uuid PK),
user_id          (FK users, NOT NULL),
company_id       (FK companies, NOT NULL),
role_in_company  (text: "Manager"|"Agent"|"Reviewer"|"Curator"),
manager_id       (FK users, nullable)            -- for Agent + Reviewer rows
assigned_by      (FK users, nullable),
assigned_at      (DateTime, default now),
is_primary       (bool, default false),          -- one primary company per user (UI default)
status           (text: "active"|"paused"),
UNIQUE (user_id, company_id)
```

Rules:
- Used for **Manager**, **Agent**, **Reviewer**, **Curator**.
- For **Owner**, **Admin**, **Auditor**, **Billing**, **Customer**, this table is unused.
- A Agent / Reviewer row's `company_id` must be one the parent `manager_id`'s Manager is also assigned to.
- Removing an assignment **does not** delete the user — it only revokes access to that company.
- All endpoints scoped to "my companies" JOIN through this table.

### 12.2 New / extended columns on `queries`

- `reply_count` (int, default 0)
- `rep_reply_count` (int, default 0)
- `email_thread_id` (text, nullable)
- `escalated_by` (text user_id, nullable)
- `auto_escalated` (bool, default false)
- `customer_user_id` (FK users, nullable — link to the optional Customer account)
- `nps_rating` (int, nullable — 1-5)

### 12.3 New tables — messaging

```
query_messages(
  id, query_id (FK), direction ("inbound"|"outbound"),
  author_id (FK users, nullable for inbound),
  email_message_id (text), in_reply_to (text, nullable),
  body (text), html_body (text, nullable),
  created_at
)

chat_rooms(
  id, query_id (FK), state ("scheduled"|"open"|"closed"|"cancelled"),
  start_at, duration_min, created_by (FK users),
  owner_key_hash (text), customer_key_hash (text),
  owner_entered_at (nullable), customer_entered_at (nullable),
  created_at, closed_at (nullable)
)

chat_messages(
  id, room_id (FK chat_rooms),
  author ("owner"|"customer"|"system"),
  body (text), created_at
)
```

### 12.4 New tables — billing & QA

```
invoices(
  id, company_id (FK), period_start, period_end,
  total_tokens, total_amount_cents, status ("draft"|"sent"|"paid"|"void"),
  issued_at, paid_at (nullable)
)

discount_approvals(
  id, query_id, product_id, requested_by, requested_pct,
  approved_pct (nullable), status ("pending"|"approved"|"denied"|"escalated_to_owner"),
  decision_by (nullable), note (text), created_at, decided_at (nullable)
)

query_reviews(
  id, query_id, reviewer_id, rating (1-5), comments (text), created_at
)
```

### 12.5 Additive `companies.config` namespaces

- `companies.config.manager.manager_discount_ceiling` (int, e.g. 25)
- `companies.config.sla.high_hours` (int, e.g. 12) / `sla.normal_hours` (e.g. 48)
- `companies.config.billing.plan_tier` ("starter" | "growth" | "scale")
- `companies.config.billing.monthly_token_allowance`
- `companies.config.chat.default_duration_min`

---

## 13. Master permission matrix

`C/R/U/D` = create/read/update/delete. `~` = scoped (own / assigned tenant). `*` = all tenants. `—` = forbidden.

| Entity                       | Admin | Auditor | Billing | Owner | Curator | Manager | Reviewer | Agent | Customer |
| ---------------------------- | :---: | :-----: | :-----: | :---: | :--------------: | :-----: | :--------: | :------: | :------: |
| Admin user                   | CRUD  | R*      | —       | —     | —                | —       | —          | —        | —        |
| Owner user                   | CRUD  | R*      | —       | R(self) | —              | R~      | R~         | R~       | —        |
| Manager user                 | CRUD  | R*      | —       | R~    | R~               | R(self) | R~         | R~       | —        |
| Agent / Reviewer / Curator user | CRUD | R* | — | R~ | R~ | CR~ + assign | R~ | R(self) | — |
| Customer user                | CRUD  | R*      | R~      | —     | —                | —       | —          | —        | R(self)  |
| Company                      | CRUD  | R*      | RU~ billing-only | RU~ | R~              | R~      | R~         | R~       | —        |
| user_company_assignments     | CRUD  | R*      | —       | R~    | R~ (own)         | CRUD~ (within assigned) | R~ (self) | R(self) | — |
| Product                      | R*    | R*      | —       | CRUD~ | R~               | CU~     | R~         | R~       | —        |
| ProductDocument              | R*    | R*      | —       | CRUD~ | CRUD~            | R~ inline | —        | R~ inline | —      |
| Query (full content)         | R*    | R*      | R~ meta only | R~ + U escalations | R~ truncated + retrieval trace | R~ + reassign / priority / notes / recall | R~ resolved + create QueryReview | R + U on own | R own |
| QueryMessage (thread)        | R*    | R*      | —       | R~    | R~ truncated     | R~      | R~         | CR (own) | R own    |
| ChatRoom                     | R*    | R* post-close | — | CR + ENTER (own co) | — | R~ | R~ | C (schedule) + R | ENTER (own) + R own |
| ChatMessage                  | R*    | R* post-close | — | CR (own room) | — | R~ | R~ | R~ | CR own room |
| DiscountApproval             | R*    | R*      | —       | R~    | —                | CR + approve/deny | R~ | C (request) | — |
| QueryReview                  | R*    | R*      | —       | R~    | —                | R~      | CRU~       | R~ (own)  | —        |
| Lead / LeadStat              | R*    | R*      | —       | R~    | —                | CRUD~   | R~         | RU~ own  | —        |
| ActivityLog                  | R*    | R*      | R~ usage entries | R~ | R~ KNOWLEDGE_* | R~ | R~       | —        | —        |
| Invoice                      | R*    | R*      | CRUD    | R~ own  | —              | —       | —          | —        | —        |
| System logs / diagnostics    | R     | R       | —       | —     | —                | —       | —          | —        | —        |

---

## 14. Authentication & route gating

### 14.1 Backend guard chain (FastAPI)

```
get_current_user
   └── get_current_active_user
          ├── get_current_active_admin
          ├── get_current_active_auditor          ⭐
          ├── get_current_active_billing          ⭐
          ├── get_current_active_owner
          ├── get_current_active_curator          ⭐
          ├── get_current_active_manager          (joins user_company_assignments for scope)
          ├── get_current_active_reviewer         ⭐
          ├── get_current_active_agent            (joins user_company_assignments for scope)
          └── get_current_active_customer         ⭐
```

Endpoints requesting a specific `company_id` must additionally verify the caller has an **active** assignment to that company (for Manager / Agent / Reviewer / Curator) or directly owns it (Owner).

### 14.2 Frontend route gating (Next.js)

`middleware.ts` matches `/admin/*`, `/auditor/*`, `/billing/*`, `/owner/*`, `/curator/*`, `/manager/*`, `/qa/*`, `/sales/*`, `/customer/*` and redirects on role mismatch. JWT in HttpOnly cookie.

### 14.3 Chat-room session tokens

Entering a `ChatRoom` mints a short-lived JWT scoped to that room only (`room_id`, `participant`, `exp = room.closed_at`). It is **not** interchangeable with the normal access token. Customer can enter with their secret key alone (no account required) — if they're a Customer-role user, the session is additionally bound to their `user_id`.

---

## 15. Cross-role workflows (canonical)

### 15.1 Customer query → AI draft → Agent send → close
*(Happy path — §9.5.)*

### 15.2 2-strike auto-escalation → Owner negotiation → Resolved
*(§9.5 → Owner `POST /negotiations/{id}/resolve`.)*

### 15.3 2-strike → Schedule chat → Owner ↔ Customer chat → close
*(§6.7 chat room with secret-key unlock.)*

### 15.4 Manager assigns a Agent to an additional company
1. Manager opens `/manager/team/[repId]`.
2. Picks one of the Manager's assigned companies (only those).
3. Submits → new `user_company_assignment` row.
4. Agent's UI now shows that company in their context switcher.

### 15.5 Owner attaches a Curator
1. Admin provisions a `Curator` user.
2. Owner opens `/owner/team/curators` → "Attach" → picks from available pool.
3. Curator now appears in `user_company_assignments` for that company.

### 15.6 Billing freezes a non-paying tenant
1. Invoice past due → Billing flips `billing_suspended=true` on the company.
2. Company's effective state becomes inactive regardless of admin/manager flags.
3. All non-admin endpoints for that tenant return 402-style errors with a payment link.

### 15.7 Customer self-serve
1. Customer registers, verifies email.
2. Sees a "My Queries" portal aggregating queries across companies they've contacted.
3. Opens a thread → can reply, rate, or join a scheduled chat.

---

## 16. Discount ceiling cascade

```
Agent ceiling = product.max_discount_pct                          (per product)
Manager  ceiling = companies.config.manager.manager_discount_ceiling (per company)
Owner    ceiling = unlimited (subject to business policy)
```

Above ceiling at any tier creates a `DiscountApproval` that escalates to the next tier.

---

## 17. Mapping to current code (gap analysis)

| Spec item                                              | Current state                 | Gap                                                                                         |
| ------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------- |
| Manager → multiple companies                           | `users.company_id` single FK  | Add `user_company_assignments`; rewrite Manager queries to JOIN through it.                 |
| Agent → multiple companies                          | Single FK                     | Same.                                                                                       |
| Customer role + portal                                 | None                          | New role, new `/auth/register/customer`, new `/customer/*` route tree.                      |
| Auditor role                                           | None                          | New role + read-only endpoints.                                                             |
| Billing role + invoices                                | None                          | New role, new `invoices` table, billing-suspended flag.                                     |
| Curator role                                  | None                          | New role + scoped to RAG corpus mutations.                                                  |
| Reviewer role                                        | None                          | New role + `query_reviews` table.                                                           |
| 2-strike auto-escalation                               | Not implemented               | New columns + reply-counter + webhook logic.                                                |
| Email-thread continuity                                | Not implemented               | `email_thread_id` + `query_messages` table + parser.                                        |
| Scheduled chat room with secret keys                   | Not implemented               | `chat_rooms` + `chat_messages` + WS/SSE + key-hash auth.                                    |
| Discount cascade (Rep → Manager → Owner)               | Only Rep cap                  | `discount_approvals` table + Manager endpoints.                                             |
| Admin = developer / log viewer                         | Stubs only                    | Real log + crash trace endpoints; gate behind Admin only.                                   |
| RAG: persistent vector store + per-tenant collections | Index built per request       | Embedding service + vector store (ChromaDB dev / Qdrant prod) — see `backend_skill.md`.    |

---

## 18. Glossary

- **Tenant** — a `companies` row.
- **Assignment** — a row in `user_company_assignments`; the lens through which Managers / Agents / Reviewers / Curators see tenant data.
- **2-strike rule** — automatic escalation after the customer's third unhappy reply.
- **Chat room** — time-boxed, key-gated Owner ↔ Customer real-time channel.
- **Triple-lock suspension** — a company is effectively suspended when `billing_suspended` is true OR (`admin_suspended` AND `manager_suspended`).
- **Discount ceiling cascade** — Rep ≤ `product.max_discount_pct` → Manager ≤ `companies.config.manager.manager_discount_ceiling` → Owner.
- **RAG corpus** — per-tenant vector collection built from `product_documents.content`.
- **Customer secret key** / **Owner secret key** — single-use, room-bound tokens emailed to the two chat participants.

---

## 19. Companion documents

- Per-role skills (to be authored once this taxonomy is approved): `./skills/admin_role.md`, `./skills/auditor_role.md`, `./skills/billing_role.md`, `./skills/owner_role.md`, `./skills/curator_role.md`, `./skills/manager_role.md`, `./skills/reviewer_role.md`, `./skills/agent_role.md`, `./skills/customer_role.md`.
- Backend conventions: `./skills/backend_skill.md` *(forthcoming).*
- Frontend (Next.js) conventions: `./skills/frontend_skill.md` *(forthcoming).*
- API contracts: `./api_contracts.md`.
- CRUD operations: `./crud_operations.md`.
- DB schema: `./db_schema.md`.
- Architecture: `./architecture.md`.
