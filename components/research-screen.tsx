"use client";

import { useEffect, useState } from "react";

const GUIDANCE = [
  "mapping the market around your idea",
  "looking for relevant competitor pages",
  "collecting public complaints and reviews",
  "grouping repeated pain points",
  "turning evidence into decision notes",
];

const STAGES = ["market context", "competitor pages", "public complaints", "pain patterns", "decision notes"];

function elapsedLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function ResearchScreen({ idea }: { idea: string }) {
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const guidanceTimer = window.setInterval(() => setIndex((current) => (current + 1) % GUIDANCE.length), 2800);
    const clock = window.setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => {
      window.clearInterval(guidanceTimer);
      window.clearInterval(clock);
    };
  }, []);

  return (
    <section className="border-t border-line">
      <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-16 md:px-6 md:py-24">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-label text-[11px] uppercase tracking-[0.22em] text-acid">research in progress</p>
            <p className="mt-4 max-w-[60ch] text-sm leading-7 text-muted">{idea}</p>
          </div>
          <p className="shrink-0 font-label text-[11px] uppercase tracking-[0.16em] text-faint" aria-label="elapsed time">{elapsedLabel(elapsed)}</p>
        </div>
        <div className="research-scan mt-10 h-px w-full overflow-hidden bg-line"><div className="h-full w-1/3 bg-acid" /></div>
        <p key={GUIDANCE[index]} aria-live="polite" className="stage-in mt-8 text-[clamp(1.45rem,4vw,2.6rem)] font-medium leading-[1.05] tracking-[-0.045em]">{GUIDANCE[index]}</p>
        <p className="mt-4 text-[13px] leading-6 text-faint">We will show the report when the research is ready. No progress estimate until we have one.</p>
        <ol className="mt-10 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
          {STAGES.map((stage, stageIndex) => <li key={stage} className="flex items-center gap-3 text-[12px] tracking-[0.08em] text-faint"><span className="inline-block h-1.5 w-1.5 rounded-full border border-line" />{String(stageIndex + 1).padStart(2, "0")} {stage}</li>)}
        </ol>
      </div>
    </section>
  );
}
