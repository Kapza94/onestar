"use client";

import { ArrowRight } from "lucide-react";
import { LANDING_IDEA, landingSample as S } from "@/lib/landing-sample";
import { Wordmark } from "./wordmark";

const CONTAINER = "mx-auto w-full max-w-[1120px] px-5 md:px-8";

export function Landing({
  idea,
  onIdea,
  onSubmit,
  busy,
}: {
  idea: string;
  onIdea: (value: string) => void;
  onSubmit: (ideaOverride?: string) => void;
  busy: boolean;
}) {
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const q = idea.trim() || LANDING_IDEA;
    onIdea(q);
    onSubmit(q);
  }

  return (
    <div className="bg-bg text-fg">
      {/* ---- header ---- */}
      <header className="border-b border-line">
        <div className={`${CONTAINER} flex h-16 items-center justify-between gap-4`}>
          <Wordmark href="/" />
          <nav className="hidden items-center gap-8 text-[13px] text-muted md:flex">
            <a href="#sample" className="hover:text-fg">how it works</a>
            <a href="#sample" className="hover:text-fg">sample report</a>
            <a href="#pricing" className="hover:text-fg">pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="#search" className="hidden text-[13px] text-muted hover:text-fg sm:inline">sign in</a>
            <a
              href="#search"
              className="rounded-md border border-acid px-4 py-2 text-[13px] font-medium text-acid transition-colors hover:bg-acid hover:text-bg"
            >
              start a search
            </a>
          </div>
        </div>
      </header>

      {/* ---- hero ---- */}
      <section className="border-b border-line">
        <div className={`${CONTAINER} py-14 md:py-20`}>
          <p className="font-label text-[11px] uppercase tracking-[0.28em] text-faint">
            onestar / product evidence
          </p>

          <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_300px] md:items-end">
            <h1 className="text-[clamp(2.9rem,8.5vw,6rem)] font-bold leading-[0.9] tracking-[-0.05em]">
              build from
              <br />
              what they hate.
            </h1>
            <p className="max-w-[42ch] border-l border-line pl-6 text-[15px] leading-7 text-muted">
              Give us the idea. We find the competitors, read the complaints, and identify the product
              customers are asking for.
            </p>
          </div>

          {/* search */}
          <form id="search" onSubmit={submit} className="mt-12 max-w-[860px] scroll-mt-24">
            <p className="font-label text-[11px] uppercase tracking-[0.22em] text-faint">01 / idea</p>
            <div className="mt-3 flex items-stretch gap-3">
              <input
                value={idea}
                onChange={(event) => onIdea(event.target.value)}
                placeholder={LANDING_IDEA}
                aria-label="describe your idea"
                className="min-w-0 flex-1 border border-line bg-bg-elev px-5 py-4 text-[15px] text-fg outline-none transition-colors placeholder:text-faint focus:border-acid/60 md:text-base"
              />
              <button
                type="submit"
                disabled={busy}
                aria-label="research this idea"
                className="inline-flex shrink-0 items-center justify-center bg-acid px-5 text-bg transition hover:brightness-110 disabled:opacity-40"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <a href="#sample" className="mt-3 inline-block text-[13px] text-faint underline underline-offset-4 hover:text-muted">
              or open the example report
            </a>
          </form>

          {/* evidence strip */}
          <div className="mt-14 grid gap-8 border-t border-line pt-8 md:grid-cols-3 md:gap-12">
            <div>
              <p className="font-label text-[11px] uppercase tracking-[0.2em] text-rage">raw evidence</p>
              <p className="mt-3 text-2xl font-semibold leading-8 tracking-[-0.02em]">
                “{S.hero.rawEvidence}”
              </p>
            </div>
            <div className="md:border-l md:border-line md:pl-12">
              <p className="font-label text-[11px] uppercase tracking-[0.2em] text-faint">repeated pain</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.02em]">{S.hero.repeatedPain}</p>
              <p className="mt-2 font-label text-[12px] uppercase tracking-[0.14em] text-faint">
                / {S.hero.mentions} mentions
              </p>
            </div>
            <div className="md:border-l md:border-line md:pl-12">
              <p className="font-label text-[11px] uppercase tracking-[0.2em] text-acid">product decision</p>
              <p className="mt-3 text-2xl font-semibold leading-8 tracking-[-0.02em]">
                {S.hero.productDecision}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- sample report (light) ---- */}
      <section id="sample" className="scroll-mt-4 bg-white text-black">
        <div className={`${CONTAINER} py-14 md:py-20`}>
          <div className="flex items-center justify-between">
            <span className="font-label text-[11px] uppercase tracking-[0.2em] text-black/50">
              sample report {S.reportNo}
            </span>
            <span className="rounded border border-black/20 px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.18em] text-black/60">
              example data
            </span>
          </div>
          <div className="mt-5 border-t border-black/10" />

          <h2 className="mt-8 max-w-[20ch] text-[clamp(1.9rem,5vw,3.2rem)] font-bold leading-[1.02] tracking-[-0.04em]">
            {S.headline}
          </h2>
          <p className="mt-2 max-w-[34ch] text-[clamp(1.4rem,3.4vw,2.1rem)] font-medium leading-[1.1] tracking-[-0.03em] text-black/45">
            {S.subhead}
          </p>

          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {/* evidence */}
            <div>
              <p className="font-label text-[11px] uppercase tracking-[0.2em] text-rage">evidence</p>
              <ul className="mt-5 space-y-6">
                {S.evidence.map((item) => (
                  <li key={item.quote}>
                    <p className="text-[15px] font-medium leading-6">
                      <span className="decoration-rage decoration-2 underline-offset-4 [text-decoration-line:underline]">
                        “{item.quote}”
                      </span>
                    </p>
                    <p className="mt-2 font-label text-[11px] uppercase tracking-[0.12em] text-black/45">
                      {item.source} · {item.date}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* interpretation */}
            <div>
              <p className="font-label text-[11px] uppercase tracking-[0.2em] text-black/40">interpretation</p>
              <ol className="mt-3 divide-y divide-black/10">
                {S.interpretation.map((item, i) => (
                  <li key={item.title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-4">
                    <span className="font-label text-[12px] text-black/40">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-semibold leading-5">{item.title}</p>
                      <p className="mt-1.5 text-[13px] leading-5 text-black/55">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* blueprint */}
            <div>
              <p className="font-label text-[11px] uppercase tracking-[0.2em] text-acid">blueprint</p>
              <ol className="mt-3 divide-y divide-black/10">
                {S.blueprint.map((item, i) => (
                  <li key={item.title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-4">
                    <span className="font-label text-[12px] text-acid">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-semibold leading-5">{item.title}</p>
                      <p className="mt-1.5 text-[13px] leading-5 text-black/55">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-2 border-t border-black/10 pt-5 font-label text-[11px] uppercase tracking-[0.14em] text-black/45 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {S.stats.sources} sources / {S.stats.negatives} negative items / {S.stats.clusters} pain clusters
            </span>
            <span>example report · onestar</span>
          </div>
        </div>
      </section>

      {/* ---- what should exist instead ---- */}
      <section className="border-b border-line">
        <div className={`${CONTAINER} py-14 md:py-20`}>
          <h2 className="text-[clamp(2rem,5vw,3.4rem)] font-bold leading-[0.95] tracking-[-0.04em]">
            what should exist instead?
          </h2>
          <ol className="mt-10 border-t border-line">
            {S.instead.map((item, i) => (
              <li
                key={item.title}
                className="grid items-baseline gap-x-6 gap-y-1 border-b border-line py-6 md:grid-cols-[3rem_minmax(0,0.9fr)_minmax(0,1.1fr)]"
              >
                <span className="font-label text-[15px] text-acid">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-xl font-semibold tracking-[-0.02em]">{item.title}</p>
                <p className="text-[14px] leading-6 text-muted">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- cta ---- */}
      <section className="border-b border-line">
        <div className={`${CONTAINER} py-14 md:py-20`}>
          <p className="font-label text-[11px] uppercase tracking-[0.24em] text-faint">
            your idea / our next report
          </p>
          <h2 className="mt-4 max-w-[20ch] text-[clamp(1.9rem,4.4vw,2.8rem)] font-bold leading-[1.0] tracking-[-0.035em]">
            find the gap before you build the product.
          </h2>
          <form onSubmit={submit} className="mt-8 flex max-w-[860px] items-stretch gap-3">
            <input
              value={idea}
              onChange={(event) => onIdea(event.target.value)}
              placeholder={LANDING_IDEA}
              aria-label="describe your idea"
              className="min-w-0 flex-1 border border-line bg-bg-elev px-5 py-3.5 text-[15px] text-fg outline-none transition-colors placeholder:text-faint focus:border-acid/60"
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex shrink-0 items-center gap-2 bg-acid px-6 text-[14px] font-medium text-bg transition hover:brightness-110 disabled:opacity-40"
            >
              {busy ? "researching…" : "research my idea"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>

      {/* ---- footer ---- */}
      <footer id="pricing" className="scroll-mt-16">
        <div className={`${CONTAINER} flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between`}>
          <div className="flex items-center gap-6 text-[13px] text-muted">
            <a href="#pricing" className="hover:text-fg">pricing</a>
            <a href="#pricing" className="hover:text-fg">privacy</a>
            <a href="#pricing" className="hover:text-fg">terms</a>
          </div>
          <Wordmark href="/" />
          <p className="font-label text-[11px] uppercase tracking-[0.14em] text-faint">
            © 2026 onestar. all rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
