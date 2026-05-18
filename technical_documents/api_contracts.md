# Smart Sales Systems — API Contracts

**Base URL:** `http://<host>:8000/api/v1`
**Auth scheme:** OAuth2 Password Bearer — pass `Authorization: Bearer <token>` on every protected route.
**Content-Type:** `application/json` (except `/auth/login` which uses `application/x-www-form-urlencoded`, and `/owner/products/{id}/upload` which uses `multipart/form-data`).

OpenAPI spec auto-generated at `GET /api/v1/openapi.json` (Swagger UI at `/docs`).

---

## 0. Conventions

- All timestamps are ISO-8601 UTC (`2026-05-18T14:32:00Z`).
- All IDs (except `lead_stats.id` and `complaint_id`) are UUIDv4 strings. `complaint_id` is an 8-char uppercase slice of a UUID.
- Errors follow FastAPI's default shape: `{ "detail": "<message>" }` (a string, or a list of field errors for 422).
- Status codes:
  - `200` — success with body
  - `204` — success, no body (deletes)
  - `400` — bad request / validation / inactive user
  - `401` — bad/missing token
  - `403` — wrong role
  - `404` — resource missing
  - `500` — unhandled exception (also dumps stack to `error.txt`)

---

## 1. Shared Schemas (Pydantic v2)

### `UserOut`
```json
{
  "id": "string (uuid)",
  "email": "user@example.com",
  "full_name": "string|null",
  "role": "Admin|Manager|Owner|SalesRep",
  "is_active": true,
  "company_id": "string|null",
  "company_name": "string|null",
  "assigned_companies": [{"id": "string", "name": "string"}],
  "theme": "system|dark|white",
  "created_at": "2026-05-18T14:32:00Z"
}
```

### `Token`
```json
{ "access_token": "<JWT>", "token_type": "bearer" }
```

### `CompanyOut`
```json
{
  "id": "string (16-char sha256 slice)",
  "name": "string",
  "description": "string|null",
  "config": {},
  "product_count": 0,
  "user_count": 0,
  "sales_rep_count": 0,
  "manager_name": "string",
  "is_active": true,
  "admin_suspended": false,
  "manager_suspended": false,
  "created_at": "2026-05-18T14:32:00Z",
  "total_tokens": 0,
  "weekly_tokens": 0,
  "monthly_tokens": 0
}
```

### `ProductOut`
```json
{
  "id": "string (uuid)",
  "company_id": "string",
  "name": "string",
  "description": "string|null",
  "price": "string|null",
  "base_price": 0,
  "max_discount_pct": 0,
  "manual_content": "string|null",
  "documents": [ { "id": "...", "filename": "...", "content": "...", "file_type": "pdf", "created_at": "..." } ]
}
```

### `QueryOut`
```json
{
  "id": "string (uuid)",
  "complaint_id": "ABC123XY",
  "company_id": "string",
  "sales_rep_id": "string|null",
  "complainant_email": "customer@example.com",
  "query_text": "string",
  "ai_generated_answer": "string|null",
  "final_answer": "string|null",
  "status": "Pending|Resolved|Escalated",
  "created_at": "...",
  "is_escalated": false,
  "escalated_at": "string|null",
  "deadline_at": "string|null",
  "priority": "normal|high",
  "escalation_reason": "string|null",
  "tokens": 0
}
```

---

## 2. `auth` — `/api/v1/auth`

| Method | Path                           | Role             | Description |
| ------ | ------------------------------ | ---------------- | ----------- |
| POST   | `/register`                    | Public           | Self-register. Admin role only granted if `admin_secret_key` matches `ADMIN_SECRET_KEY`. |
| POST   | `/login`                       | Public           | OAuth2 password grant. |
| GET    | `/me`                          | Any active       | Current user profile. |
| PUT    | `/me`                          | Any active       | Update own profile (currently only `theme`). |
| POST   | `/password-recovery/{email}`   | Public           | Send password-reset link. |
| POST   | `/reset-password/`             | Public           | Consume reset token + set new password. |

### `POST /auth/register`
**Request**
```json
{
  "email": "kiran@glimmora.ai",
  "password": "S3cret!",
  "full_name": "Kiran",
  "admin_secret_key": "optional-secret"
}
```
**Response 200:** `UserOut` (Admins are `is_active: true`, others `false`).

### `POST /auth/login`  *(form-encoded)*
```
username=kiran@glimmora.ai&password=S3cret!
```
**Response 200:** `Token`. **403** if `is_active=false`.

### `GET /auth/me`
**Response 200:** `UserOut`.

### `PUT /auth/me`
**Request**
```json
{ "theme": "dark" }
```

### `POST /auth/password-recovery/{email}`
**Response 200:** `{ "msg": "Password recovery email sent" }`

### `POST /auth/reset-password/`
**Request**
```json
{ "token": "<jwt-reset-token>", "new_password": "NewPass!" }
```

---

## 3. `admin` — `/api/v1/admin`  *(role = Admin)*

| Method | Path                  | Description |
| ------ | --------------------- | ----------- |
| GET    | `/stats`              | Global counts. |
| GET    | `/users`              | List all users (with company). |
| POST   | `/users`              | Provision a user (any role, auto-active, credentials emailed). |
| PUT    | `/users/{user_id}`    | Update role / activation / company. |
| DELETE | `/users/{user_id}`    | Hard delete user. |
| POST   | `/companies`          | Create company (ID = sha256(name)[:16]). |
| GET    | `/companies`          | List companies with usage stats. |
| DELETE | `/companies/{cid}`    | Delete company + cascade products and queries. |
| GET    | `/audit-logs`         | Stubbed audit list. |
| GET    | `/neural-diagnostics` | Stubbed RAG/LLM metrics. |

### `GET /admin/stats` → `AdminStats`
```json
{
  "total_users": 12, "total_companies": 3, "total_products": 9,
  "total_queries": 142, "pending_queries": 8, "resolved_queries": 130
}
```

### `POST /admin/users`
```json
{
  "email": "owner@acme.com",
  "password": "TempPass!1",
  "full_name": "Acme Owner",
  "role": "Owner",
  "company_id": "a1b2c3d4e5f60718"
}
```
**Response 200:** `UserOut`. Side-effect: sends welcome email with credentials.

### `PUT /admin/users/{user_id}`
```json
{
  "role": "Manager",
  "is_active": true,
  "company_id": "a1b2c3d4e5f60718",
  "company_ids": ["a1b2c3d4e5f60718"]
}
```

### `POST /admin/companies`
```json
{
  "name": "Acme Corp",
  "description": "Global widgets",
  "config": { "timezone": "Asia/Kolkata" }
}
```

### `GET /admin/companies` → `List[CompanyOut]`

### `DELETE /admin/companies/{cid}` → `204`

---

## 4. `owner` — `/api/v1/owner`  *(role = Owner)*

All endpoints implicitly scoped to `current_owner.company_id`.

| Method | Path                                          | Description |
| ------ | --------------------------------------------- | ----------- |
| GET    | `/stats`                                      | Owner dashboard. |
| GET    | `/company`                                    | Owner's company record. |
| PUT    | `/company`                                    | Update company name/description/config. |
| GET    | `/products`                                   | List products with documents. |
| POST   | `/products`                                   | Create product. |
| PUT    | `/products/{product_id}`                      | Update product. |
| DELETE | `/products/{product_id}`                      | Delete product (cascade docs). |
| POST   | `/products/{product_id}/upload`               | Upload + OCR a PDF / image / txt doc. **multipart**. |
| DELETE | `/documents/{doc_id}`                         | Delete a single doc + rebuild manual. |
| GET    | `/team`                                       | List company users. |
| GET    | `/queries`                                    | List company queries. |
| GET    | `/negotiations`                               | List pending escalated queries (sorted by deadline). |
| POST   | `/negotiations/{query_id}/resolve`            | Approve owner-authored final answer + email customer. |
| GET    | `/history`                                    | Owner activity log. |

### `GET /owner/stats` → `OwnerStats`
```json
{
  "company_name": "Acme",
  "total_products": 5,
  "pending_queries": 3,
  "resolved_queries": 41,
  "total_team_members": 8,
  "escalated_queries": 1,
  "products_missing_docs": 2,
  "high_priority_pending": 1
}
```

### `POST /owner/products`
```json
{
  "name": "Widget Pro",
  "description": "Premium model",
  "price": "$299",
  "base_price": 29900,
  "max_discount_pct": 15,
  "manual_content": null
}
```

### `POST /owner/products/{product_id}/upload`  *(multipart)*
```
file: <binary>
```
Accepts `application/pdf`, `image/*`, or text/*. Pipeline:
1. PDF → PyMuPDF text per page; pages <50 chars → rendered to PNG and OCR'd via Ollama VLM.
2. Image → Ollama OCR.
3. Other → UTF-8 decode.

Then a `ProductDocument` row is inserted and `product.manual_content` is rebuilt by concatenating all docs.

**Response 200:** `{ "status": "success", "message": "Document indexed and added to Widget Pro repository" }`

### `POST /owner/negotiations/{query_id}/resolve`
```json
{
  "final_answer": "Approved 12% discount, final $263.12",
  "final_price": "$263.12",
  "status": "Resolved"
}
```

---

## 5. `manager` — `/api/v1/manager`  *(role = Manager)*

Scoped to `current_manager.company_id`.

| Method | Path                              | Description |
| ------ | --------------------------------- | ----------- |
| GET    | `/stats`                          | Manager dashboard. |
| GET    | `/team`                           | Sales reps in this company. |
| GET    | `/queries`                        | All queries for the company. |
| PATCH  | `/queries/{query_id}`             | Reassign query (`assigned_to=<user_id>`). ⚠ Known bug: model field is `sales_rep_id`. |
| POST   | `/products`                       | Create a product. |
| PATCH  | `/products/{product_id}`          | Update a product. |
| PUT    | `/company/suspend`                | Toggle company's `manager_suspended` flag. |
| GET    | `/company/status`                 | Get current suspension state. |

### `GET /manager/stats` → `ManagerStats`
```json
{
  "company_name": "Acme",
  "total_queries": 122,
  "pending_queries": 8,
  "resolved_queries": 114,
  "positive_sentiment_pct": 78.5,
  "team_count": 6
}
```

### `PUT /manager/company/suspend`
No body. Toggles flag.
**Response 200**
```json
{
  "status": "success",
  "message": "Manager authorization state: SUSPENDED",
  "manager_suspended": true,
  "is_active": false
}
```

---

## 6. `sales` — `/api/v1/sales`  *(role = SalesRep)*

Scoped to `current_user.id` (and same company for product lookups).

| Method | Path                                   | Description |
| ------ | -------------------------------------- | ----------- |
| GET    | `/stats`                               | Rep dashboard. |
| GET    | `/queries?status=Pending\|Resolved\|Escalated` | Filterable list of own queries. |
| PATCH  | `/queries/{query_id}`                  | Generic update (status / final_answer). |
| POST   | `/queries/{query_id}/resolve`          | Send resolution. |
| POST   | `/queries/{query_id}/escalate`         | Escalate to owner. |
| POST   | `/queries/{query_id}/apply-discount`   | Apply a (capped) discount to a query. |
| GET    | `/products`                            | Read-only product list for this company. |

### `GET /sales/stats` → `SalesRepStats`
```json
{
  "active_queries": 4,
  "resolved_queries": 22,
  "escalated_queries": 1,
  "efficiency_score": 84.6,
  "avg_response_time": 17.4
}
```

### `POST /sales/queries/{query_id}/resolve`
```json
{ "resolution": "Issued a replacement under warranty." }
```

### `POST /sales/queries/{query_id}/escalate`
```json
{ "reason": "Customer requesting refund > policy ceiling", "priority": "high" }
```
Effect: `status="Escalated"`, `is_escalated=true`, `deadline_at = now + 12h (high) / 48h (normal)`, owner gets email.

### `POST /sales/queries/{query_id}/apply-discount`
```json
{ "product_id": "5e8a...", "discount_pct": 20 }
```
Final discount is `min(requested, product.max_discount_pct)`; price computed from `price` or `base_price/100`.

---

## 7. `webhook` — `/api/v1/webhook`  *(Public)*

| Method | Path             | Description |
| ------ | ---------------- | ----------- |
| POST   | `/google-forms`  | Intake endpoint for Google Apps Script. |

### `POST /webhook/google-forms`
```json
{
  "company_id": "a1b2c3d4e5f60718",
  "complainant_email": "buyer@example.com",
  "query_text": "Does the Widget Pro come with a 3-year warranty?",
  "complaint_id": "OPTIONAL"
}
```
**Response 200:** `QueryOut` (the freshly-created row, with `ai_generated_answer` populated).
Side effects: RAG generation, persistence, customer email.

---

## 8. Error Examples

```http
HTTP/1.1 401 Unauthorized
{ "detail": "Could not validate credentials" }

HTTP/1.1 403 Forbidden
{ "detail": "Administrative clearance required" }

HTTP/1.1 404 Not Found
{ "detail": "User not found" }

HTTP/1.1 422 Unprocessable Entity
{
  "detail": [
    { "loc": ["body","email"], "msg": "value is not a valid email address", "type": "value_error.email" }
  ]
}
```

---

## 9. Rate Limits & SLAs

No rate limiting today. Functional SLA: escalated queries must be resolved within `deadline_at` (12 h `high` / 48 h `normal`) — surfaced as `high_priority_pending` in owner stats.

---

## 10. CORS

Backend currently allows all origins. Lock down to specific `FRONTEND_URL`(s) before production.

---

## 11. Planned endpoints (target state)

Sections 1–10 above describe **what's implemented today**. This section describes the **planned** surface that lands during the prep phases in [`state_preparation.md`](./state_preparation.md). Authoritative role taxonomy in [`roles_and_access.md`](./roles_and_access.md); intake channels in [`query_intake_channels.md`](./query_intake_channels.md).

Status legend in this section: ⭐ planned · 🟡 partial.

### 11.1 Auth (additions)

| Method | Path                                  | Role   | Status | Description |
| ------ | ------------------------------------- | ------ | :----: | ----------- |
| POST   | `/auth/register/customer`             | Public |  ⭐    | Customer self-register; triggers email-verification token. |
| POST   | `/auth/verify-email/{token}`          | Public |  ⭐    | Confirm a Customer email. |
| POST   | `/auth/refresh`                       | Public |  ⭐    | Optional refresh-token rotation (sets cookie). |
| POST   | `/auth/logout`                        | Any    |  ⭐    | Clears the HttpOnly cookie. |

### 11.2 Admin (additions)

| Method | Path                                            | Status | Description |
| ------ | ----------------------------------------------- | :----: | ----------- |
| GET    | `/admin/system/logs?since=&level=`              |  ⭐    | Real structured logs. |
| GET    | `/admin/system/diagnostics`                     |  ⭐    | Real RAG / LLM / vector-store metrics (replaces stub). |
| POST   | `/admin/companies/{cid}/reindex`                |  ⭐    | Rebuild the tenant's vector collection. |
| POST   | `/admin/users/{uid}/assign`                     |  ⭐    | Create a `user_company_assignment` for Manager/Agent/Reviewer/Curator. |
| DELETE | `/admin/assignments/{assignment_id}`            |  ⭐    | Remove an assignment. |
| GET    | `/admin/audit?from=&to=&actor=&entity=`         |  ⭐    | Cross-tenant audit feed (also exposed to Auditor). |

### 11.3 Auditor (`/auditor/*`)

| Method | Path                                       | Status | Description |
| ------ | ------------------------------------------ | :----: | ----------- |
| GET    | `/auditor/queries?from=&to=&company=`      |  ⭐    | Read-only cross-tenant queries. |
| GET    | `/auditor/queries/{id}/messages`           |  ⭐    | Thread + judge scores + retrieval traces. |
| GET    | `/auditor/chat-rooms?from=&to=&state=closed`|  ⭐   | Read-only closed rooms. |
| GET    | `/auditor/chat-rooms/{id}/messages`        |  ⭐    | Transcript. |
| GET    | `/auditor/auth-events?from=&user=`         |  ⭐    | Logins / logouts / role changes. |
| GET    | `/auditor/activity?from=&to=&company=`     |  ⭐    | Cross-tenant activity log. |
| GET    | `/auditor/exports/queries.csv`             |  ⭐    | Bulk export. |

All non-GET methods rejected by the role guard.

### 11.4 Billing (`/billing/*`)

| Method | Path                                  | Status | Description |
| ------ | ------------------------------------- | :----: | ----------- |
| GET    | `/billing/usage?company=&from=&to=`   |  ⭐    | Token + storage + chat-minute usage per tenant. |
| GET    | `/billing/invoices?company=&status=`  |  ⭐    | List. |
| POST   | `/billing/invoices`                   |  ⭐    | Create draft invoice for a period. |
| POST   | `/billing/invoices/{id}/send`         |  ⭐    | Mark sent + email PDF. |
| POST   | `/billing/invoices/{id}/void`         |  ⭐    | Void. |
| PUT    | `/billing/companies/{cid}/plan`       |  ⭐    | Set `plan_tier`, allowance, overage rate. |
| PUT    | `/billing/companies/{cid}/suspend`    |  ⭐    | Toggle `billing_suspended` (third lock). |

### 11.5 Owner (additions)

| Method | Path                                            | Status | Description |
| ------ | ----------------------------------------------- | :----: | ----------- |
| GET    | `/owner/curators`                               |  ⭐    | Available Curators to attach. |
| POST   | `/owner/curators/{user_id}/attach`              |  ⭐    | Attach a Curator to this company. |
| DELETE | `/owner/curators/{user_id}`                     |  ⭐    | Detach. |
| GET    | `/owner/judge-rubric`                           |  ⭐    | Read active rubric. |
| PUT    | `/owner/judge-rubric`                           |  ⭐    | Update weights / thresholds / policy rules. |
| POST   | `/owner/chat-rooms/{id}/enter`                  |  ⭐    | Owner enters chat room with their secret key. |
| GET    | `/owner/chat-rooms?state=`                      |  ⭐    | List own chat rooms. |

### 11.6 Curator (`/curator/*`)

| Method | Path                                            | Status | Description |
| ------ | ----------------------------------------------- | :----: | ----------- |
| GET    | `/curator/companies`                             |  ⭐   | Assigned companies. |
| GET    | `/curator/companies/{cid}/products`              |  ⭐   | Products + documents. |
| POST   | `/curator/products/{pid}/upload`                 |  ⭐   | Same pipeline as Owner upload. |
| DELETE | `/curator/documents/{doc_id}`                    |  ⭐   | Purge + reindex. |
| POST   | `/curator/companies/{cid}/reindex`               |  ⭐   | Tenant-wide reindex. |
| GET    | `/curator/retrieval-traces?company=&from=`       |  ⭐   | Recent retrievals + scores. |
| GET    | `/curator/gap-inbox?company=`                    |  ⭐   | Topics flagged `missing_info=true` by RetrievalJudge. |

### 11.7 Manager (additions / fixes — most are 🟡 today)

| Method | Path                                                  | Status | Description |
| ------ | ----------------------------------------------------- | :----: | ----------- |
| GET    | `/manager/companies`                                  |  ⭐    | Companies the Manager is assigned to (multi-co). |
| GET    | `/manager/queries?status=&priority=&assignee=&from=&to=&page=` |  ⭐ | Filterable + paginated. |
| POST   | `/manager/queries/bulk-reassign`                      |  ⭐    | Round-robin / weighted / specific. |
| POST   | `/manager/queries/{id}/recall`                        |  ⭐    | Back to pool. |
| POST   | `/manager/queries/{id}/notes`                         |  ⭐    | Internal note. |
| GET    | `/manager/queries/{id}/notes`                         |  ⭐    | List notes. |
| POST   | `/manager/queries/{id}/review`                        |  ⭐    | QA review. |
| GET    | `/manager/queries/sla-breaches`                       |  ⭐    | Past `deadline_at`. |
| POST   | `/manager/team/invite`                                |  ⭐    | Email-invite a new Agent. |
| POST   | `/manager/team/{rep_id}/(de)activate`                 |  ⭐    | Suspend / resume. |
| POST   | `/manager/team/{rep_id}/assign-company`               |  ⭐    | Add Agent to one of Manager's companies. |
| GET    | `/manager/team/leaderboard?metric=`                   |  ⭐    | Ranking. |
| GET    | `/manager/discount-approvals?status=pending`          |  ⭐    | Queue. |
| POST   | `/manager/discount-approvals/{id}/approve` (and `/deny`) |  ⭐ | Decision. |
| CRUD   | `/manager/goals`, `/manager/announcements`, `/manager/training`, `/manager/shifts`, `/manager/leads`, `/manager/lead-stats` |  ⭐ | Extended Manager features. |
| GET    | `/manager/reports/(weekly|sla).csv`                   |  ⭐    | CSV exports. |
| GET    | `/manager/audit?from=&to=&actor=&entity=`             |  ⭐    | Team-scoped activity log. |

### 11.8 Reviewer (`/reviewer/*`)

| Method | Path                                          | Status | Description |
| ------ | --------------------------------------------- | :----: | ----------- |
| GET    | `/reviewer/queue?company=`                    |  ⭐    | Sampled resolved queries. |
| POST   | `/reviewer/reviews`                           |  ⭐    | Create review `{ query_id, rating, comments }`. |
| GET    | `/reviewer/reviews?from=&to=&agent=`          |  ⭐    | Own reviews. |

### 11.9 Agent (additions / replacements)

| Method | Path                                          | Status | Description |
| ------ | --------------------------------------------- | :----: | ----------- |
| GET    | `/agent/companies`                            |  ⭐    | Companies the Agent is assigned to (multi-co context). |
| GET    | `/agent/queries?company=&status=&page=`       |  ⭐    | Multi-co list (replaces `/sales/queries`). |
| POST   | `/agent/queries/{id}/draft`                   |  ⭐    | Request fresh RAG draft (judged). |
| POST   | `/agent/queries/{id}/send`                    |  ⭐    | Send the edited final reply (channel-aware outbound). |
| POST   | `/agent/queries/{id}/discount-request`        |  ⭐    | Create a `DiscountApproval` above the per-product cap. |
| POST   | `/agent/queries/{id}/schedule-chat`           |  ⭐    | Body `{ start_at, duration_min }`; mints both secret keys + emails. |
| GET    | `/agent/queries/{id}/chat-room`               |  ⭐    | Read-only transcript view (post-close). |

> Existing `/sales/*` endpoints continue to work for one release; new clients should use `/agent/*`.

### 11.10 Customer (`/customer/*`)

| Method | Path                                            | Status | Description |
| ------ | ----------------------------------------------- | :----: | ----------- |
| GET    | `/customer/me`                                  |  ⭐    | Profile. |
| PUT    | `/customer/me`                                  |  ⭐    | Update profile + prefs. |
| GET    | `/customer/companies`                           |  ⭐    | Directory of tenants opted-in to portal. |
| POST   | `/customer/queries`                             |  ⭐    | Create a query (Channel 2 portal intake). |
| GET    | `/customer/queries?company=&status=`            |  ⭐    | Own queries cross-tenant. |
| GET    | `/customer/queries/{id}`                        |  ⭐    | Full thread. |
| POST   | `/customer/queries/{id}/reply`                  |  ⭐    | In-portal reply (Channel 10). |
| POST   | `/customer/queries/{id}/rate`                   |  ⭐    | NPS / 1-5. |
| POST   | `/customer/chat-rooms/{id}/enter`               |  ⭐    | Enter chat with customer secret key. |

### 11.11 Webhook / intake adapters (additions)

| Method | Path                                          | Status | Description |
| ------ | --------------------------------------------- | :----: | ----------- |
| POST   | `/webhook/inbound-email`                      |  ⭐    | Channel 3 — provider posts parsed inbound email. |
| POST   | `/webhook/whatsapp`                           |  ⭐    | Channel 5. |
| POST   | `/webhook/sms`                                |  ⭐    | Channel 5. |
| POST   | `/webhook/voice`                              |  ⭐    | Channel 6 — transcript + recording URL. |
| POST   | `/webhook/social/{platform}`                  |  ⭐    | Channel 7. |
| POST   | `/widget/queries` (WS / HTTP)                 |  ⭐    | Channel 4 — anonymous, rate-limited. |
| POST   | `/partner/queries` (`Authorization: ApiKey`)  |  ⭐    | Channel 8. |

### 11.12 Real-time channels

| Type      | Path                          | Role / auth                                 | Status | Description |
| --------- | ----------------------------- | ------------------------------------------- | :----: | ----------- |
| WebSocket | `/ws/chat/{room_id}`          | room-scoped JWT (issued at room entry)      |  ⭐    | Owner ↔ Customer chat messages live. |
| SSE       | `/sse/agent/queue`            | Agent JWT (cookie)                          |  ⭐    | Live updates to Agent queue (new queries, reassigns). |
| WebSocket | `/widget/session/{session_id}`| anon, signed session token                  |  ⭐    | Channel 4 streaming AI draft + Agent messages. |

### 11.13 System / Judge endpoints (internal)

Authenticated with the **system token** (role `"System"`). Never exposed to a browser.

| Method | Path                                                | Status | Description |
| ------ | --------------------------------------------------- | :----: | ----------- |
| POST   | `/internal/judges/reply`                            |  ⭐    | Score an `ai_draft` or `final_reply`. Body: `{ query_id, target }`. |
| POST   | `/internal/judges/retrieval`                        |  ⭐    | Score a retrieval. Body: `{ query_id, retrieved_chunks }`. |
| POST   | `/internal/embeddings/reindex/{company_id}`         |  ⭐    | Triggered by Admin/Curator endpoints. |
| GET    | `/internal/health`                                  |  ⭐    | Liveness + RAG / store / queue status. |

---

## 12. Naming migration

The frontend will progressively move from `/sales/*` to `/agent/*` as the role rename `SalesRep → Agent` lands. Both paths coexist for one release; `/sales/*` returns `Deprecation` headers pointing to `/agent/*`.

---

## 13. Error shape (target — unified)

```json
{
  "error": {
    "code": "QUERY_NOT_FOUND",
    "message": "Human-readable.",
    "request_id": "uuid-from-middleware",
    "details": { /* optional structured payload */ }
  }
}
```

Stable `code` values keep clients resilient to copy changes. Today's `{"detail": "..."}` shape stays during the transition but should be wrapped before any new client integrates.

