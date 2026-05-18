# Smart Sales Systems — Workflow Visuals (PNG)

This folder contains pre-rendered PNG versions of every workflow diagram from [`../role_workflows.md`](../role_workflows.md). Use them in slide decks, onboarding docs, screenshots, or anywhere mermaid rendering isn't available.

> **To regenerate:** `python _render.py` (uses [mermaid.ink](https://mermaid.ink) — needs internet but no local Chromium). The script is idempotent; just rerun after any change to `role_workflows.md`.

---

## Index

### Per-role flows (first-time onboarding + returning user)

| # | Role          | First-time                                                    | Returning                                                       |
| - | ------------- | ------------------------------------------------------------- | --------------------------------------------------------------- |
| 1 | Admin         | ![](./01-admin__11-first-time.png)                            | ![](./01-admin__12-returning.png)                               |
| 2 | Auditor       | ![](./02-auditor__21-first-time.png)                          | ![](./02-auditor__22-returning.png)                             |
| 3 | Billing       | ![](./03-billing__31-first-time.png)                          | ![](./03-billing__32-returning.png)                             |
| 4 | Owner         | ![](./04-owner__41-first-time.png)                            | ![](./04-owner__42-returning.png)                               |
| 5 | Curator       | ![](./05-curator__51-first-time.png)                          | ![](./05-curator__52-returning.png)                             |
| 6 | Manager       | ![](./06-manager__61-first-time.png)                          | ![](./06-manager__62-returning.png)                             |
| 7 | Reviewer      | ![](./07-reviewer__71-first-time.png)                         | ![](./07-reviewer__72-returning.png)                            |
| 8 | Agent         | ![](./08-agent-formerly-salesrep__81-first-time.png)          | ![](./08-agent-formerly-salesrep__82-returning-happy-path.png) <br> ![](./08-agent-formerly-salesrep__83-returning-customer-unhappy-2-strike-escalation.png) |
| 9 | Customer      | ![](./09-customer-account-holder__91-first-time.png)          | ![](./09-customer-account-holder__92-returning.png)             |
| 10| Guest         | ![](./10-guest-no-account-anonymous-webhook-intake__101-first-time-every-time-no-notion-of-returning.png) | ![](./10-guest-no-account-anonymous-webhook-intake__102-guest-enters-a-scheduled-chat-after-escalation.png) |
| 11| ReplyJudge    | ![](./11-replyjudge-system-agent__111-per-query-lifecycle.png) | ![](./11-replyjudge-system-agent__112-nightly-batch.png)        |
| 12| RetrievalJudge| ![](./12-retrievaljudge-system-agent__121-per-query-lifecycle.png) | *(no second flow)*                                          |

### Cross-role sequence diagrams

- **13** — End-to-end customer query (happy path): `13-cross-role-end-to-end-customer-query-happy-path.png`
- **14** — 2-strike → scheduled chat → resolution: `14-cross-role-escalation-via-2-strike-scheduled-chat-resolution.png`
- **15** — Discount cascade (Agent → Manager → Owner): `15-cross-role-discount-cascade.png`

### State machines

- **16** — Query lifecycle: `16-state-machine-a-single-querys-lifecycle.png`
- **17** — ChatRoom states: `17-state-machine-a-chatroom.png`
- **18** — DiscountApproval states: `18-state-machine-a-discountapproval.png`

---

## How the renderer works

`_render.py`:
1. Reads `../role_workflows.md`, extracts every ` ```mermaid ... ``` ` block.
2. Names each PNG from the nearest preceding `##` / `###` heading.
3. POSTs the source (URL-safe base64) to `https://mermaid.ink/img/<b64>?type=png` and writes the response bytes to disk.
4. Strips `\(` / `\)` markdown escapes that mermaid's parser rejects (preserves the source markdown's editor-preview compatibility).
5. Retries up to 3× on failure with backoff.

### Mermaid pitfalls to avoid when editing `role_workflows.md`

Anything inside a flowchart `[...]` node label must avoid these characters unless the whole label is wrapped in `"..."`:

- `(` `)` — interpreted as a different node shape
- `"` (inside the label) — terminates the quoted string
- `;` — statement separator (also valid inside sequence-diagram message text — replace with `,`)

If you need parens or quotes, wrap the label in double quotes:
```
A["🟦 Some label (with parens) and a quote"]
```

To embed actual double quotes, use the HTML entity:
```
A["He said &quot;hello&quot;"]
```
