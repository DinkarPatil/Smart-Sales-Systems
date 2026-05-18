# Smart Sales Systems — Database Schema

**Database engine:** SQLite (file: `sales_chatbot.db`) accessed asynchronously via `aiosqlite`. ORM = SQLAlchemy 2.x declarative. Source of truth: [`backend/app/models/models.py`](../backend/app/models/models.py).

There is no Alembic. New columns introduced after the initial release are added at startup by [`backend/app/db/ensure_columns.py`](../backend/app/db/ensure_columns.py); historical one-off scripts live in `backend/migrate_*.py`.

---

## 1. Entity-Relationship Diagram

```
                       ┌────────────────────────┐
                       │       companies        │
                       │ id (PK, hashed)        │
                       │ name (uniq)            │
                       │ config (JSON)          │
                       │ total_tokens           │
                       │ is_active              │
                       │ admin_suspended        │
                       │ manager_suspended      │
                       └──┬──────────┬──────────┘
                          │1        1│         1│
                          │          │          │
                          │N         │N         │N
       ┌──────────────────┴─┐   ┌────┴────┐   ┌─┴───────────────┐
       │       users        │   │products │   │     queries     │
       │ id (PK, uuid)      │   │ id (PK) │   │ id (PK)         │
       │ email (uniq)       │   │ company │   │ company_id (FK) │
       │ role (enum-str)    │   │ _id (FK)│   │ sales_rep_id(FK)│
       │ is_active          │   │ name    │   │ status (enum)   │
       │ company_id (FK)    │   │ base_   │   │ is_escalated    │
       │ theme              │   │ price   │   │ priority        │
       └──────────────────┬─┘   │ max_disc│   │ deadline_at     │
                          │1    └────┬────┘   └─────────────────┘
                          │          │1
                          │ assigned │
                          │ to queries
                          │          │N
                          │     ┌────┴──────────────┐
                          │     │ product_documents │
                          │     │ id (PK)           │
                          │     │ product_id (FK)   │
                          │     │ filename, content │
                          │     │ file_type         │
                          │     └───────────────────┘
                          │
                       (queries.sales_rep_id → users.id)

       ┌────────────────────────┐    ┌────────────────────────┐
       │       lead_stats       │    │     activity_logs      │
       │ id (PK, int)           │    │ id (PK, uuid)          │
       │ company_id (FK)        │    │ company_id (FK)        │
       │ type (Call/SMS)        │    │ action, entity_name    │
       │ sentiment (+ve/-ve)    │    │ details, created_at    │
       │ timestamp              │    └────────────────────────┘
       └────────────────────────┘
```

---

## 2. Tables

### 2.1 `users`

| Column            | Type        | Constraints                                                  | Notes |
| ----------------- | ----------- | ------------------------------------------------------------ | ----- |
| `id`              | String      | PK, default `uuid4()`                                        | UUID v4 |
| `email`           | String      | UNIQUE, INDEX, NOT NULL                                      | Login identity |
| `hashed_password` | String      | NOT NULL                                                     | bcrypt via passlib |
| `full_name`       | String      |                                                              | |
| `role`            | String      | default `"SalesRep"` (`UserRole` enum: `Admin` / `Manager` / `Owner` / `SalesRep`) | Stored as plain string |
| `is_active`       | Boolean     | default `False`                                              | Admin sets True for non-admins |
| `company_id`      | String      | FK → `companies.id`, NULLABLE                                | One-to-many (a user belongs to one company) |
| `theme`           | String      | default `"system"`                                           | `system | dark | white` |
| `created_at`      | DateTime(tz)| server_default `now()`                                       | |

**Relationships:** `company` (many-to-one → `Company`), `queries` (one-to-many → `Query` via `sales_rep_id`).

---

### 2.2 `companies`

| Column              | Type        | Constraints                       | Notes |
| ------------------- | ----------- | --------------------------------- | ----- |
| `id`                | String      | PK, INDEX                         | First 16 chars of `sha256(name)` |
| `name`              | String      | UNIQUE, INDEX, NOT NULL           | Display name |
| `description`       | Text        |                                   | |
| `config`            | JSON        | default `{}`                      | Free-form per-tenant config |
| `total_tokens`      | Integer     | default `0`                       | Cumulative LLM token usage |
| `is_active`         | Boolean     | default `True`                    | (Mostly informational; effective gate uses suspensions) |
| `admin_suspended`   | Boolean     | default `False`                   | Set by Admin |
| `manager_suspended` | Boolean     | default `False`                   | Toggled by Manager via `/manager/company/suspend` |
| `created_at`        | DateTime(tz)| server_default `now()`            | |

**Relationships:** `users`, `products`, `queries`.

> Note: code computes "live" status as `not (admin_suspended and manager_suspended)` — only suspended when *both* flags are set.

---

### 2.3 `products`

| Column             | Type    | Constraints                  | Notes |
| ------------------ | ------- | ---------------------------- | ----- |
| `id`               | String  | PK, default `uuid4()`        | |
| `company_id`       | String  | FK → `companies.id`, NOT NULL | |
| `name`             | String  | INDEX, NOT NULL              | |
| `description`      | Text    |                              | |
| `price`            | String  |                              | Display value (e.g. `"$199.99"`) |
| `base_price`       | Integer | default `0`                  | Minor units (pence/cents) for math |
| `max_discount_pct` | Integer | default `0`                  | Owner-defined ceiling enforced on rep discounts |
| `manual_content`   | Text    |                              | **Auto-aggregated** concatenation of all child `product_documents.content`; consumed by the RAG service |

**Relationships:** `company`, `documents` (one-to-many, `cascade="all, delete-orphan"`).

---

### 2.4 `product_documents`

| Column        | Type        | Constraints                  | Notes |
| ------------- | ----------- | ---------------------------- | ----- |
| `id`          | String      | PK, default `uuid4()`        | |
| `product_id`  | String      | FK → `products.id`, NOT NULL | Cascade delete |
| `filename`    | String      |                              | |
| `content`     | Text        |                              | Extracted text (PyMuPDF / Ollama OCR) |
| `file_type`   | String      |                              | `pdf | image | png | jpg | txt` etc. |
| `created_at`  | DateTime(tz)| server_default `now()`       | |

---

### 2.5 `queries`

The central work-item table.

| Column                  | Type        | Constraints                    | Notes |
| ----------------------- | ----------- | ------------------------------ | ----- |
| `id`                    | String      | PK, default `uuid4()`          | |
| `complaint_id`          | String      | UNIQUE, INDEX                  | Human-friendly short code (8-char UUID slice) emitted in customer emails |
| `company_id`            | String      | FK → `companies.id`, NOT NULL  | |
| `sales_rep_id`          | String      | FK → `users.id`, NULLABLE      | Set when claimed |
| `complainant_email`     | String      | NOT NULL                       | End customer's email |
| `query_text`            | Text        | NOT NULL                       | Original query body |
| `ai_generated_answer`   | Text        |                                | First-pass RAG draft |
| `final_answer`          | Text        |                                | Sent reply (rep or owner authored) |
| `status`                | String      | default `"Pending"`            | `QueryStatus`: `Pending | Resolved | Escalated` |
| `assigned_at`           | DateTime(tz)| NULLABLE                       | When a rep claimed the query |
| `resolved_at`           | DateTime(tz)| NULLABLE                       | Stamp on resolve |
| `created_at`            | DateTime(tz)| server_default `now()`         | |
| `is_escalated`          | Boolean     | default `False`                | |
| `escalated_at`          | DateTime(tz)| NULLABLE                       | |
| `deadline_at`           | DateTime(tz)| NULLABLE                       | SLA = `escalated_at + 12 h` (high) / `+ 48 h` (normal) |
| `priority`              | String      | default `"normal"`             | `"normal" | "high"` |
| `escalation_reason`     | Text        | NULLABLE                       | |
| `tokens`                | Integer     | default `0`                    | Tokens consumed for this query |

**Relationships:** `company`, `sales_rep`.

---

### 2.6 `lead_stats`

Append-only sentiment log used by Manager's positive-sentiment % stat.

| Column        | Type        | Constraints                    | Notes |
| ------------- | ----------- | ------------------------------ | ----- |
| `id`          | Integer     | PK                             | Auto-increment |
| `company_id`  | String      | FK → `companies.id`, NOT NULL  | |
| `type`        | String      |                                | `"Call" | "SMS"` |
| `sentiment`   | String      |                                | `"+ve" | "-ve"` (manager.py also checks `"Positive"`/`"Very Positive"` — see Inconsistencies) |
| `timestamp`   | DateTime(tz)| server_default `now()`         | |

---

### 2.7 `activity_logs`

Owner-scoped audit trail.

| Column        | Type        | Constraints                    | Notes |
| ------------- | ----------- | ------------------------------ | ----- |
| `id`          | String      | PK, default `uuid4()`          | |
| `company_id`  | String      | FK → `companies.id`, NOT NULL  | |
| `action`      | String      | NOT NULL                       | e.g. `PRODUCT_PROVISIONED`, `PRODUCT_MODIFIED`, `PRODUCT_NEUTRALIZED`, `KNOWLEDGE_INDEXED`, `KNOWLEDGE_REMOVED` |
| `entity_name` | String      | NOT NULL                       | Human-readable target |
| `details`     | Text        | NULLABLE                       | Free-text context |
| `created_at`  | DateTime(tz)| server_default `now()`         | |

---

## 3. Enumerations

```python
class UserRole(str, Enum):
    ADMIN     = "Admin"
    MANAGER   = "Manager"
    OWNER     = "Owner"
    SALES_REP = "SalesRep"

class QueryStatus(str, Enum):
    PENDING   = "Pending"
    RESOLVED  = "Resolved"
    ESCALATED = "Escalated"
```

Both are persisted as the underlying string (no native `Enum` column type), so values are case-sensitive.

---

## 4. Foreign-Key Cascade Behaviour

| FK                                  | Cascade configured? | Manual cleanup |
| ----------------------------------- | ------------------- | -------------- |
| `product_documents.product_id`      | `cascade="all, delete-orphan"` on `Product.documents` | n/a |
| `products.company_id`               | None                | `DELETE FROM products WHERE company_id=?` in `admin.delete_company` |
| `queries.company_id`                | None                | `DELETE FROM queries WHERE company_id=?` in `admin.delete_company` |
| `users.company_id`                  | None                | **Not** cleaned up on company delete — orphan users will retain a stale FK. |
| `queries.sales_rep_id`              | None                | Not nulled on user delete. |
| `lead_stats.company_id`, `activity_logs.company_id` | None | Not cleaned up. |

---

## 5. Indexes

Currently only `unique`/`index=True` declarations:

- `users.email` — UNIQUE + INDEX
- `companies.id` — INDEX (PK)
- `companies.name` — UNIQUE + INDEX
- `products.name` — INDEX
- `queries.complaint_id` — UNIQUE + INDEX

No composite indexes; performance recommendations in §7 below.

---

## 6. Sample DDL (for reference)

The async engine creates tables via `Base.metadata.create_all`. Equivalent DDL (SQLite-flavoured):

```sql
CREATE TABLE companies (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL UNIQUE,
  description       TEXT,
  config            JSON DEFAULT '{}',
  total_tokens      INTEGER DEFAULT 0,
  is_active         BOOLEAN DEFAULT 1,
  admin_suspended   BOOLEAN DEFAULT 0,
  manager_suspended BOOLEAN DEFAULT 0,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL,
  full_name       TEXT,
  role            TEXT DEFAULT 'SalesRep',
  is_active       BOOLEAN DEFAULT 0,
  company_id      TEXT REFERENCES companies(id),
  theme           TEXT DEFAULT 'system',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX ix_users_email ON users(email);

CREATE TABLE products (
  id               TEXT PRIMARY KEY,
  company_id       TEXT NOT NULL REFERENCES companies(id),
  name             TEXT NOT NULL,
  description      TEXT,
  price            TEXT,
  base_price       INTEGER DEFAULT 0,
  max_discount_pct INTEGER DEFAULT 0,
  manual_content   TEXT
);

CREATE TABLE product_documents (
  id          TEXT PRIMARY KEY,
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  filename    TEXT,
  content     TEXT,
  file_type   TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE queries (
  id                  TEXT PRIMARY KEY,
  complaint_id        TEXT UNIQUE,
  company_id          TEXT NOT NULL REFERENCES companies(id),
  sales_rep_id        TEXT REFERENCES users(id),
  complainant_email   TEXT NOT NULL,
  query_text          TEXT NOT NULL,
  ai_generated_answer TEXT,
  final_answer        TEXT,
  status              TEXT DEFAULT 'Pending',
  assigned_at         DATETIME,
  resolved_at         DATETIME,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_escalated        BOOLEAN DEFAULT 0,
  escalated_at        DATETIME,
  deadline_at         DATETIME,
  priority            TEXT DEFAULT 'normal',
  escalation_reason   TEXT,
  tokens              INTEGER DEFAULT 0
);

CREATE TABLE lead_stats (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id  TEXT NOT NULL REFERENCES companies(id),
  type        TEXT,
  sentiment   TEXT,
  timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_logs (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL REFERENCES companies(id),
  action      TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  details     TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. Suggested Improvements

1. **Add composite indexes** that match the dominant query shapes:
   - `queries(company_id, status)` — manager + admin dashboards.
   - `queries(sales_rep_id, status)` — rep dashboards.
   - `queries(company_id, is_escalated, status)` — owner negotiations list.
   - `activity_logs(company_id, created_at DESC)` — owner history page.
2. **Cascade rules:** set `ON DELETE` on every FK or fix the manual cleanup gaps in `admin.delete_company` (users not unlinked, lead_stats/activity_logs orphan).
3. **Replace string enums with `sa.Enum`** to get DB-level validation.
4. **Normalise sentiment values** (see §2.6 inconsistency) — pick one vocabulary.
5. **Add Alembic** for schema versioning instead of `ensure_columns.py` ALTERs.
6. **Move to Postgres** for prod — JSON column + concurrent async writes are second-class on SQLite.

---

## 8. Known Inconsistencies (read before editing!)

- **Endpoints expect `Query.assigned_to`** (`manager.py`, parts of `sales_rep.py`) but the model defines `sales_rep_id`. Those endpoints currently raise at runtime — pick a name and unify.
- **`User.is_active`** isn't returned by `TeamMemberOut` in the schema but the manager endpoint tries to populate it.
- **Sentiment vocabularies** diverge (`"+ve"/"-ve"` in `LeadStatCreate`, but `"Positive"/"Very Positive"` in `manager.get_manager_stats`).
- **Numeric vs string IDs:** several router signatures type query/product IDs as `int`, but the underlying PKs are UUID strings — FastAPI will 422 on the path.

---

## 9. Planned schema (target state) ⭐

Sections 1–8 describe **what the DB looks like today**. This section describes the **planned** schema the system grows into per [`roles_and_access.md`](./roles_and_access.md), [`query_intake_channels.md`](./query_intake_channels.md), and the prep phases in [`state_preparation.md`](./state_preparation.md).

All new tables and columns land via **Alembic migrations** (introduced in Phase 1) — `ensure_columns.py` is retired.

### 9.1 New columns on existing tables

**`users`**
```
+ last_seen_at        DateTime(tz)  NULL            -- powers "online" dot, idle detection
+ verified_at         DateTime(tz)  NULL            -- Customer email-verification timestamp
+ verification_token  String        NULL            -- short-lived token for Customer signup
+ manager_id          String        FK users(id)    -- one-Manager-per-Agent (and per-Reviewer)
```
`users.role` enum domain expands to:
`Admin | Auditor | Billing | Owner | Curator | Manager | Reviewer | Agent | Customer | System`
(legacy `SalesRep` accepted in parallel for one release per the rename plan.)

**`companies`**
```
+ billing_suspended           Boolean  default false   -- third lock
+ plan_tier                   String   default 'starter'
+ monthly_token_allowance     Integer  default 0
```
And the `config` JSON gains namespaced sub-keys:
```
config.manager.manager_discount_ceiling
config.sla.high_hours / sla.normal_hours
config.billing.plan_tier / monthly_token_allowance / overage_cents_per_1k
config.chat.default_duration_min
config.judge.model / rubric_version / weights / thresholds / policy_rules / retriever_sample_rate / online_reranker
```

**`queries`**
```
+ channel                String  NOT NULL default 'google_form'
+ channel_metadata       JSON    default {}
+ external_thread_id     String  NULL  INDEX
+ email_thread_id        String  NULL
+ customer_user_id       String  FK users(id) NULL
+ reply_count            Integer default 0
+ rep_reply_count        Integer default 0
+ auto_escalated         Boolean default false
+ escalated_by           String  FK users(id) NULL
+ priority_set_by        String  FK users(id) NULL
+ last_reassigned_at     DateTime(tz) NULL
+ nps_rating             Integer NULL          -- 1-5
```

### 9.2 New tables

#### `user_company_assignments` (D1)
```sql
CREATE TABLE user_company_assignments (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id      TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_in_company TEXT NOT NULL,           -- 'Manager'|'Agent'|'Reviewer'|'Curator'
  manager_id      TEXT REFERENCES users(id),
  assigned_by     TEXT REFERENCES users(id),
  assigned_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_primary      BOOLEAN DEFAULT FALSE,
  status          TEXT DEFAULT 'active',   -- 'active'|'paused'
  UNIQUE (user_id, company_id)
);
CREATE INDEX ix_uca_user      ON user_company_assignments(user_id);
CREATE INDEX ix_uca_company   ON user_company_assignments(company_id);
CREATE INDEX ix_uca_user_role ON user_company_assignments(user_id, role_in_company);
```

#### `query_messages` (D2)
```sql
CREATE TABLE query_messages (
  id                TEXT PRIMARY KEY,
  query_id          TEXT NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
  direction         TEXT NOT NULL,         -- 'inbound'|'outbound'
  channel           TEXT NOT NULL,         -- mirrors queries.channel for the sending channel
  author_id         TEXT REFERENCES users(id),
  email_message_id  TEXT,                  -- inbound RFC-822 Message-ID
  in_reply_to       TEXT,                  -- inbound In-Reply-To header
  body              TEXT NOT NULL,
  html_body         TEXT,
  attachments_json  JSON DEFAULT '[]',
  judge_score_id    TEXT REFERENCES judge_scores(id),  -- for outbound
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_qm_query    ON query_messages(query_id, created_at);
CREATE INDEX ix_qm_msgid    ON query_messages(email_message_id);
CREATE INDEX ix_qm_replyto  ON query_messages(in_reply_to);
```

#### `query_notes`
```sql
CREATE TABLE query_notes (
  id          TEXT PRIMARY KEY,
  query_id    TEXT NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
  author_id   TEXT NOT NULL REFERENCES users(id),
  body        TEXT NOT NULL,               -- markdown
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `query_reviews`
```sql
CREATE TABLE query_reviews (
  id           TEXT PRIMARY KEY,
  query_id     TEXT NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
  reviewer_id  TEXT NOT NULL REFERENCES users(id),
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comments     TEXT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `discount_approvals`
```sql
CREATE TABLE discount_approvals (
  id             TEXT PRIMARY KEY,
  query_id       TEXT NOT NULL REFERENCES queries(id),
  product_id     TEXT NOT NULL REFERENCES products(id),
  requested_by   TEXT NOT NULL REFERENCES users(id),
  requested_pct  INTEGER NOT NULL,
  approved_pct   INTEGER,
  status         TEXT NOT NULL DEFAULT 'pending', -- pending|approved|denied|escalated_to_owner
  decision_by    TEXT REFERENCES users(id),
  note           TEXT,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  decided_at     DATETIME
);
CREATE INDEX ix_da_status ON discount_approvals(status);
```

#### `chat_rooms` + `chat_messages` (D3)
```sql
CREATE TABLE chat_rooms (
  id                  TEXT PRIMARY KEY,
  query_id            TEXT NOT NULL REFERENCES queries(id),
  state               TEXT NOT NULL DEFAULT 'scheduled', -- scheduled|open|closed|cancelled
  start_at            DATETIME NOT NULL,
  duration_min        INTEGER NOT NULL,
  created_by          TEXT NOT NULL REFERENCES users(id),
  owner_key_hash      TEXT NOT NULL,
  customer_key_hash   TEXT NOT NULL,
  owner_entered_at    DATETIME,
  customer_entered_at DATETIME,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at           DATETIME
);
CREATE INDEX ix_cr_state ON chat_rooms(state, start_at);

CREATE TABLE chat_messages (
  id          TEXT PRIMARY KEY,
  room_id     TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  author      TEXT NOT NULL,                  -- 'owner'|'customer'|'system'
  body        TEXT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_cm_room ON chat_messages(room_id, created_at);
```

#### `judge_scores` + `retriever_scores` + `judge_rubrics` (D4)
```sql
CREATE TABLE judge_scores (
  id                 TEXT PRIMARY KEY,
  query_id           TEXT NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
  target             TEXT NOT NULL,           -- 'ai_draft'|'final_reply'
  model_name         TEXT NOT NULL,
  rubric_version     TEXT NOT NULL,
  groundedness       REAL,
  relevance          REAL,
  tone               REAL,
  policy_compliance  BOOLEAN,
  hallucination_flag BOOLEAN,
  pii_leak_flag      BOOLEAN,
  overall            REAL,
  reasoning          TEXT,
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_js_query ON judge_scores(query_id, created_at);

CREATE TABLE retriever_scores (
  id                TEXT PRIMARY KEY,
  query_id          TEXT NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
  retrieved_chunks  JSON NOT NULL,            -- [{document_id, chunk_index, vector_score}]
  chunk_relevance   JSON,                     -- parallel 0-1 scores
  coverage          REAL,
  redundancy        REAL,
  missing_info      BOOLEAN,
  wrong_product     BOOLEAN,
  reasoning         TEXT,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_rs_query ON retriever_scores(query_id, created_at);

CREATE TABLE judge_rubrics (
  id            TEXT PRIMARY KEY,
  company_id    TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  version       TEXT NOT NULL,
  weights       JSON NOT NULL,
  thresholds    JSON NOT NULL,
  policy_rules  JSON DEFAULT '[]',
  created_by    TEXT REFERENCES users(id),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  active        BOOLEAN DEFAULT TRUE,
  UNIQUE (company_id, version)
);
CREATE INDEX ix_jr_company_active ON judge_rubrics(company_id, active);
```

#### `invoices` (Billing)
```sql
CREATE TABLE invoices (
  id                  TEXT PRIMARY KEY,
  company_id          TEXT NOT NULL REFERENCES companies(id),
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  total_tokens        INTEGER NOT NULL,
  total_amount_cents  INTEGER NOT NULL,
  status              TEXT NOT NULL DEFAULT 'draft', -- draft|sent|paid|void
  issued_at           DATETIME,
  paid_at             DATETIME,
  UNIQUE (company_id, period_start, period_end)
);
```

#### `leads` (full funnel)
```sql
CREATE TABLE leads (
  id                  TEXT PRIMARY KEY,
  company_id          TEXT NOT NULL REFERENCES companies(id),
  name                TEXT,
  email               TEXT,
  phone               TEXT,
  source              TEXT,
  score               INTEGER DEFAULT 0,                          -- 0..100
  status              TEXT NOT NULL DEFAULT 'new',                -- new|contacted|qualified|converted|lost
  owner_rep_id        TEXT REFERENCES users(id),
  notes               TEXT,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity_at    DATETIME,
  converted_query_id  TEXT REFERENCES queries(id)
);
CREATE INDEX ix_leads_company_status ON leads(company_id, status);
```

#### Manager extended features
```sql
CREATE TABLE goals (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL REFERENCES companies(id),
  scope        TEXT NOT NULL,             -- 'team'|'rep'
  rep_id       TEXT REFERENCES users(id),
  metric       TEXT NOT NULL,
  target_value REAL NOT NULL,
  period       TEXT NOT NULL,             -- daily|weekly|monthly|quarterly
  period_start DATE, period_end DATE,
  created_by   TEXT REFERENCES users(id),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE announcements (
  id                 TEXT PRIMARY KEY,
  company_id         TEXT NOT NULL REFERENCES companies(id),
  author_id          TEXT NOT NULL REFERENCES users(id),
  title              TEXT NOT NULL,
  body               TEXT NOT NULL,
  audience           TEXT NOT NULL,        -- all|sales_reps|specific
  audience_user_ids  JSON,
  publish_at         DATETIME,
  expires_at         DATETIME,
  email_dispatched   BOOLEAN DEFAULT FALSE,
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE training_materials (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL REFERENCES companies(id),
  title        TEXT NOT NULL,
  description  TEXT,
  url          TEXT,
  content      TEXT,
  file_type    TEXT,
  created_by   TEXT REFERENCES users(id),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE training_assignments (
  id            TEXT PRIMARY KEY,
  material_id   TEXT NOT NULL REFERENCES training_materials(id) ON DELETE CASCADE,
  assignee_id   TEXT NOT NULL REFERENCES users(id),
  assigned_by   TEXT NOT NULL REFERENCES users(id),
  assigned_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at  DATETIME,
  score         INTEGER
);

CREATE TABLE shift_slots (
  id           TEXT PRIMARY KEY,
  company_id   TEXT NOT NULL REFERENCES companies(id),
  rep_id       TEXT NOT NULL REFERENCES users(id),
  start_at     DATETIME NOT NULL,
  end_at       DATETIME NOT NULL,
  status       TEXT DEFAULT 'planned',     -- planned|active|missed|completed
  created_by   TEXT REFERENCES users(id),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_shift_rep_time ON shift_slots(rep_id, start_at);
```

#### Channel resolution + support tables
```sql
CREATE TABLE email_aliases (
  id           TEXT PRIMARY KEY,
  alias        TEXT NOT NULL UNIQUE,        -- 'support@acme.com' or 'acme.support@ourdomain'
  company_id   TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE phone_aliases (
  id           TEXT PRIMARY KEY,
  number       TEXT NOT NULL UNIQUE,        -- E.164
  company_id   TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  channel      TEXT,                        -- 'sms'|'whatsapp'|'voice'
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attachments (
  id              TEXT PRIMARY KEY,
  owner_kind      TEXT NOT NULL,            -- 'query_message'|'chat_message'|'product_document'
  owner_id        TEXT NOT NULL,
  filename        TEXT, mime_type TEXT, size_bytes INTEGER,
  storage_url     TEXT NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_att_owner ON attachments(owner_kind, owner_id);

CREATE TABLE auth_events (
  id           TEXT PRIMARY KEY,
  user_id      TEXT REFERENCES users(id),
  kind         TEXT NOT NULL,               -- 'login'|'login_fail'|'logout'|'role_change'|'password_reset'
  ip           TEXT, user_agent TEXT,
  metadata     JSON,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_ae_user_time ON auth_events(user_id, created_at);
```

### 9.3 Cascade rules (target)

All new FKs use explicit `ON DELETE` semantics:

| FK                                            | ON DELETE     |
| --------------------------------------------- | ------------- |
| `user_company_assignments.user_id`            | CASCADE       |
| `user_company_assignments.company_id`         | CASCADE       |
| `query_messages.query_id`                     | CASCADE       |
| `query_notes.query_id`                        | CASCADE       |
| `query_reviews.query_id`                      | CASCADE       |
| `chat_rooms.query_id`                         | RESTRICT      |
| `chat_messages.room_id`                       | CASCADE       |
| `judge_scores.query_id` / `retriever_scores.query_id` | CASCADE |
| `judge_rubrics.company_id`                    | CASCADE       |
| `attachments` (no FK; soft owner kind+id)     | manual sweep  |

Existing FK gaps (B5 in [`state_preparation.md`](./state_preparation.md)) are fixed in the same Alembic revision: `users.company_id`, `lead_stats.company_id`, `activity_logs.company_id` get `ON DELETE SET NULL` / `CASCADE` as appropriate.

### 9.4 Composite indexes (target)

- `queries(company_id, status)` — manager + admin dashboards.
- `queries(sales_rep_id, status)` / `(customer_user_id, status)` — rep + customer queues.
- `queries(company_id, is_escalated, status)` — owner negotiations.
- `queries(channel, created_at)` — channel analytics.
- `activity_logs(company_id, created_at DESC)` — owner history.
- `judge_scores(query_id, created_at)` / `retriever_scores(query_id, created_at)` — judge timelines.
- `chat_rooms(state, start_at)` — schedulers.

### 9.5 Vector store (out-of-DB)

Vector chunks live **outside** the relational store. Each tenant gets one collection:

- **Dev:** ChromaDB persistent client at `./chroma_data`. Collection name: `tenant_<company_id>`.
- **Prod:** Qdrant or Postgres + pgvector. Collection / table name: `tenant_<company_id>`.

Vector ID convention: `f"{document_id}:{chunk_index}"`. Per-vector metadata: `{product_id, document_id, filename, chunk_index}`. Maintained by `services/embedding_service.py` + `services/vector_store.py` (see [`architecture.md §10`](./architecture.md)).

### 9.6 Migration mechanics

- All new tables and column additions land via **Alembic** revisions (Phase 1 of [`state_preparation.md`](./state_preparation.md)).
- One-shot data migrations (`migrate_role_rename.py`, `migrate_sentiment.py`, etc.) are committed alongside their structural migration so a `alembic upgrade head` + script run produces a coherent state.
- `ensure_columns.py` is retired after Phase 1.

### 9.7 Updated ER overview (target)

```
                 user_company_assignments
                  ┌──── (Manager / Agent / Reviewer / Curator)
                  │
   users ────────┼──── queries ──── query_messages
                  │       │            │
                  │       │            └── attachments
                  │       ├── query_notes
                  │       ├── query_reviews
                  │       ├── judge_scores
                  │       ├── retriever_scores
                  │       ├── discount_approvals
                  │       └── chat_rooms ── chat_messages
                  │
                  ├── leads (optional funnel)
                  └── auth_events

   companies ──── judge_rubrics
              ├── invoices
              ├── email_aliases / phone_aliases
              ├── goals / announcements / training_* / shift_slots
              └── products ── product_documents
                                  │
                                  └── (vector store: tenant_<company_id>)
```

