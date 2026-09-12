"use client";

import Link from "next/link";
import type { RecentIdea } from "@/lib/client";

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
}: {
  items: RecentIdea[];
  total: number;
  onPick: (item: RecentIdea) => void;
}) {
  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-12 md:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-faint">recently searched</p>
          <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">projects</h2>
        </div>
        {total > 0 ? (
          <Link href="/searches" className="text-[12px] text-acid hover:underline">
            view more
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-faint">no searches yet. type an idea above.</p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={`${item.at}-${item.idea}`}>
              <button
                type="button"
                onClick={() => onPick(item)}
                className="flex h-full w-full flex-col items-start rounded-2xl border border-line bg-bg-elev px-4 py-4 text-left hover:border-acid/50"
              >
                <p className="line-clamp-3 text-sm leading-6 text-fg">{item.idea}</p>
                <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-faint">{relative(item.at)}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
