"use client";

import { useEffect, useState } from "react";

const STAGES = [
  "understanding your market",
  "discovering competitors",
  "searching for unhappy customers",
  "reading public reviews and discussions",
  "clustering recurring complaints",
  "finding underserved opportunities",
  "building your product blueprint",
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
    <section className="border-t border-line">
      <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-16 md:px-6">
      <p className="text-sm leading-7 text-muted">{idea}</p>
      <div className="mt-10 h-px w-full overflow-hidden bg-line">
        <div className="research-bar h-px w-full bg-acid" />
      </div>
      <p
        key={STAGES[index]}
        className="stage-in mt-8 text-[clamp(1.6rem,4vw,2.8rem)] font-medium leading-[1.05] tracking-[-0.045em]"
      >
        {STAGES[index]}
      </p>
      <ol className="mt-10 space-y-2">
        {STAGES.map((stage, stageIndex) => (
          <li
            key={stage}
            className={`text-[12px] tracking-[0.12em] ${
              stageIndex === index ? "text-acid" : stageIndex < index ? "text-muted" : "text-faint"
            }`}
          >
            {String(stageIndex + 1).padStart(2, "0")} {stage}
          </li>
        ))}
      </ol>
      </div>
    </section>
  );
}
