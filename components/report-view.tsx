"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, sourceById } from "@/lib/client";
import { sanitizeReportCopy, withEvidenceCounts } from "@/lib/copy";
import type { Report } from "@/lib/schemas";
import { ConfidenceMark, Stamp } from "./stamp";

const TABS = [
  { id: "snapshot", label: "Snapshot" },
  { id: "competitors", label: "Competitors" },
  { id: "rage", label: "Wall of Rage" },
  { id: "heatmap", label: "Heatmap" },
  { id: "opportunities", label: "Opportunities" },
  { id: "build", label: "Build this" },
  { id: "blueprint", label: "Blueprint" },
  { id: "sources", label: "Sources" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ReportView({ report: raw }: { report: Report }) {
  const report = withEvidenceCounts(sanitizeReportCopy(raw));
  const maxTheme = Math.max(...report.themes.map((theme) => theme.evidenceCount), 1);

  const [activeTab, setActiveTab] = useState<TabId>("snapshot");
  const topRef = useRef<HTMLDivElement>(null);

  const activeIndex = TABS.findIndex((tab) => tab.id === activeTab);

  function changeTab(id: TabId) {
    setActiveTab(id);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div id="report" className="bg-bg">
      <div ref={topRef} className="mx-auto max-w-[1120px] scroll-mt-6 px-5 py-10 md:px-8 md:py-14">
        <div className="overflow-hidden rounded-xl border border-line">
          <div className="flex items-center gap-3 border-b border-line bg-bg-elev/40 px-3 py-2.5 md:px-4">
            <div
              className="flex flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Report sections"
            >
            {TABS.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => changeTab(tab.id)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 font-label text-[11px] uppercase tracking-[0.14em] transition-colors ${
                    active
                      ? "bg-acid text-bg"
                      : "text-muted hover:bg-bg-elev hover:text-fg"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
            </div>
            <span className="hidden shrink-0 sm:inline-flex">
              {report.mode === "demo" ? <Stamp tone="acid">example data</Stamp> : <Stamp>live research</Stamp>}
            </span>
          </div>

          <div className="px-5 py-10 md:px-10 md:py-12">
        {activeTab === "snapshot" ? (
          <section>
            <p className="font-label text-[11px] uppercase tracking-[0.2em] text-acid">market snapshot</p>
            <h1 className="mt-4 max-w-[34ch] text-[clamp(1.5rem,2.6vw,2.15rem)] font-medium leading-[1.2] tracking-[-0.02em]">
              {report.market.interpretedIdea}
            </h1>
            <p className="mt-5 max-w-[64ch] text-[15px] leading-7 text-muted line-clamp-4">
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
            {report.competitors.length ? (
              <div className="mt-10">
                <p className="font-label text-[11px] uppercase tracking-[0.16em] text-faint">similar products</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {report.competitors.map((competitor) => (
                    <li key={`${competitor.name}-${competitor.url}`}>
                      <CompetitorChip name={competitor.name} url={competitor.url} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {activeTab === "competitors" ? (
          <section>
            <SectionHead kicker="01" title="Competitors" />
            <div className="mt-8 divide-y divide-line border-y border-line">
              {report.competitors.map((competitor) => (
                <article key={competitor.url} className="grid gap-6 py-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-semibold tracking-[-0.03em]">
                        <CompetitorName name={competitor.name} url={competitor.url} />
                      </h3>
                      <ConfidenceMark value={competitor.confidence} />
                    </div>
                    {hostOf(competitor.url) ? (
                      <a
                        href={competitor.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-sm text-acid hover:underline"
                      >
                        {hostOf(competitor.url)} <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
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
                    <p className="text-lg leading-8 text-rage">
                      “{competitor.mostCommonComplaint}”
                    </p>
                    <p className="mt-3 font-label text-[12px] uppercase tracking-[0.14em] text-faint">
                      {competitor.feedbackCount > 0
                        ? `${competitor.feedbackCount} ${competitor.feedbackCount === 1 ? "complaint" : "complaints"} in this sample`
                        : "no complaints in this sample"}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3 md:justify-end">
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
        ) : null}

        {activeTab === "rage" ? (
          <section className="relative py-6">
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
                  className={`mb-4 break-inside-avoid rounded-2xl border border-rage/25 bg-rage-dim/40 p-4 ${
                    index % 3 === 1 ? "md:translate-y-3" : index % 3 === 2 ? "md:-translate-y-2" : ""
                  }`}
                >
                  <p className="text-[1.05rem] leading-7 text-fg">“{item.excerpt}”</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Stamp tone="rage">{item.category}</Stamp>
                    {item.rating === null ? (
                      <Stamp>Negative mention</Stamp>
                    ) : (
                      <Stamp tone="rage">{item.rating}/5</Stamp>
                    )}
                  </div>
                  <p className="mt-3 font-label text-[11px] uppercase tracking-[0.14em] text-muted">
                    <CompetitorName
                      name={item.competitor}
                      url={matchCompetitor(report.competitors, item.competitor)?.url}
                      className="text-muted hover:text-acid"
                    />
                    {" · "}
                    {item.platform}
                    {formatDate(item.publishedAt) ? ` · ${formatDate(item.publishedAt)}` : ""}
                  </p>
                  <SourceLink report={report} id={item.sourceId} />
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "heatmap" ? (
          <section>
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
                      <p className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted">
                        {theme.competitorsAffected.map((name, index) => (
                          <span key={`${theme.id}-${name}`} className="inline-flex items-center gap-2">
                            {index > 0 ? <span className="text-faint">·</span> : null}
                            <CompetitorName
                              name={name}
                              url={matchCompetitor(report.competitors, name)?.url}
                              className="text-muted hover:text-acid"
                            />
                          </span>
                        ))}
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
        ) : null}

        {activeTab === "opportunities" ? (
          <section>
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
        ) : null}

        {activeTab === "build" ? (
          <section>
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
                    <p className="mt-4 text-lg leading-8 text-muted">because {item.because}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {report.competitors
                        .filter((competitor) =>
                          [item.build, item.notThat, item.because].some((text) =>
                            text.toLowerCase().includes(competitor.name.toLowerCase()),
                          ),
                        )
                        .map((competitor) => (
                          <CompetitorChip key={competitor.url} name={competitor.name} url={competitor.url} />
                        ))}
                    </div>
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
        ) : null}

        {activeTab === "blueprint" ? (
          <section className="relative rounded-3xl border border-acid/20 bg-acid-dim/30 p-5 md:p-10">
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
                landing headline
              </p>
              <p className="mt-3 text-3xl leading-tight md:text-4xl">
                {report.blueprint.landingHeadline}
              </p>
              <p className="mt-6 inline-flex rounded-full bg-acid px-5 py-3 font-medium text-bg">
                {report.blueprint.primaryCta}
              </p>
            </div>
          </section>
        ) : null}

        {activeTab === "sources" ? (
          <section>
            <SectionHead kicker="07" title="Sources" />
            <details className="group mt-8 rounded-2xl border border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4">
                <span className="font-semibold tracking-[-0.03em]">All sources</span>
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
        ) : null}

        <div className="mt-16 flex items-center justify-between gap-4 border-t border-line pt-8">
          {activeIndex > 0 ? (
            <button
              type="button"
              onClick={() => changeTab(TABS[activeIndex - 1].id)}
              className="group inline-flex items-center gap-2 text-left text-muted transition-colors hover:text-fg"
            >
              <ChevronLeft className="h-4 w-4 shrink-0 text-faint transition-colors group-hover:text-acid" />
              <span>
                <span className="block font-label text-[10px] uppercase tracking-[0.16em] text-faint">Previous</span>
                <span className="text-sm font-medium">{TABS[activeIndex - 1].label}</span>
              </span>
            </button>
          ) : (
            <span />
          )}
          {activeIndex < TABS.length - 1 ? (
            <button
              type="button"
              onClick={() => changeTab(TABS[activeIndex + 1].id)}
              className="group inline-flex items-center gap-2 text-right text-muted transition-colors hover:text-fg"
            >
              <span>
                <span className="block font-label text-[10px] uppercase tracking-[0.16em] text-faint">Next</span>
                <span className="text-sm font-medium">{TABS[activeIndex + 1].label}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-faint transition-colors group-hover:text-acid" />
            </button>
          ) : (
            <span />
          )}
          </div>
        </div>
        </div>
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
      <h2 className="mt-2 text-[clamp(1.4rem,2.6vw,2.1rem)] font-medium tracking-[-0.03em]">{title}</h2>
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

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function matchCompetitor(competitors: Report["competitors"], name: string) {
  const key = name.trim().toLowerCase();
  return (
    competitors.find((item) => item.name.trim().toLowerCase() === key) ||
    competitors.find((item) => {
      const current = item.name.trim().toLowerCase();
      return current.includes(key) || key.includes(current);
    })
  );
}

function CompetitorChip({ name, url }: { name: string; url: string }) {
  const host = hostOf(url);
  if (!url.startsWith("http")) {
    return (
      <span className="inline-flex rounded-full border border-line px-3 py-1.5 text-[12px] text-muted">
        {name}
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[12px] text-fg hover:border-acid hover:text-acid"
    >
      <span>{name}</span>
      {host ? <span className="text-faint">{host}</span> : null}
      <ArrowUpRight className="h-3 w-3" />
    </a>
  );
}

function CompetitorName({
  name,
  url,
  className = "hover:text-acid",
}: {
  name: string;
  url?: string;
  className?: string;
}) {
  if (!url?.startsWith("http")) return <span>{name}</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 ${className}`}>
      {name}
      <ArrowUpRight className="h-3 w-3" />
    </a>
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
