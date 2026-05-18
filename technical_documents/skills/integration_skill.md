---
name: smart-sales-integration
description: Cross-cutting design brain for wiring the FastAPI backend and the Next.js frontend together end-to-end. Use whenever you (a) add or change a feature that spans both sides, (b) audit the codebase for backend↔frontend drift, or (c) need to scaffold the missing half of an integration. Defines the contract layer, auth transport, error shape, real-time channels, file uploads, form patterns, env-var conventions, and an audit-and-wire procedure that produces the missing pieces automatically when possible.
type: design-skill
scope: integration
stack_backend: FastAPI 0.115 + Pydantic v2 + SQLAlchemy 2.x async
stack_frontend: Next.js 14 (App Router) + TypeScript + Zod + TanStack Query + shadcn/ui + Tailwind
---

# Smart Sales Systems — Backend ↔ Frontend Integration Skill

> The job of this skill is to make sure **every backend endpoint has a typed frontend consumer**, **every frontend interaction has a real backend endpoint**, and **the two never drift** in schema, naming, auth, or error shape. When a piece is missing, this skill describes exactly what to scaffold.

---

## 0. When to invoke this skill

Activate whenever the task touches **both** sides, or when you suspect they're out of sync:

- Adding any feature with a UI **and** an API call.
- Renaming an endpoint, schema field, role, or table.
- Migrating the JWT transport, the API base URL, or the cookie domain.
- Implementing real-time (WS / SSE) channels.
- Implementing file uploads or downloads.
- Auditing for drift before a release (run the §11 procedure).
- Anything tagged "wire it up", "scaffold", "missing endpoint", "missing page", "TS errors after backend change".

If the change is purely backend-internal (DB migration, refactor, service code) **without** a visible behaviour change, you don't need this skill — use [`backend_skill.md`](./backend_skill.md) instead. Same for purely frontend-internal (styling, component refactor).

---

## 1. The integration mental model

```
                  ┌─────────────────────────────────────────┐
                  │            Next.js (frontend)            │
                  │                                          │
                  │  Page (Server Component)                 │
                  │   └─▶ api.<role>.<feature>(...)          │
                  │           │                              │
                  │           ▼                              │
                  │     lib/api/http.ts ──[reads cookie]──┐  │
                  │           │                           │  │
                  └───────────┼───────────────────────────┼──┘
                              │                           │
                       (1) HttpOnly cookie         (2) Authorization: Bearer
                              │                           │
                  ┌───────────▼───────────────────────────▼──┐
                  │  /app/api/auth/login/route.ts   (proxy)  │
                  │  – sets cookie after FastAPI login        │
                  │  – or forwards Bearer in dev              │
                  └───────────┬──────────────────────────────┘
                              │
                  ┌───────────▼──────────────────────────────┐
                  │            FastAPI (backend)              │
                  │  Depends(get_current_active_<role>) →    │
                  │     async def handler(...) -> ResponseModel│
                  └──────────────────────────────────────────┘
```

The integration has **four contract surfaces** that must stay aligned. If any one of them drifts, the wiring breaks:

1. **Schema contract** — Pydantic model on the backend ↔ Zod schema on the frontend.
2. **URL contract** — FastAPI path ↔ frontend API-client method.
3. **Auth contract** — cookie / Bearer header ↔ `Depends(get_current_active_*)`.
4. **Error contract** — unified `{error: {code, message, request_id}}` shape ↔ frontend toast/dialog.

Sections 2–6 spell out each contract. Section 11 is the audit procedure that flags drift.

---

## 2. Schema contract (Pydantic ↔ Zod)

### 2.1 Rule

Every Pydantic response model that crosses the wire **must** have a Zod mirror in `frontend/lib/api/schemas.ts`. The Zod schema is the single source of truth for frontend types.

### 2.2 Convention

```python
# backend/app/schemas/schemas.py
class QueryOut(BaseModel):
    id: str
    complaint_id: str
    status: QueryStatus
    created_at: datetime
    ...
```

```ts
// frontend/lib/api/schemas.ts
import { z } from 'zod';

export const QueryStatus = z.enum(['Pending', 'Resolved', 'Escalated']);
export const QueryOut = z.object({
  id: z.string(),
  complaint_id: z.string(),
  status: QueryStatus,
  created_at: z.string().datetime({ offset: true }),
  // ...
});
export type QueryOut = z.infer<typeof QueryOut>;
```

### 2.3 Wiring rules

- **One-to-one names.** Pydantic class `QueryOut` → Zod export `QueryOut`. Don't rename.
- **Enums:** mirror the Python `Enum` as a `z.enum([...])` with **exact string literals**.
- **Dates:** Pydantic `datetime` → Zod `z.string().datetime({ offset: true })` (validates ISO-8601, leaves it as a string — convert with `new Date(s)` only when needed).
- **Optionals:** Pydantic `Optional[X] = None` → Zod `X.nullable().optional()`. Don't drop the `.nullable()` — the backend will send `null`, not `undefined`.
- **Nested objects:** define the nested Zod schema first, reference it in the parent.

### 2.4 When the backend schema changes

If you change a Pydantic field name, type, or optionality, you **must** also update its Zod mirror in the same commit. The audit (§11) will catch it if you forget.

---

## 3. URL contract (FastAPI path ↔ API client method)

### 3.1 Convention

Every FastAPI route file `endpoints/<role>.py` maps to a method namespace in `frontend/lib/api/<role>.ts`:

| FastAPI                            | Frontend client                    |
| ---------------------------------- | ---------------------------------- |
| `endpoints/admin.py`               | `lib/api/admin.ts`                 |
| `endpoints/manager.py`             | `lib/api/manager.ts`               |
| `endpoints/owner.py`               | `lib/api/owner.ts`                 |
| `endpoints/sales_rep.py` / `agent.py` | `lib/api/agent.ts`              |
| `endpoints/customer.py`            | `lib/api/customer.ts`              |
| `endpoints/auth.py`                | `lib/api/auth.ts`                  |
| `endpoints/webhook.py`             | not consumed by frontend           |

Each role file exports one namespace object aggregated in `lib/api/index.ts`:

```ts
// lib/api/index.ts
import { auth }    from './auth';
import { admin }   from './admin';
import { owner }   from './owner';
import { manager } from './manager';
import { agent }   from './agent';
import { customer } from './customer';

export const api = { auth, admin, owner, manager, agent, customer };
```

### 3.2 Method-naming pattern

```
api.<role>.<resource>.<verb>(...)
```

| Backend route                                  | Client call                              |
| ---------------------------------------------- | ---------------------------------------- |
| `GET  /api/v1/manager/stats`                   | `api.manager.stats()`                    |
| `GET  /api/v1/manager/queries`                 | `api.manager.queries.list(filter)`       |
| `PATCH /api/v1/manager/queries/{id}`           | `api.manager.queries.reassign(id, body)` |
| `POST /api/v1/owner/products`                  | `api.owner.products.create(body)`        |
| `DELETE /api/v1/owner/products/{id}`           | `api.owner.products.delete(id)`          |
| `POST /api/v1/owner/products/{id}/upload`      | `api.owner.products.upload(id, file)`    |

### 3.3 Wiring rules

- One backend route = one client method. **Never** call `fetch()` inline from a component.
- Every method validates the response with the Zod schema (§2) and **returns the parsed type**. Failure throws.
- Path params are positional; query / body params are an object.
- File uploads return raw `Response` if you need the headers; everything else returns parsed JSON.

---

## 4. Auth contract (HttpOnly cookie + middleware)

### 4.1 Transport

- **Storage:** the JWT lives in an **HttpOnly + Secure + SameSite=Lax cookie** named `access_token`.
- **Setter:** a Next.js route handler `app/api/auth/login/route.ts` proxies the form POST to FastAPI `/auth/login`, takes the returned JWT, and sets the cookie. The frontend **never** sees the JWT directly.
- **Sender:** the typed client (`lib/api/http.ts`) reads the cookie server-side via `cookies()` and forwards it as `Authorization: Bearer <jwt>` when calling FastAPI (since FastAPI's `OAuth2PasswordBearer` expects a header, not a cookie). Client-side calls go to internal Next.js route handlers that do the same proxying.

> *Important:* the legacy frontend reads the JWT from `localStorage` — that's an XSS exposure. Cut over to cookies during the Next.js migration. See [`state_preparation.md` Phase 2](../state_preparation.md).

### 4.2 Route gating

```ts
// middleware.ts at project root
import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ROLE_PREFIXES: Record<string, string> = {
  '/admin':    'Admin',
  '/auditor':  'Auditor',
  '/billing':  'Billing',
  '/owner':    'Owner',
  '/curator':  'Curator',
  '/manager':  'Manager',
  '/reviewer': 'Reviewer',
  '/agent':    'Agent',
  '/sales':    'Agent',     // legacy path, until rename completes
  '/customer': 'Customer',
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  const { payload } = await jwtVerify(token, secretKey());
  const prefix = Object.keys(ROLE_PREFIXES).find(p => req.nextUrl.pathname.startsWith(p));
  if (prefix && payload.role !== ROLE_PREFIXES[prefix]) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}
export const config = {
  matcher: ['/admin/:path*', '/auditor/:path*', '/billing/:path*', '/owner/:path*',
            '/curator/:path*', '/manager/:path*', '/reviewer/:path*', '/agent/:path*',
            '/sales/:path*', '/customer/:path*'],
};
```

### 4.3 Wiring rules

- One role guard on the backend (`Depends(get_current_active_<role>)`) ↔ one prefix in `ROLE_PREFIXES`.
- Cross-role endpoints (rare) must use a **composite guard** in `api/deps.py`, not OR'd inline.
- The `Customer` role uses a separate signup endpoint (`/auth/register/customer`) and a separate cookie scope is unnecessary — same `access_token` cookie, role in JWT determines the gate.
- The **system token** (ReplyJudge / RetrievalJudge / embedding worker) is **never** put in a cookie; it lives in `SYSTEM_TOKEN_SECRET` env and is sent as `Authorization: Bearer <system-jwt>` from worker processes.

---

## 5. Error contract

### 5.1 Backend shape (target)

```json
{
  "error": {
    "code": "QUERY_NOT_FOUND",
    "message": "Query 5e8a... not found in this tenant.",
    "request_id": "5b5e3...",
    "details": { "query_id": "5e8a..." }
  }
}
```

Until the unified shape lands, the current `{ "detail": "..." }` shape stays — the frontend wrapper accepts both.

### 5.2 Frontend handling

```ts
// lib/api/http.ts (extract)
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public requestId?: string,
    public details?: unknown,
  ) { super(message); }
}

async function parseError(res: Response): Promise<never> {
  let body: any = null;
  try { body = await res.json(); } catch { /* */ }
  const err = body?.error ?? { code: 'UNKNOWN', message: body?.detail ?? res.statusText };
  throw new ApiError(res.status, err.code, err.message, err.request_id, err.details);
}
```

UI conventions:
- `401` → middleware should have caught this; if not, force-logout via `router.push('/login')`.
- `403` → toast "You don't have access to this action."
- `404` → page-level empty state with "Not found"; in mutations, toast "Item missing or already deleted."
- `422` → render field errors inline against the form via `details`.
- `5xx` → toast "Something went wrong. We've logged it." + send the `request_id` to telemetry.

---

## 6. Conventions for cross-cutting wiring

### 6.1 Server vs Client components

| Pattern                              | Where                                 |
| ------------------------------------ | ------------------------------------- |
| Initial data fetch                   | **Server Component** in `page.tsx`, calls `api.<role>.…()`. |
| Reactive lists, search, filtering    | **Client Component**, hydrates from `initialData` via TanStack Query. |
| Mutations                            | **Server Action** (`'use server'`) calling `api.<role>.<verb>(...)`, then `revalidateTag('<role>:<resource>')`. |
| Long-running uploads, streams        | Client Component using fetch directly (multipart / SSE / WS). |

### 6.2 TanStack Query keys

Convention: `[role, resource, ...subkeys, filterObject?]`

```ts
queryKey: ['manager', 'queries', { status: 'Pending', page: 1 }]
queryKey: ['agent', 'query', queryId]
queryKey: ['owner', 'products']
```

Always invalidate by the role+resource prefix after a mutation:

```ts
queryClient.invalidateQueries({ queryKey: ['manager', 'queries'] });
```

### 6.3 Next.js fetch tags (server-side cache)

Mirror the TanStack key as a tag:

```ts
fetch(url, { next: { tags: [`${role}:${resource}`] } });
// after mutation, in a server action:
revalidateTag(`${role}:${resource}`);
```

### 6.4 Forms

- **Library:** React Hook Form + Zod resolver (`@hookform/resolvers/zod`) — the same Zod schema used by the API client validates the form, so payloads can't drift from the contract.
- **Submission:** Server Action calls the typed client; success → toast + `revalidateTag` + close dialog / redirect.
- **422 mapping:** the catch block converts `ApiError.details` (the field-error array from FastAPI) into RHF `setError(field, { message })` calls.

### 6.5 File uploads

```ts
// lib/api/owner.ts
upload: async (productId: string, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`/api/proxy/owner/products/${productId}/upload`, {
    method: 'POST', body: fd, credentials: 'include',
  });
  if (!res.ok) await parseError(res);
  return res.json();
}
```

The `/api/proxy/*` route handler in Next.js streams multipart to FastAPI with the cookie attached (so the FastAPI host doesn't need to know about Next.js cookies). For very large files, use direct-to-storage presigned URLs and only POST the resulting URL to FastAPI.

### 6.6 Real-time (WebSocket / SSE)

| Channel                   | Transport | Endpoint                          | Auth |
| ------------------------- | --------- | --------------------------------- | ---- |
| Owner ↔ Customer chat     | WS        | `wss://api/.../ws/chat/{room_id}` | room-scoped JWT (minted on enter) |
| Agent queue live updates  | SSE       | `/sse/agent/queue`                | cookie via Next.js proxy |
| Chat widget session       | WS        | `/widget/session/{sid}`           | anonymous signed session token |

Client wiring:

```ts
// hooks/use-chat-room.ts
'use client';
import { useEffect, useState } from 'react';
import { z } from 'zod';
const ChatMessage = z.object({ author: z.enum(['owner','customer','system']), body: z.string(), created_at: z.string() });

export function useChatRoom(roomId: string, roomToken: string) {
  const [msgs, setMsgs] = useState<z.infer<typeof ChatMessage>[]>([]);
  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/chat/${roomId}?token=${roomToken}`);
    ws.onmessage = (e) => {
      const parsed = ChatMessage.safeParse(JSON.parse(e.data));
      if (parsed.success) setMsgs(m => [...m, parsed.data]);
    };
    return () => ws.close();
  }, [roomId, roomToken]);
  return msgs;
}
```

### 6.7 Environment variables — convention

Backend (`backend/.env`) — see [`state_preparation.md §4`](../state_preparation.md).

Frontend (`frontend/.env.local`) — `NEXT_PUBLIC_*` for browser-visible, plain for server-only:

```
# Server-side only (read from server components / route handlers)
BACKEND_API_URL=http://127.0.0.1:8000
SYSTEM_TOKEN_SECRET=...        # only if the frontend ever mints system tokens (rare)
COOKIE_DOMAIN=
COOKIE_SECURE=false            # true in prod

# Public (sent to browser bundle)
NEXT_PUBLIC_BACKEND_PUBLIC_URL=https://api.example.com   # only if the browser hits the API directly (uploads / WS)
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000
NEXT_PUBLIC_APP_NAME="Smart Sales"
```

Rules:
- **Never** import a non-`NEXT_PUBLIC_` var from client components.
- Backend URL used server-side is `BACKEND_API_URL`; browser-side is `NEXT_PUBLIC_BACKEND_PUBLIC_URL` (often same value in dev, different host in prod).
- Cookie auth means the browser doesn't need to know the JWT — keep `SYSTEM_TOKEN_SECRET` server-side only.

---

## 7. Per-role wiring map (current code, post-rename)

For each role, the list of backend endpoint files and the corresponding frontend route + API-client module that must exist in lock-step.

| Role     | Backend file                            | Frontend route tree           | API client module        |
| -------- | --------------------------------------- | ----------------------------- | ------------------------ |
| Admin    | `endpoints/admin.py`                    | `app/(dashboard)/admin/*`     | `lib/api/admin.ts`       |
| Auditor⭐| `endpoints/auditor.py` (new)            | `app/(dashboard)/auditor/*`   | `lib/api/auditor.ts`     |
| Billing⭐| `endpoints/billing.py` (new)            | `app/(dashboard)/billing/*`   | `lib/api/billing.ts`     |
| Owner    | `endpoints/owner.py`                    | `app/(dashboard)/owner/*`     | `lib/api/owner.ts`       |
| Curator⭐| `endpoints/curator.py` (new)            | `app/(dashboard)/curator/*`   | `lib/api/curator.ts`     |
| Manager  | `endpoints/manager.py`                  | `app/(dashboard)/manager/*`   | `lib/api/manager.ts`     |
| Reviewer⭐| `endpoints/reviewer.py` (new)           | `app/(dashboard)/reviewer/*`  | `lib/api/reviewer.ts`    |
| Agent    | `endpoints/sales_rep.py` → `agent.py`   | `app/(dashboard)/agent/*`     | `lib/api/agent.ts`       |
| Customer⭐| `endpoints/customer.py` (new)           | `app/(customer)/customer/*`   | `lib/api/customer.ts`    |
| Auth     | `endpoints/auth.py`                     | `app/(auth)/*`                | `lib/api/auth.ts`        |
| Webhook  | `endpoints/webhook.py`                  | n/a (external)                | n/a                      |

When any of these triples is incomplete, this skill prescribes scaffolding the missing pieces (§9).

---

## 8. End-to-end feature recipe

Use this every time you add a feature touching both sides. Yields a clean wire in ~30 min for a simple endpoint+page.

1. **Spec** — write the request / response shape in plain text. What enters, what comes back, who's allowed.
2. **Pydantic schema** — add `<Feature>Create` / `<Feature>Out` to `backend/app/schemas/schemas.py`.
3. **Handler** — add the FastAPI route to the appropriate `endpoints/<role>.py` with the right `Depends(get_current_active_<role>)`. Scope to tenant if applicable. Write `ActivityLog` if it mutates Owner-scoped state.
4. **Zod mirror** — add `<Feature>Create` / `<Feature>Out` to `frontend/lib/api/schemas.ts` matching field-for-field.
5. **API client method** — add `api.<role>.<resource>.<verb>` in `frontend/lib/api/<role>.ts`, validating the response with the new Zod schema.
6. **Server-side fetch** — call the new method from the relevant `page.tsx` (Server Component) and pass initial data to client.
7. **Client UI** — Client Component renders the data with TanStack Query (key `[role, resource, ...]`); forms use React Hook Form + Zod resolver against the same Zod schema; mutations call a Server Action which calls the client method and `revalidateTag`.
8. **Middleware** — confirm the new route's path prefix is gated (§4.2).
9. **Docs** — update [`api_contracts.md`](../api_contracts.md), [`crud_operations.md`](../crud_operations.md), and the role's checklist row in [`roles_checklist.md`](../roles_checklist.md).
10. **Tests** — one pytest (happy path + 403) + one Playwright assertion that the page renders.

---

## 9. "Wire the missing half" — scaffolding rules

When the audit (§11) finds a gap, the action depends on which side is missing.

### 9.1 Backend endpoint exists, frontend doesn't consume it
- Add the Zod mirror (§2) for the response.
- Add the API client method (§3) in the appropriate `lib/api/<role>.ts`.
- Decide if a page needs it. If yes, scaffold it (use the role's page tree in [`roles_and_access.md`](../roles_and_access.md) as the canonical layout).
- If the endpoint is genuinely unused (e.g. an internal admin tool), document it explicitly in the role's skill file — don't leave it ambiguous.

### 9.2 Frontend page expects an endpoint, backend doesn't have it
- Open the page; identify the call signature it expects from `api.<role>.<verb>(...)`.
- Add the Pydantic schema in `backend/app/schemas/schemas.py`.
- Add the FastAPI route with the right guard + tenant scoping.
- Add the API client method to mirror what the page is already calling — **keep the method signature the page assumes** so the page doesn't change.

### 9.3 Schema drift (Pydantic ≠ Zod)
- Pydantic is the source of truth (the data actually crosses the wire from it).
- Update the Zod schema to match field-for-field; TypeScript compile errors will then surface every consumer that needs adjusting — fix each.
- If the change is a rename, add a Pydantic alias for one release so the frontend can roll over gradually.

### 9.4 URL drift (path renamed)
- Add a duplicate FastAPI route under both old and new path for one release; set `Deprecation` header on the old.
- Frontend API client moves to the new URL in the same commit; release notes call out the migration window.

### 9.5 Auth drift (role guard changed)
- Update `ROLE_PREFIXES` in `middleware.ts` to match the new mapping.
- Update the API client module's namespace if the route file moved.
- If the role itself was renamed (e.g. `SalesRep → Agent`), bump the JWT validation to accept **both** role string values for one release.

### 9.6 Error shape drift (unified error shape lands)
- `parseError` in `http.ts` already accepts both shapes — keep it tolerant.
- Once every endpoint emits the unified shape, drop the legacy `detail` branch from `parseError`.

### 9.7 Real-time channel missing
- WS endpoints require both a backend route (`@app.websocket(...)`) **and** a client hook (`use-<channel>.ts`).
- Don't ship one without the other; the channel must round-trip a synthetic "ping" message in dev before merging.

---

## 10. Idiomatic snippets

### 10.1 `fetchWithAuth` (server-side)

```ts
// lib/api/http.ts
import { cookies } from 'next/headers';
import { z, ZodTypeAny } from 'zod';

export async function fetchWithAuth<T extends ZodTypeAny>(
  path: string, schema: T, init: RequestInit = {},
): Promise<z.infer<T>> {
  const token = cookies().get('access_token')?.value;
  const res = await fetch(`${process.env.BACKEND_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) await parseError(res);
  const data = await res.json();
  return schema.parse(data);
}

export function qs(o?: Record<string, unknown>): string {
  if (!o) return '';
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined && v !== null) u.set(k, String(v));
  }
  return u.toString();
}
```

### 10.2 Login proxy (sets cookie)

```ts
// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const form = await req.formData();
  const r = await fetch(`${process.env.BACKEND_API_URL}/api/v1/auth/login`, {
    method: 'POST', body: form,
  });
  if (!r.ok) return new NextResponse(await r.text(), { status: r.status });
  const { access_token } = await r.json();
  const res = NextResponse.json({ ok: true });
  res.cookies.set('access_token', access_token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
```

### 10.3 Server Action mutation pattern

```ts
// app/(dashboard)/manager/queries/_actions.ts
'use server';
import { api } from '@/lib/api';
import { revalidateTag } from 'next/cache';

export async function reassignQuery(queryId: string, salesRepId: string) {
  const updated = await api.manager.queries.reassign(queryId, salesRepId);
  revalidateTag('manager:queries');
  return updated;
}
```

---

## 11. The drift audit — procedure to run before each release

Walk these checks. Anything that fails creates a wire-up task per §9.

### 11.1 Endpoint inventory

```
1. From backend:
     grep "@router\." backend/app/api/endpoints/*.py  → list every route + method + path
2. From frontend:
     grep "fetchWithAuth(\|fetch(" frontend/lib/api/*.ts → list every URL the client calls
3. Diff:
     • Routes with no client → §9.1 (add Zod + client method; decide if a page is needed)
     • Client URLs that 404 against the backend → §9.2 (add the endpoint)
```

### 11.2 Schema inventory

```
1. Pydantic exports:  grep "^class .*BaseModel\|^class .*BaseModel)" backend/app/schemas/schemas.py
2. Zod exports:       grep "^export const " frontend/lib/api/schemas.ts
3. Diff:
     • Pydantic with no Zod → add Zod mirror
     • Zod with no Pydantic → either dead code (remove) or the backend lost a model — investigate
     • Both present but field-list differs → §9.3 (fix Zod to match Pydantic)
```

### 11.3 Auth inventory

```
1. Backend guard prefixes:
     grep "router = APIRouter\|prefix=" backend/app/main.py  → router prefixes
2. Frontend ROLE_PREFIXES in middleware.ts
3. Diff:
     • Prefix on backend but not gated in middleware → add prefix to ROLE_PREFIXES
     • Prefix gated in middleware but no backend router → either retire the gate or build the router
```

### 11.4 Role-value coherence

```
1. UserRole enum values in backend/app/models/models.py
2. ROLE_PREFIXES values in middleware.ts
3. accepted role values in lib/api/http.ts (if any)
→ All three sets must be identical (modulo the migration window for renames).
```

### 11.5 WS/SSE channels

```
1. Backend:  grep "@app.websocket\|EventSourceResponse" backend/app/**.py
2. Frontend: grep "new WebSocket(\|EventSource(" frontend/**/*.ts*
3. Diff:
     • Channels without a frontend hook → §9.7
     • Hooks without a backend channel → §9.7
```

### 11.6 Env-var sanity

```
1. List backend env vars used: grep "os.getenv\|settings\." backend/app/core/config.py
2. List frontend env vars used: grep "process.env" frontend/**/*.ts*
3. Verify both `.env.example` files contain every var, with safe defaults.
```

### 11.7 Error shape

```
For every new endpoint, manually verify a 404 + a 422 + a 500 case:
  • Returns the unified shape, OR
  • Falls back to the legacy {detail: "..."} (which parseError still handles).
```

### 11.8 Pass/fail gate

Release blocks if §11.1 / §11.2 / §11.4 produce any diffs that aren't documented as intentional in this commit's PR description.

---

## 12. Common wiring pitfalls (and the fix)

| Symptom                                                           | Likely cause                                              | Fix |
| ----------------------------------------------------------------- | --------------------------------------------------------- | --- |
| 422 on every PATCH / POST                                         | Path param typed `int` but PK is UUID string              | Switch to `str`. |
| 403 even though the user has the right role                       | Cookie not forwarded; fetch missing `credentials: 'include'` or server fetch missing the cookie read | Use `fetchWithAuth`. |
| "Cannot read property … of undefined" on the client                | Zod schema drift; the field name silently changed         | Re-run audit §11.2 and re-parse with the latest Zod. |
| Cookie present but middleware redirects to /login                  | JWT signed with wrong key or expired                      | Verify `SECRET_KEY` matches between backend + middleware. |
| Mutation succeeds, UI doesn't update                               | Forgot `revalidateTag` and/or `invalidateQueries`         | Add both. |
| Upload returns 422 from FastAPI                                    | Sent JSON instead of multipart                            | Use `FormData`; do **not** set `Content-Type` manually (browser sets boundary). |
| Different role on the JWT than what the UI thinks                  | Role rename mid-release; legacy JWT still in cookie       | Bump server validation to accept both for one release; force-rotate `SECRET_KEY` at cutover. |
| WS connects then closes immediately                                | Missing room-scoped token; or backend `accept()` deferred behind a slow await | Verify token included in URL query; `await ws.accept()` first in handler. |
| Form errors don't show against fields                              | `parseError` not mapping `details[]` into RHF `setError`   | Add the mapping in the server action's catch. |
| Two roles see different shapes for the same query                  | Per-role serializer leaks fields (e.g. judge scores to SalesRep) | Use distinct `response_model` per role, not the same `QueryOut`. |

---

## 13. References

- Foundational role taxonomy: [`../roles_and_access.md`](../roles_and_access.md)
- Per-role implementation status: [`../roles_checklist.md`](../roles_checklist.md)
- Current vs target state + phases: [`../state_preparation.md`](../state_preparation.md)
- Channels: [`../query_intake_channels.md`](../query_intake_channels.md)
- API surface (current + planned): [`../api_contracts.md`](../api_contracts.md)
- CRUD operations: [`../crud_operations.md`](../crud_operations.md)
- DB schema (current + planned): [`../db_schema.md`](../db_schema.md)
- Architecture (current + target): [`../architecture.md`](../architecture.md)
