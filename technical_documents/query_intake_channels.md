# Smart Sales Systems — Query Intake Channels

> How does a customer actually reach the system to ask a question or file a complaint? This document is the design spec for **every channel** through which a `Query` row gets created. All channels converge on the same downstream pipeline (RAG draft → Agent verify → email thread → 2-strike escalation → scheduled chat).

Status legend: ✅ implemented · 🟡 partial · ⭐ planned.

---

## 0. The principle: one Query, many doorways

```
        ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
        │ Google Form│  │  Customer  │  │  Support   │  │   Website  │  │ WhatsApp / │
        │  (Guest)   │  │   portal   │  │   email    │  │ chat widget│  │    SMS     │
        └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
              │               │               │               │               │
              └──────┬────────┴───────┬───────┴───────┬───────┴───────┬───────┘
                     │                │               │               │
                     ▼                ▼               ▼               ▼
                ┌────────────────────────────────────────────────────────┐
                │   Intake adapter (per channel)  →  normalised Query    │
                │   • channel               • channel_metadata           │
                │   • complainant_email     • query_text                 │
                │   • company_id            • customer_user_id (nullable)│
                └─────────────────────────────┬──────────────────────────┘
                                              ▼
                       RAG draft  →  Agent verify  →  Reply sent
                                              │
                       [thread continues / 2-strike / escalate / chat]
```

**Single internal model.** Every channel writes the same `queries` row plus an entry in `query_messages` (the conversation log). The UI, the Agent's queue, the Manager's analytics, and the Reply/Retrieval Judges all consume that unified shape — they don't need to know how the question arrived.

---

## 1. Unified Query intake contract

All channels (whether webhook, portal, email parser, etc.) eventually call **one internal function**:

```python
async def intake_query(
    *,
    company_id: str,
    complainant_email: str,
    query_text: str,
    channel: str,                       # "google_form" | "portal" | "email" | "chat_widget" | ...
    channel_metadata: dict | None = None,
    customer_user_id: str | None = None,
    external_thread_id: str | None = None,
    attachments: list[Attachment] | None = None,
) -> Query:
    ...
```

It is responsible for:
1. Tenancy lookup (verify the `company_id` / domain / form-token is valid).
2. Optional dedup (same `external_thread_id` within N minutes → append to existing query).
3. `INSERT queries (...)` with the channel info.
4. `INSERT query_messages (direction="inbound", body=query_text, ...)`.
5. Trigger the RAG pipeline (`services.rag_service.generate_ai_answer`) to populate `ai_generated_answer`.
6. Notify the auto-assignment service (FCFS / round-robin) or wait for Manager pickup.
7. Emit `ActivityLog(action="QUERY_INTAKE", entity_name=channel, details=...)`.

Each channel section below specifies its own **intake adapter** that calls this function.

### 1.1 New / extended schema for channels

Add to `queries`:
- `channel` (text, NOT NULL, default `"google_form"`)
- `channel_metadata` (JSON, default `{}`)
- `external_thread_id` (text, nullable) — used for dedup and thread joining
- `customer_user_id` (FK users, nullable) — set if the customer was authenticated

(`email_thread_id`, `reply_count`, `rep_reply_count`, `auto_escalated` already defined in [roles_and_access.md §12.2](./roles_and_access.md).)

---

## 2. Channels

### 2.1 Channel 1 — Google Form webhook ✅ (existing)

**How it works today.**
1. Customer fills a Google Form embedded on the company's website (or shared as a link).
2. A Google Apps Script bound to the Form's response Sheet runs `onFormSubmit` and POSTs to `https://<api>/api/v1/webhook/google-forms`.
3. Body: `{ company_id, complainant_email, query_text, complaint_id? }`.
4. Backend looks up the company by hashed ID, runs RAG, persists the `Query`, emails the draft to the customer.

**Identity model.** Guest (anonymous). No login required. The form must be configured per-tenant with that company's hashed `company_id` so the request maps correctly.

**Pros.** Zero infra for the company; works for non-technical Owners.
**Cons.** No thread continuity (customer's replies don't loop back automatically); no attachments today; spammable unless the form has a captcha.

**Channel metadata captured**
```json
{ "form_id": "1FAIpQ...", "submission_id": "abc123" }
```

### 2.2 Channel 2 — Customer portal ⭐ (planned)

**Use case.** A registered Customer logs in to the portal and opens a question against a specific company / product.

**Surface (Next.js):**
- Route: `/customer/ask` (new)
- Picker: choose **Company** (from a directory of tenants opted-in to the portal) → **Product** (optional).
- Form: query text + optional file attachments.
- On submit → `POST /api/v1/customer/queries` → calls `intake_query(channel="portal", customer_user_id=me.id, ...)`.

**Identity model.** Authenticated Customer (JWT in HttpOnly cookie). Their `customer_user_id` is set on the query → their `/customer` portal aggregates all their queries cross-tenant.

**Channel metadata**
```json
{ "product_id": "...", "attachment_ids": ["..."] }
```

**Benefits over Channel 1.** Thread continuity is trivial (the reply lives in the portal); the customer can self-serve attachments, history, ratings, and chat-room entry.

### 2.3 Channel 3 — Support email ingest ⭐ (planned)

**Use case.** Customer sends an email to `support@<company-domain>` (or a tenant-specific alias like `<tenant>.support@<our-domain>`).

**Pipeline.**
1. Inbound email arrives at our SMTP/IMAP relay (e.g. **Resend Inbound**, **Postmark**, **AWS SES + SNS**, or **Cloudflare Email Routing → Worker**).
2. Email body + headers POSTed to `POST /api/v1/webhook/inbound-email`.
3. Adapter:
   - Resolve `company_id` from the `To:` address (lookup table `email_aliases(alias → company_id)`).
   - Extract `Message-ID` → `external_thread_id`.
   - If `In-Reply-To` matches an existing query's `email_thread_id` → append `query_messages(direction="inbound")` and bump `reply_count` (feeds the 2-strike rule).
   - Otherwise create a new `Query` via `intake_query(channel="email", ...)`.
4. Attachments stored to object storage; references in `attachments` table.

**Identity model.** Guest by default (matched on `From:` email); if that email matches a registered `Customer.email`, the system auto-links `customer_user_id`.

**Why this matters.** Email is how most customers naturally reply. Without inbound-email ingest, the 2-strike rule can't fire automatically from reply emails — it would depend on the customer using a portal or refilling a Google Form.

**Channel metadata**
```json
{ "from": "buyer@example.com", "to": "support@acme.com",
  "subject": "...", "message_id": "<...>", "in_reply_to": "<...>" }
```

### 2.4 Channel 4 — Embeddable chat widget ⭐ (planned)

**Use case.** A small JS snippet on the company's website pops up a chat bubble. Visitors type a question, see the AI draft instantly, then a human Agent takes over if needed.

**Components.**
- **Widget** (`@smart-sales/widget`) — a tiny Preact/Vue bundle the company pastes:
  ```html
  <script src="https://cdn.../widget.js"
          data-company-id="a1b2c3d4e5f60718"
          data-product-id="optional"></script>
  ```
- **Public WS endpoint** `wss://api/.../widget` — anonymous, rate-limited per IP.
- Backend adapter writes `intake_query(channel="chat_widget", complainant_email=<collected upfront>, ...)`.

**Identity model.** Guest by default. The widget can prompt for email up-front (recommended) or post-question (allows hit-and-run). Logged-in Customers can have the widget auto-identify them via a signed token from the host site.

**Live AI mode.** Before the human Agent picks up, the widget can stream the RAG answer directly (no email round-trip) — turns the widget into a chatbot. The Agent sees both the AI's responses and the visitor's follow-ups in their queue.

**Channel metadata**
```json
{ "page_url": "...", "referrer": "...", "user_agent": "...", "session_id": "..." }
```

### 2.5 Channel 5 — WhatsApp / SMS ⭐ (planned)

**Use case.** Customer texts the company's WhatsApp Business or SMS number.

**Provider.** Twilio (SMS + WhatsApp), Meta Cloud API (WhatsApp), MessageBird.

**Pipeline.**
1. Provider receives the message → fires a webhook to `POST /api/v1/webhook/sms` or `/webhook/whatsapp`.
2. Adapter resolves company by recipient phone number (table `phone_aliases(number → company_id)`).
3. Calls `intake_query(channel="whatsapp" | "sms", complainant_email=<derived or asked>, query_text=body, external_thread_id=phone_number)`.
4. AI draft is sent back over the same channel (WhatsApp/SMS reply).
5. The 2-strike rule applies — three unhappy replies trigger escalation.

**Identity model.** Guest, keyed by phone number rather than email. The system asks for an email once and stores it on the query for the chat-room escalation path (since chat rooms email keys to participants).

### 2.6 Channel 6 — Voice / phone call ⭐ (planned)

**Use case.** Customer calls a support number; the call is recorded and transcribed.

**Pipeline.**
1. **Twilio Voice** / Vonage answers the call. Either:
   - **IVR** captures intent + records voicemail → on hangup webhook fires.
   - **Live transcribe** streams audio to Whisper/Deepgram and we run RAG live, speaking the answer back via TTS.
2. Webhook posts `{ recording_url, transcript_url, caller_phone, called_phone, duration }` to `POST /api/v1/webhook/voice`.
3. Adapter pulls the transcript, calls `intake_query(channel="voice", ...)`, attaches the recording URL.

**Channel metadata**
```json
{ "caller": "+91...", "duration_sec": 92,
  "recording_url": "...", "transcript_url": "..." }
```

### 2.7 Channel 7 — Social DMs (X / Facebook / Instagram) ⭐ (planned)

**Use case.** A customer DMs the company's social handle.

**Pipeline.** Subscribe to platform webhooks (Meta Graph API, X API v2). Each DM POSTs to `/webhook/social/<platform>`. Adapter resolves company by handle, creates a query with `channel="social_<platform>"`. Replies go back through the same API.

### 2.8 Channel 8 — Partner API ⭐ (planned)

**Use case.** A partner system (e.g. the company's existing CRM, Zendesk, Salesforce) wants to push tickets in programmatically.

**Endpoint.** `POST /api/v1/partner/queries` with an API key in `Authorization: ApiKey <key>` (separate from JWT). API keys are minted per-tenant in Owner settings; rate-limited per key.

**Body** (full intake contract from §1):
```json
{
  "company_id": "...",
  "complainant_email": "...",
  "query_text": "...",
  "channel": "partner",
  "channel_metadata": { "source": "zendesk", "external_ticket_id": "TKT-123" },
  "external_thread_id": "zd:TKT-123",
  "attachments": [...]
}
```

### 2.9 Channel 9 — QR code → Form / chat ⭐ (planned)

**Use case.** Physical product packaging carries a QR code. Scanning opens a pre-filled form or the chat widget with `product_id` already set.

**Implementation.** QR encodes `https://<portal>/ask?company=<id>&product=<id>`. Lands on the portal form pre-populated. Falls back to email if the user isn't logged in.

### 2.10 Channel 10 — In-portal "Ask again" ⭐ (planned)

**Use case.** A logged-in Customer in `/customer/queries/[id]` clicks "follow-up" — same thread, adds an inbound `query_messages` row, bumps `reply_count`. This is the *first-class* customer reply path that bypasses email entirely.

---

## 3. Channel ↔ feature compatibility matrix

| Channel        | Anonymous? | Logged-in? | Thread continuity (replies) | Attachments | 2-strike auto-escalation | Scheduled chat room |
| -------------- | :--------: | :--------: | :-------------------------: | :---------: | :----------------------: | :-----------------: |
| Google Form    |    ✅      |     —      |  ❌ (re-submission)         |    ❌       | ❌ (needs email ingest)  | ✅ (via email keys) |
| Customer portal|    —       |    ✅      |  ✅ (in-portal thread)      |    ✅       | ✅                       | ✅ (in-portal)      |
| Support email  |    ✅      |    ✅      |  ✅ (Message-ID chaining)   |    ✅       | ✅                       | ✅                  |
| Chat widget    |    ✅      |    ✅      |  ✅ (session-bound)         |   limited   | ✅                       | ✅                  |
| WhatsApp/SMS   |    ✅      |    ✅ (linked)| ✅ (per phone)           |    ✅       | ✅                       | ✅ (link to chat)   |
| Voice          |    ✅      |    ✅ (linked)| 🟡 (each call → new)     |   recording | 🟡 (needs follow-up call detection) | ✅           |
| Social DMs     |    ✅      |    ✅ (linked)| ✅ (platform-thread)      |   limited   | ✅                       | ✅ (link)           |
| Partner API    |    —       |   (key)    |  ✅ (`external_thread_id`)  |    ✅       | ✅                       | ✅                  |
| QR → portal    |    ✅      |    ✅      |  inherits portal/email      |    ✅       | ✅                       | ✅                  |
| In-portal      |    —       |    ✅      |  ✅                         |    ✅       | ✅                       | ✅                  |

---

## 4. Identity resolution

For every intake, the adapter resolves three things:

1. **Tenant (`company_id`)** — required.
   - Email channels: lookup `email_aliases` table.
   - Phone channels: lookup `phone_aliases` table.
   - Web: form/widget config carries `company_id`.
   - Portal: customer picks the company explicitly.
2. **Customer identity (`complainant_email` + optional `customer_user_id`)**.
   - Logged-in portal → both fields populated.
   - Anonymous channel with email collected → `complainant_email` only.
   - If `complainant_email` matches a registered Customer → auto-link `customer_user_id`.
3. **Thread (`external_thread_id`)** — for dedup and continuity.
   - Email: `Message-ID` / `In-Reply-To`.
   - Phone: phone number + a soft window (e.g. same number in same 24 h → same thread).
   - Portal / partner: explicit IDs.

---

## 5. AI reply, verification, and outbound delivery (channel-agnostic)

Once a query is created, the AI reply pipeline is the **same** regardless of channel:

```
intake_query ────▶ rag_service.generate_ai_answer ──▶ ReplyJudge / RetrievalJudge (advisory)
                                                       │
                                                       ▼
                                              Agent's queue (FCFS or assigned)
                                                       │
                                                       ▼
                                       Agent reviews + edits + sends
                                                       │
                                                       ▼
                              Outbound dispatcher picks channel-appropriate path:
                                 • email channels → SMTP via Resend
                                 • portal       → push notification + in-portal entry
                                 • chat widget  → WebSocket push to session
                                 • WhatsApp/SMS → provider API
                                 • voice        → optional callback / SMS summary
                                 • social DM    → platform API
```

Every outbound message is also written to `query_messages(direction="outbound")` so the unified thread renders correctly in the Agent / Customer UI no matter the channel mix.

---

## 6. Suggested rollout order

1. **Customer portal** (Channel 2) — unblocks thread continuity, attachments, ratings, scheduled-chat entry. The single highest-leverage addition.
2. **Inbound email** (Channel 3) — makes the 2-strike rule actually fire on the channel most customers reply through.
3. **Chat widget** (Channel 4) — captures the largest top-of-funnel volume.
4. **Partner API** (Channel 8) — opens enterprise integrations.
5. **WhatsApp / SMS** (Channel 5) — high impact in many markets; needs a provider account.
6. **Social DMs** (Channel 7) — marketing-driven, moderate effort.
7. **Voice** (Channel 6) — highest implementation cost; sequence last.
8. **QR** (Channel 9) — trivial after the portal exists.
9. **In-portal "Ask again"** (Channel 10) — falls out of the portal work.

Each rollout is just a new **intake adapter** + outbound dispatcher path; the queue, RAG, judges, escalation, and chat-room logic are untouched.

---

## 7. Cross-references

- The downstream reply flow (RAG → Agent → 2-strike → escalation → chat room): [`roles_and_access.md §9.5–§9.7, §6.7`](./roles_and_access.md)
- RAG pipeline & vector store: [`architecture.md`](./architecture.md) + (forthcoming) `skills/backend_skill.md`
- DB schema additions for channels: this doc §1.1 + [`db_schema.md`](./db_schema.md) once implemented
- Webhook endpoint surface: [`api_contracts.md`](./api_contracts.md) (will expand as channels land)
