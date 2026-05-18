# Build Prompt — 08 — Agent (Frontend, Next.js 14)

> Paste everything below into your AI coding assistant. The assistant should produce a working, tested Next.js implementation that satisfies every Acceptance Criterion. **Depends on `00-single-login.md` and `08-agent-backend.md`** — login + cookie + middleware + Agent backend endpoints must already exist.

---

## Role

You are a senior frontend engineer working on **Smart Sales Systems** (Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui + TanStack Query + Zod). Your task is to build the **complete Agent dashboard** at `/agent/*` (and the legacy `/sales/*` alias) in `frontend-next/`: every page, component, hook, and form the customer-facing executor needs.

---

## Goal

Deliver an Agent dashboard rooted at `/agent` that gives a customer-facing rep everything they need to: pick a company (multi-tenant switcher), see their queue, review the AI draft with a judge badge, edit + send replies, handle 2-strike escalations + manual escalations, request discounts (auto-applied or cascade to Manager), schedule chat rooms, and watch their personal performance — across one or many companies.

---

## Foundational context (read before writing code)

- Agent role definition + permissions: [`../roles_and_access.md`](../roles_and_access.md) §9 + master matrix §13.
- Agent workflows (visuals): [`../role_workflows.md`](../role_workflows.md) §8 + [`../visuals/08-agent-formerly-salesrep__81-first-time.png`](../visuals/08-agent-formerly-salesrep__81-first-time.png), [`../visuals/08-agent-formerly-salesrep__82-returning-happy-path.png`](../visuals/08-agent-formerly-salesrep__82-returning-happy-path.png), [`../visuals/08-agent-formerly-salesrep__83-returning-customer-unhappy-2-strike-escalation.png`](../visuals/08-agent-formerly-salesrep__83-returning-customer-unhappy-2-strike-escalation.png).
- Backend surface this consumes: [`../api_contracts.md`](../api_contracts.md) §11.9 (after `08-agent-backend.md` lands, this becomes current §6).
- Integration wiring conventions: [`../skills/integration_skill.md`](../skills/integration_skill.md) entire doc.
- Implementation tracker: [`../roles_checklist.md`](../roles_checklist.md) §8.

---

## Flexibility & Adaptation

> This prompt is a **starting blueprint**, not a contract. Read the [Adaptive Development Principles](./README.md#adaptive-development-principles) in the README before you start. Tl;dr:
>
> - **🟢 Safe** to deviate on: component decomposition under `components/agent/`; choice of which icon represents each channel; whether the reply composer is a separate component or inlined; the exact polling interval (30s is a starting suggestion — drop to 10s for `/queue?status=Escalated`); the exact HTML sanitiser config; folder layout inside `components/agent/`.
> - **🟡 Flag in PR description** if you diverge on: route tree changes (adding / removing pages from §4); switching from the two-column query detail to a different layout (single-column wizard, three-column with inspector, etc.); not pre-populating the composer with the latest AI draft; switching the multi-co state from cookie+context to a different mechanism (URL search param, server-only cookie, etc.); using a different drag-and-drop / virtualization library.
> - **🔴 Update foundational docs first** if you discover: the Agent needs a capability the role spec doesn't list (e.g. read another rep's queries for handover) — update `roles_and_access.md` §9.3 first; the channel UX matrix is missing a channel that's about to land — update `query_intake_channels.md`; the JudgeBadge contract changes (e.g. judge now returns severity instead of float overall) — update `roles_and_access.md` §11A.1 and the API contract.
>
> **Non-negotiables** (do not adapt): every API call goes through `lib/api/agent.ts`; no `localStorage` for the JWT (`agent_company` UI-pref cookie is fine — non-HttpOnly); composer's Send button **must** be disabled when `hallucination_flag === true`; schedule-chat **must** be disabled unless the query is escalated; secret keys never appear in the Agent UI.

---

## Scope

### In scope
- Every page under `/agent/*` (and `/sales/*` legacy redirect) listed in §4.
- Typed API client module `lib/api/agent.ts` + Zod mirrors in `lib/api/schemas.ts` for every Agent schema.
- A persistent **multi-company switcher** in the topbar (top-level Agent UX primitive).
- Server Actions for every mutation.
- shadcn/ui primitives + Recharts.
- TanStack Table v8 for the queue table.
- Playwright smoke tests for: pick company → open Pending → draft → send; 2-strike inbound → auto-escalate badge; discount request → Manager queue (mock); schedule chat with two emails.

### Out of scope
- Live chat-room WebSocket UI (the Agent enters only the post-close transcript here; the live experience for Owner+Customer is in `09-chat-rooms-frontend.md`).
- The Manager-facing discount-approval queue (`06-manager-frontend.md`).
- The Customer portal (`09-customer-frontend.md`).

---

## §4 — Route tree (canonical)

```
frontend-next/
└── app/
    └── (dashboard)/
        └── agent/
            ├── layout.tsx                       # Agent guard + sidebar + company switcher
            ├── page.tsx                         # /agent                        — Overview
            ├── queue/
            │   ├── page.tsx                     # /agent/queue                  — list (Pending/Escalated/Resolved tabs)
            │   └── [queryId]/page.tsx           # /agent/queue/[queryId]        — detail with reply composer
            ├── discounts/
            │   └── page.tsx                     # /agent/discounts              — own requests + statuses
            ├── chats/
            │   └── page.tsx                     # /agent/chats                  — scheduled / closed rooms (transcripts)
            ├── products/
            │   └── page.tsx                     # /agent/products               — read-only catalogue
            └── settings/
                └── page.tsx                     # /agent/settings               — theme + notification prefs
```

Also: `/sales/*` exists only as a `redirect` configured in `next.config.mjs` to the matching `/agent/*` URL (or middleware handles it). UX-wise they're identical.

---

## §5 — Topbar + sidebar shell

Topbar (Client island):

```
[Smart Sales] [ Company: ▾  All Companies | Acme | Globex ]    [theme] [Q badge "12"] [avatar]
```

- **Company switcher**: a `Select` (or shadcn `Combobox`) populated by `api.agent.companies()` showing each company + its pending count badge. Selection persists in a cookie `agent_company` (or `localStorage` *only for UI prefs, never auth*).
- **Queue badge**: small pill next to the avatar showing total Pending across the selected company (or all). Updates every 30s.
- **Notifications dropdown** (later): for now a `Bell` icon with no content.

Sidebar items: `LayoutDashboard` (Overview), `Inbox` (Queue), `Tag` (Discounts), `MessageSquare` (Chats), `Package` (Products), `Settings`.

The layout reads the cookie/local pref for the selected company and passes it down via React Context (`SelectedCompanyContext`) so every page knows the filter.

---

## §6 — Page-by-page spec

### 6.1 `/agent` — Overview

Server component fetches (scoped to selected company or all):
- `api.agent.stats({ company })`
- `api.agent.queries.list({ status: 'Pending', limit: 5 })`
- `api.agent.queries.list({ status: 'Escalated', limit: 5 })`

Tiles: Active queries, Resolved (today / 7d), Escalated, Avg response (min), Efficiency %, Last 30d resolved, Last 30d avg response.

Two lists: "Oldest pending" (top 5) and "My escalations" (top 5). Each row links to `/agent/queue/[queryId]`.

Quick actions: "Open oldest pending", "Request discount" (opens the dialog on the first pending), "Schedule a chat" (disabled unless an escalated query is selected).

### 6.2 `/agent/queue` — Queue

- **Tabs:** `Pending` (default) · `Escalated` · `Resolved`.
- **Filter bar:** company (overrides topbar selection per-page), priority (normal/high), date range (default last 7d for Resolved; none for the others), search by `complaint_id` or `complainant_email`.
- **Table (TanStack Table v8):**
  - Columns: `complaint_id`, customer email, status badge, priority chip, channel chip (envelope=email, form=Google Form, chat-bubble=widget, etc.), age (relative time), deadline countdown (only if escalated; red <2h), `reply_count / rep_reply_count` mini counter, channel + (last action: who/when).
  - Row click → `/agent/queue/[queryId]`.
  - Server-rendered initial data; TanStack `useQuery` for live filter changes with 30s polling.

### 6.3 `/agent/queue/[queryId]` — Query detail (the **main work surface**)

Two-column layout (responsive: stacks on small screens).

**Left column — Thread**
- Header card: `complaint_id`, customer email + small avatar, channel + product (if known), status + priority + escalation reason (if any), `reply_count / rep_reply_count`, "Customer history: 3 prior queries" link.
- Message timeline (chronological): each message is a card.
  - Inbound (customer): grey background, left-aligned.
  - Outbound (agent): purple background, right-aligned.
  - Outbound (owner/system, post-escalation): different color (e.g. blue).
  - Each message: avatar, author label, timestamp, body (HTML if present, else plain), expandable raw email headers for inbound.
- **Reply composer** at the bottom (only visible if `status==='Pending'` and the query is in the Agent's scope):
  - Textarea pre-populated with the latest AI draft if one exists in `query_messages` of `direction='outbound' AND author_id IS NULL`; otherwise "Generate draft" button to call `api.agent.queries.draft(id)`.
  - **Judge badge** above the textarea (component `<JudgeBadge score>`): green ≥4.0, amber 2.0–4.0, red <2.0; tooltip shows the rubric numbers; if `hallucination_flag===true` show a red "Hallucination" pill and **disable the Send button**.
  - Buttons: "Regenerate draft" (calls `/draft` again), "Send reply" (calls `/send`), "Escalate" (opens dialog), "Request discount" (opens dialog), "Schedule chat" (only if `status === 'Escalated'`).

**Right column — Side panel**
- "Customer" card: email, history count, link to other queries.
- "Product" card (if known): name, price, max_discount_pct, link to `/agent/products`.
- "SLA" card: created_at, escalated_at, deadline_at, countdown (`<DeadlineCountdown>`).
- "Discount requests" card: list any `DiscountApprovalOut` for this query with status chips.
- "Chat rooms" card: list scheduled / open / closed rooms; for closed ones, "View transcript".
- "Audit trail" card: filtered `ActivityLog` for this query (last 10).

**Dialogs:**
- **Escalate dialog:** `reason` (textarea, required ≥10 chars), `priority` (radio normal/high). Submit → `api.agent.queries.escalate(id, body)` → invalidate + toast "Escalated. Owner notified."
- **Discount-request dialog:** `product_id` (auto-select from query if known; else combobox of company's products), `requested_pct` (number, 1–100), `note` (optional textarea). Submit → `api.agent.queries.discountRequest(id, body)`. If response status is `approved` (in-cap), show success "Discount applied at X% — final answer ready to send"; if `pending`, show "Sent to Manager for approval".
- **Schedule-chat dialog:** `start_at` (datetime-local input; min = now + 1 hour rounded), `duration_min` (Select 15/30/45/60/90). Submit → `api.agent.queries.scheduleChat(id, body)`. On success: toast "Chat scheduled — secret keys emailed to Owner and Customer."

### 6.4 `/agent/discounts`

- Table of all `DiscountApprovalOut` rows where `requested_by === me`.
- Columns: query link (`complaint_id`), product, requested %, approved %, status badge (pending=amber, approved=green, denied=red, escalated_to_owner=purple), created_at, decided_at.
- Filter by status; empty state "No discount requests yet."

### 6.5 `/agent/chats`

- Two sections: **Scheduled** and **Closed**.
- Scheduled: card per `chat_room`, columns: query, customer, start_at countdown, duration. No actions (Agent doesn't enter live rooms).
- Closed: card with "View transcript" → opens a Drawer/Sheet showing the `chat_messages` list (read-only).

### 6.6 `/agent/products`

- Card grid: product name (link to detail row only — no detail page for Agent), price, max_discount_pct, doc count chip (read-only).
- Filter by company; search by name.

### 6.7 `/agent/settings`

- Personal preferences:
  - Theme select (system/light/dark) → `PUT /auth/me`.
  - Notification prefs (placeholder for now — checkbox "Email me on new query assignment"; persists in `users.preferences` JSON when that column lands).
- Logout button.

---

## §7 — Shared components (Agent-scoped, into `components/agent/`)

| Component                          | Purpose |
| ---------------------------------- | ------- |
| `<CompanySwitcher>`                | Topbar Combobox; updates the `SelectedCompanyContext`. |
| `<StatusBadge status>`             | Pending (amber), Escalated (red), Resolved (emerald). |
| `<PriorityChip priority>`          | normal / high. |
| `<ChannelChip channel>`            | Icon + label for each intake channel. |
| `<DeadlineCountdown until>`        | Live ticking timer; red <2h, amber <6h, grey otherwise. |
| `<MessageBubble message direction>`| Renders one `QueryMessage` (inbound/outbound). |
| `<ReplyComposer queryId initialDraft judgeScore onSent>` | Textarea + buttons; handles regenerate/send/escalate/discount/chat actions. |
| `<JudgeBadge score>`               | Tooltip with rubric numbers; colours per §6.3; emits a `block` flag when score requires blocking. |
| `<EscalateDialog queryId open onClose>` | Form dialog. |
| `<DiscountDialog queryId companyId currentProductId open onClose>` | Form dialog. |
| `<ScheduleChatDialog queryId open onClose>` | Form dialog. |
| `<CustomerHistoryCard email>`      | Compact card with link to other queries from same email. |
| `<ChatTranscript roomId>`          | Sheet content for closed rooms. |
| `<QueueTable rows initialData>`    | Wrapper around TanStack Table v8. |

---

## §8 — Typed API client — `lib/api/agent.ts`

```ts
import { z } from 'zod';
import { fetchWithAuth, qs } from './http';
import {
  AgentCompanyOut, AgentStats, QueryOut, QueryDetail, AgentDraftResult, AgentSendRequest, AgentSendResult,
  AgentEscalateRequest, DiscountRequest, DiscountApprovalOut, ChatRoomScheduleRequest, ChatRoomOut,
  ChatMessageOut, ProductOut,
} from './schemas';

export const agent = {
  companies: () => fetchWithAuth('/api/v1/agent/companies', z.array(AgentCompanyOut)),
  stats:     (q?: { company?: string }) =>
                  fetchWithAuth(`/api/v1/agent/stats?${qs(q)}`, AgentStats),
  queries: {
    list:     (q?: { company?: string; status?: string; page?: number; page_size?: number; q?: string }) =>
                  fetchWithAuth(`/api/v1/agent/queries?${qs(q)}`, z.array(QueryOut)),
    one:      (id: string) =>
                  fetchWithAuth(`/api/v1/agent/queries/${id}`, QueryDetail),
    draft:    (id: string) =>
                  fetchWithAuth(`/api/v1/agent/queries/${id}/draft`, AgentDraftResult, { method: 'POST' }),
    send:     (id: string, body: AgentSendRequest) =>
                  fetchWithAuth(`/api/v1/agent/queries/${id}/send`, AgentSendResult, {
                    method: 'POST', body: JSON.stringify(body),
                  }),
    escalate: (id: string, body: AgentEscalateRequest) =>
                  fetchWithAuth(`/api/v1/agent/queries/${id}/escalate`, QueryDetail, {
                    method: 'POST', body: JSON.stringify(body),
                  }),
    discountRequest: (id: string, body: DiscountRequest) =>
                  fetchWithAuth(`/api/v1/agent/queries/${id}/discount-request`, DiscountApprovalOut, {
                    method: 'POST', body: JSON.stringify(body),
                  }),
    scheduleChat: (id: string, body: ChatRoomScheduleRequest) =>
                  fetchWithAuth(`/api/v1/agent/queries/${id}/schedule-chat`, ChatRoomOut, {
                    method: 'POST', body: JSON.stringify(body),
                  }),
    chatRooms: (id: string) =>
                  fetchWithAuth(`/api/v1/agent/queries/${id}/chat-rooms`, z.array(ChatRoomOut)),
    transcript: (id: string, roomId: string) =>
                  fetchWithAuth(`/api/v1/agent/queries/${id}/chat-rooms/${roomId}/transcript`,
                                z.array(ChatMessageOut)),
  },
  products: (company: string) =>
                  fetchWithAuth(`/api/v1/agent/products?${qs({ company })}`, z.array(ProductOut)),
};
```

Add Zod mirrors for every schema in `08-agent-backend.md` §3 to `lib/api/schemas.ts`. Add `agent` to the `api` object in `lib/api/index.ts`.

---

## §9 — Server Actions (`app/(dashboard)/agent/_actions.ts`)

```ts
'use server';
import { revalidateTag } from 'next/cache';
import { api } from '@/lib/api';

export async function sendReply(id: string, body) {
  const res = await api.agent.queries.send(id, body);
  revalidateTag('agent:queue'); revalidateTag(`agent:query:${id}`);
  return res;
}
export async function escalate(id: string, body)         { /* ... */ }
export async function requestDiscount(id: string, body)  { /* ... */ }
export async function scheduleChat(id: string, body)     { /* ... */ }
export async function regenerateDraft(id: string)        { /* ... */ }
```

Tag every server-fetch with `agent:queue`, `agent:query:<id>`, `agent:companies`, `agent:stats:<companyOrAll>`.

---

## §10 — Multi-company UX details

- `SelectedCompanyContext` provides `{ selectedCompanyId: string | 'ALL', setSelected(id) }`.
- The topbar `<CompanySwitcher>` is the only writer; sets a `agent_company` cookie (NOT HttpOnly — UI pref only) so server components can read it via `cookies()`.
- Server components default to the cookie value; if absent, default to `'ALL'`.
- Every page passes `company` (resolved from context/cookie) to the API client; `'ALL'` means omit the param.
- Switching companies must invalidate `['agent', 'queue']` and `['agent', 'stats']` queries.

---

## §11 — Channel UX matrix (icons)

| Channel       | Icon (lucide)    | Tooltip                   |
| ------------- | ---------------- | ------------------------- |
| `google_form` | `ClipboardList`  | "Google Form"             |
| `portal`      | `Globe`          | "Customer portal"         |
| `email`       | `Mail`           | "Inbound email"           |
| `widget`      | `MessageCircle`  | "Website chat widget"     |
| `whatsapp`    | `Phone` (or WA)  | "WhatsApp"                |
| `sms`         | `Smartphone`     | "SMS"                     |
| `voice`       | `PhoneCall`      | "Voice call"              |
| `social_x`    | `Twitter`        | "X DM"                    |
| `partner`     | `Plug`           | "Partner API"             |

If `channel` is unknown, render `Inbox` with tooltip "Unknown channel".

---

## §12 — Acceptance criteria (must all pass)

Playwright + manual smoke:

- [ ] Log in as an Agent assigned to two companies → topbar shows both in switcher; default = "All".
- [ ] `/agent/queue?status=Pending` shows only pending queries for the selected company (or all).
- [ ] Open a query → reply composer is enabled; "Regenerate draft" fetches a new body; "Send reply" inserts the message and the new outbound bubble appears in the timeline without a full reload.
- [ ] If `judge_score.hallucination_flag === true`, "Send reply" is disabled with a tooltip; "Regenerate draft" is enabled.
- [ ] Escalate dialog requires reason ≥ 10 chars; on submit the status badge flips to Escalated and `deadline_at` appears in the SLA card.
- [ ] Discount dialog with `requested_pct` within cap → toast "Discount applied"; status doesn't change. With `requested_pct` above cap → toast "Sent to Manager"; row appears in `/agent/discounts` with status `pending`.
- [ ] Schedule-chat dialog is **disabled** for non-escalated queries; for escalated queries, on submit the toast says "Secret keys emailed to Owner and Customer" and the new room appears in `/agent/chats > Scheduled`.
- [ ] When inbound bumps `reply_count` to 3 (simulate via the backend's `email_inbound.ingest_inbound_message`), the query in the Agent's UI flips to Escalated on the next poll, the timeline shows the new inbound bubble, and a banner "Auto-escalated by 2-strike rule" is visible.
- [ ] `/agent/chats > Closed > View transcript` opens a Sheet with the chat messages in order.
- [ ] `/sales/queue` URL redirects to `/agent/queue` (or works identically).
- [ ] No inline `fetch('/api/v1/…')` outside `lib/api/agent.ts`.
- [ ] No `localStorage.setItem('token', …)` anywhere; the `agent_company` cookie is *not* HttpOnly.
- [ ] Theme toggle persists.

Run:
```bash
cd frontend-next
pnpm install
pnpm dev
pnpm test:e2e --grep agent
```

---

## §13 — Implementation notes (gotchas)

- The reply composer must **always** pre-populate from the latest preview draft (system-authored outbound message) — never overwrite the rep's in-progress edit. If the rep has typed anything, show a confirm before regenerating.
- The `<MessageBubble>` for inbound emails should render `html_body` if present, falling back to `body`. Sanitise HTML with `DOMPurify` (add the dep) — never `dangerouslySetInnerHTML` raw email HTML.
- The 30s polling for queue + stats means an auto-escalation will surface within at most 30s — fine for now. Don't add SSE/WS in this prompt.
- The schedule-chat dialog should clamp `start_at` to **at least 1 hour from now** (server allows less; UI nudges users away from impossible-to-react-to times).
- The discount cap is on the `Product` — fetch via `api.agent.products(company)` once per session and cache in a TanStack Query; let the dialog show the cap inline so reps don't request blind.
- Use `Date.parse(server_timestamp)` carefully — server times are UTC ISO with offset; render with `Intl.DateTimeFormat` in the user's locale.
- For the queue table at >200 rows, enable virtualisation via `@tanstack/react-virtual` (no design changes needed; just wrap the rows).
- Channel-specific outbound notice: when a Google-Form query gets sent, the toast should say "Reply emailed". When a widget query gets sent, "Reply will appear in the chat widget" (since widget outbound is `widget_pending` until `04-widget.md`).
- When the Agent has zero assigned companies (just provisioned, no UCA rows yet), show an empty-state on `/agent` saying "Your manager hasn't assigned you to a company yet. Hang tight — they'll be in touch." Don't crash on empty switcher.
- The `<JudgeBadge>` must remain functional when the backend returns `null` for `judge_pre_send` (no judge data) — render a grey "Draft (judge unavailable)" pill.

---

## §14 — Test plan (paste-ready)

```bash
# Boot stack
cd backend && uvicorn app.main:app --reload &
cd frontend-next && pnpm dev &

# Manual flow as an Agent with two companies:
# 1. /login → land on /agent
# 2. Switch to company A → queue filters
# 3. Open a Pending query → "Generate draft" → tweak → "Send reply" → bubble appears
# 4. Trigger 2-strike on the same query via a backend stub call
#    (POST /test/ingest-reply for the test env) → wait 30s → see auto-escalate banner
# 5. From the escalated query → "Schedule chat" → confirm both emails landed (mailcatcher)
# 6. From a different pending query → "Request discount" above cap → see entry in /agent/discounts
# 7. /agent/chats > Closed > pick the now-closed room → view transcript

pnpm test:e2e --grep agent
```

---

## §15 — Update docs in the same PR

- [`../roles_checklist.md`](../roles_checklist.md) §8 (Agent) — flip ⭐ → ✅ for frontend rows #3, #4, #6 (UI part), #8 (UI auto-escalate badge), #10, #11, #12.
- [`../api_contracts.md`](../api_contracts.md) — no further changes (backend prompt updated).
- [`../skills/integration_skill.md`](../skills/integration_skill.md) §7 per-role wiring map — Agent row ✅ across all three columns.

---

## §16 — What "done" looks like

An Agent assigned to multiple companies can log in, switch between tenants, pull a queue, work through queries with the AI draft + judge badge, escalate or schedule chats, request discounts that flow through the cascade, and see auto-escalations land in their UI without manual intervention. The legacy `/sales` URL still works. All acceptance tests pass. The Agent row of [`../roles_checklist.md`](../roles_checklist.md) §8 is fully ✅ on the frontend column.
