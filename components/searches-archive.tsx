"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchSearches, type RecentIdea } from "@/lib/client";
import { TopNav } from "./top-nav";

const PAGE_SIZE = 20;

export function SearchesArchive() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<RecentIdea[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    void fetchSearches(page, PAGE_SIZE).then((result) => {
      setItems(result.items);
      setTotal(result.total);
      setPages(result.pages);
    });
  }, [page]);

  const safePage = Math.min(page, pages);

  return (
    <div className="min-h-[100dvh]">
      <TopNav current="searches" />
      <main className="mx-auto max-w-[1200px] px-4 py-12 md:px-6">
        <p className="text-[11px] uppercase tracking-[0.16em] text-faint">archive</p>
        <h1 className="mt-2 text-[clamp(2rem,5vw,3.4rem)] font-medium tracking-[-0.04em]">all searched ideas</h1>
        <p className="mt-3 text-sm text-muted">
          {total} {total === 1 ? "idea" : "ideas"}. Convex keeps this public search history durable across deploys.
        </p>

        {items.length === 0 ? (
          <p className="mt-10 text-sm text-faint">
            nothing here yet. <Link href="/#search" className="text-acid hover:underline">search an idea</Link> first.
          </p>
        ) : (
          <ol className="mt-10 divide-y divide-line border-y border-line">
            {items.map((item, index) => (
              <li key={`${item.at}-${item.idea}`}>
                <Link
                  href={`/?q=${encodeURIComponent(item.idea)}`}
                  className="flex items-baseline justify-between gap-6 py-5 hover:text-acid"
                >
                  <span className="min-w-0">
                    <span className="mr-4 text-faint">{String((safePage - 1) * PAGE_SIZE + index + 1).padStart(2, "0")}</span>
                    {item.idea}
                  </span>
                  <span className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-faint">
                    {new Date(item.at).toLocaleString().toLowerCase()}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}

        {pages > 1 ? (
          <div className="mt-8 flex items-center gap-3 text-[12px]">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-full border border-line px-3 py-1.5 disabled:opacity-30"
            >
              previous
            </button>
            <span className="text-muted">
              page {safePage} of {pages}
            </span>
            <button
              type="button"
              disabled={safePage >= pages}
              onClick={() => setPage((current) => Math.min(pages, current + 1))}
              className="rounded-full border border-line px-3 py-1.5 disabled:opacity-30"
            >
              next
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
