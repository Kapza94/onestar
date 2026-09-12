"use client";

import { ArrowUpRight, ChevronDown } from "lucide-react";
import { formatDate, sourceById } from "@/lib/client";
import type { Report } from "@/lib/schemas";
import { ConfidenceMark, Stamp } from "./stamp";
import { Wordmark } from "./wordmark";

const NAV = [
  ["snapshot", "Snapshot"],
  ["competitors", "Competitors"],
  ["rage", "Wall of Rage"],
  ["heatmap", "Heatmap"],
  ["opportunities", "Opportunities"],
  ["build", "Build this"],
  ["blueprint", "Blueprint"],
  ["sources", "Sources"],
] as const;

export function ReportView({
  report,
  onReset,
}: {
  report: Report;
  onReset: () => void;
}) {
  const maxTheme = Math.max(...report.themes.map((theme) => theme.evidenceCount), 1);

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-bg/92">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-8">
          <Wordmark className="text-base" />
          <div className="flex flex-wrap items-center gap-2">
            {report.mode === "demo" ? <Stamp tone="acid">Example data</Stamp> : <Stamp>Live research</Stamp>}
            <button
              type="button"
              onClick={onReset}
              className="font-label text-[12px] uppercase tracking-[0.14em] text-muted hover:text-fg"
            >
              New idea
            </button>
          </div>
        </div>
        <nav className="flex gap-4 overflow-x-auto px-5 pb-3 md:px-8">
          {NAV.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="shrink-0 font-label text-[11px] uppercase tracking-[0.16em] text-faint hover:text-fg"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-[1180px] px-5 py-10 md:px-8 md:py-16 [&_section]:scroll-mt-28">
        <section id="snapshot">
          <p className="font-label text-[12px] uppercase tracking-[0.2em] text-rage">Market snapshot</p>
          <h1 className="mt-4 max-w-[22ch] text-[clamp(2.1rem,5vw,4.2rem)] font-semibold leading-[0.95] tracking-[-0.05em]">
            {report.market.interpretedIdea}
          </h1>
          <p className="mt-6 max-w-[62ch] font-serif text-xl leading-9 text-muted">
            {report.market.opportunityVerdict}
          </p>
          <dl className="mt-10 grid grid-cols-2 gap-px bg-line md:grid-cols-4">
            {[
              ["Target", report.market.targetCustomer],
              ["Category", report.market.productCategory],
              ["Competitors", String(report.market.competitorCount)],
              ["Sources", String(report.market.sourcesAnalyzed)],
            ].map(([label, value]) => (
              <div key={label} className="bg-bg px-4 py-5">
                <dt className="font-label text-[11px] uppercase tracking-[0.16em] text-faint">{label}</dt>
                <dd className="mt-2 text-base leading-7 text-fg">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 font-label text-[12px] uppercase tracking-[0.14em] text-rage">
            {report.market.negativeFeedbackCount} negative items in this sample
          </p>
        </section>

        <section id="competitors" className="mt-24">
          <SectionHead kicker="01" title="Competitors" />
          <div className="mt-8 divide-y divide-line border-y border-line">
            {report.competitors.map((competitor) => (
              <article key={competitor.url} className="grid gap-6 py-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-semibold tracking-[-0.03em]">{competitor.name}</h3>
                    <ConfidenceMark value={competitor.confidence} />
                  </div>
                  <p className="mt-3 max-w-[50ch] text-muted">{competitor.description}</p>
                  <p className="mt-4 text-sm text-faint">
                    Audience: <span className="text-fg">{competitor.targetAudience}</span>
                  </p>
                  <p className="mt-1 text-sm text-faint">
                    Pricing:{" "}
                    <span className="text-fg">{competitor.pricing ?? "Unknown in this sample"}</span>
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="font-serif text-lg leading-8 text-rage">
                    “{competitor.mostCommonComplaint}”
                  </p>
                  <p className="mt-3 font-label text-[12px] uppercase tracking-[0.14em] text-faint">
                    {competitor.feedbackCount} feedback items
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 md:justify-end">
                    <a
                      href={competitor.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-label text-[12px] uppercase tracking-[0.14em] text-acid hover:underline"
                    >
                      Site <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                    {competitor.sourceIds.map((id) => {
                      const source = sourceById(report.sources, id);
                      if (!source) return null;
                      return (
                        <a
                          key={id}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-label text-[12px] uppercase tracking-[0.14em] text-muted hover:text-fg"
                        >
                          {source.domain}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="rage" className="relative mt-24 py-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[-1.5rem] top-0 h-full bg-[radial-gradient(900px_420px_at_10%_0%,oklch(0.42_0.16_32/0.22),transparent_70%)] md:inset-x-[-3rem]"
          />
          <SectionHead kicker="02" title="Wall of Rage" rage />
          <p className="mt-3 max-w-[50ch] text-muted">
            Short excerpts only. If a score was not published, it is labeled Negative mention, not a 1-star review.
          </p>
          <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {report.wallOfRage.map((item, index) => (
              <article
                key={item.id}
                className={`mb-4 break-inside-avoid border border-rage/25 bg-rage-dim/40 p-4 ${
                  index % 3 === 1 ? "md:translate-y-3" : index % 3 === 2 ? "md:-translate-y-2" : ""
                }`}
              >
                <p className="font-serif text-[1.05rem] leading-7 text-fg">“{item.excerpt}”</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Stamp tone="rage">{item.category}</Stamp>
                  {item.rating === null ? (
                    <Stamp>Negative mention</Stamp>
                  ) : (
                    <Stamp tone="rage">{item.rating}/5</Stamp>
                  )}
                </div>
                <p className="mt-3 font-label text-[11px] uppercase tracking-[0.14em] text-muted">
                  {item.competitor} · {item.platform}
                  {formatDate(item.publishedAt) ? ` · ${formatDate(item.publishedAt)}` : ""}
                </p>
                <SourceLink report={report} id={item.sourceId} />
              </article>
            ))}
          </div>
        </section>

        <section id="heatmap" className="mt-24">
          <SectionHead kicker="03" title="Complaint heatmap" />
          <p className="mt-3 max-w-[54ch] text-muted">
            Frequency is the count of items in this collected sample, not the entire market.
          </p>
          <ul className="mt-8 space-y-5">
            {report.themes.map((theme) => (
              <li key={theme.id}>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold tracking-[-0.03em]">{theme.theme}</p>
                    <p className="mt-1 text-sm text-muted">
                      {theme.competitorsAffected.join(" · ")}
                    </p>
                  </div>
                  <p className="font-label text-[12px] uppercase tracking-[0.14em] text-faint">
                    {theme.evidenceCount} items · {theme.severity}
                  </p>
                </div>
                <div className="mt-3 h-[6px] bg-line">
                  <div
                    className={`h-full ${
                      theme.severity === "critical" || theme.severity === "high"
                        ? "bg-rage"
                        : theme.severity === "medium"
                          ? "bg-fg/55"
                          : "bg-faint"
                    }`}
                    style={{ width: `${Math.max(8, (theme.evidenceCount / maxTheme) * 100)}%` }}
                  />
                </div>
                <p className="mt-3 max-w-[70ch] text-sm leading-6 text-muted">{theme.explanation}</p>
                <SourceLink report={report} id={theme.representativeSourceId} />
              </li>
            ))}
          </ul>
        </section>

        <section id="opportunities" className="mt-24">
          <SectionHead kicker="04" title="Opportunity map" acid />
          <div className="mt-8 space-y-8">
            {report.opportunities.map((item, index) => (
              <article key={item.id} className="grid gap-6 border-t border-line pt-8 md:grid-cols-[4rem_minmax(0,1fr)]">
                <p className="font-label text-2xl text-acid">{String(index + 1).padStart(2, "0")}</p>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="font-label text-[11px] uppercase tracking-[0.16em] text-faint">Pain</p>
                    <p className="mt-2 text-lg leading-8">{item.customerPain}</p>
                    <p className="mt-4 font-label text-[11px] uppercase tracking-[0.16em] text-faint">
                      Competitor weakness
                    </p>
                    <p className="mt-2 text-muted">{item.competitorWeakness}</p>
                  </div>
                  <div>
                    <p className="font-label text-[11px] uppercase tracking-[0.16em] text-acid">Build</p>
                    <p className="mt-2 text-lg leading-8">{item.recommendedSolution}</p>
                    <p className="mt-4 text-sm text-muted">For {item.targetSegment}</p>
                    <div className="mt-3">
                      <ConfidenceMark value={item.confidence} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {item.evidenceSourceIds.map((id) => (
                        <SourceLink key={id} report={report} id={id} />
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="build" className="mt-24">
          <SectionHead kicker="05" title="Build this, not that" />
          <div className="mt-8 divide-y divide-line border-y border-line">
            {report.buildThisNotThat.map((item) => (
              <article key={item.build} className="grid gap-4 py-8 md:grid-cols-2">
                <div>
                  <p className="font-label text-[11px] uppercase tracking-[0.16em] text-acid">Build</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{item.build}</p>
                </div>
                <div>
                  <p className="font-label text-[11px] uppercase tracking-[0.16em] text-rage">Not</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-muted">{item.notThat}</p>
                  <p className="mt-4 font-serif text-lg leading-8 text-muted">Because {item.because}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {item.sourceIds.map((id) => (
                      <SourceLink key={id} report={report} id={id} />
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="blueprint" className="relative mt-24 border border-acid/20 bg-acid-dim/30 p-5 md:p-10">
          <SectionHead kicker="06" title="Better-product blueprint" acid />
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <BlueprintBlock label="Underserved niche" body={report.blueprint.underservedNiche} />
            <BlueprintBlock label="Positioning" body={report.blueprint.positioning} />
            <BlueprintBlock label="Core differentiator" body={report.blueprint.coreDifferentiator} />
            <BlueprintBlock label="Smallest viable MVP" body={report.blueprint.smallestViableMvp} />
            <BlueprintBlock label="Pricing hypothesis" body={report.blueprint.pricingHypothesis} />
            <BlueprintBlock label="Distribution wedge" body={report.blueprint.distributionWedge} />
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <p className="font-label text-[11px] uppercase tracking-[0.16em] text-acid">Build first</p>
              <ol className="mt-3 space-y-3">
                {report.blueprint.featuresToBuildFirst.map((item, index) => (
                  <li key={item} className="flex gap-3">
                    <span className="font-label text-acid">{String(index + 1).padStart(2, "0")}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="font-label text-[11px] uppercase tracking-[0.16em] text-rage">Avoid</p>
              <ol className="mt-3 space-y-3 text-muted">
                {report.blueprint.featuresToAvoid.map((item, index) => (
                  <li key={item} className="flex gap-3">
                    <span className="font-label text-rage">{String(index + 1).padStart(2, "0")}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="mt-10">
            <p className="font-label text-[11px] uppercase tracking-[0.16em] text-faint">
              Critical assumptions
            </p>
            <ul className="mt-3 space-y-2">
              {report.blueprint.criticalAssumptions.map((item) => (
                <li key={item} className="text-muted">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-10">
            <p className="font-label text-[11px] uppercase tracking-[0.16em] text-acid">
              Seven-day validation
            </p>
            <ol className="mt-4 space-y-4">
              {report.blueprint.validationPlan.map((day) => (
                <li key={day.day} className="grid gap-2 border-t border-line/80 pt-4 md:grid-cols-[4rem_minmax(0,1fr)]">
                  <p className="font-label text-acid">Day {day.day}</p>
                  <div>
                    <p>{day.action}</p>
                    <p className="mt-1 text-sm text-muted">Pass if: {day.successSignal}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-12 border-t border-acid/20 pt-8">
            <p className="font-label text-[11px] uppercase tracking-[0.16em] text-faint">Pitch</p>
            <p className="mt-3 max-w-[50ch] text-2xl font-semibold tracking-[-0.03em]">
              {report.blueprint.rewrittenPitch}
            </p>
            <p className="mt-8 font-label text-[11px] uppercase tracking-[0.16em] text-faint">
              Landing headline
            </p>
            <p className="mt-3 font-serif text-3xl leading-tight md:text-4xl">
              {report.blueprint.landingHeadline}
            </p>
            <p className="mt-6 inline-flex bg-acid px-5 py-3 font-medium text-bg">
              {report.blueprint.primaryCta}
            </p>
          </div>
        </section>

        <section id="sources" className="mt-24 mb-16">
          <details className="group border border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4">
              <span className="font-semibold tracking-[-0.03em]">Sources</span>
              <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <ul className="divide-y divide-line border-t border-line">
              {report.sources.map((source) => (
                <li key={source.id} className="px-4 py-4">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium hover:text-acid"
                  >
                    {source.title} <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                  <p className="mt-1 font-label text-[12px] uppercase tracking-[0.14em] text-faint">
                    {source.domain}
                    {formatDate(source.publishedAt) ? ` · ${formatDate(source.publishedAt)}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-muted">{source.findings}</p>
                </li>
              ))}
            </ul>
          </details>
          <ul className="mt-6 space-y-2">
            {report.caveats.map((item) => (
              <li key={item} className="text-sm text-faint">
                {item}
              </li>
            ))}
          </ul>
          {report.warnings.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {report.warnings.map((item) => (
                <li key={item} className="text-sm text-rage/80">
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function SectionHead({
  kicker,
  title,
  rage,
  acid,
}: {
  kicker: string;
  title: string;
  rage?: boolean;
  acid?: boolean;
}) {
  return (
    <div>
      <p
        className={`font-label text-[12px] uppercase tracking-[0.2em] ${
          rage ? "text-rage" : acid ? "text-acid" : "text-faint"
        }`}
      >
        {kicker}
      </p>
      <h2 className="mt-2 text-[clamp(1.8rem,4vw,3rem)] font-semibold tracking-[-0.045em]">{title}</h2>
    </div>
  );
}

function BlueprintBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="font-label text-[11px] uppercase tracking-[0.16em] text-faint">{label}</p>
      <p className="mt-2 leading-7">{body}</p>
    </div>
  );
}

function SourceLink({ report, id }: { report: Report; id: string }) {
  const source = sourceById(report.sources, id);
  if (!source) return null;
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 inline-flex items-center gap-1 font-label text-[11px] uppercase tracking-[0.14em] text-acid hover:underline"
    >
      {source.domain} <ArrowUpRight className="h-3 w-3" />
    </a>
  );
}
