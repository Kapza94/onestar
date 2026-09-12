"use client";

import type { AnalyzeError } from "@/lib/schemas";

export function ErrorScreen({
  error,
  onRetry,
  onEdit,
  onExample,
}: {
  error: AnalyzeError["error"];
  onRetry: () => void;
  onEdit: () => void;
  onExample?: () => void;
}) {
  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-xl px-4 py-16 md:px-6">
        <p className="text-[12px] uppercase tracking-[0.16em] text-rage">research stalled</p>
        <h1 className="mt-4 text-4xl font-medium tracking-[-0.04em]">we could not finish this pass.</h1>
        <p className="mt-5 text-lg leading-8 text-muted">{error.message}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {error.retryable ? (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-full bg-acid px-5 py-3 font-medium text-bg hover:brightness-110"
            >
              retry
            </button>
          ) : null}
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full border border-line px-5 py-3 hover:border-acid hover:text-acid"
          >
            edit idea
          </button>
          {onExample ? (
            <button
              type="button"
              onClick={onExample}
              className="rounded-full border border-line px-5 py-3 hover:border-acid hover:text-acid"
            >
              load example
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
