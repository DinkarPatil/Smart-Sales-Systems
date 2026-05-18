# Smart Sales Systems — Role Workflows

> Developer-facing visualisation of **what each role actually does**, separated into **first-time** (onboarding / setup) and **returning** (typical day) flows. Each diagram is rendered as Mermaid — VSCode (with the Mermaid Preview extension) and GitHub render these natively.
>
> The role taxonomy this doc visualises is defined in [`roles_and_access.md`](./roles_and_access.md). Intake channels are in [`query_intake_channels.md`](./query_intake_channels.md). For per-role endpoint and page details see [`api_contracts.md`](./api_contracts.md) and the per-role skills under [`skills/`](./skills/).

---

## 0. Legend & conventions

```
🟦  User-driven action
🟩  System-driven action / async background
🟧  Decision branch
🟥  Failure / blocked state
✉️  Email side-effect
🔔  In-app notification
🔒  Auth / permission gate
🤖  AI / Judge / RAG step
```

In the diagrams:
- `1️⃣ First-time` flows happen on the very first session after the user is created.
- `🔁 Returning` flows are what they see every subsequent visit.
- Cross-role flows in §15 show how a single customer query traverses multiple roles.

---

## 1. Admin

### 1.1 First-time

```mermaid
flowchart TD
    A[🟦 Receives invite or knows ADMIN_SECRET_KEY] --> B{🟧 Path?}
    B -- "Self-register" --> C[🟦 POST /auth/register with secret key]
    B -- "Provisioned by existing Admin" --> D[✉️ Receives credentials email]
    C --> E[🟩 role=Admin, is_active=true, welcome email]
    D --> E
    E --> F[🟦 First login → cookie set]
    F --> G[🟦 Lands on /admin overview]
    G --> H[🟦 Creates first company]
    H --> I[🟦 Provisions Owner for that company]
    I --> J[🟦 Provisions a Manager + assigns to companies via UCA*]
    J --> K[✉️ Owner + Manager receive welcome emails]
    K --> L[🟦 Optional: skim system diagnostics + audit log]
    L --> M[✅ Onboarding complete]

    classDef tip fill:#fff5cc,stroke:#d4a017,stroke-width:1px,color:#333;
    class M tip
```

> *UCA = `user_company_assignments` (the join table that enables multi-company for Manager / Agent / Reviewer / Curator).*

### 1.2 Returning

```mermaid
flowchart TD
    A[🔒 Login → /admin] --> B[🟦 Check system health tiles]
    B --> C{🟧 Anything red?}
    C -- "5xx spike / queue lag" --> D[🟦 Open /admin/system/logs?since=…]
    C -- "Normal" --> E[🟦 Skim audit log + diagnostics]
    D --> F[🟦 Open the failed request → reproduce → file/ fix]
    E --> G{🟧 Tenant ops needed?}
    G -- "Yes" --> H[🟦 Create/delete company · provision user · reindex]
    G -- "No" --> I[✅ End session]
    F --> I
    H --> I
```

---

## 2. Auditor

### 2.1 First-time

```mermaid
flowchart TD
    A[🟦 Provisioned by Admin] --> B[✉️ Receives credentials]
    B --> C[🟦 First login → /auditor]
    C --> D[🟦 Familiarise with cross-tenant indices: queries, chat rooms, auth events]
    D --> E[🟦 Configure date-range default + saved views]
    E --> F[✅ Ready to audit]
```

### 2.2 Returning

```mermaid
flowchart TD
    A[🔒 Login → /auditor] --> B[🟦 Pick scope: tenant + date range]
    B --> C[🟦 Run review queries\n• chat rooms closed last 7d\n• queries with hallucination_flag=true\n• role changes in auth_events]
    C --> D{🟧 Findings?}
    D -- "Yes" --> E[🟦 Export CSV evidence pack]
    D -- "No" --> F[✅ Sign-off period]
    E --> F
```

> The guard rejects every non-GET / non-export method, so the only side-effect is the export record.

---

## 3. Billing

### 3.1 First-time

```mermaid
flowchart TD
    A[🟦 Provisioned by Admin] --> B[✉️ Credentials]
    B --> C[🟦 First login → /billing]
    C --> D[🟦 Set default plan + monthly token allowance]
    D --> E["🟦 Define overage rate (cents/1k tokens)"]
    E --> F[🟦 Set up first invoice template]
    F --> G[✅ Ready to invoice]
```

### 3.2 Returning

```mermaid
flowchart TD
    A[🔒 Login → /billing] --> B[🟦 Open /billing/usage]
    B --> C{🟧 Tenant over allowance?}
    C -- "Yes" --> D[🟦 Generate overage invoice]
    C -- "No" --> E[🟦 Monthly run: generate standard invoices]
    D --> F[🟦 POST invoices → send PDFs]
    E --> F
    F --> G{🟧 Past-due tenants?}
    G -- "Yes" --> H[🟦 Toggle billing_suspended=true ⇒ tenant freezes]
    G -- "No" --> I[✅ End session]
    H --> J[✉️ Owner notified of suspension]
    J --> I
```

---

## 4. Owner

### 4.1 First-time

```mermaid
flowchart TD
    A[✉️ Receives credentials from Admin] --> B[🔒 First login → /owner]
    B --> C[🟦 Edit company profile name/description/config]
    C --> D[🟦 Create first Product\n• base_price\n• max_discount_pct]
    D --> E[🟦 Upload product manual PDF/image]
    E --> F[🟩 OCR pipeline runs\nPyMuPDF → low-text pages → Ollama VLM]
    F --> G[🟩 Embeddings written to per-tenant vector collection]
    G --> H[🟩 ActivityLog: KNOWLEDGE_INDEXED]
    H --> I{🟧 Attach a Curator?}
    I -- "Yes" --> J[🟦 Attach Curator from pool]
    I -- "No" --> K[🟦 Configure judge rubric\n weights, thresholds, policy rules]
    J --> K
    K --> L[✅ Ready to receive first customer query]
```

### 4.2 Returning

```mermaid
flowchart TD
    A[🔒 Login → /owner] --> B[🟦 Skim stats tiles\nescalations, products missing docs, high-priority pending]
    B --> C{🟧 Pending negotiations?}
    C -- "Yes" --> D[🟦 Open /owner/negotiations]
    D --> E[🟦 Read query + AI draft + thread]
    E --> F{🟧 Action?}
    F -- "Resolve in writing" --> G[🟦 POST /owner/negotiations/&#123;id&#125;/resolve]
    F -- "Need synchronous talk" --> H[🟦 Schedule chat room]
    G --> I[✉️ Customer receives official response]
    H --> J[✉️ Owner + Customer get secret keys]
    J --> K[🔁 Enter room at start_at → chat → resolve]
    I --> L[✅ End session]
    K --> L
    C -- "No" --> M{🟧 Catalog updates?}
    M -- "Yes" --> N[🟦 Add/edit products · upload/delete docs ⇒ reindex]
    M -- "No" --> L
    N --> L
```

---

## 5. Curator

### 5.1 First-time

```mermaid
flowchart TD
    A[🟦 Provisioned by Admin] --> B[✉️ Credentials]
    B --> C[🔒 First login → /curator]
    C --> D[🟦 Wait for Owner to attach you to their company]
    D --> E[🔔 In-app: Attached to Acme Corp]
    E --> F[🟦 Open /curator/companies/acme/products]
    F --> G[🟦 Audit existing docs · spot gaps]
    G --> H[🟦 Upload missing manuals → OCR + embed]
    H --> I[✅ Corpus ready]
```

### 5.2 Returning

```mermaid
flowchart TD
    A[🔒 Login → /curator] --> B["🟦 Open Gap Inbox\n(populated by RetrievalJudge missing_info findings)"]
    B --> C{🟧 New gaps?}
    C -- "Yes" --> D[🟦 Locate / write doc covering the topic]
    D --> E[🟦 Upload → embed]
    E --> F[🟦 Tenant-wide reindex if structural change]
    C -- "No" --> G[🟦 Skim retrieval traces\nbad chunks? wrong product tagging?]
    G --> H{🟧 Fix needed?}
    H -- "Yes" --> I[🟦 Adjust manual_content / replace doc]
    H -- "No" --> J[✅ End session]
    F --> J
    I --> J
```

---

## 6. Manager

### 6.1 First-time

```mermaid
flowchart TD
    A[✉️ Credentials from Admin] --> B[🔒 First login → /manager]
    B --> C[🟦 See assigned companies\nmulti-company picker top-right]
    C --> D[🟦 Configure per-company manager.config\n• manager_discount_ceiling\n• sla.high_hours / normal_hours\n• auto_reassign_strategy]
    D --> E[🟦 Invite first Agents → assign to companies]
    E --> F[✉️ Agents receive welcome emails]
    F --> G["🟦 Set first weekly goal\n(e.g. resolved_count target)"]
    G --> H[🟦 Send launch announcement to team]
    H --> I[✅ Team operational]
```

### 6.2 Returning

```mermaid
flowchart TD
    A[🔒 Login → /manager] --> B[🟦 Overview tiles\nSLA breaches · Pending approvals · At-risk · Online reps]
    B --> C{🟧 SLA breaches?}
    C -- "Yes" --> D[🟦 Open /manager/queries/sla → triage]
    C -- "No" --> E{🟧 Pending discount approvals?}
    D --> E
    E -- "Yes" --> F[🟦 Approve within ceiling · escalate above]
    E -- "No" --> G{🟧 Reassignment needed?}
    F --> G
    G -- "Yes" --> H["🟦 Bulk reassign\n(round-robin · weighted · specific)"]
    G -- "No" --> I{🟧 Periodic ops?}
    H --> I
    I -- "Weekly" --> J[🟦 Update goals · send announcement · schedule shifts]
    I -- "Monthly" --> K[🟦 Pull reports CSV · review leaderboard]
    I -- "None" --> L[✅ End session]
    J --> L
    K --> L
```

---

## 7. Reviewer

### 7.1 First-time

```mermaid
flowchart TD
    A[✉️ Credentials from Admin] --> B[🔒 First login → /reviewer]
    B --> C[🟦 Manager attaches you to their companies via UCA]
    C --> D["🟦 Familiarise with the QA queue\n(sampled resolved queries)"]
    D --> E[🟦 Calibrate first 3 reviews with Manager guidance]
    E --> F[✅ Ready to grade]
```

### 7.2 Returning

```mermaid
flowchart TD
    A[🔒 Login → /reviewer] --> B[🟦 Open /reviewer/queue]
    B --> C[🟦 Pick a resolved query]
    C --> D[🟦 Read thread · check vs corpus · check vs policy]
    D --> E[🟦 Submit rating 1-5 + comments]
    E --> F[🟩 Score persists; rolls into Agent leaderboard]
    F --> G{🟧 More in queue?}
    G -- "Yes" --> C
    G -- "No" --> H[✅ End session]
```

---

## 8. Agent (formerly SalesRep)

### 8.1 First-time

```mermaid
flowchart TD
    A{🟧 How registered?} -- "Self-register" --> B[🟦 POST /auth/register]
    A -- "Invited by Manager" --> C[✉️ Receive invite email]
    A -- "Provisioned by Admin" --> D[✉️ Receive credentials]
    B --> E[🟩 role=Agent, is_active=false]
    C --> F[🟦 Accept invite → set password]
    D --> F
    E --> G[⏳ Wait: Manager activates account]
    G --> F
    F --> H[🔒 First login → /agent]
    H --> I[🟦 See assigned companies in switcher]
    I --> J[🟦 Skim products of assigned companies\nread-only]
    J --> K[🟦 Open first incoming query]
    K --> L[🤖 See AI draft + ReplyJudge badge]
    L --> M[🟦 Edit draft · send]
    M --> N[✅ First reply sent]
```

### 8.2 Returning — happy path

```mermaid
flowchart TD
    A[🔒 Login → /agent] --> B["🟦 Pick company in switcher\n(or All)"]
    B --> C[🟦 Open queue: filter Pending]
    C --> D[🟦 Pick oldest query]
    D --> E[🤖 ReplyJudge pre-send: overall ≥ block_threshold?]
    E -- "No" --> F[🟥 Regenerate / hide draft]
    E -- "Yes" --> G[🟦 Review · edit · personalise]
    G --> H{🟧 Discount > product.max_discount_pct?}
    H -- "Yes" --> I[🟦 POST discount-request → goes to Manager]
    H -- "No" --> J[🟦 Send reply]
    I --> K[⏳ Wait Manager decision]
    K --> J
    J --> L[🟩 query_messages outbound; ReplyJudge post-send eval runs]
    L --> M[✅ Move to next query]
```

### 8.3 Returning — customer unhappy (2-strike → escalation)

```mermaid
flowchart TD
    A[🟩 Customer replies still-unhappy #1] --> B[🟩 reply_count=1, query back to Agent queue]
    B --> C[🟦 Agent replies #1]
    C --> D[🟩 Customer replies #2 unhappy]
    D --> E[🟦 Agent replies #2]
    E --> F[🟩 Customer replies #3 unhappy]
    F --> G[🟩 2-strike rule fires:\nstatus=Escalated · auto_escalated=true]
    G --> H[✉️ Owner notified]
    H --> I[🟦 Agent CTA — Schedule chat]
    I --> J[🟦 Pick start_at + duration]
    J --> K[🟩 Two secret keys minted & emailed]
    K --> L[✅ Agent's role ends; Owner takes the chat]
```

---

## 9. Customer (account-holder)

### 9.1 First-time

```mermaid
flowchart TD
    A[🟦 Land on company website / portal] --> B[🟦 POST /auth/register/customer]
    B --> C[✉️ Verification email]
    C --> D[🟦 Click link → POST /auth/verify-email/&#123;token&#125;]
    D --> E[🔒 First login → /customer]
    E --> F[🟦 Browse company directory]
    F --> G[🟦 Open /customer/ask → pick company + product → describe issue]
    G --> H[🟩 intake_query channel=portal · customer_user_id=me]
    H --> I[🤖 RAG draft generated]
    I --> J[🟩 Agent picks up · sends edited reply]
    J --> K[🔔 Customer notified in portal + ✉️ optional email]
    K --> L[✅ First query in flight]
```

### 9.2 Returning

```mermaid
flowchart TD
    A[🔒 Login → /customer] --> B[🟦 My Queries list cross-tenant]
    B --> C{🟧 Action?}
    C -- "Open ongoing thread" --> D[🟦 Read latest Agent reply]
    D --> E{🟧 Satisfied?}
    E -- "Yes" --> F[🟦 Rate 1-5 / NPS]
    E -- "No" --> G[🟦 Reply in-portal Channel 10]
    G --> H[🟩 reply_count++  → may trigger 2-strike]
    F --> I[✅ Done]
    H --> I
    C -- "New question" --> J[🟦 /customer/ask flow ⇒ §9.1 step G]
    J --> I
    C -- "Chat scheduled?" --> K[🟦 Open chat-room page]
    K --> L{🟧 Time arrived?}
    L -- "No" --> M[🟥 Room not yet open — countdown]
    L -- "Yes" --> N[🟦 Enter with customer secret key]
    N --> O[🟩 Mints room-scoped JWT]
    O --> P[🟦 Chat with Owner over WS]
    P --> Q[🟩 At start_at+duration → room closes]
    Q --> I
```

---

## 10. Guest (no account — anonymous webhook intake)

### 10.1 First-time = every-time (no notion of "returning")

```mermaid
flowchart TD
    A[🟦 Customer fills Google Form on company site] --> B[🟩 Apps Script POST → /webhook/google-forms]
    B --> C[🟩 Lookup company by hashed id]
    C --> D[🤖 RAG generates draft]
    D --> E[🟩 INSERT queries channel=google_form]
    E --> F[✉️ Customer receives reply email]
    F --> G{🟧 Replies satisfied?}
    G -- "Yes" --> H[✅ Done]
    G -- "No" --> I["🟦 Customer replies to email\n(Channel 3 inbound ingest)"]
    I --> J[🟩 Parsed → bumps reply_count]
    J --> K[🔁 Continue Agent thread + 2-strike]
    K --> H
```

### 10.2 Guest enters a scheduled chat (after escalation)

```mermaid
flowchart TD
    A[✉️ Email arrives with customer secret key + room URL] --> B[🟦 Open URL]
    B --> C{🟧 start_at reached?}
    C -- "No" --> D[🟥 Countdown screen]
    C -- "Yes" --> E[🟦 Paste secret key]
    E --> F[🟩 Server validates · mints room-scoped JWT]
    F --> G[🟦 Chat with Owner]
    G --> H[🟩 Room closes at start_at+duration]
    H --> I[✅ Transcript archived]
```

---

## 11. ReplyJudge (system agent)

### 11.1 Per-query lifecycle

```mermaid
flowchart TD
    A[🟩 RAG produces ai_draft for a query] --> B[🤖 Pre-send judge call\nmodel = JUDGE_MODEL]
    B --> C[🟩 Score persisted to judge_scores target=ai_draft]
    C --> D{🟧 overall vs thresholds}
    D -- "< block_threshold OR hallucination_flag" --> E[🟥 Hide draft · regen · count failures]
    D -- "< warn_threshold" --> F[⚠️ Show with warning chip]
    D -- "≥ warn" --> G[✅ Show normally]
    E --> H{🟧 Failures ≥ 3?}
    H -- "Yes" --> I[🔔 Escalate to Owner with reason]
    H -- "No" --> A
    F --> J[🟦 Agent edits + sends]
    G --> J
    J --> K[🤖 Post-send judge eval on final_reply]
    K --> L[🟩 Score persisted target=final_reply ⇒ feeds analytics + Reviewer queue]
```

### 11.2 Nightly batch

```mermaid
flowchart TD
    A[🟩 Cron at 02:00 UTC per tenant] --> B[🟩 Sample N queries from last 24h]
    B --> C[🤖 Re-grade with current rubric_version]
    C --> D[🟩 Append to judge_scores]
    D --> E[🟩 Aggregate trend report ⇒ Owner dashboard + Auditor]
```

---

## 12. RetrievalJudge (system agent)

### 12.1 Per-query lifecycle

```mermaid
flowchart TD
    A[🟩 RAG retrieves top-k from tenant vector store] --> B[🤖 Online cross-encoder rerank]
    B --> C[🟩 chunk_relevance scores persisted]
    C --> D[🟦 Reordered chunks → generator]
    D --> E{🟧 Sampled for offline judge? sample_rate}
    E -- "No" --> F[✅ Done]
    E -- "Yes" --> G[🟩 Queue job: query + chunks]
    G --> H[🤖 LLM rubric: coverage · redundancy · missing_info · wrong_product]
    H --> I[🟩 Persist retriever_scores]
    I --> J{🟧 missing_info==true?}
    J -- "Yes" --> K[🔔 Curator gap-inbox ticket]
    J -- "No" --> L{🟧 wrong_product==true?}
    L -- "Yes" --> M[🔔 Flag metadata for review]
    L -- "No" --> N{🟧 avg chunk_relevance < threshold?}
    N -- "Yes" --> O["🟩 Trigger re-embedding job\n(different chunk size / model)"]
    N -- "No" --> F
    K --> F
    M --> F
    O --> F
```

---

## 13. Cross-role — end-to-end customer query (happy path)

```mermaid
sequenceDiagram
    participant C as 👤 Customer / Guest
    participant W as Webhook / Portal
    participant R as 🤖 RAG + RetrievalJudge
    participant J as 🤖 ReplyJudge
    participant A as 👤 Agent
    participant DB as 🗄️ Queries DB
    participant ES as ✉️ Email/WS

    C->>W: 1. Submit query (Channel 1..10)
    W->>DB: 2. intake_query() inserts Query + inbound message
    W->>R: 3. Retrieve top-k from tenant vector store
    R->>R: 4. Online rerank → grounded prompt
    R->>J: 5. ai_draft generated → judge pre-send
    J-->>R: 6. score, pass / warn / block
    R->>DB: 7. Persist ai_generated_answer + judge_scores
    DB->>A: 8. Query appears in Agent queue
    A->>A: 9. Review draft + judge badge → edit
    A->>DB: 10. POST /agent/queries/{id}/send → outbound message
    A->>J: 11. Post-send judge eval (background)
    A->>ES: 12. Outbound dispatched on the same channel
    ES->>C: 13. Customer receives reply
    C-->>A: 14. (optional) Satisfied → no follow-up = Resolved
```

---

## 14. Cross-role — escalation via 2-strike → scheduled chat → resolution

```mermaid
sequenceDiagram
    participant C as 👤 Customer
    participant A as 👤 Agent
    participant DB as 🗄️ Queries DB
    participant O as 👤 Owner
    participant ES as ✉️ Email
    participant WS as 🔌 WS /ws/chat/{room}

    C->>A: Reply #1 unhappy
    A->>C: Reply #1
    C->>A: Reply #2 unhappy
    A->>C: Reply #2
    C->>A: Reply #3 unhappy
    A->>DB: reply_count=3 → 2-strike rule
    DB->>DB: status=Escalated · auto_escalated=true
    DB->>O: Notification + email
    A->>DB: POST /agent/queries/{id}/schedule-chat\n  {start_at, duration_min}
    DB->>DB: Create chat_room (state=scheduled)\nHash + store two secret keys
    DB->>ES: ✉️ Owner key
    DB->>ES: ✉️ Customer key
    Note over O,C: ⏳ Wait until start_at
    O->>DB: POST /owner/chat-rooms/{id}/enter (owner_secret_key)
    DB-->>O: room-scoped JWT
    C->>DB: POST /customer/chat-rooms/{id}/enter (customer_secret_key)
    DB-->>C: room-scoped JWT
    DB->>DB: state=open
    O->>WS: connect with JWT
    C->>WS: connect with JWT
    par live chat
        O->>C: message via WS
        C->>O: message via WS
    end
    Note over DB: start_at + duration reached
    DB->>DB: state=closed, transcript archived
    O->>DB: POST /owner/negotiations/{id}/resolve (summary)
    DB->>ES: ✉️ Customer receives formal closure
```

---

## 15. Cross-role — discount cascade

```mermaid
flowchart TD
    A[👤 Agent: discount > product.max_discount_pct] --> B[🟦 POST /agent/queries/&#123;id&#125;/discount-request]
    B --> C[🟩 DiscountApproval row pending]
    C --> D[🔔 Manager queue /manager/approvals]
    D --> E{🟧 requested_pct ≤ manager_discount_ceiling?}
    E -- "Yes" --> F[🟦 Manager approves]
    F --> G[🟩 status=approved · Agent notified · final_answer prepped]
    E -- "No" --> H[🟦 Manager escalates]
    H --> I[🟩 status=escalated_to_owner · spawn Owner negotiation]
    I --> J[🟦 Owner decides via /owner/negotiations]
    J --> G
    G --> K[🟦 Agent sends reply with approved discount]
    K --> L[✅ Done]
```

---

## 16. State machine — a single Query's lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending: intake_query()
    Pending --> Pending: reassign / priority changes
    Pending --> Resolved: agent resolves (≤2 customer replies)
    Pending --> Escalated: 2-strike fires OR manual escalate
    Escalated --> Resolved: owner negotiation resolved\nOR scheduled chat closes + owner summary
    Resolved --> [*]
    Escalated --> Escalated: chat room scheduled
```

---

## 17. State machine — a ChatRoom

```mermaid
stateDiagram-v2
    [*] --> scheduled: POST /schedule-chat
    scheduled --> cancelled: Owner or Agent cancels before start_at
    scheduled --> open: now ≥ start_at AND both keys validated (or just first)
    open --> closed: now ≥ start_at + duration_min
    cancelled --> [*]
    closed --> [*]
```

---

## 18. State machine — a DiscountApproval

```mermaid
stateDiagram-v2
    [*] --> pending: Agent requests
    pending --> approved: Manager approves (within ceiling)
    pending --> denied: Manager denies
    pending --> escalated_to_owner: Manager escalates OR requested > ceiling
    escalated_to_owner --> approved: Owner approves
    escalated_to_owner --> denied: Owner denies
    approved --> [*]
    denied --> [*]
```

---

## 19. Putting it together — "a day in the life" matrix

| Time of day      | Admin            | Auditor             | Billing             | Owner                          | Curator              | Manager                          | Reviewer             | Agent                              | Customer                  |
| ---------------- | ---------------- | ------------------- | ------------------- | ------------------------------ | -------------------- | -------------------------------- | -------------------- | ---------------------------------- | ------------------------- |
| **Start of day** | Scan diagnostics | Set scope           | Scan usage tiles    | Skim escalations               | Open gap inbox      | Review SLA breaches + approvals  | Open QA queue        | Pick company + open Pending queue  | Check My Queries          |
| **Mid-day**      | Provision a user | Run a sample audit  | Generate invoices   | Resolve a negotiation         | Upload a missing doc | Bulk-reassign · approve discounts| Grade 5 resolved     | Send replies · request discounts   | Reply to a thread         |
| **Afternoon**    | Reindex a tenant | Export CSV evidence | Suspend non-payer   | Enter scheduled chat           | Reindex tenant       | Update a goal · send announcement| Calibrate with Manager| Schedule a chat for hard escalation| Enter scheduled chat     |
| **End of day**   | Skim audit log   | Sign-off period     | Reconcile sends     | Review judge findings          | Verify retrieval traces| Pull weekly CSV                | Submit final grades  | Close out queue                    | Rate resolved queries     |

---

## 20. References

- Role taxonomy: [`roles_and_access.md`](./roles_and_access.md)
- Intake channels: [`query_intake_channels.md`](./query_intake_channels.md)
- Implementation status: [`roles_checklist.md`](./roles_checklist.md)
- Migration phases: [`state_preparation.md`](./state_preparation.md)
- API surface: [`api_contracts.md`](./api_contracts.md)
- CRUD operations: [`crud_operations.md`](./crud_operations.md)
- DB schema: [`db_schema.md`](./db_schema.md)
- Architecture: [`architecture.md`](./architecture.md)
- Integration skill (wiring backend ↔ frontend): [`skills/integration_skill.md`](./skills/integration_skill.md)
