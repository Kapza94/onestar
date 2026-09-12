import { Blocks, MessageSquareWarning, PenLine, type LucideIcon } from "lucide-react";

const STEPS: { n: string; icon: LucideIcon; title: string; body: string }[] = [
  {
    n: "01",
    icon: PenLine,
    title: "describe an idea",
    body: "one sentence is enough. optional competitor urls help.",
  },
  {
    n: "02",
    icon: MessageSquareWarning,
    title: "we read the complaints",
    body: "public reviews and forum posts, clustered by pain.",
  },
  {
    n: "03",
    icon: Blocks,
    title: "you get a blueprint",
    body: "what to build, what to skip, and the evidence behind it.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-line/70">
      <div className="mx-auto max-w-[1180px] px-4 py-14 md:px-6 md:py-20">
        <p className="font-label text-[11px] uppercase tracking-[0.28em] text-faint">
          how it works
        </p>
        <h2 className="mt-3 max-w-[22ch] text-[clamp(1.7rem,3.2vw,2.5rem)] font-medium leading-[1.05] tracking-[-0.04em] text-fg">
          from a one-line idea to a build-ready blueprint.
        </h2>

        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.n}
                className="group rounded-2xl border border-line bg-bg-elev p-6 transition-colors hover:border-acid/40"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-bg text-acid transition-colors group-hover:border-acid/40">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-label text-[12px] uppercase tracking-[0.24em] text-faint">
                    {step.n}
                  </span>
                </div>
                <p className="mt-6 text-lg font-medium tracking-[-0.02em] text-fg">
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
