# Smart Sales Systems — Build Prompts

> **Purpose.** Each file in this folder is a **standalone build prompt** you can paste into an AI coding assistant (or hand to a developer) to produce the actual code for one slice of the system. The prompts are self-contained — they reference the foundational design docs but include every constraint, acceptance criterion, and gotcha needed to build the feature correctly without further back-and-forth.

---

## How to use a prompt file

1. **Read the foundational docs first** (the prompt assumes you've internalised the role taxonomy and the integration conventions):
   - [`../roles_and_access.md`](../roles_and_access.md) — the role taxonomy + permissions.
   - [`../skills/integration_skill.md`](../skills/integration_skill.md) — backend↔frontend wiring rules.
   - [`../skills/backend_skill.md`](../skills/backend_skill.md) — backend conventions (when written).
   - [`../api_contracts.md`](../api_contracts.md), [`../crud_operations.md`](../crud_operations.md), [`../db_schema.md`](../db_schema.md) — surface specs.
2. **Pick a prompt file.** Open it in your IDE side-by-side with the codebase.
3. **Paste the file contents** into an AI coding assistant as a single prompt. The assistant should produce a PR-sized change set that hits every acceptance criterion.
4. **Review the diff**, run the tests listed in the acceptance section, ship.

---

## Build order (recommended)

| # | Prompt                                              | Why first / when                                                       |
| - | --------------------------------------------------- | ---------------------------------------------------------------------- |
| 0 | [00-single-login.md](./00-single-login.md)          | Shared auth + role-routing foundation. **Build first** — every other role-specific page depends on it. |
| 1 | [01-admin-backend.md](./01-admin-backend.md)        | Admin owns user provisioning, so it unblocks creating other test users. |
| 2 | [01-admin-frontend.md](./01-admin-frontend.md)      | Visualises admin work; needed for QA after backend lands. |
| 3 | [08-agent-backend.md](./08-agent-backend.md)        | Customer-facing executor; combined with intake, this is the visible product. |
| 4 | [08-agent-frontend.md](./08-agent-frontend.md)      | The dashboard most of the team will live in. |
| … | (later) Manager, Owner, Curator, Reviewer, Customer, Auditor, Billing | Sequencing per [`../state_preparation.md`](../state_preparation.md). |

---

## Conventions every prompt assumes

These are the **invariants** — the things every prompt depends on staying true. They are stricter than the rest of the prompt content; see "Adaptive Development Principles" below for what can flex.

- **Backend** = FastAPI 0.115 + SQLAlchemy 2.x async + SQLite (aiosqlite) + JWT.
- **Frontend** = Next.js 14 App Router + TypeScript + Zod + TanStack Query + Tailwind + shadcn/ui.
- **Auth transport** = HttpOnly cookie `access_token` set by Next.js `/api/auth/login/route.ts` proxy; FastAPI receives it as `Authorization: Bearer <jwt>`.
- **Schema contract** = Pydantic v2 on backend mirrors Zod on frontend, field-for-field. Same name, same enum literals, same nullability.
- **URL contract** = `endpoints/<role>.py` ⇄ `lib/api/<role>.ts`; method shape `api.<role>.<resource>.<verb>(...)`.
- **Error contract** = `{ "error": { "code", "message", "request_id", "details" } }` with the legacy `{ "detail": "..." }` tolerated by the client.
- **No `localStorage` for the JWT.** HttpOnly cookie only.
- **No inline `fetch()` in components.** Always use the typed `api.*` client.
- **Tenant-scope every non-Admin endpoint** by `current_user.company_id` (or via `user_company_assignments` JOIN for Manager / Agent / Reviewer / Curator).
- **`response_model=` mandatory** on every FastAPI route.
- **Activity-log mutations** that affect tenant state.
- **Background tasks** for any email or LLM call that doesn't need to block the response.

---

## Adaptive Development Principles

> **The prompts are blueprints, not contracts.** They were written before the code existed; reality will surface things the prompt didn't anticipate (a library upgrade broke an import, the proposed column name clashes with a reserved word, an endpoint actually wants pagination the spec missed, the AI model's response shape changed, etc.). Treat the prompt as a smart starting point and **adapt as you go** — but adapt with discipline so the codebase and docs stay coherent.

### The three categories of divergence

Classify every deviation before you make it:

| Category | What it is | Action |
| -------- | ---------- | ------ |
| **🟢 Safe adaptation** | Implementation detail the prompt didn't specify, or trivially better choice (rename a local variable, swap a tiny helper, choose between two equally-good library versions). | Just do it. No PR-description note needed unless it's surprising. |
| **🟡 Notable divergence** | The prompt named a specific approach (file path, helper name, library choice, table column) and reality requires a different one. The **outcome** is the same; the **how** changed. | Do it. Add a "**Divergences from prompt**" section in the PR description listing each (one bullet each) with a one-line reason. |
| **🔴 Spec-changing divergence** | The prompt's *outcome* (an acceptance criterion, a public API contract, a foundational design decision) no longer holds. Examples: an endpoint shape needs to change in a way that breaks the Zod mirror, a role boundary turns out to be wrong, a new entity is needed that the design docs didn't mention. | **Stop and update the foundational doc first** (`roles_and_access.md` / `api_contracts.md` / `db_schema.md` / `crud_operations.md` / `architecture.md`), then continue. Update the prompt itself if the lesson generalises. Call it out in the PR description under "**Spec changes**" so reviewers know docs moved. |

If you can't tell which category you're in, default up: 🟡 → 🔴. Over-documenting a divergence costs nothing; missing one creates drift.

### Rules for adaptation

1. **Hold the acceptance criteria sacred.** If you deviate, the acceptance tests still apply; if they're now unreachable, you're in 🔴 territory and need to update the criteria too.
2. **Hold the four contract surfaces sacred.** Schema, URL, auth, error shape — see [`../skills/integration_skill.md`](../skills/integration_skill.md) §§2–5. Diverging on these always cascades to the frontend; never adapt them silently.
3. **Update the foundational docs in the same PR** as the code change. Stale docs are worse than missing docs.
4. **Flip checklist rows.** When you complete (or change) a row in [`../roles_checklist.md`](../roles_checklist.md), update it (`⭐` → `✅` / `🟡`).
5. **Prefer minimal divergence.** "I'd rather use library X" is not a reason; "library Y is incompatible with our Python version" is.
6. **Comment in code only when the divergence is non-obvious.** A renamed local helper needs no comment; a chosen-different-because-X-broke needs one short line near the change.
7. **Run the acceptance tests after every adaptation.** A 🟡 that breaks an acceptance criterion silently becomes a 🔴.

### How to write down a divergence (PR description template)

```
## Summary
<what shipped>

## Divergences from prompt (🟡)
- `services/email_inbound.py` lives at `app/services/inbound/email.py` instead — the inbound parser grew to two modules so a sub-package was clearer.
- Used `passlib[argon2]` instead of `[bcrypt]` for the chat-room key hashing — bcrypt's 72-byte limit clashed with our 32-byte URL-safe tokens (collision below the limit, but a footgun for the next contributor).
- Replaced the proposed `AgentSendResult.delivered_via` enum with a free-text string — three new channels landed mid-PR and an enum would be churn.

## Spec changes (🔴)
- `roles_and_access.md` §13 — added `nps_rating` to the Customer column (we discovered Customer is the only one who can write it; the original matrix had this blank).
- `api_contracts.md` §6 — `POST /agent/queries/{id}/send` now returns `QueryDetail` instead of `AgentSendResult` so the UI can avoid a second roundtrip. Zod mirror updated; legacy callers unaffected (no clients yet).
- `db_schema.md` §9.2 — `chat_rooms.duration_min` becomes `duration_seconds` (we found out customer-success wants 90-second drop-ins for VIP triage).

## Tests
- pytest: <pass>
- Playwright: <pass>
```

### "What if the prompt itself is wrong?"

You'll find prompts that contradict each other or contradict reality. When this happens:

1. Fix the immediate code per the smallest sane interpretation.
2. Update both prompts so they no longer disagree.
3. Add a one-line note in the PR's "Spec changes" section.

The build prompts are **versioned design intent** — they should improve every time they're run, not be preserved as fossils.

### "What if I don't know how an unrelated piece works yet?"

Use the prompt's **dependencies** list (each prompt declares what must already exist). If something further upstream is missing, **stop** and either:
- ship the upstream prompt first, or
- carve a tiny stub in your own PR with a `TODO(prompt: NN-other.md)` comment + a corresponding entry in `state_preparation.md` so the work isn't lost.

Never silently mock a dependency without writing down what was mocked.

### Living documents

These prompts will be edited as the project evolves. When you edit a prompt:
- Bump nothing (no version numbers; git history is the version).
- Keep the structure (Goal / Foundational context / Scope / Deliverables / Acceptance / Notes / Test plan / What "done" looks like). Future readers depend on it.
- Cross-link to any other prompt or doc you've moved with.
- If the change invalidates an in-flight PR, leave a one-line note at the top of the prompt: `> ⚠️ Updated YYYY-MM-DD; re-read before continuing if you started before this date.`

---

## File naming

`NN-<role>[-backend|-frontend].md` where `NN` aligns with the order in [`../roles_and_access.md`](../roles_and_access.md):

```
00-single-login.md              ← shared (no role number)
01-admin-backend.md
01-admin-frontend.md
02-auditor-backend.md           (later)
03-billing-backend.md           (later)
04-owner-backend.md             (later)
05-curator-backend.md           (later)
06-manager-backend.md           (later)
07-reviewer-backend.md          (later)
08-agent-backend.md
08-agent-frontend.md
09-customer-backend.md          (later)
```

---

## Tips when running a prompt

- Set the AI's working directory to the repo root so paths in the prompt resolve.
- If the AI asks "do you want X?", the answer is in the prompt — re-paste the relevant section instead of improvising.
- After the AI ships, run the Acceptance Tests block at the end of each prompt. **Don't merge** if any acceptance test fails.
- If a prompt produces too large a diff, split it by the "Deliverables" list — ship one bullet, run tests, then move to the next.
