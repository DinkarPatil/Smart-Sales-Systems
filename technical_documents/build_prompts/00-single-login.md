# Build Prompt — 00 — Single Login Point for All Roles

> Paste everything below into your AI coding assistant. The assistant should produce a working, tested implementation that satisfies every Acceptance Criterion. This is the **foundational** prompt; every other role-specific prompt depends on it.

---

## Role

You are a senior full-stack engineer working on **Smart Sales Systems** (FastAPI + Next.js 14). Your job in this task is to build a **single, role-aware login surface** that serves Admin, Auditor, Billing, Owner, Curator, Manager, Reviewer, Agent, and Customer — all from one page — and routes each user to their own dashboard after login.

---

## Goal

Replace the legacy `localStorage`-based JWT flow with an **HttpOnly cookie** flow, fronted by a single `/login` page. After login, the user is redirected to their role's dashboard. Every protected route is gated by Next.js middleware that reads the cookie, verifies the JWT, and checks the role.

---

## Foundational context (read before writing code)

- Role taxonomy + every role's stored `role` string: [`../roles_and_access.md`](../roles_and_access.md) §1.
- Wiring rules (cookie, middleware, contracts): [`../skills/integration_skill.md`](../skills/integration_skill.md) §§4, 10.2, 10.3.
- Current auth endpoints: [`../api_contracts.md`](../api_contracts.md) §2.
- Known bugs to fix while you're here: [`../state_preparation.md`](../state_preparation.md) §1.2 (B6, B7 in particular).

---

## Flexibility & Adaptation

> This prompt is a **starting blueprint**, not a contract. Read the [Adaptive Development Principles](./README.md#adaptive-development-principles) in the README before you start. Tl;dr:
>
> - **🟢 Safe** to deviate on: helper names, file organisation within a directory, library minor versions, exact CSS, exact form field order, exact toast wording, error-message copy.
> - **🟡 Flag in PR description** if you diverge on: file paths called out below, env-var names, route-handler structure (proxy vs. server action vs. middleware), the exact cookie attributes (must remain HttpOnly+SameSite=Lax+Secure-in-prod).
> - **🔴 Update foundational docs first** if you discover: the JWT subject can't be the email, the role-prefix map needs more / fewer entries, the verification-token flow doesn't fit the existing `security.generate_password_reset_token`, or the OAuth2-password form requirement on FastAPI breaks the proxy.
>
> **Non-negotiables** (do not adapt): JWT in HttpOnly cookie (never `localStorage`); middleware-based role gating; same `SECRET_KEY` shared between backend + middleware; legacy `/sales/*` accepts both `SalesRep` and `Agent` role strings.

---

## Scope

### In scope
- Backend: keep `POST /api/v1/auth/login` (OAuth2 password form), ensure response shape is `{ access_token, token_type }`, add `GET /api/v1/auth/me` (already exists) and `POST /api/v1/auth/logout` (new, clears cookie via Next.js — backend itself is stateless).
- Backend: add `POST /api/v1/auth/register/customer` for Customer self-signup with email verification token issuance (new — see §5 below).
- Frontend: scaffold `frontend-next/` (Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui + TanStack Query + Zod). If the directory exists, skip scaffolding.
- Frontend: `app/(auth)/login/page.tsx` — the single login page, used by every role.
- Frontend: `app/(auth)/forgot-password/page.tsx`, `app/(auth)/reset-password/page.tsx` — keep functional parity with the legacy React+Vite app.
- Frontend: `app/(auth)/register/customer/page.tsx` — Customer-only registration (staff are provisioned by Admin and never self-register here).
- Frontend: `app/api/auth/login/route.ts` — proxy to FastAPI; on success sets HttpOnly cookie `access_token`.
- Frontend: `app/api/auth/logout/route.ts` — clears the cookie + redirects to `/login`.
- Frontend: `middleware.ts` at project root — reads the cookie, verifies JWT (HS256, same `SECRET_KEY` as backend), enforces the role-prefix gate, redirects to `/login` on mismatch.
- Frontend: `lib/api/http.ts` + `lib/api/auth.ts` + `lib/api/schemas.ts` (initial schemas for `Token`, `UserOut`).
- Post-login redirect: read `user.role` from `/auth/me` and route to that role's dashboard prefix (`/admin`, `/owner`, `/manager`, `/agent`, etc.).

### Out of scope
- Building any role's dashboard pages (those are in role-specific prompts).
- Refresh tokens (token lifetime is 7 days; refresh is a later phase).
- Multi-factor auth (later phase).
- Migrating the legacy React+Vite app — leave it untouched; the new Next.js app coexists.

---

## Deliverables (file-level)

### Backend

1. `backend/app/api/endpoints/auth.py` — add:
   - `POST /api/v1/auth/register/customer` — body `{ email, password, full_name }`. Creates a `User` with `role="Customer"`, `is_active=False`, issues a verification JWT via `security.generate_password_reset_token` (re-use; it already creates a short-lived JWT bound to an email), sends a verification email containing a link `${FRONTEND_URL}/verify-email?token=...`. Returns `UserOut`.
   - `POST /api/v1/auth/verify-email/{token}` — validates the token, flips `is_active=True`, returns `{ "msg": "Email verified" }`. 400 on invalid/expired token.
2. `backend/app/models/models.py` — extend `UserRole` enum string-values to include `Auditor`, `Billing`, `Curator`, `Reviewer`, `Customer`, `System`. Do **not** remove `SalesRep`; add `Agent` alongside. Both must validate during the rename window.
3. `backend/app/api/deps.py` — add `get_current_active_customer` guard (mirror existing pattern). Stub `get_current_active_auditor`, `_billing`, `_curator`, `_reviewer`, `_agent` for use by other prompts (each just checks role; do **not** wire endpoint files yet).
4. `backend/app/schemas/schemas.py` — add `CustomerCreate`, `EmailVerification` Pydantic models. Ensure `UserOut.role` accepts the expanded set.
5. `backend/app/core/security.py` — confirm `generate_password_reset_token` and `verify_password_reset_token` can be reused for the email-verification flow (same JWT, different `purpose` claim is fine if you want to harden it).
6. `backend/app/main.py` — lock CORS to `[settings.FRONTEND_URL]` (drop the wildcard); add `BACKEND_API_URL` and `COOKIE_SECURE` to `core/config.py:Settings`.

### Frontend

7. Scaffold `frontend-next/` (if missing) with:
   - `package.json` deps: `next@14`, `react@18`, `react-dom@18`, `typescript`, `tailwindcss`, `@tanstack/react-query`, `zod`, `jose`, `@hookform/resolvers`, `react-hook-form`, `lucide-react`, `framer-motion`, `clsx`, `tailwind-merge`, plus shadcn/ui dev setup.
   - `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `next.config.mjs`.
   - `app/layout.tsx`, `app/globals.css`, `app/page.tsx` (redirects to `/login`).
8. `frontend-next/app/(auth)/login/page.tsx` — server component shell + client form. Uses React Hook Form + Zod. Submits to `/api/auth/login`.
9. `frontend-next/app/(auth)/forgot-password/page.tsx` + `reset-password/page.tsx` — port from legacy.
10. `frontend-next/app/(auth)/register/customer/page.tsx` — Customer-only registration form. **Staff cannot use this page.** Admin/staff are provisioned in `01-admin-backend.md`/`01-admin-frontend.md`.
11. `frontend-next/app/api/auth/login/route.ts` — proxies the form POST to `${BACKEND_API_URL}/api/v1/auth/login`, takes the JWT, sets the cookie:
    ```ts
    res.cookies.set('access_token', access_token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    ```
    On success returns `{ ok: true, role: <role> }` so the client can `router.push(...)` to the right dashboard.
12. `frontend-next/app/api/auth/logout/route.ts` — `cookies().delete('access_token')`; returns `{ ok: true }`.
13. `frontend-next/middleware.ts` — see §6 for the exact role-prefix map. Matcher must cover every protected tree.
14. `frontend-next/lib/api/http.ts` — `fetchWithAuth(path, schema, init)`. Reads the cookie via `cookies()` server-side and sends `Authorization: Bearer`. Defines `ApiError` and `parseError` per [`../skills/integration_skill.md`](../skills/integration_skill.md) §5.2 (tolerant: accepts both `{error: {...}}` and legacy `{detail: "..."}`).
15. `frontend-next/lib/api/schemas.ts` — Zod mirrors for `Token`, `UserOut`, `UserRole`.
16. `frontend-next/lib/api/auth.ts` — `api.auth.me()`, `api.auth.logout()`, `api.auth.forgotPassword(email)`, `api.auth.resetPassword(token, newPassword)`, `api.auth.registerCustomer(body)`, `api.auth.verifyEmail(token)`.
17. `frontend-next/components/login-form.tsx` — the actual interactive form (client component).
18. `frontend-next/components/role-redirect.ts` — pure helper: `roleToPath("Admin") === "/admin"`, etc.
19. `frontend-next/app/(auth)/verify-email/page.tsx` — reads `?token=` from URL, POSTs to `/auth/verify-email/{token}`, shows success/failure state.

### Env

20. `frontend-next/.env.local.example`:
    ```
    BACKEND_API_URL=http://127.0.0.1:8000
    COOKIE_DOMAIN=
    COOKIE_SECURE=false
    NEXT_PUBLIC_APP_NAME=Smart Sales
    ```

---

## §6 — The role-prefix map (canonical)

`middleware.ts` must include exactly this mapping:

```ts
const ROLE_PREFIXES: Record<string, string> = {
  '/admin':    'Admin',
  '/auditor':  'Auditor',
  '/billing':  'Billing',
  '/owner':    'Owner',
  '/curator':  'Curator',
  '/manager':  'Manager',
  '/reviewer': 'Reviewer',
  '/agent':    'Agent',
  '/sales':    'Agent',     // legacy path, accepts Agent (or 'SalesRep' during rename window)
  '/customer': 'Customer',
};
```

The matcher config:
```ts
export const config = {
  matcher: [
    '/admin/:path*', '/auditor/:path*', '/billing/:path*', '/owner/:path*',
    '/curator/:path*', '/manager/:path*', '/reviewer/:path*', '/agent/:path*',
    '/sales/:path*', '/customer/:path*',
  ],
};
```

During the SalesRep→Agent rename window, the role check must accept **both** `"Agent"` and `"SalesRep"` as valid for the `/agent` and `/sales` prefixes.

---

## §7 — Login page UX requirements

- One form, three inputs: `email`, `password`, optional `admin_secret_key` (collapsed behind a "Sign in as Admin" disclosure).
- Submit calls `/api/auth/login`; on success the response includes `role`; the client `router.push(roleToPath(role))`.
- Links: "Forgot password?", "Sign up as a customer" (→ `/register/customer`).
- Errors:
  - 401 → inline error under password "Incorrect email or password".
  - 403 → inline error "Your account is inactive — wait for an admin to approve it."
  - Network error → toast "Couldn't reach the server".
- A11y: labels, error association via `aria-describedby`, focus the email input on mount.
- Visual: shadcn/ui `Card` + `Form` primitives. Tailwind. No emojis.

---

## §8 — Customer-only register page

- Form: `full_name`, `email`, `password`, `confirm_password`. Zod schema enforces password ≥ 8 chars + matching confirm.
- Submit → `POST /api/v1/auth/register/customer` (via `api.auth.registerCustomer`).
- On success: show "Check your inbox to verify your email" panel; do **not** auto-log-in until verified.
- `/verify-email?token=` page consumes the token and on success redirects to `/login`.

---

## §9 — Auth contract reminders

- JWT is HS256, signed with `SECRET_KEY`. Subject = email. Expiry 7 days.
- `middleware.ts` must use `jose.jwtVerify` with the same `SECRET_KEY` (read via `process.env.SECRET_KEY` server-side in middleware — Next.js middleware runs in the edge runtime, so no Node-only modules).
- The cookie must be `httpOnly`, `secure` (in prod), `sameSite='lax'`, `path='/'`, `maxAge=604800`.
- `/api/auth/logout` deletes the cookie; backend has nothing to revoke (stateless).
- Never store JWT in `localStorage`. If you see legacy code that does, leave the legacy app alone but don't replicate the pattern.

---

## §10 — Bugs to fix in this PR

While you're in this code, fix these (from [`../state_preparation.md`](../state_preparation.md) §1.2):

- **B6** — JWT-in-`localStorage` exposure: the new app must never do this. (Legacy untouched.)
- **B7** — manager-stats schema mismatch is touched only if you update `/auth/me` shape; if `UserOut` changes, update Zod mirror in lock-step.

---

## §11 — Acceptance criteria (must all pass)

Backend (pytest, add a small fixture set if none exists):

- [ ] `POST /api/v1/auth/login` with a valid Admin returns `{access_token, token_type:"bearer"}` and 200.
- [ ] Login with `is_active=False` returns 403 with detail explaining inactivity.
- [ ] Login with wrong password returns 401.
- [ ] `GET /api/v1/auth/me` with a fresh token returns `UserOut` including `role`.
- [ ] `POST /api/v1/auth/register/customer` creates an inactive Customer and sends a verification email (BackgroundTasks mocked).
- [ ] `POST /api/v1/auth/verify-email/{token}` flips `is_active=True` exactly once; second call returns 400.
- [ ] CORS allows only `FRONTEND_URL`; a random origin gets blocked.

Frontend (Playwright + manual smoke):

- [ ] `/login` renders, validates inputs, submits, sets the HttpOnly cookie (check via DevTools — present, HttpOnly flag, no JS access).
- [ ] Successful login lands on the correct dashboard prefix per role.
- [ ] Hitting `/admin` while logged in as a Manager 302s to `/login`.
- [ ] Hitting `/agent` while logged in as a SalesRep-legacy user works (rename-window compatibility).
- [ ] `/api/auth/logout` clears the cookie + lands on `/login`.
- [ ] Customer registration form rejects mismatched passwords client-side and 400-routes a duplicate email; verification link flips `is_active`.
- [ ] Forgot/reset password flows produce a working email link and reset the password.
- [ ] No `localStorage.setItem('token', ...)` anywhere in `frontend-next/`.

---

## §12 — Implementation notes (gotchas)

- Next.js middleware runs in the **edge runtime** by default. Use `jose` (works in edge), not `jsonwebtoken` (Node-only).
- Set `runtime = 'nodejs'` only on the login/logout route handlers if you need Node APIs there (you shouldn't — `fetch` and `cookies()` are edge-safe).
- The form POSTs `application/x-www-form-urlencoded` to FastAPI (OAuth2PasswordRequestForm requires this). In the proxy, recreate the form from JSON or accept form-encoded straight through.
- When proxying to FastAPI, **do not** forward the incoming cookie header (it's the user's browser cookie for the Next.js host, not for FastAPI). Forward only what FastAPI needs — typically nothing.
- The `Customer` role's `Pydantic` enum value must be exactly `"Customer"` to match `UserRole.CUSTOMER = "Customer"`.
- Never log `access_token` values, even at DEBUG level.
- The `register/customer` flow must reuse the existing email infrastructure (`services.email_service.send_response_email`) — no new SMTP setup.
- `roleToPath`: Admin→/admin, Auditor→/auditor, Billing→/billing, Owner→/owner, Curator→/curator, Manager→/manager, Reviewer→/reviewer, Agent→/agent, SalesRep→/sales (legacy), Customer→/customer.
- If `/auth/me` returns a role we don't know (defensive), middleware should still redirect to `/login` rather than crash.
- The Next.js app and FastAPI must share `SECRET_KEY`. Put it in both `.env` files; on cutover rotate it once.

---

## §13 — Test plan (paste-ready)

```bash
# Backend
cd backend
pytest tests/test_auth.py -v

# Frontend
cd frontend-next
pnpm install   # or npm install
pnpm test:e2e  # Playwright

# Manual smoke
# 1. Boot backend: uvicorn app.main:app --reload
# 2. Boot frontend: pnpm dev
# 3. Open http://localhost:3000/login
# 4. Log in as each role you have a fixture for; verify dashboard prefix
# 5. Open DevTools → Application → Cookies → confirm access_token is HttpOnly
# 6. Try hitting another role's dashboard URL → expect /login
```

---

## §14 — What "done" looks like

A new developer can clone the repo, run `pnpm dev` + `uvicorn app.main:app --reload`, visit `/login`, log in as any role (or register as a Customer), and land on the correct dashboard with a secure HttpOnly session cookie. Middleware blocks cross-role access. The legacy `frontend/` app continues to work side-by-side. All acceptance tests pass. Docs in `../api_contracts.md` updated to reflect the new `/auth/register/customer` and `/auth/verify-email/{token}` endpoints.
