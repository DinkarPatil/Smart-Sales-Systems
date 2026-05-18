# Build Prompt — 01 — Admin (Frontend, Next.js 14)

> Paste everything below into your AI coding assistant. The assistant should produce a working, tested Next.js implementation that satisfies every Acceptance Criterion. **Depends on `00-single-login.md` and `01-admin-backend.md`** — login + cookie + middleware + Admin backend endpoints must already exist.

---

## Role

You are a senior frontend engineer working on **Smart Sales Systems** (Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui + TanStack Query + Zod). Your task is to build the **complete Admin dashboard** in `frontend-next/`: every page, component, hook, and form the Admin role needs to govern the platform.

---

## Goal

Deliver an Admin dashboard rooted at `/admin` that surfaces every capability from the Admin row of the master permission matrix ([`../roles_and_access.md`](../roles_and_access.md) §13). The Admin can: read platform stats, manage users (CRUD + role + activation), manage companies, manage multi-company assignments, view real system logs, view RAG diagnostics, trigger per-tenant reindex, browse the cross-tenant audit feed.

---

## Foundational context (read before writing code)

- Admin role definition + permissions: [`../roles_and_access.md`](../roles_and_access.md) §2 + master matrix §13.
- Admin workflows (first-time + returning): [`../role_workflows.md`](../role_workflows.md) §1; visuals at [`../visuals/01-admin__11-first-time.png`](../visuals/01-admin__11-first-time.png) and [`../visuals/01-admin__12-returning.png`](../visuals/01-admin__12-returning.png).
- Backend surface this consumes: [`../api_contracts.md`](../api_contracts.md) §3 + §11.2 (after `01-admin-backend.md` lands, both are current).
- Integration / wiring conventions: [`../skills/integration_skill.md`](../skills/integration_skill.md) entire doc (cookie + middleware + Zod mirror + TanStack Query + Server Actions + error contract).
- Implementation tracker: [`../roles_checklist.md`](../roles_checklist.md) §1.

---

## Flexibility & Adaptation

> This prompt is a **starting blueprint**, not a contract. Read the [Adaptive Development Principles](./README.md#adaptive-development-principles) in the README before you start. Tl;dr:
>
> - **🟢 Safe** to deviate on: component decomposition within `components/admin/`; choice of charts (Recharts vs. another); icon swaps; column ordering in tables; pagination size defaults; whether you use `useFormState` or `useMutation` for a given form; whether `/admin/companies` is a table or a card grid; Tailwind class organisation; folder layout under `components/`.
> - **🟡 Flag in PR description** if you diverge on: route tree (adding / removing pages from §4); tab ordering on user / company detail pages; what's a Server Component vs. Client Component; switching from TanStack Query to native React Server Component caching for some flows; replacing shadcn `Dialog` with a different modal lib.
> - **🔴 Update foundational docs first** if you discover: a backend endpoint shape changes mid-PR (update Zod mirror **and** `api_contracts.md`); a new Admin page is needed that the role spec didn't enumerate (update `roles_and_access.md` §2.3 and `roles_checklist.md` §1); the cookie/middleware contract from `00-single-login.md` doesn't fit (escalate to that prompt's spec).
>
> **Non-negotiables** (do not adapt): all API calls go through `lib/api/admin.ts` (no inline fetch); auth via HttpOnly cookie only; every list page has an empty state + a loading skeleton; every destructive action goes through `<AlertDialog>`.

---

## Scope

### In scope
- Every page under `/admin/*` listed in §4 below.
- Typed API client module `lib/api/admin.ts` + Zod mirrors for all Admin schemas in `lib/api/schemas.ts`.
- Server Actions for every mutation.
- TanStack Query setup (already present from `00-single-login.md`? — if not, add it now).
- shadcn/ui primitives (`Card`, `Table`, `Dialog`, `AlertDialog`, `Form`, `Input`, `Select`, `Badge`, `Tabs`, `Toast`, `DropdownMenu`, `Combobox`, `Sheet`).
- Recharts for two charts (queries by day, status breakdown donut).
- TanStack Table v8 for the user / company / audit tables.
- Playwright smoke tests for the critical paths.

### Out of scope
- Other roles' dashboards.
- Real-time updates (poll every 30s for stats; SSE is later).
- Theme customisation beyond `light | dark | system` mapped from `User.theme`.

---

## §4 — Route tree (canonical)

```
frontend-next/
└── app/
    └── (dashboard)/
        └── admin/
            ├── layout.tsx                       # Admin-only guard + sidebar shell
            ├── page.tsx                         # /admin                       — Overview
            ├── users/
            │   ├── page.tsx                     # /admin/users                 — list + filter
            │   ├── new/page.tsx                 # /admin/users/new             — provision form
            │   └── [userId]/page.tsx            # /admin/users/[userId]        — edit + assignments + activity
            ├── companies/
            │   ├── page.tsx                     # /admin/companies             — list + aggregates
            │   ├── new/page.tsx                 # /admin/companies/new         — create form
            │   └── [companyId]/page.tsx         # /admin/companies/[companyId] — detail + reindex + delete
            ├── assignments/
            │   └── page.tsx                     # /admin/assignments           — cross-tenant UCA browser
            ├── system/
            │   ├── logs/page.tsx                # /admin/system/logs           — filterable log viewer
            │   └── diagnostics/page.tsx         # /admin/system/diagnostics    — RAG/LLM tiles + charts
            ├── audit/
            │   └── page.tsx                     # /admin/audit                 — unified audit feed
            └── settings/
                └── page.tsx                     # /admin/settings              — personal prefs (theme)
```

`layout.tsx` for `/admin` re-checks `payload.role === "Admin"` (defence-in-depth — middleware already gates the prefix) and renders the persistent sidebar.

---

## §5 — Sidebar / top-bar shell

```
┌─────────────────────────────────────────────────┐
│ [Smart Sales]                  [theme] [avatar] │
├──────┬──────────────────────────────────────────┤
│ /    │                                          │
│ Over │       <page content>                     │
│ User │                                          │
│ Comp │                                          │
│ Assn │                                          │
│ Logs │                                          │
│ Diag │                                          │
│ Aud  │                                          │
│ Set  │                                          │
└──────┴──────────────────────────────────────────┘
```

Sidebar items (lucide icons): `LayoutDashboard` (Overview), `Users`, `Building2` (Companies), `Network` (Assignments), `Logs` (System logs), `Activity` (Diagnostics), `ScrollText` (Audit), `Settings`.

Top-bar: theme toggle (`/auth/me` → `PUT /auth/me`), user dropdown (avatar + email + Logout → `/api/auth/logout`).

Layout shell is a Server Component; the topbar interactive bits are Client islands.

---

## §6 — Page-by-page spec

### 6.1 `/admin` — Overview

**Server component fetches:**
- `api.admin.stats()` → tiles
- `api.admin.system.diagnostics()` → RAG tiles
- `api.admin.audit.list({ limit: 10 })` → recent activity strip

**Tiles:** Total users, Total companies, Total products, Total queries, Pending, Resolved, Escalated, Chat rooms open, Judge block rate 24h, Per-tenant collections, Avg query latency.

**Charts (Recharts, client):**
- Last-30-day query volume (line) — derive from `api.admin.audit.list({ kind: "QUERY_CREATED", from: now-30d })` count grouping by day; or, if backend exposes a dedicated endpoint later, swap to that.
- Status breakdown donut — from `total_queries / pending / resolved / escalated`.

**Quick actions row (buttons):** "Provision user" (→ `/admin/users/new`), "Create company" (→ `/admin/companies/new`), "View system logs", "Open audit feed".

**Recent activity strip:** last 10 entries from `api.admin.audit.list({ limit: 10 })` — `{ timestamp, kind, summary, actor_email }` rendered as compact rows.

Refresh: `refetchInterval: 30_000` on the client tiles.

### 6.2 `/admin/users` — User list

- Filter bar: `role` (multi), `is_active` (yes/no/all), free-text search on `email|full_name`.
- Table (TanStack Table v8 client):
  - Columns: avatar+name, email, role badge, status chip (active/inactive), company chip (or "Unassigned"), created_at, actions.
  - Row click → `/admin/users/[userId]`.
  - Bulk select → "Deactivate selected", "Delete selected" (each with `AlertDialog` confirm).
- Top-right: "Provision user" button.
- Empty state: "No users match these filters."

Data: `api.admin.users.list({ role, is_active, search })` server-fetched + `useQuery` for live filter changes.

### 6.3 `/admin/users/new` — Provision form

- Form fields: `email`, `full_name`, `password`, `role` (Select with all roles except `Customer` and `System`), `company_id` (Combobox of companies — required for Owner/Manager/Agent/Reviewer/Curator).
- Validation (React Hook Form + Zod resolver): valid email, password ≥ 8 chars, company required when role is tenant-scoped.
- Submit → Server Action `provisionUser(body)` → `api.admin.users.create(body)` → `revalidateTag('admin:users')` → redirect to `/admin/users/[newUserId]`.
- On success toast: "User provisioned. Credentials email sent to <email>."

### 6.4 `/admin/users/[userId]` — User detail

Three tabs (`Tabs` primitive):

1. **Profile** — read fields + inline edits for `role`, `is_active`, `company_id` (Combobox). "Save" → Server Action calling `api.admin.users.update(id, body)`. Activation toggles fire `revalidateTag('admin:users')`.
2. **Assignments** (only for `role in {Manager, Agent, Reviewer, Curator}`) — list of `UserCompanyAssignment` rows for this user. Each row shows company name, `role_in_company`, `manager_id`'s name (if any), `status`. Actions: "Add assignment" (opens a Dialog with company + role_in_company + manager_id selects), "Pause"/"Resume" (PATCH), "Revoke" (DELETE with confirm).
3. **Activity** — paginated `api.admin.audit.list({ actor: userId })` and `api.admin.authEvents.list({ user_id: userId })` merged client-side, sorted by timestamp DESC.

Top-right: "Delete user" (`AlertDialog` warns about cascade + last-Admin protection).

### 6.5 `/admin/companies` — Company list

- Card grid (or table — your choice; cards work well here):
  - Each card: name, description, product count, user count, sales-rep count, manager_name, weekly tokens, monthly tokens, suspension state.
  - Click card → `/admin/companies/[companyId]`.
- Top-right: "Create company".

### 6.6 `/admin/companies/new` — Create form

- Form: `name` (required, unique server-side), `description`, `config` (JSON textarea with Zod validation that it parses).
- Submit → Server Action calling `api.admin.companies.create(body)` → toast → redirect.

### 6.7 `/admin/companies/[companyId]` — Company detail

Three tabs:

1. **Overview** — aggregated stats + manager + suspension matrix (re-use `<SuspensionMatrix>` component — see §7).
2. **Team** — `users` filtered by `company_id`, plus a UCA-driven view (since Manager/Agent/Reviewer/Curator may be attached via assignments rather than `users.company_id`).
3. **RAG corpus** — count of products + documents; "Reindex this tenant" button calls `api.admin.companies.reindex(companyId)` and shows a progress toast → final `ReindexResult` summary.

Top-right: "Delete company" (`AlertDialog` lists everything that gets cascade-deleted — products, queries, lead_stats, activity_logs, assignments, vector collection).

### 6.8 `/admin/assignments` — Cross-tenant UCA browser

- Table: every `user_company_assignment` row across the platform.
- Filters: company, role_in_company, status, search by user email.
- Bulk-pause / bulk-revoke (with confirm).
- "Create assignment" button opens a Dialog with user-Combobox + company-Combobox + role + manager_id.

### 6.9 `/admin/system/logs`

- Filter bar: `level` (Select), `since` (datetime-local input, default last 1h), `request_id` (text), free-text search on `message`.
- Table: timestamp · level badge (`DEBUG` grey, `INFO` blue, `WARN` amber, `ERROR` red) · request_id (monospace, copy on click) · message · expand-row to show JSON `extra`.
- Auto-refresh: 10s polling when `level === ERROR`; otherwise 30s.
- "Download visible (CSV)" button.

### 6.10 `/admin/system/diagnostics`

- Top tiles: embedding model name, vector store backend, per-tenant collections, total vectors, avg query latency, cache hit rate, last hour queries, failed queries 24h, judge block rate 24h.
- Banner if `rebuilding_collections` is non-empty: "Reindex in progress for: <list>".
- Buttons: "Trigger reindex for a tenant…" (opens a Dialog with company Combobox).

### 6.11 `/admin/audit`

- Filter bar: `from` / `to` (date range picker), `actor` (Combobox), `company` (Combobox), `kind` (multi-select).
- Table columns: timestamp · kind badge · actor (email link to user detail) · company chip · entity link · summary · expand-row for `details` JSON.
- "Export CSV" button (server action streams the filtered set).

### 6.12 `/admin/settings`

- Personal preferences card: theme (Select `system|light|dark`), display name (read-only — admins edit themselves only via the user detail page).
- Logout button.

---

## §7 — Shared components (Admin-scoped, into `components/admin/`)

| Component                       | Purpose |
| ------------------------------- | ------- |
| `<StatTile title value delta sparklineData?>` | Reusable KPI tile. |
| `<RoleBadge role>`              | Coloured badge for each role string. |
| `<UserStatusChip is_active>`    | Active / Inactive. |
| `<CompanyCombobox onChange>`    | Async-loaded company picker (used in many forms). |
| `<UserCombobox role? onChange>` | Async-loaded user picker, optionally filtered by role. |
| `<SuspensionMatrix admin manager billing>` | Renders the 2×2 (or 2×3 once billing lands) matrix from `roles_and_access.md` §6.3 with the current cell highlighted. |
| `<LogLevelBadge level>`         | Colour-coded level pill. |
| `<JsonViewer data>`             | Collapsible pretty-printer (use a tiny custom impl; no extra deps). |
| `<ConfirmDialog title body onConfirm>` | Wrapper over shadcn `AlertDialog` for one-line confirmations. |
| `<ReindexButton companyId>`     | Trigger + progress toast + final result modal. |
| `<AuditTable rows>`             | Common renderer for `/admin/audit` and the user-detail Activity tab. |

---

## §8 — Typed API client — `lib/api/admin.ts`

```ts
import { z } from 'zod';
import { fetchWithAuth, qs } from './http';
import {
  AdminStats, UserOut, UserCreate, UserUpdate, CompanyOut, CompanyCreate, CompanyUpdate,
  UserCompanyAssignmentOut, UserCompanyAssignmentCreate, UserCompanyAssignmentUpdate,
  SystemLogEntry, RagDiagnostics, ReindexResult, AuditEntry,
} from './schemas';

export const admin = {
  stats: () => fetchWithAuth('/api/v1/admin/stats', AdminStats),
  users: {
    list:   (q?: { role?: string; is_active?: boolean; search?: string }) =>
              fetchWithAuth(`/api/v1/admin/users?${qs(q)}`, z.array(UserOut)),
    create: (b: UserCreate) =>
              fetchWithAuth('/api/v1/admin/users', UserOut, { method: 'POST', body: JSON.stringify(b) }),
    update: (id: string, b: UserUpdate) =>
              fetchWithAuth(`/api/v1/admin/users/${id}`, UserOut, { method: 'PUT', body: JSON.stringify(b) }),
    remove: (id: string) =>
              fetchWithAuth(`/api/v1/admin/users/${id}`, z.void(), { method: 'DELETE' }),
    assignments: {
      list: (uid: string) =>
              fetchWithAuth(`/api/v1/admin/users/${uid}/assignments`, z.array(UserCompanyAssignmentOut)),
      create: (uid: string, b: UserCompanyAssignmentCreate) =>
              fetchWithAuth(`/api/v1/admin/users/${uid}/assignments`,
                            UserCompanyAssignmentOut, { method: 'POST', body: JSON.stringify(b) }),
    },
  },
  assignments: {
    update: (id: string, b: UserCompanyAssignmentUpdate) =>
              fetchWithAuth(`/api/v1/admin/assignments/${id}`,
                            UserCompanyAssignmentOut, { method: 'PATCH', body: JSON.stringify(b) }),
    remove: (id: string) =>
              fetchWithAuth(`/api/v1/admin/assignments/${id}`, z.void(), { method: 'DELETE' }),
  },
  companies: {
    list:    () => fetchWithAuth('/api/v1/admin/companies', z.array(CompanyOut)),
    create:  (b: CompanyCreate) =>
                fetchWithAuth('/api/v1/admin/companies', CompanyOut, { method: 'POST', body: JSON.stringify(b) }),
    remove:  (cid: string) =>
                fetchWithAuth(`/api/v1/admin/companies/${cid}`, z.void(), { method: 'DELETE' }),
    reindex: (cid: string) =>
                fetchWithAuth(`/api/v1/admin/companies/${cid}/reindex`, ReindexResult, { method: 'POST' }),
  },
  system: {
    logs:        (q?: { since?: string; level?: string; limit?: number; request_id?: string }) =>
                    fetchWithAuth(`/api/v1/admin/system/logs?${qs(q)}`, z.array(SystemLogEntry)),
    diagnostics: () => fetchWithAuth('/api/v1/admin/system/diagnostics', RagDiagnostics),
  },
  audit: {
    list: (q?: { from?: string; to?: string; actor?: string; company?: string; kind?: string; limit?: number }) =>
            fetchWithAuth(`/api/v1/admin/audit?${qs(q)}`, z.array(AuditEntry)),
  },
  authEvents: {
    list: (q: { user_id?: string; from?: string; limit?: number }) =>
            fetchWithAuth(`/api/v1/admin/auth-events?${qs(q)}`, z.array(AuditEntry)),
  },
};
```

Mirror every backend Pydantic schema in `lib/api/schemas.ts` (see [`../skills/integration_skill.md`](../skills/integration_skill.md) §2 for conventions). Add to `lib/api/index.ts`:

```ts
import { admin } from './admin';
export const api = { auth, admin /* …other roles later */ };
```

---

## §9 — Server Actions (`app/(dashboard)/admin/_actions.ts`)

```ts
'use server';
import { revalidateTag } from 'next/cache';
import { api } from '@/lib/api';

export async function provisionUser(b) { const u = await api.admin.users.create(b); revalidateTag('admin:users'); return u; }
export async function updateUser(id, b)   { const u = await api.admin.users.update(id, b); revalidateTag('admin:users'); return u; }
export async function deleteUser(id)      { await api.admin.users.remove(id);  revalidateTag('admin:users'); }
export async function createCompany(b)    { const c = await api.admin.companies.create(b); revalidateTag('admin:companies'); return c; }
export async function deleteCompany(cid)  { await api.admin.companies.remove(cid); revalidateTag('admin:companies'); }
export async function reindexCompany(cid) { const r = await api.admin.companies.reindex(cid); revalidateTag('admin:diagnostics'); return r; }
export async function createAssignment(uid, b) { const a = await api.admin.users.assignments.create(uid, b); revalidateTag('admin:assignments'); return a; }
export async function updateAssignment(id, b)  { const a = await api.admin.assignments.update(id, b); revalidateTag('admin:assignments'); return a; }
export async function deleteAssignment(id)     { await api.admin.assignments.remove(id); revalidateTag('admin:assignments'); }
```

Tag every server-fetch with the matching tag (`{ next: { tags: ['admin:users'] } }`, etc.).

---

## §10 — TanStack Query setup

`app/(dashboard)/admin/providers.tsx` (Client Component):

```ts
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }));
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
```

Wrap the `(dashboard)/admin/layout.tsx` content with `<Providers>` so client islands can use `useQuery` / `useMutation`.

Convention for keys: `['admin', 'users', filterObj]`, `['admin', 'user', userId]`, `['admin', 'companies']`, `['admin', 'system', 'diagnostics']`, etc.

---

## §11 — Error handling

- All API calls go through `fetchWithAuth` (from `00-single-login.md`); errors throw `ApiError`.
- Wrap Server Actions in try/catch that map `ApiError.details` (FastAPI 422 field-errors) into React-Hook-Form `setError` calls.
- Toast surface: shadcn `useToast` — success in green-tinted card, error in red.
- Specific codes:
  - `LAST_ADMIN` (from delete-user) → toast "You cannot delete the last Admin." + don't re-throw.
  - `ASSIGNMENT_DUPLICATE` → inline form error on the company combobox.
  - `MANAGER_NOT_IN_TENANT` → inline error on the manager combobox.

---

## §12 — Accessibility + UX

- All forms: visible labels, `aria-describedby` for error messages, focus trap inside Dialogs, ESC to close.
- All Tables: keyboard nav (`Tab` between rows; `Enter` to open), column headers sortable via click + `aria-sort`.
- Confirm any destructive action (`AlertDialog`); destructive button is red and **not** the default focus.
- Empty states everywhere (no scary blank screens).
- Loading skeletons via shadcn `Skeleton` on every server-fetched page.

---

## §13 — Acceptance criteria (must all pass)

Playwright + manual smoke:

- [ ] Log in as Admin → land on `/admin`; tiles render real numbers.
- [ ] Manager log-in attempting `/admin` 302s to `/login`.
- [ ] Provision a Manager from `/admin/users/new` → see them in `/admin/users` immediately; a welcome email is queued (mock the SMTP in tests).
- [ ] Edit role on `/admin/users/[id]` → page reflects new role; `auth_events(role_change)` appears in Activity tab.
- [ ] Assign Manager to a company; then assign an Agent under that Manager to the same company. UCA browser shows both rows. Trying to assign the Agent to a company the Manager isn't on → inline error.
- [ ] Delete a company from `/admin/companies/[id]` → confirm dialog enumerates cascade items; deletion succeeds; `users.company_id` for that tenant now null; Chroma collection gone.
- [ ] `/admin/system/logs?level=ERROR` shows only ERROR lines; clicking a `request_id` copies it.
- [ ] `/admin/system/diagnostics` shows non-zero `total_vectors` after a reindex.
- [ ] `/admin/companies/[id]` "Reindex this tenant" → button disables, progress toast, success modal with `chunks_indexed`.
- [ ] `/admin/audit` filters across activity + auth events; CSV export returns the same rows.
- [ ] Theme toggle persists via `PUT /auth/me` and survives reload.
- [ ] No `localStorage.setItem('token', …)` anywhere.
- [ ] No inline `fetch('/api/v1/…')` in any component — every call goes through `api.admin.*`.

Run:
```bash
cd frontend-next
pnpm install
pnpm dev               # smoke
pnpm test:e2e --grep admin
```

---

## §14 — Implementation notes (gotchas)

- TanStack Table v8 needs `columnHelper` typed against your Zod-inferred row type — keep the inference end-to-end.
- The `assignments` Dialog is the trickiest form: the `manager_id` Combobox must filter to Managers **already assigned** to the chosen `company_id`. Implement via `useQuery` keyed on the selected company.
- Reindex can be slow; show optimistic UI but **don't** invalidate other queries until the response lands (avoid mid-reindex flicker).
- `JsonViewer` should truncate large `extra` payloads (>10 KB) with an "Expand" toggle.
- Use `revalidateTag` after every mutation — TanStack invalidation alone won't refresh server-rendered pages on next nav.
- When the Admin demotes themselves (changing own `role`), display a banner: "You may lose access on next request." Don't try to be clever — just warn.
- Match the visual style of the legacy app (`#6d28d9` accent) for continuity.

---

## §15 — Test plan (paste-ready)

```bash
# Boot stack
cd backend && uvicorn app.main:app --reload &
cd frontend-next && pnpm dev &

# Open http://localhost:3000/login → log in as admin@example.com
# Walk these flows:
# 1. /admin                          — verify tiles + recent activity
# 2. /admin/users/new                — provision a Manager
# 3. /admin/users/[mgr_id]           — confirm + add assignment
# 4. /admin/companies/new            — create a company; reindex it
# 5. /admin/system/diagnostics       — confirm vectors > 0
# 6. /admin/system/logs              — filter to ERROR
# 7. /admin/audit                    — filter by company; export CSV

# Run Playwright
pnpm test:e2e --grep admin
```

---

## §16 — Update docs in the same PR

- [`../roles_checklist.md`](../roles_checklist.md) §1 (Admin) — flip ⭐ → ✅ for frontend rows (#5–#10 frontend cells).
- [`../api_contracts.md`](../api_contracts.md) — no changes needed (backend prompt already updated it).
- [`../skills/integration_skill.md`](../skills/integration_skill.md) — append the Admin row to the §7 per-role wiring map: ✅ across all three columns.

---

## §17 — What "done" looks like

An Admin can log in, navigate every page in §4 without an error, perform every capability in their permission matrix, and the underlying data (users, companies, assignments, logs, audit, diagnostics) reflects the action immediately. The legacy `frontend/src/pages/AdminDashboard.jsx` remains untouched. All acceptance tests pass. The Admin row of [`../roles_checklist.md`](../roles_checklist.md) is fully ✅.
