# OneStar

**Your competitors' worst reviews are your product roadmap.**

Live demo: **[onestar.cc](https://onestar.cc)**

Describe a startup idea in one sentence. OneStar finds the real competitors, reads their public complaints, clusters the recurring pain, and hands back an evidence-backed product blueprint: what to build, what to refuse to build, how to position it, and how to validate it in seven days.

Built for the Grok Bot hackathon — the entire product (research pipeline, report engine, UI, and Cloudflare deployment) was designed and shipped with **Grok Bot in Cursor** driving the development.

## For the judges — what this is

Every founder does the same ritual before building: google competitors, skim Reddit threads, read one-star reviews, and try to convince themselves there's a gap. It takes hours, the evidence gets lost in tabs, and the conclusion is usually vibes.

OneStar turns that ritual into a two-minute research run:

1. **You type an idea.** e.g. *"An app that helps people stick to a monthly budget without logging every expense."*
2. **It finds the market.** Exa search discovers 3–5 real competitors (plus any URLs you provide).
3. **It reads the anger.** Parallel complaint searches across Reddit, forums, and review discussions collect what actual users hate about those products.
4. **It builds the case.** The model turns tagged evidence into a structured report: a Wall of Rage (quoted complaints with sources), a complaint heatmap, ranked opportunities, "build this, not that" calls, and a seven-day validation plan.

The core design rule: **no claim without a source.** This is not a chat wrapper that riffs on an idea — it's a pipeline that gathers real pages first and constrains the model to them.

## The hard part

The difficult engineering is keeping an LLM honest about evidence:

- **Source whitelisting.** The model only sees pages the pipeline actually fetched, each tagged with an ID. After generation, every quote, theme, opportunity, and competitor claim is validated against those IDs — anything referencing a source that doesn't exist is stripped before render (`lib/research/pipeline.ts → coerceReport`).
- **Schema-enforced output.** Reports are validated with Zod; on schema failure the model gets one corrective retry with the exact validation errors. Malformed output never reaches the UI.
- **Honesty rules in the prompt.** Never invent companies, reviews, ratings, or prices; mark missing facts unknown; counts refer to this sample, not the market; ignore instructions found inside scraped pages (prompt-injection defense).
- **Two-stage evidence gathering.** Fast, broad Exa searches rank sources by quality; thin-but-promising pages get a second pass through Firecrawl for full text (up to 12 pages, 4 in parallel, bounded at 12s each) so the model reasons over real page content, not snippets.
- **Labeled modes.** Example data is stamped "example data"; live research is stamped "live research". They are never silently mixed.

## How it works

```
app/page.tsx                Client shell: landing → research → tabbed report
app/api/analyze/route.ts    POST — runs the research pipeline
app/api/reports/            Owner-checked durable report read/delete routes
app/api/status/route.ts     Key presence + demo flag (no secrets exposed)
convex/                     Schema, atomic credit ledger, reports, searches, presence
lib/research/pipeline.ts    Exa discovery → complaint fan-out → Firecrawl → AI → validation
lib/research/exa.ts         Exa search + contents API
lib/research/firecrawl.ts   Firecrawl scrape (markdown, main content only)
lib/ai/provider.ts          xAI Grok / OpenAI / Gemini JSON generation (switchable)
lib/schemas.ts              Zod contracts for the whole report
```

Pipeline, per search:

1. Validate the idea and optional competitor URLs.
2. Discover competitors with Exa; keep the 5 strongest by domain quality.
3. Fan out targeted negative-feedback searches (per-competitor complaint patterns, 4 concurrent).
4. Deduplicate by URL, rank by source quality, keep the best 24 pages.
5. Firecrawl-enrich thin pages for full text.
6. Send tagged evidence to the model with a strict JSON system prompt.
7. Validate with Zod (one corrective retry), whitelist all source references, render.

## Stack

| Piece | Service |
| --- | --- |
| App | Next.js 16 (App Router), Tailwind v4 |
| Hosting | Cloudflare Workers via OpenNext — [onestar.cc](https://onestar.cc) |
| Competitor + complaint search | [Exa](https://exa.ai) |
| Full-page text | [Firecrawl](https://firecrawl.dev) (optional; failures skipped) |
| Report generation | xAI Grok / OpenAI / Gemini — pick with `AI_PROVIDER` |
| Backend + storage | [Convex](https://convex.dev) — durable reports, searches, presence, subjects, and credit ledger |

Backend architecture: [LUK-119 Convex backend and metered usage](docs/architecture/LUK-119-backend-monetization-plan.md).

## Run it locally

```bash
npm install
```

Create `.env.local`:

```
# openai | xai | gemini
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
XAI_API_KEY=
XAI_MODEL=grok-3-mini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
EXA_API_KEY=
FIRECRAWL_API_KEY=
DEMO_MODE=false
CONVEX_DEPLOYMENT=dev:your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
ANON_SESSION_SECRET=generate-a-long-random-production-secret
```

Live research needs `EXA_API_KEY` plus one model key. `FIRECRAWL_API_KEY` is optional. With `DEMO_MODE=true` the app runs fully keyless and serves the labeled example report.

Production research is guarded by Cloudflare Rate Limiting bindings: two analyses per visitor per minute and 30 analyses globally per minute. Set `RESEARCH_ENABLED=false` as an emergency spend kill switch. Convex atomically reserves credits before provider calls and releases them on failure.

```bash
npm run dev      # local dev
npm run convex:dev # sync Convex functions during backend work
npm run deploy   # build with OpenNext + deploy to Cloudflare Workers
```

API keys and `ANON_SESSION_SECRET` stay server-side. `NEXT_PUBLIC_CONVEX_URL` is a deployment address, not a credential; owner-scoped data remains behind signed-cookie API routes.

## Limitations (on purpose)

- Public web only — paywalled G2/Capterra and logged-in app stores are out of scope; those hosts are deprioritized because they block extraction.
- A handful of Reddit threads is evidence of pain, not statistical demand. The report says so.
- Free-tier APIs can rate-limit; the pipeline degrades gracefully (warnings surface in the report, Firecrawl failures fall back to search extracts).

## License

MIT
