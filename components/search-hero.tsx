"use client";

import { ArrowUpRight } from "lucide-react";
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
  return (
    <section id="search" className="mx-auto max-w-[1200px] px-4 pb-8 pt-12 md:px-6 md:pt-20">
      <p className="text-[12px] uppercase tracking-[0.18em] text-acid">product research from public complaints</p>
      <h1 className="mt-4 max-w-[18ch] text-[clamp(2.4rem,6vw,4.8rem)] font-medium leading-[0.95] tracking-[-0.055em]">
        your competitors’ worst reviews are your product roadmap.
      </h1>
      <p className="mt-6 max-w-[48ch] text-base leading-7 text-muted md:text-lg">
        describe a startup idea. onestar finds competitors, scrapes public complaints, and turns the gaps into a product blueprint.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="mt-10"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-acid/40 bg-bg-elev px-4 py-4 md:px-5">
          <span className="text-acid">{">"}</span>
          <input
            value={idea}
            onChange={(event) => onIdea(event.target.value)}
            placeholder={EXAMPLE_IDEA}
            className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-faint md:text-lg"
          />
          {idea ? null : <span className="search-caret hidden h-5 w-[7px] bg-acid sm:block" />}
          <button
            type="submit"
            disabled={busy || idea.trim().length < 12}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-acid px-4 py-2 text-[12px] font-medium text-bg disabled:opacity-40"
          >
            find the gaps
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={urls}
            onChange={(event) => onUrls(event.target.value)}
            placeholder="optional competitor urls, comma separated"
            className="min-w-0 flex-1 rounded-full border border-line bg-transparent px-3 py-2 text-[12px] text-muted outline-none placeholder:text-faint focus:border-acid/40"
          />
          {onExample ? (
            <button
              type="button"
              onClick={onExample}
              className="rounded-full border border-line px-3 py-2 text-[12px] text-muted hover:border-acid hover:text-acid"
            >
              try an example
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
