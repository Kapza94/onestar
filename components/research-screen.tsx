"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "./wordmark";

const STAGES = [
  "Understanding your market",
  "Discovering competitors",
  "Searching for unhappy customers",
  "Reading public reviews and discussions",
  "Clustering recurring complaints",
  "Finding underserved opportunities",
  "Building your product blueprint",
];

export function ResearchScreen({ idea }: { idea: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % STAGES.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.42_0.12_32/0.3),transparent_68%)]"
      />
      <header className="flex items-center justify-between px-5 py-5 md:px-10">
        <Wordmark className="text-lg" />
        <p className="font-label text-[11px] uppercase tracking-[0.18em] text-faint">
          Live search
        </p>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 pb-24">
        <p className="font-serif text-lg leading-8 text-muted md:text-xl">
          {idea}
        </p>
        <div className="mt-10 h-px w-full overflow-hidden bg-line">
          <div className="research-bar h-px w-full bg-rage" />
        </div>
        <p
          key={STAGES[index]}
          className="stage-in mt-8 text-[clamp(1.8rem,4vw,3.1rem)] font-semibold leading-[1.05] tracking-[-0.045em]"
        >
          {STAGES[index]}
        </p>
        <ol className="mt-10 space-y-2">
          {STAGES.map((stage, stageIndex) => (
            <li
              key={stage}
              className={`font-label text-[12px] uppercase tracking-[0.16em] ${
                stageIndex === index
                  ? "text-rage"
                  : stageIndex < index
                    ? "text-muted"
                    : "text-faint"
              }`}
            >
              {String(stageIndex + 1).padStart(2, "0")} {stage}
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
