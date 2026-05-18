# Smart Sales Systems — CRUD Operations (Exhaustive)

This document enumerates **every Create / Read / Update / Delete operation** exposed (or implicit) in the backend, with: caller role, HTTP signature, request body, response body, ORM/SQL behaviour, side effects, validation rules, and failure modes.

Legend: 🔓 public, 👤 any authenticated active user, 🛡 Admin, 🏢 Owner, 📊 Manager, 💬 SalesRep.

For each entity the sections are ordered **C → R → U → D**. Every operation has a stable ID (e.g. `USER-C1`) so it can be cross-referenced from tests, tickets, or other docs.

---

# 1. User  (`users` table)

ORM model: `User` ([backend/app/models/models.py:14](../backend/app/models/models.py#L14))
Primary key: `id` (UUID v4). Natural key: `email` (UNIQUE).

## 1.C — Create

### USER-C1 — Self register
- 🔓 `POST /api/v1/auth/register`
- Handler: `auth.register` ([auth.py:74](../backend/app/api/endpoints/auth.py#L74))
- **Request**
  ```json
  {
    "email": "user@example.com",
    "password": "P@ssword1",
    "full_name": "Jane Doe",
    "admin_secret_key": "optional"
  }
  ```
- **Logic**
  - `SELECT * FROM users WHERE email = ?` → 400 if exists.
  - If `admin_secret_key == settings.ADMIN_SECRET_KEY` → `role=Admin`, `is_active=True`. Otherwise `role=SalesRep`, `is_active=False`.
  - `INSERT INTO users (id, email, hashed_password, full_name, role, is_active) VALUES (...)`.
- **Side effects:** Admin onboarding → "🚀 Administrative Clearance Granted" email via Resend.
- **Response 200:** `UserOut`.
- **Errors:** 400 (duplicate email), 422 (invalid email).

### USER-C2 — Admin provisions any user
- 🛡 `POST /api/v1/admin/users`
- Handler: `admin.admin_create_user` ([admin.py:109](../backend/app/api/endpoints/admin.py#L109))
- **Request** — `UserCreate`:
  ```json
  {
    "email": "owner@acme.com",
    "password": "TempPass!1",
    "full_name": "Acme Owner",
    "role": "Owner",
    "company_id": "a1b2c3d4e5f60718"
  }
  ```
- **Logic**: always `is_active=True`; role defaults to `SalesRep` if omitted. `BackgroundTasks` queues a welcome email with the plaintext password.
- **Response 200:** `UserOut`.
- **Errors:** 400 if email already exists; 403 if caller not Admin.

## 1.R — Read

### USER-R1 — Self profile
- 👤 `GET /api/v1/auth/me` — returns the authenticated `UserOut`.

### USER-R2 — List all users
- 🛡 `GET /api/v1/admin/users` ([admin.py:53](../backend/app/api/endpoints/admin.py#L53))
- `SELECT * FROM users LEFT JOIN companies ORDER BY users.created_at DESC` (via `joinedload(User.company)`).
- Populates `assigned_companies` and `company_name` ("Unassigned" if null).

### USER-R3 — Owner team list
- 🏢 `GET /api/v1/owner/team` — `SELECT * FROM users WHERE company_id = :owner.company_id`.

### USER-R4 — Manager team list
- 📊 `GET /api/v1/manager/team`
- `SELECT * FROM users WHERE company_id = :cid AND role = 'SalesRep'`
- Per rep: counts `active_queries`, `resolved_queries` (joins `queries` by `assigned_to` — see Known Bug).

## 1.U — Update

### USER-U1 — Update self
- 👤 `PUT /api/v1/auth/me`
- Body: `UserUpdate` (currently only `theme` is honoured).
- **SQL:** `UPDATE users SET theme = :theme WHERE id = :me`.

### USER-U2 — Admin update of any user
- 🛡 `PUT /api/v1/admin/users/{user_id}` ([admin.py:78](../backend/app/api/endpoints/admin.py#L78))
- Body: `UserUpdate` (`role`, `is_active`, `company_id`, `company_ids[]`).
- **Logic:**
  - Mutates only fields explicitly present in payload.
  - `company_ids` (legacy multi-assignment) → first element wins; empty list → unassign.
- **Errors:** 404 if user missing.

## 1.D — Delete

### USER-D1 — Hard delete user
- 🛡 `DELETE /api/v1/admin/users/{user_id}` → 204.
- **SQL:** `DELETE FROM users WHERE id = ?`.
- **Cascade:** none — `queries.sales_rep_id` is **not** nulled. Resolve manually or add a DB-level `ON DELETE SET NULL`.

## 1.P — Password lifecycle  *(grouped because related)*

| ID  | Caller | Method/Path | Behaviour |
|-----|--------|-------------|-----------|
| USER-P1 | 🔓 | `POST /api/v1/auth/password-recovery/{email}` | Generates short-lived JWT reset token; emails reset link. 404 if email unknown. |
| USER-P2 | 🔓 | `POST /api/v1/auth/reset-password/` | Verifies token, requires `is_active=True`, rehashes password. 400 on invalid token, 400 if user inactive, 404 if user missing. |

---

# 2. Company  (`companies` table)

ORM model: `Company` ([models.py:30](../backend/app/models/models.py#L30))
PK: `id` (first 16 hex chars of `sha256(name)`).

## 2.C — Create

### COMP-C1 — Admin creates a company
- 🛡 `POST /api/v1/admin/companies` ([admin.py:171](../backend/app/api/endpoints/admin.py#L171))
- **Request** — `CompanyCreate`:
  ```json
  { "name": "Acme Corp", "description": "Widgets", "config": {"timezone":"UTC"} }
  ```
- **ID derivation:** `hashlib.sha256(name).hexdigest()[:16]`.
- **SQL:** `INSERT INTO companies (id, name, description, config) VALUES (...)`.
- **Errors:** 400/integrity error if name (and thus hash) already exists.

> Note: there is no admin "update company" endpoint; mutation is performed by the Owner.

## 2.R — Read

### COMP-R1 — Admin list with aggregates
- 🛡 `GET /api/v1/admin/companies` ([admin.py:192](../backend/app/api/endpoints/admin.py#L192))
- For each company computes:
  - `product_count = COUNT(products WHERE company_id = ?)`
  - `user_count = COUNT(users WHERE company_id = ?)`
  - `sales_rep_count = COUNT(users WHERE company_id = ? AND role='SalesRep')`
  - `manager_name = string_agg(users.full_name WHERE role='Manager')`
  - `weekly_tokens = SUM(queries.tokens) WHERE created_at >= now-7d`
  - `monthly_tokens = SUM(queries.tokens) WHERE created_at >= now-30d`
  - `is_active = NOT (admin_suspended AND manager_suspended)`

### COMP-R2 — Owner's own company
- 🏢 `GET /api/v1/owner/company` → `CompanyOut`. 404 if missing.

### COMP-R3 — Manager status
- 📊 `GET /api/v1/manager/company/status` → name + suspension flags + derived `is_active`.

## 2.U — Update

### COMP-U1 — Owner edits profile
- 🏢 `PUT /api/v1/owner/company`
- Body — `CompanyUpdate`: any subset of `name`, `description`, `config`.
- `setattr(company, key, value)` for explicit fields only.

### COMP-U2 — Manager toggles `manager_suspended`
- 📊 `PUT /api/v1/manager/company/suspend` (no body)
- Flips the boolean and reports the new effective state. Effective suspension only when BOTH `admin_suspended` AND `manager_suspended` are True (`is_active = NOT (a AND m)`).

### COMP-U3 — Token accounting *(implicit/admin)*
`Company.total_tokens` is intended to accumulate tokens; **no endpoint writes it today**. Should be updated by the RAG path once token usage is captured.

## 2.D — Delete

### COMP-D1 — Admin delete
- 🛡 `DELETE /api/v1/admin/companies/{cid}` → 204.
- Manual cascade:
  ```sql
  DELETE FROM products WHERE company_id = ?;
  DELETE FROM queries  WHERE company_id = ?;
  DELETE FROM companies WHERE id = ?;
  ```
- **Not cleaned up:** `users.company_id` (orphan stays), `lead_stats`, `activity_logs`.

---

# 3. Product  (`products` table)

ORM model: `Product` ([models.py:47](../backend/app/models/models.py#L47))
PK: `id` UUID; scoped by `company_id`.

## 3.C — Create

### PROD-C1 — Owner create
- 🏢 `POST /api/v1/owner/products` ([owner.py:135](../backend/app/api/endpoints/owner.py#L135))
- Body — `ProductCreate` (any `company_id` sent is overwritten with `current_owner.company_id`).
- Inserts product, then `ActivityLog(action="PRODUCT_PROVISIONED", entity_name=product.name, details="Base price: X, Max discount: Y%")`.
- Returns the row with `documents` eager-loaded ( `selectinload`).

### PROD-C2 — Manager create
- 📊 `POST /api/v1/manager/products` — same shape, no activity log; `company_id` forced to manager's.

## 3.R — Read

### PROD-R1 — Owner list
- 🏢 `GET /api/v1/owner/products` — eager-loads `documents`.

### PROD-R2 — SalesRep list
- 💬 `GET /api/v1/sales/products` — same company, no docs.

> No standalone "get one product" endpoint — frontends filter from the list.

## 3.U — Update

### PROD-U1 — Owner update
- 🏢 `PUT /api/v1/owner/products/{id}` ([owner.py:166](../backend/app/api/endpoints/owner.py#L166))
- Body — `ProductUpdate`: `name`, `description`, `price`, `base_price`, `max_discount_pct`, `manual_content`.
- Writes `ActivityLog(action="PRODUCT_MODIFIED", entity_name=product.name)`.
- 404 if product not in caller's company.

### PROD-U2 — Manager update
- 📊 `PATCH /api/v1/manager/products/{id}` — `ProductBase` payload via `dict(exclude_unset=True)`. No audit log.

> `Product.manual_content` is **automatically maintained** by the upload/delete-doc handlers — manual edits via this endpoint will be overwritten on the next upload/delete.

## 3.D — Delete

### PROD-D1 — Owner delete
- 🏢 `DELETE /api/v1/owner/products/{id}` ([owner.py:197](../backend/app/api/endpoints/owner.py#L197))
- `db.delete(product)` → cascades `product_documents` (ORM `cascade="all, delete-orphan"`).
- Writes `ActivityLog(action="PRODUCT_NEUTRALIZED")`.
- 404 if product not in caller's company.

---

# 4. ProductDocument  (`product_documents` table)

ORM model: `ProductDocument` ([models.py:62](../backend/app/models/models.py#L62))

## 4.C — Create (upload pipeline)

### DOC-C1 — Owner upload (PDF / image / txt)
- 🏢 `POST /api/v1/owner/products/{product_id}/upload`  *(multipart)*
- Handler: `owner.upload_product_manual` ([owner.py:260](../backend/app/api/endpoints/owner.py#L260))
- **Pipeline**
  1. `Product` looked up, scoped to owner's company → 404 otherwise.
  2. PDF → PyMuPDF `fitz.open(stream=…)`. For each page:
     - `page.get_text()` extracted.
     - If `len(text) < 50` → render at 2× matrix to PNG, base64-encode, POST to `OLLAMA_BASE_URL/api/generate` with prompt *"This is a scanned page from a product manual…"*.
  3. Image → base64 → Ollama VLM directly.
  4. Anything else → UTF-8 decode of raw bytes.
  5. If `extracted_text.strip() == ""` → 400 *"No readable text extracted"*.
  6. `INSERT INTO product_documents (id, product_id, filename, content, file_type)`.
  7. **Rebuild parent**: `product.manual_content = "\n\n".join(d.content for d in all docs)`.
  8. `ActivityLog(action="KNOWLEDGE_INDEXED", entity_name=product.name, details=f"Attached node: {filename}")`.
- **Response 200:** `{"status":"success","message":"Document indexed and added to {product.name} repository"}`.
- **Errors:** 400 (no text), 404 (product), 500 (extraction failure) — rolls back transaction.

## 4.R — Read

### DOC-R1 — Inline with product
- 🏢 returned in `documents` of each `ProductOut` from `GET /owner/products`. No standalone list endpoint.

## 4.U — Update

Not exposed. To replace, upload again and delete the old one.

## 4.D — Delete

### DOC-D1 — Owner delete document
- 🏢 `DELETE /api/v1/owner/documents/{doc_id}` ([owner.py:354](../backend/app/api/endpoints/owner.py#L354))
- Joins `ProductDocument → Product` to enforce `product.company_id == owner.company_id`.
- Deletes the row, **rebuilds** `product.manual_content`, writes `ActivityLog(action="KNOWLEDGE_REMOVED")`.

---

# 5. Query  (`queries` table)  — the central work-item

ORM model: `Query` ([models.py:79](../backend/app/models/models.py#L79))

## 5.C — Create

### QRY-C1 — Webhook intake
- 🔓 `POST /api/v1/webhook/google-forms` ([webhook.py:13](../backend/app/api/endpoints/webhook.py#L13))
- Body — `QueryCreate`:
  ```json
  {
    "company_id": "a1b2c3d4e5f60718",
    "complainant_email": "buyer@example.com",
    "query_text": "Does Widget Pro have a 3-year warranty?",
    "complaint_id": null
  }
  ```
- **Steps**
  1. `SELECT companies WHERE id = ?` → 404 if missing.
  2. `SELECT products WHERE company_id = ? LIMIT 1` → take its `manual_content` (else "No manual available.").
  3. `rag_service.generate_ai_answer(query_text, manual_content)` — LlamaIndex `VectorStoreIndex` + Groq Llama-3-70B; falls back to template on any failure.
  4. `complaint_id = body.complaint_id or uuid4()[:8].upper()`.
  5. `INSERT INTO queries (...) status='Pending'`.
  6. Resend email to complainant with the AI draft.
- **Response 200:** `QueryOut`.

> There is no staff endpoint to create queries directly — webhook is the only source.

## 5.R — Read

| ID | Caller | Endpoint | Filter |
|----|--------|----------|--------|
| QRY-R1 | 🛡 | aggregated only in `GET /admin/stats` | counts (`total`, `pending`, `resolved`) |
| QRY-R2 | 🏢 | `GET /api/v1/owner/queries` | `company_id = me` |
| QRY-R3 | 🏢 | `GET /api/v1/owner/negotiations` | `is_escalated=true AND status=Pending` ordered by `deadline_at ASC` |
| QRY-R4 | 📊 | `GET /api/v1/manager/queries` | `company_id = me` |
| QRY-R5 | 💬 | `GET /api/v1/sales/queries?status=Pending|Escalated|Resolved` | `sales_rep_id = me` (+ optional status) |

## 5.U — Update

### QRY-U1 — SalesRep generic patch
- 💬 `PATCH /api/v1/sales/queries/{id}` ([sales_rep.py:103](../backend/app/api/endpoints/sales_rep.py#L103))
- Body — `QueryUpdate`: `status`, `final_answer`.
- If `final_answer` set → `resolved_at = now()`.

### QRY-U2 — Resolve (dedicated)
- 💬 `POST /api/v1/sales/queries/{id}/resolve`
- Body: `{ "resolution": "..." }`.
- Forces `status=Resolved`, sets `final_answer`, `resolved_at=now()`.
- **Errors:** 404 (not owned), 400 (already resolved).

### QRY-U3 — Escalate
- 💬 `POST /api/v1/sales/queries/{id}/escalate`
- Body: `{ "reason": "...", "priority": "high|normal" }`.
- Sets `is_escalated=True`, `status=Escalated`, `priority`, `escalation_reason`, `escalated_at=now()`, `deadline_at = now + (12h if high else 48h)`.
- Background task: email Owner ("URGENT: Query Escalation #…").
- **Errors:** 404, 400 (already escalated).

### QRY-U4 — Apply discount
- 💬 `POST /api/v1/sales/queries/{id}/apply-discount`
- Body: `{ "product_id": "...", "discount_pct": 20 }`.
- Caps `discount_pct` at `product.max_discount_pct`; computes price from `price` (parsed as float) or `base_price/100`.
- Writes a formatted `final_answer` ("APPROVED DISCOUNT: x% applied…"). If requested > cap, appends a "NOTE: capped — escalate" line.
- Does **not** change `status` — call resolve separately.
- **Errors:** 404 (query / product not found in scope).

### QRY-U5 — Manager reassign  ⚠ broken
- 📊 `PATCH /api/v1/manager/queries/{query_id}?assigned_to=<user_id>` ([manager.py:101](../backend/app/api/endpoints/manager.py#L101))
- Intended: change which rep owns the query. Real column is `sales_rep_id`; code uses `Query.assigned_to`. **Requires fix** before functional.

### QRY-U6 — Owner negotiation resolve
- 🏢 `POST /api/v1/owner/negotiations/{query_id}/resolve` ([owner.py:402](../backend/app/api/endpoints/owner.py#L402))
- Body — `NegotiationAction`: `{ "final_answer": "...", "final_price": "optional", "status": "Resolved" }`.
- Sets `final_answer`, `status`, `resolved_at=now()`.
- Background task: email customer ("Official Response from {company}").

## 5.D — Delete

No per-query delete. The only delete path is **cascade via** `DELETE /admin/companies/{cid}` (COMP-D1). No soft-delete column exists.

## 5.S — State Machine

```
              POST /webhook/google-forms
                          │
                          ▼
                    ┌───────────┐
                    │  Pending  │
                    └────┬───┬──┘
            U1/U2 resolve│   │U3 escalate
                          ▼   ▼
                   ┌───────┐┌────────────┐
                   │Resolved││ Escalated │──── U6 owner resolve ──┐
                   └───────┘└────┬───────┘                         │
                                  │ (no path back to Pending)      ▼
                                  └──────────────────────► ┌───────────┐
                                                            │ Resolved  │
                                                            └───────────┘
```

---

# 6. ActivityLog  (`activity_logs` table)

Append-only audit trail, written **implicitly** by Owner-side mutations.

## 6.C — Create  *(implicit)*

| Trigger endpoint                            | `action`             | `entity_name`     | `details`                                  |
|---------------------------------------------|----------------------|-------------------|--------------------------------------------|
| `POST /owner/products`                      | `PRODUCT_PROVISIONED`| `product.name`    | `Base price: X, Max discount: Y%`         |
| `PUT  /owner/products/{id}`                 | `PRODUCT_MODIFIED`   | `product.name`    | `Updated metadata parameters`              |
| `DELETE /owner/products/{id}`               | `PRODUCT_NEUTRALIZED`| `product.name`    | `Asset node destroyed`                     |
| `POST /owner/products/{id}/upload`          | `KNOWLEDGE_INDEXED`  | `product.name`    | `Attached node: {filename}`                |
| `DELETE /owner/documents/{doc_id}`          | `KNOWLEDGE_REMOVED`  | `product.name`    | `Detached node: {filename}`                |

## 6.R — Read

### LOG-R1 — Owner history
- 🏢 `GET /api/v1/owner/history` → `List[ActivityLogOut]`, ordered `created_at DESC`.

## 6.U / 6.D
Not exposed. The table is append-only.

---

# 7. LeadStat  (`lead_stats` table)

No HTTP CRUD today. Schemas `LeadStatCreate` / `LeadStatOut` exist; rows are seeded out-of-band.

## 7.C — Create (planned)
- Schema: `LeadStatCreate` — `{ "company_id": "...", "type": "Call|SMS", "sentiment": "+ve|-ve" }`.
- Recommended endpoint: `POST /api/v1/manager/lead-stats` (not yet implemented).

## 7.R — Read (aggregated only)
- 📊 `GET /api/v1/manager/stats` computes `positive_sentiment_pct = positives / total * 100` over the company's lead stats.
- (Note: the handler checks for `"Positive"`/`"Very Positive"`, not the `"+ve"` schema value — known inconsistency.)

## 7.U / 7.D
Not exposed.

---

# 8. Auth Tokens  (JWT)

Tokens are not persisted (stateless JWT), but are part of the lifecycle.

| ID    | Operation                          | Trigger                                    |
|-------|------------------------------------|--------------------------------------------|
| AUTH-C1 | Issue access token               | `POST /auth/login` (form-encoded). HS256, `sub=email`, exp = 7 days. |
| AUTH-C2 | Issue password-reset token       | `POST /auth/password-recovery/{email}`. Short-lived JWT. |
| AUTH-R1 | Validate access token (implicit) | Every protected request via `deps.get_current_user`. |
| AUTH-U1 | Refresh                          | Not implemented — re-login required after expiry. |
| AUTH-D1 | Revoke                           | Not implemented — tokens are valid until expiry. |

---

# 9. Stats / Diagnostics  (read-only computed views)

| ID    | Caller | Endpoint                          | Response                                                                                          |
|-------|--------|-----------------------------------|---------------------------------------------------------------------------------------------------|
| STAT-R1 | 🛡 | `GET /api/v1/admin/stats`         | `AdminStats` — totals & status counts                                                             |
| STAT-R2 | 🛡 | `GET /api/v1/admin/audit-logs`    | **Stubbed** static list of 4 events                                                              |
| STAT-R3 | 🛡 | `GET /api/v1/admin/neural-diagnostics` | **Stubbed** RAG metrics (latency, throughput, cache hit, hourly signals)                       |
| STAT-R4 | 🏢 | `GET /api/v1/owner/stats`         | `OwnerStats` — products / team / queries / escalations / docs-missing / high-priority-pending     |
| STAT-R5 | 📊 | `GET /api/v1/manager/stats`       | `ManagerStats` — queries totals + positive-sentiment %                                            |
| STAT-R6 | 💬 | `GET /api/v1/sales/stats`         | `SalesRepStats` — active / resolved / escalated, efficiency %, real avg response time            |

---

# 10. Authorisation Matrix (per entity × per operation)

| Operation             | 🔓 | 🛡  | 🏢  | 📊  | 💬  |
|-----------------------|----|-----|-----|-----|-----|
| User C / R / U / D   | C1 | C2/R2/U2/D1 | R3 | R4 | —   |
| Company C / R / U / D| —  | C1/R1/D1 | R2/U1 | R3/U2 | — |
| Product C / R / U / D| —  | —   | C1/R1/U1/D1 | C2/U2 | R2 |
| ProductDocument C/R/U/D| — | — | C1/R(inline)/D1 | — | — |
| Query Create         | C1 (webhook) | — | — | — | — |
| Query Read           | —  | aggregates | R2,R3 | R4 | R5 |
| Query Update         | —  | —   | U6 | U5 (broken) | U1-U4 |
| Query Delete         | —  | (cascade via Company D1) | — | — | — |
| ActivityLog          | —  | —   | C(implicit), R1 | — | — |
| LeadStat             | —  | —   | —   | (R aggregated) | — |
| Password reset       | P1,P2 | — | — | — | — |
| Login                | AUTH-C1 | — | — | — | — |

---

# 11. Side-Effect Matrix

| CRUD ID        | DB writes                                                                 | Emails sent                                          | External calls |
|----------------|---------------------------------------------------------------------------|------------------------------------------------------|----------------|
| USER-C1 (admin) | `users` insert                                                            | "Administrative Clearance Granted" → new admin       | Resend         |
| USER-C2        | `users` insert                                                            | "Welcome to Sales RAG System" (with password)        | Resend         |
| USER-P1        | none                                                                      | "Password Recovery for {name}"                       | Resend         |
| QRY-C1         | `queries` insert                                                          | RAG draft → complainant                              | Resend, Groq, LlamaIndex |
| QRY-U3         | `queries` update                                                          | "URGENT: Query Escalation #…" → Owner                | Resend         |
| QRY-U6         | `queries` update                                                          | "Official Response from {company}" → complainant     | Resend         |
| DOC-C1         | `product_documents` insert + `products.manual_content` update + `activity_logs` insert | —                                  | Ollama VLM     |
| DOC-D1         | `product_documents` delete + `products.manual_content` update + `activity_logs` insert | —                                  | —              |
| PROD-C1/U1/D1  | `products` (+ delete cascade docs) + `activity_logs` insert               | —                                                    | —              |
| COMP-D1        | `products`, `queries`, `companies` deletes                                | —                                                    | —              |

---

# 12. Idempotency / Concurrency Notes

- No request-level idempotency keys. Webhook retries with the **same** `complaint_id` will currently 500 on the UNIQUE index — recommend an upsert.
- No row-level locking. Concurrent `apply-discount` + `resolve` on the same query can interleave and produce a half-written `final_answer`.
- RAG index is rebuilt **per request** (no persistent vector store). High-traffic intake will exhaust memory.
- `products.manual_content` is rebuilt server-side on every `DOC-C1`/`DOC-D1` — readers should treat it as eventually consistent.

---

# 13. Quick Verb-by-Entity Reference

| Entity            | Create                                                              | Read                                                                               | Update                                                                       | Delete                                            |
|-------------------|---------------------------------------------------------------------|------------------------------------------------------------------------------------|------------------------------------------------------------------------------|---------------------------------------------------|
| User              | `auth/register`, `admin/users`                                      | `auth/me`, `admin/users`, `owner/team`, `manager/team`                              | `auth/me`, `admin/users/{id}`                                                | `admin/users/{id}`                                |
| Company           | `admin/companies`                                                   | `admin/companies`, `owner/company`, `manager/company/status`                       | `owner/company`, `manager/company/suspend`                                  | `admin/companies/{cid}`                           |
| Product           | `owner/products`, `manager/products`                                | `owner/products`, `sales/products`                                                 | `owner/products/{id}`, `manager/products/{id}`                              | `owner/products/{id}`                             |
| ProductDocument   | `owner/products/{id}/upload`                                        | inline in `owner/products`                                                         | (re-upload + delete)                                                         | `owner/documents/{doc_id}`                        |
| Query             | `webhook/google-forms`                                              | `owner/queries`, `owner/negotiations`, `manager/queries`, `sales/queries`          | `sales/queries/{id}` + `/resolve` `/escalate` `/apply-discount`, `manager/queries/{id}`, `owner/negotiations/{id}/resolve` | (only via company-delete cascade)                |
| ActivityLog       | implicit (Owner mutations)                                          | `owner/history`                                                                    | n/a                                                                          | n/a                                               |
| LeadStat          | (no endpoint)                                                       | aggregated in `manager/stats`                                                      | n/a                                                                          | n/a                                               |
| Auth Token        | `auth/login`, `auth/password-recovery/{email}`                      | (implicit per-request)                                                             | n/a                                                                          | n/a (stateless)                                   |

---

# 14. Planned entities (target state) ⭐

The sections above describe **what's implemented today**. This section enumerates the **planned** entities the system grows to support per [`roles_and_access.md`](./roles_and_access.md), [`query_intake_channels.md`](./query_intake_channels.md), and the prep phases in [`state_preparation.md`](./state_preparation.md).

Each entity below follows the same C/R/U/D structure as the current entities, but is marked ⭐ until the corresponding phase ships.

## 14.1 UserCompanyAssignment ⭐

Join table that lets Manager / Agent / Reviewer / Curator span multiple companies.

| Op  | Caller         | Endpoint                                                | Notes |
|-----|----------------|---------------------------------------------------------|-------|
| C   | 🛡 Admin        | `POST /admin/users/{uid}/assign`                        | Body `{ company_id, role_in_company, manager_id? }`. |
| C   | 📊 Manager      | `POST /manager/team/{rep_id}/assign-company`            | Subset of Manager's own assigned companies. |
| R   | 🛡 / 📊 / 💬 / curator | implicit (every scoped list endpoint JOINs through this) | — |
| U   | 🛡 Admin        | `PUT /admin/assignments/{id}`                           | Pause / resume / change role_in_company. |
| D   | 🛡 / 📊         | `DELETE /admin/assignments/{id}` or `/manager/team/{rep_id}/assignments/{id}` | Soft-revoke; does not delete the user. |

## 14.2 QueryMessage ⭐ (D2)

Per-message log replacing today's single `final_answer`. Anchors email threading and the 2-strike rule.

| Op  | Caller            | Endpoint                                                  | Notes |
|-----|-------------------|-----------------------------------------------------------|-------|
| C   | 🔓 inbound adapter | implicit in `/webhook/inbound-email`, `/webhook/whatsapp`, etc. | `direction="inbound"`; bumps `queries.reply_count`. |
| C   | 💬 Agent           | `POST /agent/queries/{id}/send`                           | `direction="outbound"`; bumps `rep_reply_count`. |
| C   | 🏢 Owner           | `POST /owner/negotiations/{id}/resolve`                   | Outbound from Owner. |
| C   | 🧑 Customer        | `POST /customer/queries/{id}/reply`                       | Inbound via portal (Channel 10). |
| R   | role-scoped       | `GET /<role>/queries/{id}` (returns the thread inline)    | Auditor sees all. |
| U   | —                 |                                                           | Append-only. |
| D   | —                 |                                                           | Append-only. |

## 14.3 QueryNote ⭐

Internal Manager / Reviewer notes; never sent to the customer.

| Op  | Caller         | Endpoint                              |
|-----|----------------|---------------------------------------|
| C   | 📊 / Reviewer   | `POST /manager/queries/{id}/notes`    |
| R   | 📊 / Reviewer / 🏢 | `GET /manager/queries/{id}/notes`  |
| U   | author          | `PATCH /manager/queries/{id}/notes/{nid}` |
| D   | author / 📊     | `DELETE /manager/queries/{id}/notes/{nid}` |

## 14.4 QueryReview ⭐

QA review (rating + comments) of a resolved query.

| Op  | Caller   | Endpoint                                  |
|-----|----------|-------------------------------------------|
| C   | Reviewer | `POST /reviewer/reviews`                  |
| R   | Reviewer / 📊 / 🏢 / Auditor | `GET /reviewer/reviews?…` / inline in query detail |
| U   | author   | `PATCH /reviewer/reviews/{id}`            |
| D   | —        |                                           |

## 14.5 DiscountApproval ⭐

Middle-tier discount cascade (Rep → Manager → Owner).

| Op  | Caller   | Endpoint                                            | Notes |
|-----|----------|-----------------------------------------------------|-------|
| C   | 💬 Agent  | `POST /agent/queries/{id}/discount-request`         | Body `{ product_id, requested_pct, note }`. |
| R   | 📊 Manager | `GET /manager/discount-approvals?status=pending`   | Queue. |
| U   | 📊 Manager | `POST /manager/discount-approvals/{id}/approve` or `/deny` | Above ceiling → status `escalated_to_owner` + Owner negotiation auto-created. |
| D   | —        |                                                     | Append-only. |

## 14.6 ChatRoom ⭐ (D3)

Scheduled Owner ↔ Customer real-time room.

| Op  | Caller          | Endpoint                                          | Notes |
|-----|-----------------|---------------------------------------------------|-------|
| C   | 💬 Agent / 🏢 Owner | `POST /agent/queries/{id}/schedule-chat`       | Mints two secret keys, hashes both, emails participants. |
| R   | role-scoped     | `GET /<role>/chat-rooms?state=`                   | Auditor sees closed; Agent / Manager read transcripts. |
| U   | 🏢 Owner / 💬 Agent | `PATCH /chat-rooms/{id}` (reschedule / cancel) | Until `state=open`. |
| **Enter** | 🏢 Owner   | `POST /owner/chat-rooms/{id}/enter` body `{ secret_key }` | Mints room-scoped JWT. |
| **Enter** | 🧑 Customer / Guest | `POST /customer/chat-rooms/{id}/enter` body `{ secret_key }` | Same. |
| D   | —               |                                                   | Closed rooms archived. |

## 14.7 ChatMessage ⭐

| Op  | Caller        | Endpoint                                  | Notes |
|-----|---------------|-------------------------------------------|-------|
| C   | 🏢 / 🧑        | over `wss://api/.../ws/chat/{room_id}`    | Room-scoped JWT required. |
| R   | role-scoped   | `GET /chat-rooms/{id}/messages`           | Auditor / Manager / Agent read-only. |
| U/D | —             |                                           | Append-only. |

## 14.8 JudgeScore ⭐ (D4)

Written by **system token** (ReplyJudge). Append-only.

| Op  | Caller     | Endpoint                          |
|-----|------------|-----------------------------------|
| C   | System     | `POST /internal/judges/reply`     |
| R   | 🏢 / 📊 / Reviewer / Auditor | inline in query detail; `GET /admin/system/diagnostics` aggregates. |
| U/D | —          | Append-only.                      |

## 14.9 RetrieverScore ⭐ (D4)

Written by **system token** (RetrievalJudge).

| Op  | Caller    | Endpoint                                  |
|-----|-----------|-------------------------------------------|
| C   | System    | `POST /internal/judges/retrieval`         |
| R   | Curator (sanitised) / Auditor / Admin     | inline in retrieval traces |
| U/D | —         | Append-only.                              |

## 14.10 JudgeRubric ⭐

Per-company configuration of the ReplyJudge.

| Op  | Caller   | Endpoint                          |
|-----|----------|-----------------------------------|
| C   | 🏢 Owner  | `PUT /owner/judge-rubric` (versioned write — creates a new active row) |
| R   | 🏢 / 📊 / Auditor | `GET /owner/judge-rubric` |
| U   | 🏢 Owner  | `PUT /owner/judge-rubric` (replaces active) |
| D   | 🛡 Admin  | (only via direct DB op for safety) |

## 14.11 Invoice ⭐

Billing artefact.

| Op  | Caller | Endpoint                              | Notes |
|-----|--------|---------------------------------------|-------|
| C   | Billing | `POST /billing/invoices`             | For a `{company_id, period_start, period_end}`. |
| R   | Billing / 🏢 / Auditor | `GET /billing/invoices?company=&status=` | Owner sees own only. |
| U   | Billing | `POST /billing/invoices/{id}/send` / `/void` | State transitions. |
| D   | —      |                                       | Void instead. |

## 14.12 Lead ⭐ + LeadStat extensions ⭐

| Op  | Caller     | Endpoint                                          |
|-----|------------|---------------------------------------------------|
| C   | 📊 Manager  | `POST /manager/leads`                             |
| R   | 📊 Manager  | `GET /manager/leads?…`                            |
| U   | 📊 / 💬 (owner)| `PATCH /manager/leads/{id}`                     |
| **Convert** | 📊 Manager | `POST /manager/leads/{id}/convert-to-query` | Creates a `Query` skipping the webhook. |
| C   | 📊         | `POST /manager/lead-stats`                       | Append a `LeadStat`. |
| R   | 📊         | `GET /manager/lead-stats?from=&to=&bucket=`      | Aggregated time-series. |
| D   | —          | append-only / soft-delete                         |                                                |

## 14.13 Goal / Announcement / Training / Shift ⭐

Standard CRUD per Manager extended features (see [`api_contracts.md §11.7`](./api_contracts.md)).

## 14.14 EmailAlias / PhoneAlias / Attachment / AuthEvent ⭐

Support tables for the intake adapters and Auditor:

| Entity      | Purpose                                                 | Owners      |
|-------------|---------------------------------------------------------|-------------|
| EmailAlias  | maps inbound `To:` address → `company_id`               | Admin       |
| PhoneAlias  | maps inbound number → `company_id`                      | Admin       |
| Attachment  | unified attachment storage referenced by `query_messages` / `chat_messages` | system  |
| AuthEvent   | login / logout / role-change events (for Auditor)       | system writes, Auditor reads |

---

# 15. Updated authorisation matrix (target)

See the master matrix in [`roles_and_access.md §13`](./roles_and_access.md). Each new role gets a column; each new entity gets a row.

---

# 16. Updated side-effect matrix (planned highlights)

| CRUD ID                | DB writes                                                                                   | Emails / channels                                          | External calls |
|------------------------|---------------------------------------------------------------------------------------------|------------------------------------------------------------|----------------|
| QueryMessage-C (inbound) | `query_messages` insert; `queries.reply_count++`; possible `auto_escalated=True`           | reply to customer once Agent acts                          | provider webhook delivery |
| ChatRoom-C             | `chat_rooms` insert (state=scheduled)                                                       | secret-key emails to Owner + Customer                      | Resend         |
| ChatRoom enter         | updates `*_entered_at`; mints room-scoped JWT                                               | "Other party has entered" notification (optional)          | —              |
| ChatMessage-C          | `chat_messages` insert                                                                      | WS broadcast to other party                                | —              |
| JudgeScore-C           | `judge_scores` insert; may block draft                                                       | —                                                          | LLM call (Groq / alt) |
| RetrieverScore-C       | `retriever_scores` insert; may create Curator gap-ticket                                    | —                                                          | LLM call (offline path) |
| DiscountApproval-C / U | `discount_approvals` insert / update; on `escalated_to_owner` → spawn Owner negotiation     | email to Manager (request) or Agent (decision)             | Resend         |
| Invoice-send           | `invoices.status='sent'`                                                                    | PDF email to Owner billing contact                         | Resend         |
| Customer-self-register | `users` insert (role=Customer, is_active=False)                                              | verification email                                         | Resend         |

---

# 17. Backwards-compatibility plan

- `users.role = "SalesRep"` accepted for one release after rename to `"Agent"` (guard accepts both).
- `/sales/*` and `/agent/*` coexist for one release; `Deprecation` header set on `/sales/*`.
- The legacy `Query.final_answer` field continues to be written by `QueryMessage` outbound inserts (= concatenation of latest outbound message) until consumers move to `query_messages`.
- `manager.assigned_to` query param accepted in addition to `sales_rep_id` for one release to avoid breaking the legacy frontend during cutover.

