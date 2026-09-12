"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { RecentIdea } from "@/lib/client";
import type { StarterSearch } from "@/lib/starters";
import { STARTER_SEARCHES } from "@/lib/starters";

function relative(at: number) {
  const delta = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (delta < 60) return `${delta}s ago`;
  const minutes = Math.round(delta / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toLowerCase();
}

export function RecentProjects({
  items,
  total,
  onPick,
  onStarter,
}: {
  items: RecentIdea[];
  total: number;
  onPick: (item: RecentIdea) => void;
  onStarter: (item: StarterSearch) => void;
}) {
  const showStarters = items.length === 0;

  return (
    <section className="border-t border-line/70">
      <div className="mx-auto max-w-[1180px] px-4 py-14 md:px-6 md:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-label text-[11px] uppercase tracking-[0.28em] text-faint">
              {showStarters ? "to get started" : "recently searched"}
            </p>
            <h2 className="mt-3 text-[clamp(1.5rem,2.6vw,2rem)] font-medium tracking-[-0.03em] text-fg">
              {showStarters ? "starter ideas" : "projects"}
            </h2>
          </div>
          {total > 0 && !showStarters ? (
            <Link
              href="/searches"
              className="inline-flex shrink-0 items-center gap-1 text-[12px] text-acid transition-opacity hover:opacity-80"
            >
              view more
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>

        {showStarters ? (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STARTER_SEARCHES.map((item) => (
              <li key={item.idea}>
                <button
                  type="button"
                  onClick={() => onStarter(item)}
                  className="group flex h-full w-full flex-col items-start rounded-2xl border border-line bg-bg-elev px-5 py-5 text-left transition-colors hover:border-acid/50 hover:bg-bg-sheet"
                >
                  <p className="line-clamp-3 text-[15px] leading-6 text-fg">{item.idea}</p>
                  <div className="mt-5 flex w-full items-center justify-between">
                    <span className="font-label text-[11px] uppercase tracking-[0.2em] text-acid">
                      {item.note}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-faint transition-colors group-hover:text-acid" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li key={`${item.at}-${item.idea}`}>
                <button
                  type="button"
                  onClick={() => onPick(item)}
                  className="group flex h-full w-full flex-col items-start rounded-2xl border border-line bg-bg-elev px-5 py-5 text-left transition-colors hover:border-acid/50 hover:bg-bg-sheet"
                >
                  <p className="line-clamp-3 text-[15px] leading-6 text-fg">{item.idea}</p>
                  <div className="mt-5 flex w-full items-center justify-between">
                    <span className="font-label text-[11px] uppercase tracking-[0.18em] text-faint">
                      {relative(item.at)}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-faint transition-colors group-hover:text-acid" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
