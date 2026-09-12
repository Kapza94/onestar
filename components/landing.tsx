"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import { landingSample as S } from "@/lib/landing-sample";
import { STARTER_SEARCHES } from "@/lib/starters";
import { Wordmark } from "./wordmark";

const CONTAINER = "mx-auto w-full max-w-[1120px] px-5 md:px-8";

export function Landing({
  idea,
  onIdea,
  onSubmit,
  busy,
  onOpenReport,
}: {
  idea: string;
  onIdea: (value: string) => void;
  onSubmit: (ideaOverride?: string) => void;
  busy: boolean;
  onOpenReport?: () => void;
}) {
  const ready = !busy && idea.trim().length >= 12;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (ready) onSubmit(idea.trim());
  }

  function pickExample(example: string) {
    onIdea(example);
    document.getElementById("search")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="bg-bg text-fg">
      <header className="border-b border-line">
        <div className={`${CONTAINER} flex min-h-16 items-center justify-between gap-4 py-3`}>
          <Wordmark href="/" />
          <nav className="hidden items-center gap-8 text-[13px] text-muted md:flex" aria-label="Main navigation">
            {onOpenReport ? <button type="button" onClick={onOpenReport} className="text-acid hover:text-fg">your report</button> : null}
            <a href="#process" className="hover:text-fg">how it works</a>
            <a href="#sample" className="hover:text-fg">sample report</a>
          </nav>
          <a href="#search" className="rounded-md border border-acid px-4 py-2 text-[13px] font-medium text-acid transition-colors hover:bg-acid hover:text-bg">start a search</a>
        </div>
      </header>

      <main>
        <section className="border-b border-line">
          <div className={`${CONTAINER} py-14 md:py-20`}>
            <p className="font-label text-[11px] uppercase tracking-[0.28em] text-faint">onestar / product evidence</p>
            <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_300px] md:items-end">
              <h1 className="text-[clamp(2.9rem,8.5vw,6rem)] font-bold leading-[0.9] tracking-[-0.05em]">build from<br />what they hate.</h1>
              <p className="max-w-[42ch] border-l border-line pl-6 text-[15px] leading-7 text-muted">Turn a rough product idea into a clearer decision: what customers complain about, what keeps repeating, and what is worth building.</p>
            </div>

            <form id="search" onSubmit={submit} className="mt-12 max-w-[860px] scroll-mt-24">
              <p className="font-label text-[11px] uppercase tracking-[0.22em] text-faint">01 / idea</p>
              <div className="mt-3 flex items-stretch gap-3">
                <input value={idea} onChange={(event) => onIdea(event.target.value)} placeholder="Type your idea here…" aria-label="describe your idea" className="min-w-0 flex-1 border border-line bg-bg-elev px-5 py-4 text-[15px] text-fg outline-none transition-colors placeholder:text-faint focus:border-acid/60 md:text-base" />
                <button type="submit" disabled={!ready} aria-label="research this idea" className="inline-flex shrink-0 items-center justify-center bg-acid px-5 text-bg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"><ArrowRight className="h-5 w-5" /></button>
              </div>
              <p className="mt-3 text-[13px] text-faint">One sentence is enough. Add competitor URLs later if you have them.</p>
            </form>

            <div className="mt-10 border-t border-line pt-6">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="font-label text-[11px] uppercase tracking-[0.2em] text-faint">try an idea</span>
                {STARTER_SEARCHES.map((item) => <button key={item.idea} type="button" onClick={() => pickExample(item.idea)} className="group inline-flex items-center gap-1 text-left text-[13px] text-muted underline decoration-line underline-offset-4 transition-colors hover:text-acid">{item.idea.replace(/^A /, "").replace(/\.$/, "")}<ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" /></button>)}
              </div>
            </div>
          </div>
        </section>

        <section id="process" className="scroll-mt-4 border-b border-line">
          <div className={`${CONTAINER} py-14 md:py-20`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div><p className="font-label text-[11px] uppercase tracking-[0.24em] text-faint">02 / the work</p><h2 className="mt-3 max-w-[22ch] text-[clamp(2rem,5vw,3.4rem)] font-bold leading-[0.95] tracking-[-0.04em]">idea → evidence → decision</h2></div>
              <p className="max-w-[34ch] text-[14px] leading-6 text-muted">A short research pass that leaves you with a direction, not another dashboard to maintain.</p>
            </div>
            <ol className="mt-10 grid border-t border-line md:grid-cols-3">
              {[
                ["01", "start with the idea", "Give us the rough version. We use it to frame the market and find nearby products."],
                ["02", "read the evidence", "We collect public complaints and group the pain people keep describing."],
                ["03", "make the decision", "You get a focused build direction, with the evidence that supports it."],
              ].map(([number, title, body]) => <li key={number} className="border-b border-line py-6 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0 md:last:pr-0"><p className="font-label text-[12px] text-acid">{number}</p><h3 className="mt-6 text-xl font-semibold tracking-[-0.02em]">{title}</h3><p className="mt-2 max-w-[30ch] text-[14px] leading-6 text-muted">{body}</p></li>)}
            </ol>
          </div>
        </section>

        <section id="sample" className="scroll-mt-4 bg-white text-black">
          <div className={`${CONTAINER} py-14 md:py-20`}>
            <div className="flex items-center justify-between gap-4"><span className="font-label text-[11px] uppercase tracking-[0.2em] text-black/50">sample report {S.reportNo}</span><span className="rounded border border-black/20 px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.18em] text-black/60">example data</span></div>
            <div className="mt-5 border-t border-black/10" />
            <div className="mt-8 grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-start">
              <div><h2 className="max-w-[18ch] text-[clamp(2rem,5vw,3.4rem)] font-bold leading-[0.98] tracking-[-0.04em]">{S.headline}</h2><p className="mt-3 max-w-[34ch] text-[clamp(1.2rem,3vw,1.7rem)] leading-[1.1] tracking-[-0.03em] text-black/50">{S.subhead}</p></div>
              <div className="border-l border-black/10 pl-6"><p className="font-label text-[11px] uppercase tracking-[0.2em] text-rage">evidence</p><p className="mt-4 text-lg font-medium leading-7">“{S.hero.rawEvidence}”</p><p className="mt-6 font-label text-[11px] uppercase tracking-[0.2em] text-acid">decision</p><p className="mt-4 text-lg font-medium leading-7">{S.hero.productDecision}</p></div>
            </div>
            <div className="mt-10 grid gap-4 border-t border-black/10 pt-5 text-[13px] leading-5 text-black/60 md:grid-cols-3">{S.instead.map((item) => <p key={item.title}><span className="font-semibold text-black">{item.title}.</span> {item.body}</p>)}</div>
          </div>
        </section>

        <section className="border-b border-line"><div className={`${CONTAINER} py-14 md:py-20`}><p className="font-label text-[11px] uppercase tracking-[0.24em] text-faint">your idea / our next report</p><h2 className="mt-4 max-w-[20ch] text-[clamp(1.9rem,4.4vw,2.8rem)] font-bold leading-[1] tracking-[-0.035em]">find the gap before you build the product.</h2><a href="#search" className="mt-8 inline-flex items-center gap-2 bg-acid px-5 py-3 text-[14px] font-medium text-bg transition hover:brightness-110">research an idea <ArrowRight className="h-4 w-4" /></a></div></section>
      </main>

      <footer><div className={`${CONTAINER} flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between`}><p className="font-label text-[11px] uppercase tracking-[0.14em] text-faint">© 2026 onestar · product evidence</p><Wordmark href="/" /><a href="#search" className="text-[13px] text-muted hover:text-fg">start a search</a></div></footer>
    </div>
  );
}
