# LUK-119 — Convex backend and metered usage

## Goal

Convex is OneStar’s durable backend. Next.js 16 route handlers keep browser-facing HTTP contracts and run on OpenNext/Cloudflare Workers. Convex stores anonymous subjects, reports, searches, presence, credit balances, idempotency state, and append-only usage events.

Browser storage is only a migration fallback for reports created before this backend. New report ownership and history come from Convex.

## Current architecture

| Concern | Implementation |
| --- | --- |
| Durable data | Convex tables, indexes, queries, and mutations |
| Report payloads | Validated report JSON in private Convex report documents |
| Anonymous identity | Signed `onestar_sid` HttpOnly cookie issued by Next.js route handlers |
| Ownership | Server-resolved subject key; browser request bodies never select an owner |
| Credit accounting | Cached subject balance plus append-only Convex ledger |
| Idempotency | Per-subject request key and canonical input hash |
| Spend bursts | Existing Cloudflare visitor and global rate-limit bindings |
| Research | Existing synchronous Exa → Firecrawl → model pipeline |
| Accounts | Schema plus internal claim mutation ready for a future hosted auth provider |
| Billing | Deferred until price, provider, refund, and expiration policy are approved |

Next.js route handlers use `fetchQuery` and `fetchMutation` from `convex/nextjs`. The app does not need a Convex React provider because all owner-scoped calls remain behind HttpOnly-cookie routes.

## Data model

`subjects`

- SHA-256 pseudonym derived from a random server-created cookie subject, anonymous/account kind, optional account link.
- Cached integer `creditBalance` updated only beside ledger inserts in the same mutation.
- New anonymous subjects receive five credits through one idempotent grant event.

`accounts`

- Hosted auth provider plus unique external subject.
- No password authentication or provider choice is added here.

`reports`

- Subject owner, request/input hashes, idea and competitor URLs, trace ID, timestamps.
- Status: `running`, `complete`, `failed`, or `deleted`.
- Complete report JSON stays private and is returned only through owner-checked routes.

`analysisRequests`

- Unique logical request per subject and idempotency key.
- Input hash prevents one key from being reused for different input.
- Stores terminal failure response fields so retries return the first result.

`usageLedger`

- Append-only `grant`, `reserve`, `consume`, `release`, or future `adjustment` events.
- Reservation debits one credit before provider calls.
- Completion records a zero-delta consume marker. Failure returns the reserved credit with a release event.

`searches`

- Durable public archive created once when an analysis reservation succeeds.
- Normalized idea supports deterministic deduplication in query results.

`presence`

- Six-hour activity window with a hashed visitor key, coarse geo fields, action, and timestamp.
- Visit writes are limited to once per five minutes per visitor. No raw IP address is stored.

## Analyze lifecycle

1. Next.js resolves or issues the signed anonymous cookie.
2. Route checks emergency pause, Cloudflare burst limits, request size, and Zod input.
3. Route hashes canonical input and calls `analysis.reserve`.
4. One Convex mutation creates subject/grant if needed, checks idempotency and active work, reserves credit, creates running report/request, and records search.
5. Route runs current research pipeline.
6. Success calls `analysis.complete`, stores report JSON, and records consume marker.
7. Typed or unknown failure calls `analysis.fail`, stores safe failure fields, and releases reserved credit.
8. Response includes full report for current UI compatibility plus durable `reportId` and balance.

Convex mutations are the transaction boundary. Provider network calls stay in Next.js between reservation and completion because Convex queries and mutations cannot call external services.

## API boundary

| Route | Responsibility |
| --- | --- |
| `POST /api/analyze` | Rate limit, validate, reserve, run research, persist terminal result, return `reportId` |
| `GET /api/reports` | List caller-owned durable report metadata |
| `GET /api/reports/:id` | Return one caller-owned report |
| `DELETE /api/reports/:id` | Tombstone caller-owned report and clear payload |
| `GET /api/usage` | Return caller balance and safe recent ledger entries |
| `GET /api/searches` | Return paged durable public search archive |
| `GET /api/presence` | Return aggregate Convex presence snapshot |
| `POST /api/presence` | Store a throttled visit/search activity event |

Every owner-scoped route derives subject from signed cookie. Report IDs alone grant no access. Invalid or foreign IDs return not found.

## Idempotency and credits

Clients send an `Idempotency-Key`. Missing or malformed keys are replaced server-side. Keys are scoped to subject and compared against canonical input hash.

- Same key + same completed input: return stored report, charge nothing.
- Same key + same failed input: return stored failure, charge nothing.
- Same key + running input: report active work, charge nothing.
- Same key + different input: reject with `request_conflict`.
- Different key while subject has running report: reject before provider calls.
- No credit: reject with `insufficient_credits` before provider calls.

Demo-mode reports use the same durable lifecycle with zero credit cost.

## Anonymous-to-account claim

`analysis.claimSubject` is an internal Convex mutation. Future auth callback code must verify the hosted provider session in Next.js, then invoke the internal claim path through a trusted backend function. It creates or finds the provider account and links the anonymous subject atomically.

Account collision merging is intentionally not exposed yet. If an external account already belongs to another subject, claim fails. A later auth ticket must define canonical-subject selection, report transfer, ledger transfer pairs, and cookie rotation before enabling account UI.

## Retention and privacy

Anonymous report retention policy remains a product decision. Deleting a report immediately changes status to `deleted` and clears its report payload. Usage ledger events remain append-only for accounting integrity.

Persisted data excludes raw IPs, cookies, provider secrets, full Exa/Firecrawl responses, and model credentials. Report JSON contains selected evidence already shown to the user. Presence retains at most six hours in aggregate queries; scheduled physical cleanup can be added before volume requires it.

## Failure behavior

- Convex unavailable before reservation: fail closed; paid providers are not called.
- Pipeline failure after reservation: mark failed and release credit.
- Duplicate completion/failure calls: mutation state makes them no-ops.
- Completion write failure: response fails; running row remains visible for reconciliation and must not be rerun automatically with a new key.
- Foreign report read/delete: return not found.
- Presence/search read failure: route fails without falling back to Worker memory.

Operational alerts should watch running reports older than route maximum duration, reserve events without consume/release markers, negative balances, Convex errors, dependency failure rates, and p95 analysis duration. Logs must omit idea/report bodies, cookies, provider payloads, and auth identifiers.

## Deployment

Development backend is selected by `CONVEX_DEPLOYMENT`; Next.js server helpers use `NEXT_PUBLIC_CONVEX_URL`. `ANON_SESSION_SECRET` must be a high-entropy production secret. Local development uses a clearly scoped fallback only when `NODE_ENV` is not production.

Run `npx convex dev --once` to validate and push functions to the configured development deployment. Production deployment remains a separate release action and is not part of this implementation.

## Validation checklist

- First anonymous live run creates one subject, initial grant, reservation, complete report, search, and net one-credit debit.
- Repeating same request key creates no second report, search, or debit.
- Failed research releases exactly one reserved credit and replays same failure.
- Concurrent different request is stopped while one report runs.
- Another signed session cannot list, fetch, or delete first session’s report.
- Search archive and presence survive Worker cold starts because Convex is source of truth.
- Deleted report payload becomes inaccessible while ledger remains intact.
- Internal account claim is unavailable to browser clients.
