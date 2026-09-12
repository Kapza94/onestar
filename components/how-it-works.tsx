const STEPS = [
  ["01", "describe an idea", "one sentence is enough. optional competitor urls help."],
  ["02", "we read the complaints", "public reviews and forum posts, clustered by pain."],
  ["03", "you get a blueprint", "what to build, what to skip, and the evidence behind it."],
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-10 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-faint">how it works</p>
      <ol className="mt-5 grid gap-3 md:grid-cols-3">
        {STEPS.map(([n, title, body]) => (
          <li key={n} className="rounded-2xl border border-line px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-acid">{n}</p>
            <p className="mt-2 text-base tracking-[-0.03em]">{title}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
