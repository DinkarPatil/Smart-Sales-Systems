import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export const metadata = {
  title: 'Smart Sales — multi-tenant sales support, AI-drafted and human-verified',
  description:
    'AI generates the first reply from your own corpus. Your team verifies, sends, escalates. Every escalation can land in a scheduled, key-gated room with the company owner.',
};

const roles: Array<{
  name: string;
  oneLiner: string;
  path: string;
  capabilities: string[];
}> = [
  {
    name: 'Admin',
    oneLiner: 'Platform operator. Keeps the lights on.',
    path: '/admin',
    capabilities: ['Provision tenants', 'Manage every user', 'Read system logs + RAG diagnostics'],
  },
  {
    name: 'Owner',
    oneLiner: 'The company. Owns catalogue, prices, the AI’s knowledge.',
    path: '/owner',
    capabilities: ['Products + documents', 'Per-tenant RAG corpus', 'Resolve escalated negotiations'],
  },
  {
    name: 'Manager',
    oneLiner: 'Mid-management. Spans multiple companies if needed.',
    path: '/manager',
    capabilities: ['Team + queue oversight', 'Reassign and prioritise', 'Approve mid-tier discounts'],
  },
  {
    name: 'Agent',
    oneLiner: 'Customer-facing executor. The human in the loop.',
    path: '/agent',
    capabilities: ['Verify and send AI drafts', 'Escalate or schedule chat', 'Apply discounts within ceiling'],
  },
  {
    name: 'Reviewer',
    oneLiner: 'Quality gate after resolution.',
    path: '/reviewer',
    capabilities: ['Sample resolved replies', 'Grade on rubric', 'Feed leaderboards'],
  },
  {
    name: 'Curator',
    oneLiner: 'Specialist who keeps the corpus accurate.',
    path: '/curator',
    capabilities: ['Upload + curate manuals', 'Trigger re-index', 'Fill retrieval gaps'],
  },
  {
    name: 'Auditor',
    oneLiner: 'Read-only across every tenant.',
    path: '/auditor',
    capabilities: ['Activity + auth event log', 'Closed chat transcripts', 'Export evidence packs'],
  },
  {
    name: 'Billing',
    oneLiner: 'Token usage, invoices, payment freezes.',
    path: '/billing',
    capabilities: ['Per-tenant usage', 'Plan tiers + overage', 'Suspend non-payers'],
  },
  {
    name: 'Customer',
    oneLiner: 'The end user. Tracks their threads cross-tenant.',
    path: '/customer',
    capabilities: ['Submit + track queries', 'Reply in-portal', 'Rate resolution, join chat'],
  },
];

const pillars = [
  {
    n: '01',
    title: 'AI drafts. Humans verify.',
    body:
      'Every customer query gets a retrieval-grounded first answer from the right company’s corpus. The Agent reads it, edits, sends. No AI ever speaks for you unsupervised.',
  },
  {
    n: '02',
    title: 'Many doorways. One queue.',
    body:
      'Google Forms, customer portal, support email, chat widget, WhatsApp, voice, partner API — all funnel into the same Query model. Threads stitch by Message-ID; nothing falls through the cracks.',
  },
  {
    n: '03',
    title: 'Discipline at escalation.',
    body:
      'A 2-strike rule auto-escalates after the third unhappy reply. Discounts cascade Agent → Manager → Owner. SLAs are tracked; the at-risk view is the first thing Managers see.',
  },
  {
    n: '04',
    title: 'A room when text isn’t enough.',
    body:
      'Owner and Customer enter a time-boxed chat room with one-time secret keys delivered separately. Transcripts archive automatically. Agent and Manager get read-only visibility.',
  },
  {
    n: '05',
    title: 'Quality watched by quality.',
    body:
      'ReplyJudge scores every draft pre-send (block on hallucination, warn on tone). RetrievalJudge scores the retrieval itself and opens corpus-gap tickets for the Curator. Reviewers grade the survivors.',
  },
];

export default function LandingPage() {
  return (
    <main className="text-ink" style={{ counterReset: 'section' }}>
      {/* -------------------------------------------------------------- */}
      {/* HEADER                                                          */}
      {/* -------------------------------------------------------------- */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="font-display text-xl tracking-tight">
          <span className="font-semibold italic">Smart</span>
          <span className="ml-1 font-light">Sales</span>
          <span className="ml-1 align-top text-accent">·</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#what" className="text-ink-soft hover:text-ink">What</a>
          <a href="#roles" className="text-ink-soft hover:text-ink">Roles</a>
          <a href="#flow" className="text-ink-soft hover:text-ink">Flow</a>
          <Link
            href="/login"
            className="rounded-full border border-ink/15 bg-paper-2 px-4 py-1.5 text-ink hover:border-ink/40"
          >
            Sign in
          </Link>
        </nav>
      </header>

      {/* -------------------------------------------------------------- */}
      {/* HERO                                                            */}
      {/* -------------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-12 sm:px-10 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <p className="eyebrow rise">A sales workbench for the LLM era</p>
            <h1 className="rise delay-1 mt-6 font-display text-5xl leading-[1.02] tracking-tight sm:text-7xl">
              The AI writes the first reply.{' '}
              <span className="italic text-accent">A person</span>{' '}
              writes the one your customer reads.
            </h1>
            <p className="rise delay-2 mt-8 max-w-2xl text-lg leading-relaxed text-ink-soft">
              Smart Sales Systems is a multi-tenant sales support platform. Customer questions come
              in from any channel, a per-company retrieval-grounded draft is generated, your
              sales team reviews and sends. Escalations route to the company owner, optionally
              landing in a time-boxed, key-gated chat room.
            </p>
            <div className="rise delay-3 mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition hover:bg-ink-soft"
              >
                Sign in
                <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/register/customer"
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-medium text-ink transition hover:border-ink/50"
              >
                Create a customer account
              </Link>
              <span className="ml-2 hidden text-xs text-ink-mute sm:inline">
                Staff are provisioned by an Admin.
              </span>
            </div>
          </div>

          {/* HERO sidecar — a tiny visualisation, not a stock photo */}
          <aside className="rise delay-4 lg:col-span-4">
            <div className="relative">
              <div className="rounded-2xl border border-ink/15 bg-paper-2 p-6 shadow-[0_1px_0_rgb(0,0,0,0.03),0_30px_60px_-30px_rgb(24,24,27,0.15)]">
                <p className="eyebrow">A query in motion</p>
                <ol className="mt-4 space-y-3 font-mono text-[13px] text-ink">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                    customer → google form
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-ink" />
                    rag.retrieve(tenant_id)
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-ink" />
                    judge.pre_send(draft)
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-ink" />
                    agent → review + send
                  </li>
                  <li className="flex items-start gap-3 text-ink-mute">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-ink-mute" />
                    customer.reply × 3 ⇒ 2-strike
                  </li>
                  <li className="flex items-start gap-3 text-ink-mute">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-ink-mute" />
                    owner.schedule_chat
                  </li>
                  <li className="flex items-start gap-3 text-accent">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                    resolved ✓
                  </li>
                </ol>
              </div>
              <div className="absolute -bottom-3 -right-3 -z-10 h-full w-full rounded-2xl border border-ink/10" />
            </div>
          </aside>
        </div>
      </section>

      {/* -------------------------------------------------------------- */}
      {/* WHAT — five pillars                                             */}
      {/* -------------------------------------------------------------- */}
      <section id="what" className="border-y border-ink/10 bg-paper-2/50">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow">What it does</p>
              <h2 className="mt-4 font-display text-4xl leading-tight">
                A sales workbench, not <span className="italic">another</span> chatbot.
              </h2>
              <p className="mt-4 text-ink-soft">
                The AI is in the loop, but the loop is built around your team — their roles, their
                ceilings, their tenants, their tone.
              </p>
            </div>

            <div className="lg:col-span-8">
              <ol className="grid gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10 sm:grid-cols-2">
                {pillars.map((p) => (
                  <li key={p.n} className="bg-paper p-6">
                    <p className="font-mono text-[11px] tracking-[0.18em] text-accent">{p.n}</p>
                    <h3 className="mt-3 font-display text-xl leading-tight">{p.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink-soft">{p.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- */}
      {/* ROLES — the directory of dashboards                             */}
      {/* -------------------------------------------------------------- */}
      <section id="roles" className="mx-auto max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Who uses it</p>
            <h2 className="mt-4 font-display text-4xl leading-tight">
              Nine roles. Each gets a workbench.
            </h2>
          </div>
          <Link
            href="/login"
            className="hidden text-sm font-medium text-ink hover:text-accent sm:inline-flex sm:items-center sm:gap-1"
          >
            Sign in to the right one <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <article key={r.name} className="group bg-paper p-6 transition hover:bg-paper-2">
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-2xl text-ink">{r.name}</h3>
                <code className="font-mono text-[11px] text-ink-mute">{r.path}</code>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{r.oneLiner}</p>
              <ul className="mt-4 space-y-1.5 text-[13px] text-ink-soft">
                {r.capabilities.map((c) => (
                  <li key={c} className="flex gap-2">
                    <span className="mt-2 inline-block h-px w-3 bg-ink/30" />
                    {c}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="mt-6 text-xs text-ink-mute">
          Staff dashboards are gated by role at the middleware layer — visit them and you’ll be
          routed back to <Link href="/login" className="underline">sign in</Link> if you’re not the right person.
        </p>
      </section>

      {/* -------------------------------------------------------------- */}
      {/* FLOW — canonical pipeline                                       */}
      {/* -------------------------------------------------------------- */}
      <section id="flow" className="border-y border-ink/10 bg-paper-2/50">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
          <p className="eyebrow">How a query flows</p>
          <h2 className="mt-4 font-display text-4xl leading-tight">
            From intake to resolution, one path.
          </h2>

          <div className="mt-12 grid gap-8 lg:grid-cols-7">
            {[
              { k: 'Intake', v: '10 channels feed one queue.' },
              { k: 'Retrieve', v: 'Per-tenant vector store.' },
              { k: 'Draft', v: 'Groq Llama-3, grounded.' },
              { k: 'Judge', v: 'Block on hallucination.' },
              { k: 'Send', v: 'Agent verifies, dispatches.' },
              { k: '2-strike', v: 'Auto-escalate at reply #3.' },
              { k: 'Room', v: 'Owner + Customer chat.' },
            ].map((s, i) => (
              <div key={s.k} className="relative">
                <p className="font-mono text-[11px] tracking-[0.18em] text-accent">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-2 font-display text-xl">{s.k}</h3>
                <p className="mt-1 text-sm text-ink-soft">{s.v}</p>
                {i < 6 && (
                  <span
                    aria-hidden
                    className="absolute right-[-1.5rem] top-1 hidden h-px w-6 bg-ink/30 lg:block"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- */}
      {/* CTA strip                                                       */}
      {/* -------------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
        <div className="rounded-2xl border border-ink/15 bg-ink p-10 text-paper sm:p-14">
          <p className="font-mono text-[11px] tracking-[0.22em] text-paper/70">READY?</p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
            Two doors. One platform.
          </h2>
          <p className="mt-3 max-w-2xl text-paper/70">
            Staff sign in to their role’s dashboard. Customers sign up to track their own queries
            and join scheduled chats.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition hover:bg-paper-2"
            >
              Sign in
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register/customer"
              className="inline-flex items-center gap-2 rounded-full border border-paper/30 px-6 py-3 text-sm font-medium text-paper transition hover:border-paper"
            >
              Create a customer account
            </Link>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- */}
      {/* FOOTER                                                          */}
      {/* -------------------------------------------------------------- */}
      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-base">
              <span className="font-semibold italic">Smart</span> <span className="font-light">Sales</span>
            </span>
            <span className="font-mono text-[11px] text-ink-mute">v0.1 · build prompt 00</span>
          </div>
          <div className="flex gap-6 text-sm text-ink-soft">
            <Link href="/login" className="hover:text-ink">Sign in</Link>
            <Link href="/register/customer" className="hover:text-ink">Customer sign-up</Link>
            <Link href="/forgot-password" className="hover:text-ink">Forgot password</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
