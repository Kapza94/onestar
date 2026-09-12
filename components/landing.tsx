"use client";

import { ArrowUpRight } from "lucide-react";
import { EXAMPLE_COMPETITOR_URLS, EXAMPLE_IDEA } from "@/lib/example-report";
import { Stamp } from "./stamp";
import { Wordmark } from "./wordmark";

export function Landing({
  idea,
  urls,
  busy,
  demoMode,
  onIdea,
  onUrls,
  onSubmit,
  onExample,
}: {
  idea: string;
  urls: string;
  busy: boolean;
  demoMode: boolean;
  onIdea: (value: string) => void;
  onUrls: (value: string) => void;
  onSubmit: () => void;
  onExample: () => void;
}) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-[-8rem] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,oklch(0.45_0.12_32/0.28),transparent_68%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-6rem] bottom-[-8rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,oklch(0.55_0.14_132/0.16),transparent_70%)]"
      />

      <header className="flex items-center justify-between px-5 py-5 md:px-10">
        <Wordmark className="text-lg" />
        <div className="flex items-center gap-2">
          {demoMode ? <Stamp tone="acid">Example mode</Stamp> : <Stamp>Public sources only</Stamp>}
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100dvh-5.5rem)] max-w-[1280px] items-end gap-12 px-5 pb-10 pt-6 md:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] md:items-center md:px-10 md:pb-16">
        <section className="max-w-3xl">
          <p className="font-label text-[12px] font-semibold uppercase tracking-[0.22em] text-rage">
            Product research lab
          </p>
          <h1 className="mt-5 max-w-[16ch] text-[clamp(2.6rem,7vw,5.6rem)] font-semibold leading-[0.92] tracking-[-0.055em] text-fg">
            Your competitors’ worst reviews are your product roadmap.
          </h1>
          <p className="mt-7 max-w-[42ch] text-lg leading-8 text-muted md:text-xl">
            Discover what customers hate, what competitors ignore, and what your product should do differently.
          </p>
        </section>

        <section className="border border-line bg-bg-elev p-4 shadow-[0_24px_80px_oklch(0.1_0.02_52/0.55)] md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-label text-[12px] font-semibold uppercase tracking-[0.18em] text-faint">
              Intake
            </p>
            <Stamp>Step 01</Stamp>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
            className="flex flex-col gap-4"
          >
            <label className="block">
              <span className="font-label text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
                Describe the idea
              </span>
              <textarea
                required
                minLength={12}
                rows={7}
                value={idea}
                onChange={(event) => onIdea(event.target.value)}
                placeholder={EXAMPLE_IDEA}
                className="mt-2 w-full resize-y border border-line bg-bg px-3 py-3 text-base leading-7 text-fg outline-none placeholder:text-faint focus:border-rage/70"
              />
            </label>
            <label className="block">
              <span className="font-label text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
                Known competitor URLs
                <span className="ml-2 tracking-normal text-faint">(optional, 1–3)</span>
              </span>
              <textarea
                rows={3}
                value={urls}
                onChange={(event) => onUrls(event.target.value)}
                placeholder={EXAMPLE_COMPETITOR_URLS.join("\n")}
                className="mt-2 w-full resize-y border border-line bg-bg px-3 py-3 font-label text-sm leading-6 text-fg outline-none placeholder:text-faint focus:border-rage/70"
              />
            </label>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              <button
                type="submit"
                disabled={busy || idea.trim().length < 12}
                className="group inline-flex flex-1 items-center justify-between gap-3 bg-rage px-4 py-3 text-left font-medium text-bg transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
              >
                Find the gaps
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bg/15">
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </button>
              <button
                type="button"
                onClick={onExample}
                className="inline-flex items-center justify-center border border-line px-4 py-3 text-sm text-fg transition-colors hover:border-acid/50 hover:text-acid"
              >
                Try an example
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
