"use client";

import { ArrowUpRight, CornerDownLeft } from "lucide-react";
import { EXAMPLE_IDEA } from "@/lib/example-report";

export function SearchHero({
  idea,
  urls,
  busy,
  onIdea,
  onUrls,
  onSubmit,
  onExample,
}: {
  idea: string;
  urls: string;
  busy: boolean;
  onIdea: (value: string) => void;
  onUrls: (value: string) => void;
  onSubmit: () => void;
  onExample?: () => void;
}) {
  const ready = !busy && idea.trim().length >= 12;

  return (
    <section
      id="search"
      className="mx-auto max-w-[1180px] scroll-mt-24 px-4 pb-16 pt-14 md:px-6 md:pb-24 md:pt-24"
    >
      <p className="font-label text-[11px] uppercase tracking-[0.28em] text-acid">
        product research from public complaints
      </p>

      <h1 className="mt-6 max-w-[16ch] text-[clamp(2.6rem,6.4vw,5rem)] font-medium leading-[0.93] tracking-[-0.055em] text-fg">
        your competitors’ 1-star reviews are your product roadmap.
      </h1>

      <p className="mt-6 max-w-[52ch] text-lg leading-8 text-muted md:text-xl">
        See what customers hate about your competitors — and exactly what to build instead.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="mt-10 max-w-[760px]"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-bg-elev px-4 py-3.5 transition-colors focus-within:border-acid/60 md:px-5 md:py-4">
          <span className="font-label text-lg text-acid">{">"}</span>
          <input
            value={idea}
            onChange={(event) => onIdea(event.target.value)}
            placeholder={EXAMPLE_IDEA}
            aria-label="describe your startup idea"
            className="min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-faint md:text-lg"
          />
          {idea ? null : <span className="search-caret hidden h-5 w-[7px] bg-acid sm:block" />}
          <button
            type="submit"
            disabled={!ready}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-acid px-4 py-2.5 text-[13px] font-medium text-bg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 md:px-5"
          >
            {busy ? "researching…" : "find the gaps"}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={urls}
            onChange={(event) => onUrls(event.target.value)}
            placeholder="optional competitor urls, comma separated"
            aria-label="optional competitor urls"
            className="min-w-0 flex-1 rounded-full border border-line bg-transparent px-4 py-2 text-[12px] text-muted outline-none placeholder:text-faint focus:border-acid/50"
          />
          {onExample ? (
            <button
              type="button"
              onClick={onExample}
              className="shrink-0 rounded-full border border-line px-4 py-2 text-[12px] text-muted transition-colors hover:border-acid hover:text-acid"
            >
              try an example
            </button>
          ) : null}
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-faint">
          <CornerDownLeft className="h-3.5 w-3.5" />
          press enter to run — describe the idea in a sentence or two.
        </p>
      </form>
    </section>
  );
}
