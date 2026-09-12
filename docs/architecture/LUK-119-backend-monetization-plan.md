# LUK-119 — Durable reports and metered usage

## Goal and boundary

Add the smallest production backend for live research reports, anonymous usage, later account ownership, and paid credits. Keep the current Next.js 16 App Router application on OpenNext/Cloudflare Workers. Do not add an auth, database, object-storage, or billing SDK in this ticket.

Today `POST /api/analyze` performs the whole research run synchronously and returns a report; reports and saved history live only in browser `localStorage`. The global presence/search archive is Worker-process memory and is deliberately not a source of truth. The new backend must not make either client cache or presence data authoritative.

## Recommended path

Use Cloudflare D1 for relational metadata, ownership, idempotency, and the immutable usage ledger; R2 for full report JSON; Workers Analytics Engine (or structured logs first) for operational events; and Stripe Checkout + webhooks when payments are enabled. Use a signed anonymous cookie now and add an external hosted auth provider at the account gate.

Why this path: it keeps the request on the existing Worker, needs no extra regional database or connection proxy, and separates small transactional records from potentially large report payloads. It is sufficient for the first paid tier. D1 is not the place for raw scraped page bodies or report blobs; R2 is not the place to enforce credits.

| Concern | Options that fit | Decision |
| --- | --- | --- |
| Relational state | D1; Neon/Postgres; Supabase Postgres | Start D1. Move only if concurrent account/credit transactions, SQL needs, or reporting outgrow D1. |
| Report payloads | D1 JSON; R2; external S3 | Store versioned JSON in private R2. D1 keeps metadata and object key. |
| Anonymous identity | signed first-party cookie; Cloudflare Turnstile identity; IP hash | Signed opaque cookie. IP hashes remain abuse telemetry only. |
| Account auth | Clerk; Auth0; Better Auth; custom credentials | Gate decision: choose Clerk for fastest hosted UX, Better Auth + D1 for Cloudflare-native control. Do not build passwords. |
| Payments | Stripe; Paddle; Lemon Squeezy | Stripe first: Checkout, customer portal, signed webhooks, credit-pack invoices. Re-evaluate Paddle if merchant-of-record/tax handling becomes a business requirement. |
| Async work | synchronous route; Cloudflare Queues + Worker consumer; Durable Objects | Keep synchronous while the current 120 s route is reliable. Gate Queues when p95 exceeds 45 s, retry volume rises, or a job must survive client disconnects. |

Decision gates before implementation:

1. Confirm launch geography and expected paid research volume. If workloads need multi-region write guarantees or advanced analytics, evaluate Postgres before migrations.
2. Choose account UX: hosted Clerk versus Better Auth with D1. This defines the `accounts.external_subject` source, not report/ledger shape.
3. Approve the credit price, expiration policy, and whether demo runs are free. Do not enable Checkout until these are explicit.
4. Run D1 load tests using representative report completion and credit-spend concurrency. If atomic credit decrement is not reliable at target load, serialize a subject's debits through a Durable Object or move the ledger to Postgres.

## Data model

All UUIDs are server-generated. Timestamps are UTC ISO strings or integer milliseconds consistently chosen during migration. IDs sent by clients are opaque; ownership always comes from the server session.

```text
subjects
  id PK                         # durable owner, anonymous or account-backed
  kind                           # anonymous | account
  account_id nullable unique     # set after account claim
  created_at, claimed_at nullable, deleted_at nullable

accounts
  id PK
  auth_provider, external_subject unique
  email_hash nullable            # only if product needs support lookup
  created_at, deleted_at nullable

reports
  id PK
  subject_id FK subjects
  status                         # running | complete | failed | deleted
  input_hash, idea_preview, requested_at, completed_at nullable
  report_schema_version
  r2_key nullable, size_bytes nullable, expires_at
  failure_code nullable, trace_id
  unique(subject_id, request_id)

usage_ledger
  id PK
  subject_id FK subjects
  report_id nullable FK reports
  kind                           # grant | reserve | consume | release | refund | expire | adjustment
  credits_delta                  # signed integer; append-only
  source_type, source_id         # checkout_session, webhook_event, report, admin_case
  idempotency_key unique
  created_at, metadata_json

billing_customers
  id PK
  account_id unique FK accounts
  provider_customer_id unique
  created_at

webhook_events
  provider_event_id PK
  provider, received_at, processed_at nullable, status, payload_hash, error_code nullable

idempotency_keys
  key PK
  subject_id FK subjects
  operation                       # analyze | checkout | webhook
  request_hash, response_status, response_json nullable, created_at, expires_at
```

Indexes: `reports(subject_id, requested_at DESC)`, `reports(status, requested_at)`, `usage_ledger(subject_id, created_at DESC)`, `usage_ledger(source_type, source_id)`, and `webhook_events(status, received_at)`. `usage_ledger` is never updated or deleted except under a documented privacy erasure process; balance is `SUM(credits_delta)` or a cache rebuilt from the ledger. Credit debits must be inserted with a unique idempotency key in the same D1 transaction/batch as their state transition.

## Request flow

```mermaid
sequenceDiagram
  participant B as Browser
  participant W as OpenNext Worker
  participant D as D1
  participant O as R2
  participant X as Exa/Firecrawl/AI
  B->>W: POST /api/analyze + Idempotency-Key
  W->>W: verify signed anonymous/account session; validate body
  W->>D: create subject if needed; reserve one credit atomically
  alt replayed key
    D-->>W: prior response or active report
  else credit reserved
    W->>D: create reports(running)
    W->>X: current research pipeline
    X-->>W: validated report
    W->>O: put reports/{reportId}/v1.json
    W->>D: complete report; consume reserve in one transaction
    W-->>B: report summary + reportId
  else provider failure
    W->>D: mark failed; release reserve
    W-->>B: existing typed retryable error
  end
```

The initial response may keep returning the full report for UI compatibility, but it must also return `reportId`. Then migrate the client to `GET /api/reports/:id`; the browser saves only report IDs and presentation preferences. R2 object access stays behind the Worker; never issue a public bucket URL for report data.

## API boundary

| Route | Responsibility |
| --- | --- |
| `POST /api/analyze` | Session resolution, rate-limit check, idempotent credit reservation, run/create report, final response. Existing input schema remains. |
| `GET /api/reports` | List caller-owned durable reports with cursor pagination and no payload blobs. |
| `GET /api/reports/:id` | Authorize owner, read R2 payload, return report. |
| `DELETE /api/reports/:id` | Mark deleted, delete R2 object asynchronously/retryably, retain minimal deletion audit. |
| `GET /api/usage` | Return balance and ledger entries safe for the caller. |
| `POST /api/billing/checkout` | Account-only, idempotently create or reuse Checkout session; no client supplied amount. |
| `POST /api/billing/webhook` | Verify raw Stripe signature before parsing, dedupe provider event, grant/refund credits transactionally. |
| `POST /api/auth/claim` | Auth callback/internal hook: atomically attach anonymous subject to account, or merge safely. |

Responses include a correlation ID. Never expose provider event payloads, object keys, customer IDs, raw errors, or remaining third-party API quota.

## Anonymous-to-account claim

1. First request sets a Secure, HttpOnly, SameSite=Lax `onestar_sid` cookie containing a signed opaque `subject_id`; rotate signing keys with key IDs. Do not put email or balance in the cookie.
2. Anonymous reports and ledger rows use this subject. An anonymous subject has a small free grant and stricter abuse limits.
3. After successful provider authentication, `POST /api/auth/claim` verifies both sessions server-side. In one transaction, lock/serialize the anonymous subject, create or find `accounts`, attach the subject if unclaimed, and record an audit event.
4. If the account already has a separate subject, choose the account subject as canonical; reassign non-deleted reports and append a ledger transfer pair rather than changing ledger history. If both subjects have an active reservation, reject/retry after it resolves.
5. Rotate the session cookie to the canonical subject. Claim is idempotent and safe to retry.

## Metering, billing, and abuse control

Meter one credit per successful live report initially. Reserve before external calls; consume only after the validated report is stored; release on every typed failure, timeout, or cancelled job. Demo mode costs zero and never creates a billable ledger row. Do not debit from a mutable balance field without an append-only ledger record.

Protect spend before credit reservation: per-subject and per-IP rate limits, Turnstile escalation for suspicious anonymous traffic, 2,000-character input and 3 URL caps already enforced, request-size cap, one active analysis per subject, a daily anonymous cap, and provider-specific timeout/concurrency limits. Give the pipeline a cost budget: maximum Exa queries/pages, maximum Firecrawl pages, max LLM input/output tokens, and a hard per-report estimated-cost ceiling. Record actual provider usage where returned; otherwise record estimates tagged as estimates.

Stripe webhook processing is at-least-once: validate signature against the raw request, persist `provider_event_id` before granting, use it as the ledger idempotency key, process asynchronously/retry on temporary D1 failure, and alert on aged unprocessed events. Checkout success in the browser is never proof of credits. Refund/dispute events append compensating ledger entries and may block new generation if balance is negative.

## Retention, privacy, and deletion

Default report retention: 30 days for anonymous subjects and 12 months for accounts, configurable by product policy. Store only report JSON and minimal metadata; never persist raw Exa/Firecrawl response bodies unless a separate evidence-retention decision is approved. Store a normalized idea preview only if needed for report lists; otherwise derive a redacted preview. Do not persist IP addresses; existing presence uses a hash and must stay separate from identities.

`DELETE /api/reports/:id` makes the report inaccessible immediately and removes the R2 object with retry. Account deletion revokes sessions, marks reports deleted, schedules R2 removal, minimizes/replaces subject linkage, and retains only legally required billing/ledger records with pseudonymous IDs and documented retention. Keep webhook payloads only as long as needed for reconciliation; retain payload hashes and event status longer. Publish exact retention windows before paid launch.

## Observability and failure behavior

Every analyze, report read, claim, debit, Checkout creation, and webhook gets `trace_id`, operation, subject kind, result, latency, and safe failure code. Emit structured Worker logs and metrics for: report success/failure by dependency, p50/p95 duration, R2/D1 errors, reserve/consume/release mismatch, duplicate idempotency hits, balance below zero, webhook age, estimated cost/report, and deletion backlog. Sampling must exclude idea text, report payloads, cookies, auth IDs, payment data, and raw provider responses.

Failure rules:

- D1 unavailable before reservation: fail closed; do not call paid providers.
- Duplicate analyze: return the original completed result or current running report; never reserve twice.
- Research/AI timeout after reserve: mark failure and release; reconciliation finds reservations older than the maximum job duration.
- R2 write fails: do not consume; release and return retryable failure.
- D1 completion fails after R2 write: keep object private, retry reconciliation by `report_id`; do not rerun providers automatically.
- Webhook succeeds at Stripe but D1 fails: retry from persisted/delivered event; no browser credit grant.
- Deletion object removal fails: keep tombstone, retry, alert after SLA.

## Staged rollout

1. **Shadow persistence:** feature flag writes completed live reports to D1/R2 after the current response, no reads, no credits. Verify schema, retention job, and cost metrics.
2. **Durable reports:** return `reportId`, enable report history/read for a small allowlist, preserve localStorage fallback, and compare stored payload hashes with returned reports.
3. **Anonymous usage:** issue signed subjects, free grants, limits, and reserve/consume/release ledger while billing remains off. Reconcile daily.
4. **Accounts:** enable selected auth provider and claim flow for staff/beta users; test collision and merge paths.
5. **Paid credits:** enable Stripe Checkout/webhooks for a small region/cohort, then expand after webhook, reconciliation, support, and deletion alerts meet thresholds.
6. **Async jobs if gated:** move analysis to Queues/consumer and expose report polling/status without changing report ownership or ledger semantics.

Rollback: disable flags to stop new persistence, accounts, or Checkout independently; keep read/delete access for existing data. Never remove the ledger or webhook tables as a rollback mechanism.

## Manual validation checklist

- [ ] A first anonymous live run creates one subject, one complete report, one private R2 object, and one net `-1` credit charge.
- [ ] Repeating the same request with the same idempotency key creates no second report, debit, or provider run.
- [ ] Timeout at each provider, R2 write failure, and D1 completion failure leaves no stranded debit after reconciliation.
- [ ] A second browser/session cannot list, fetch, or delete another subject's report; direct R2 URL is unavailable.
- [ ] Sign-in claims anonymous reports and balance once; repeated claim, account collision, and active-reservation cases are safe.
- [ ] Checkout redirect without a verified webhook grants zero credits; a duplicate, delayed, invalid-signature, refund, and dispute webhook each produce correct ledger outcomes.
- [ ] Rate limits, one-active-job limit, daily anonymous cap, and suspicious-traffic challenge stop spend before provider calls.
- [ ] Retention expiry and user deletion make report content unavailable, remove R2 payloads, preserve only approved audit/billing records, and complete retry queues.
- [ ] Dashboards show correlation IDs and safe failure codes without raw ideas, report content, auth data, cookies, or payment payloads.
