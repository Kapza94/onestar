"use client";

import type { AnalyzeError } from "@/lib/schemas";
import { Wordmark } from "./wordmark";

export function ErrorScreen({
  error,
  onRetry,
  onEdit,
  onExample,
}: {
  error: AnalyzeError["error"];
  onRetry: () => void;
  onEdit: () => void;
  onExample: () => void;
}) {
  return (
    <div className="min-h-[100dvh]">
      <header className="flex items-center justify-between px-5 py-5 md:px-10">
        <Wordmark className="text-lg" />
      </header>
      <main className="mx-auto max-w-xl px-5 py-16">
        <p className="font-label text-[12px] font-semibold uppercase tracking-[0.18em] text-rage">
          Research stalled
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
          We could not finish this pass.
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted">{error.message}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {error.retryable ? (
            <button
              type="button"
              onClick={onRetry}
              className="bg-rage px-5 py-3 font-medium text-bg hover:brightness-110"
            >
              Retry
            </button>
          ) : null}
          <button
            type="button"
            onClick={onEdit}
            className="border border-line px-5 py-3 hover:border-fg/40"
          >
            Edit idea
          </button>
          <button
            type="button"
            onClick={onExample}
            className="border border-line px-5 py-3 hover:border-acid/50 hover:text-acid"
          >
            Load example
          </button>
        </div>
      </main>
    </div>
  );
}
