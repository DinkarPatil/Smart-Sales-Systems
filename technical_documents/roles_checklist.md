# Smart Sales Systems — Roles Implementation Checklist

> Per-role tracker showing what's **built**, what's **partial**, and what's **planned** for each role in the [roles_and_access.md](./roles_and_access.md) taxonomy. Use this as the implementation backlog when sequencing work.

**Legend:** ✅ done · 🟡 partial / buggy · ⭐ planned · ⛔ blocked on a dependency

**Cross-cutting dependencies referenced below:**
- **D1** `user_company_assignments` table (multi-company for Manager / Agent / Reviewer / Curator)
- **D2** `query_messages` table + email-thread continuity
- **D3** `chat_rooms` + `chat_messages` + secret-key auth
- **D4** `judge_scores` + `retriever_scores` + `judge_rubrics`
- **D5** Persistent vector store (ChromaDB dev / Qdrant prod) + embedding service
- **D6** HttpOnly cookie auth + Next.js middleware
- **D7** Customer auth (`/auth/register/customer` + verification)
- **D8** Inbound email adapter
- **D9** Customer portal scaffold (`/customer/*`)

---

## 1. Admin

| # | Capability                                       | Backend | Frontend | Deps   |
|---|--------------------------------------------------|:-------:|:--------:|--------|
| 1 | Self-register with `ADMIN_SECRET_KEY`            |   ✅    |    ✅    | —      |
| 2 | Provision any user (any role)                    |   ✅    |    ✅    | —      |
| 3 | List / update / delete users                     |   ✅    |    ✅    | —      |
| 4 | Create / list / delete companies                 |   ✅    |    ✅    | —      |
| 5 | Read **real** system logs / crash traces         |   🟡 (stub) |  ⭐   | structured logging |
| 6 | Read **real** RAG / LLM diagnostics              |   🟡 (stub) |  ⭐   | D4, D5 |
| 7 | Cross-tenant audit-log feed                      |   🟡 (stub) |  ⭐   | D1     |
| 8 | Manage `user_company_assignments` for any user   |   ⭐    |   ⭐    | D1     |
| 9 | Trigger per-tenant vector re-index               |   ⭐    |   ⭐    | D5     |
|10 | Promote / demote roles                            |   ✅ (via PUT /admin/users) | ✅ | — |

---

## 2. Auditor

| # | Capability                                       | Backend | Frontend | Deps   |
|---|--------------------------------------------------|:-------:|:--------:|--------|
| 1 | Role guard `get_current_active_auditor`          |   ⭐    |    —    | —      |
| 2 | Read all `activity_logs` across tenants           |   ⭐    |   ⭐    | —      |
| 3 | Read all queries (text + threads)                 |   ⭐    |   ⭐    | D2     |
| 4 | Read all `chat_rooms` + `chat_messages` (post-close) | ⭐  |   ⭐    | D3     |
| 5 | Read auth event log                              |   ⭐    |   ⭐    | new `auth_events` table |
| 6 | Export CSV / JSON of audit data                  |   ⭐    |   ⭐    | —      |
| 7 | View RAG retrieval traces                        |   ⭐    |   ⭐    | D4, D5 |
| 8 | Hard-block all non-GET methods                   |   ⭐    |    —    | —      |

---

## 3. Billing

| # | Capability                                       | Backend | Frontend | Deps   |
|---|--------------------------------------------------|:-------:|:--------:|--------|
| 1 | Role guard `get_current_active_billing`          |   ⭐    |    —    | —      |
| 2 | Read per-company token usage (weekly / monthly)  |   🟡    |   ⭐    | token accounting in RAG path |
| 3 | Create / list / void invoices                    |   ⭐    |   ⭐    | new `invoices` table |
| 4 | Configure plan tier + monthly allowance          |   ⭐    |   ⭐    | `companies.config.billing` |
| 5 | Toggle `billing_suspended` flag                  |   ⭐    |   ⭐    | new column on `companies` |
| 6 | Triple-lock suspension (Admin + Manager + Billing) |  ⭐   |   ⭐    | —      |
| 7 | Per-tenant usage breakdown report                |   ⭐    |   ⭐    | —      |

---

## 4. Owner

| # | Capability                                       | Backend | Frontend | Deps   |
|---|--------------------------------------------------|:-------:|:--------:|--------|
| 1 | Read / update own company profile                |   ✅    |    ✅    | —      |
| 2 | CRUD on products (audit-logged)                  |   ✅    |    ✅    | —      |
| 3 | Upload product docs (OCR pipeline)               |   ✅    |    ✅    | —      |
| 4 | Delete product docs (rebuild manual)             |   ✅    |    ✅    | —      |
| 5 | Persistent embeddings on upload/delete           |   ⭐    |    —    | D5     |
| 6 | List team members (read-only)                    |   ✅    |    ✅    | —      |
| 7 | Receive escalation emails                        |   ✅    |    —    | —      |
| 8 | Resolve escalated negotiations                   |   ✅    |    ✅    | —      |
| 9 | Read activity log                                |   ✅    |    ✅    | —      |
|10 | **Enter scheduled chat room** with secret key    |   ⭐    |   ⭐    | D3     |
|11 | Attach a Curator to the company                   |   ⭐    |   ⭐    | D1     |
|12 | Configure tone / policy rubric for ReplyJudge    |   ⭐    |   ⭐    | D4     |

---

## 5. Curator

| # | Capability                                       | Backend | Frontend | Deps   |
|---|--------------------------------------------------|:-------:|:--------:|--------|
| 1 | Role guard `get_current_active_curator`          |   ⭐    |    —    | —      |
| 2 | Upload / replace / delete docs for assigned co's |   ⭐    |   ⭐    | D1, D5 |
| 3 | Edit `manual_content` directly                   |   ⭐    |   ⭐    | D1     |
| 4 | Trigger per-tenant re-index                      |   ⭐    |   ⭐    | D5     |
| 5 | View retrieval traces                            |   ⭐    |   ⭐    | D4     |
| 6 | Corpus-gap inbox (from RetrievalJudge findings)  |   ⭐    |   ⭐    | D4     |
| 7 | Read-only access to query text (truncated, no PII) | ⭐  |   ⭐    | D2     |

---

## 6. Manager

| # | Capability                                       | Backend | Frontend | Deps   |
|---|--------------------------------------------------|:-------:|:--------:|--------|
| 1 | Dashboard stats (totals + sentiment)             |   ✅    |    ✅    | —      |
| 2 | Stats aggregated **across multiple companies**   |   ⭐    |   ⭐    | D1     |
| 3 | List team members                                |   🟡 (broken counts) |  ✅ | — |
| 4 | Invite / provision Agents                        |   ⭐    |   ⭐    | —      |
| 5 | Activate / deactivate Agents                     |   ⭐    |   ⭐    | —      |
| 6 | Assign Agents to companies (within own set)      |   ⭐    |   ⭐    | D1     |
| 7 | List + filter + paginate queries                 |   🟡 (no filters / pagination) | ✅ | — |
| 8 | Reassign single query                            |   🟡 (wrong column `assigned_to`) |  ✅ | — |
| 9 | Bulk reassign (round-robin / weighted / specific)|   ⭐    |   ⭐    | —      |
|10 | Recall a query (back to pool)                    |   ⭐    |   ⭐    | —      |
|11 | Set query priority + override deadline           |   ⭐    |   ⭐    | —      |
|12 | Add internal notes to queries                    |   ⭐    |   ⭐    | new `query_notes` |
|13 | SLA breach view                                  |   ⭐    |   ⭐    | —      |
|14 | Discount approval (mid-tier)                     |   ⭐    |   ⭐    | new `discount_approvals` |
|15 | Create / update products (audit-logged)          |   🟡 (no audit) |  ✅ | — |
|16 | Toggle `manager_suspended` (dual-lock)           |   ✅    |    ✅    | —      |
|17 | QA review trigger + read reports                 |   ⭐    |   ⭐    | new `query_reviews` |
|18 | Goals / KPIs                                     |   ⭐    |   ⭐    | new `goals` table |
|19 | Announcements (in-app + email)                   |   ⭐    |   ⭐    | new `announcements` |
|20 | Training assignments + progress                  |   ⭐    |   ⭐    | new `training_*` |
|21 | Shift / capacity planning                        |   ⭐    |   ⭐    | new `shift_slots` |
|22 | Scheduled reports + CSV exports                  |   ⭐    |   ⭐    | —      |
|23 | Team-scoped audit feed                           |   ⭐    |   ⭐    | D1     |

---

## 7. Reviewer

| # | Capability                                       | Backend | Frontend | Deps   |
|---|--------------------------------------------------|:-------:|:--------:|--------|
| 1 | Role guard `get_current_active_reviewer`         |   ⭐    |    —    | —      |
| 2 | Read resolved queries (with thread)              |   ⭐    |   ⭐    | D1, D2 |
| 3 | Create `QueryReview` (rating + comments)         |   ⭐    |   ⭐    | new `query_reviews` |
| 4 | Read own review aggregates                       |   ⭐    |   ⭐    | —      |
| 5 | Per-agent QA leaderboard                         |   ⭐    |   ⭐    | —      |

---

## 8. Agent (formerly SalesRep)

| # | Capability                                       | Backend | Frontend | Deps   |
|---|--------------------------------------------------|:-------:|:--------:|--------|
| 1 | Personal stats                                   |   ✅    |    ✅    | —      |
| 2 | Read own queries (filterable by status)          |   ✅    |    ✅    | —      |
| 3 | Multi-company context switcher                   |   ⭐    |   ⭐    | D1     |
| 4 | Verify + edit + send AI draft                    |   🟡 (sends generic patch, no draft preview) | ✅ | — |
| 5 | Auto-apply discount within product ceiling       |   ✅    |    ✅    | —      |
| 6 | Request elevated discount (creates approval)     |   ⭐    |   ⭐    | new `discount_approvals` |
| 7 | Continue email thread (Message-ID chaining)      |   ⭐    |   ⭐    | D2, D8 |
| 8 | 2-strike auto-escalation                         |   ⭐    |   ⭐    | D2     |
| 9 | Manual escalation with reason                    |   ✅    |    ✅    | —      |
|10 | Schedule chat room (start_at + duration)         |   ⭐    |   ⭐    | D3     |
|11 | View ReplyJudge badge on drafts                  |   ⭐    |   ⭐    | D4     |
|12 | Read-only chat-room transcript after close       |   ⭐    |   ⭐    | D3     |
|13 | Rename `users.role` from `"SalesRep"` to `"Agent"` | ⭐ migrate  |  —   | —      |

---

## 9. Customer

| # | Capability                                       | Backend | Frontend | Deps   |
|---|--------------------------------------------------|:-------:|:--------:|--------|
| 1 | Self-register + email verification               |   ⭐    |   ⭐    | D7     |
| 2 | Role guard `get_current_active_customer`         |   ⭐    |    —    | D7     |
| 3 | View own queries cross-tenant                    |   ⭐    |   ⭐    | D9     |
| 4 | Read full thread per query                       |   ⭐    |   ⭐    | D2     |
| 5 | Reply in-portal (Channel 10)                     |   ⭐    |   ⭐    | D2, D9 |
| 6 | Enter scheduled chat room (own key)              |   ⭐    |   ⭐    | D3     |
| 7 | Rate resolution (NPS / 1-5)                      |   ⭐    |   ⭐    | new `nps_rating` col |
| 8 | Update profile                                   |   ⭐    |   ⭐    | D9     |

---

## 10. Guest (no account)

| # | Capability                                       | Backend | Frontend | Deps   |
|---|--------------------------------------------------|:-------:|:--------:|--------|
| 1 | Submit query via Google Form webhook             |   ✅    |    n/a   | —      |
| 2 | Receive RAG-drafted reply by email               |   ✅    |    n/a   | —      |
| 3 | Enter scheduled chat with customer key (no login)|   ⭐    |   ⭐    | D3     |

---

## 11. ReplyJudge (system agent)

| # | Capability                                       | Backend | Frontend (config) | Deps |
|---|--------------------------------------------------|:-------:|:-----------------:|------|
| 1 | System token role `"System"`                     |   ⭐    |        —          | —    |
| 2 | Pre-send scoring of AI draft                     |   ⭐    |        —          | D4   |
| 3 | Post-send scoring of final reply                 |   ⭐    |        —          | D4   |
| 4 | Nightly batch re-grade of sample                 |   ⭐    |        —          | D4   |
| 5 | Block draft below `threshold_block`              |   ⭐    |        —          | D4   |
| 6 | Per-company configurable rubric                  |   ⭐    |   ⭐ (Owner UI)   | D4   |
| 7 | Hallucination + PII-leak flags                   |   ⭐    |        —          | D4   |

---

## 12. RetrievalJudge (system agent)

| # | Capability                                       | Backend | Frontend (config) | Deps |
|---|--------------------------------------------------|:-------:|:-----------------:|------|
| 1 | Online cross-encoder reranker                    |   ⭐    |        —          | D5   |
| 2 | Offline LLM-backed rubric scoring                |   ⭐    |        —          | D4, D5 |
| 3 | Corpus-gap ticket on `missing_info`              |   ⭐    |   ⭐ (Curator UI) | D4   |
| 4 | `wrong_product` detection (metadata sanity)      |   ⭐    |        —          | D4, D5 |
| 5 | Trigger re-embedding job on low avg relevance    |   ⭐    |        —          | D5   |

---

## 13. Cross-cutting infrastructure prerequisites

| Dep | Item                                                                 | Status | Owner |
|-----|----------------------------------------------------------------------|:------:|------|
| D1  | `user_company_assignments` table + scope helpers                     |   ⭐   |      |
| D2  | `query_messages` table + email-thread continuity (+ reply counters)  |   ⭐   |      |
| D3  | `chat_rooms` + `chat_messages` + secret-key auth + WS/SSE channel    |   ⭐   |      |
| D4  | `judge_scores` + `retriever_scores` + `judge_rubrics`                |   ⭐   |      |
| D5  | Persistent vector store + embedding service + chunking + reindex jobs|   ⭐   |      |
| D6  | HttpOnly cookie auth + Next.js middleware route gating               |   ⭐   |      |
| D7  | Customer auth (separate register/verify endpoints)                   |   ⭐   |      |
| D8  | Inbound email adapter (Resend / Postmark / SES + parser)             |   ⭐   |      |
| D9  | Next.js `/customer/*` portal scaffold                                |   ⭐   |      |

---

## 14. Suggested implementation sequencing

1. **D1** — unblocks Manager/Agent multi-company *and* Reviewer/Curator.
2. **D6** — secure cookie auth before any new role lands.
3. **D5** — persistent vector store; unblocks ReplyJudge groundedness.
4. **D2 + D8** — email threads + inbound parser; unblocks 2-strike rule.
5. **Agent multi-co UI + rename `SalesRep → Agent`** — small but reduces churn.
6. **Manager extended features** (D1 dependent) — reassign fixes, bulk, SLA, approvals.
7. **D4** — ReplyJudge + RetrievalJudge (pre-send advisory only at first).
8. **D7 + D9 + Customer role + Channel 2 portal**.
9. **D3** — scheduled chat rooms (depends on D7 + D9 for the in-portal entry path).
10. **Reviewer + Curator roles**.
11. **Auditor + Billing roles** + invoices + triple-lock.
12. **Remaining intake channels** (widget, WhatsApp, voice, social, partner API, QR).

---

## 15. References

- Role taxonomy: [./roles_and_access.md](./roles_and_access.md)
- Intake channels: [./query_intake_channels.md](./query_intake_channels.md)
- Current API surface: [./api_contracts.md](./api_contracts.md)
- CRUD operations: [./crud_operations.md](./crud_operations.md)
- DB schema: [./db_schema.md](./db_schema.md)
- Architecture: [./architecture.md](./architecture.md)
- State / migration prep: [./state_preparation.md](./state_preparation.md)
