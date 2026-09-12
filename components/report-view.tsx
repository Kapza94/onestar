"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
} from "lucide-react";
import { formatDate, sourceById } from "@/lib/client";
import { namesMatch, sanitizeReportCopy, withEvidenceCounts } from "@/lib/copy";
import type { Confidence, Report } from "@/lib/schemas";
import { ConfidenceMark, Stamp } from "./stamp";

const TABS = [
  { id: "snapshot", label: "Snapshot" },
  { id: "competitors", label: "Competitors" },
  { id: "rage", label: "Wall of Rage" },
  { id: "heatmap", label: "Heatmap" },
  { id: "decisions", label: "Decisions" },
  { id: "blueprint", label: "Blueprint" },
  { id: "sources", label: "Sources" },
] as const;

type TabId = (typeof TABS)[number]["id"];
type RageRating = "all" | "rated" | "mention";
type RageConfidence = "all" | Confidence | "unavailable";

export function ReportView({ report: raw }: { report: Report }) {
  const report = withEvidenceCounts(sanitizeReportCopy(raw));
  const [activeTab, setActiveTab] = useState<TabId>("snapshot");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(report.opportunities[0]?.id ?? "");
  const [rageCompetitor, setRageCompetitor] = useState("all");
  const [rageCategory, setRageCategory] = useState("all");
  const [rageRating, setRageRating] = useState<RageRating>("all");
  const [rageConfidence, setRageConfidence] = useState<RageConfidence>("all");
  const [copied, setCopied] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const selectedOpportunity = report.opportunities.find((item) => item.id === selectedOpportunityId) ?? report.opportunities[0];
  const defaultPrompt = selectedOpportunity ? agentPrompt(report, selectedOpportunity) : "";
  const [prompt, setPrompt] = useState(() => defaultPrompt);
  const directCompetitors = report.competitors.filter((item) => relevanceOf(item) === "direct");
  const adjacentCompetitors = report.competitors.filter((item) => relevanceOf(item) === "adjacent");
  const maxFrequency = Math.max(
    ...report.themes.flatMap((theme) => report.competitors.map((competitor) => themeCompetitorFrequency(report, theme, competitor))),
    1,
  );
  const rageItems = report.wallOfRage.filter((item) => {
    const confidence = rageConfidenceFor(report, item) ?? "unavailable";
    return (
      (rageCompetitor === "all" || namesMatch(item.competitor, rageCompetitor)) &&
      (rageCategory === "all" || item.category === rageCategory) &&
      (rageRating === "all" || (rageRating === "rated" ? item.rating !== null : item.rating === null)) &&
      (rageConfidence === "all" || confidence === rageConfidence)
    );
  });
  const activeFilters = [rageCompetitor, rageCategory, rageRating, rageConfidence].filter((item) => item !== "all").length;
  const activeIndex = TABS.findIndex((tab) => tab.id === activeTab);

  function changeTab(id: TabId) {
    setActiveTab(id);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function selectOpportunity(id: string) {
    const item = report.opportunities.find((opportunity) => opportunity.id === id) ?? report.opportunities[0];
    setSelectedOpportunityId(id);
    if (item) setPrompt(agentPrompt(report, item));
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function downloadPrompt() {
    const blob = new Blob([prompt], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "onestar-agent-brief.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div id="report" className="bg-bg">
      <div ref={topRef} className="mx-auto max-w-[1180px] scroll-mt-6 px-4 py-7 sm:px-6 md:px-8 md:py-12">
        <div className="overflow-hidden rounded-2xl border border-line bg-bg">
          <TabBar activeTab={activeTab} onChange={changeTab} mode={report.mode} />
          <main className="px-4 py-7 sm:px-6 md:px-10 md:py-10">
            {activeTab === "snapshot" && <Snapshot report={report} opportunity={selectedOpportunity} onDecisions={() => changeTab("decisions")} />}
            {activeTab === "competitors" && <Competitors report={report} direct={directCompetitors} adjacent={adjacentCompetitors} />}
            {activeTab === "rage" && (
              <RageWall
                report={report}
                items={rageItems}
                filters={{ competitor: rageCompetitor, category: rageCategory, rating: rageRating, confidence: rageConfidence }}
                onChange={{ competitor: setRageCompetitor, category: setRageCategory, rating: setRageRating, confidence: setRageConfidence }}
                activeFilters={activeFilters}
                onClear={() => { setRageCompetitor("all"); setRageCategory("all"); setRageRating("all"); setRageConfidence("all"); }}
              />
            )}
            {activeTab === "heatmap" && <Heatmap report={report} maxFrequency={maxFrequency} />}
            {activeTab === "decisions" && selectedOpportunity && (
              <Decisions
                report={report}
                selected={selectedOpportunity}
                onSelect={selectOpportunity}
                prompt={prompt}
                onPrompt={setPrompt}
                onCopy={() => void copyPrompt()}
                onDownload={downloadPrompt}
                onReset={() => setPrompt(defaultPrompt)}
                copied={copied}
              />
            )}
            {activeTab === "blueprint" && selectedOpportunity && (
              <Blueprint
                report={report}
                opportunity={selectedOpportunity}
                prompt={prompt}
                onPrompt={setPrompt}
                onCopy={() => void copyPrompt()}
                onDownload={downloadPrompt}
                onReset={() => setPrompt(defaultPrompt)}
                copied={copied}
              />
            )}
            {activeTab === "sources" && <Sources report={report} />}
            <Pagination activeIndex={activeIndex} onChange={changeTab} />
          </main>
        </div>
      </div>
    </div>
  );
}

function TabBar({ activeTab, onChange, mode }: { activeTab: TabId; onChange: (id: TabId) => void; mode: Report["mode"] }) {
  return <div className="border-b border-line bg-bg-elev/40 px-3 py-2.5 md:px-4"><div className="flex items-center gap-3"><div className="flex flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Report sections">{TABS.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={tab.id === activeTab} onClick={() => onChange(tab.id)} className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 font-label text-[11px] uppercase tracking-[.14em] ${tab.id === activeTab ? "bg-acid text-bg" : "text-muted hover:bg-bg-elev hover:text-fg"}`}>{tab.label}</button>)}</div><span className="hidden sm:inline-flex">{mode === "demo" ? <Stamp tone="acid">example data</Stamp> : <Stamp>live research</Stamp>}</span></div></div>;
}

function Snapshot({ report, opportunity, onDecisions }: { report: Report; opportunity?: Report["opportunities"][number]; onDecisions: () => void }) {
  return <section><div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-end"><div><Kicker tone="acid">Decision brief</Kicker><h1 className="mt-3 max-w-[23ch] text-[clamp(1.8rem,4vw,3.25rem)] font-medium leading-[1.03] tracking-[-.045em]">Test this wedge before building product.</h1><p className="mt-5 max-w-[62ch] text-[15px] leading-7 text-muted">{report.market.opportunityVerdict}</p></div>{opportunity && <aside className="border border-acid/30 bg-acid-dim/35 p-5"><Kicker tone="acid">Best first bet</Kicker><p className="mt-3 text-lg leading-7">{opportunity.recommendedSolution}</p><button type="button" onClick={onDecisions} className="mt-5 inline-flex items-center gap-2 font-label text-[11px] uppercase tracking-[.14em] text-acid hover:text-fg">Open decision flow <ChevronRight className="h-3.5 w-3.5" /></button></aside>}</div><dl className="mt-9 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">{[["Who first", report.market.targetCustomer], ["Market shape", report.market.productCategory], ["Signal", `${report.market.negativeFeedbackCount} negative items`], ["Evidence", `${report.market.sourcesAnalyzed} sources analyzed`]].map(([label, value]) => <div key={label} className="bg-bg p-4 md:p-5"><dt><Kicker>{label}</Kicker></dt><dd className="mt-2 text-sm leading-6">{value}</dd></div>)}</dl><div className="mt-8 border-t border-line pt-5"><Kicker>Market read</Kicker><p className="mt-2 max-w-[70ch] text-lg leading-8">{report.market.interpretedIdea}</p></div></section>;
}

function Competitors({ report, direct, adjacent }: { report: Report; direct: Report["competitors"]; adjacent: Report["competitors"] }) {
  return <section><SectionHead kicker="01" title="Competitor scan" /><p className="mt-3 max-w-[64ch] text-sm leading-6 text-muted">Direct means explicit workout- or sports-partner matching in product description. Uncertain products stay adjacent.</p><CompetitorTable report={report} title="Direct alternatives" competitors={direct} relevance="direct" /><CompetitorTable report={report} title="Adjacent alternatives" competitors={adjacent} relevance="adjacent" /></section>;
}

function CompetitorTable({ report, title, competitors, relevance }: { report: Report; title: string; competitors: Report["competitors"]; relevance: "direct" | "adjacent" }) {
  if (!competitors.length) return null;
  return <div className="mt-8"><div className="mb-3 flex items-center justify-between"><Kicker>{title}</Kicker><Stamp tone={relevance === "direct" ? "acid" : "default"}>{competitors.length}</Stamp></div><div className="overflow-x-auto rounded-xl border border-line"><table className="w-full min-w-[760px] text-left"><thead className="bg-bg-elev/60 font-label text-[10px] uppercase tracking-[.13em] text-faint"><tr><th className="px-4 py-3">Product</th><th className="px-3 py-3">Relevance</th><th className="px-3 py-3">Audience / job</th><th className="px-3 py-3">Failure mode</th><th className="px-3 py-3">Evidence</th></tr></thead><tbody>{competitors.map((competitor) => <tr key={competitor.url} className="border-t border-line align-top"><td className="px-4 py-4"><CompetitorName name={competitor.name} url={competitor.url} className="font-medium hover:text-acid" /><p className="mt-1 max-w-52 text-xs leading-5 text-muted">{competitor.description}</p></td><td className="px-3 py-4"><Stamp tone={relevance === "direct" ? "acid" : "default"}>{relevance}</Stamp>{relevance === "adjacent" && <p className="mt-2 max-w-36 text-[11px] leading-4 text-faint">Nearby behavior, different core job.</p>}</td><td className="px-3 py-4"><p className="max-w-52 text-sm leading-6">{competitor.targetAudience}</p><p className="mt-2 text-xs leading-5 text-muted">{competitor.pricing ?? "Pricing not captured"}</p></td><td className="px-3 py-4"><p className="max-w-56 text-sm leading-6 text-rage">{competitor.mostCommonComplaint}</p><ConfidenceMark value={competitor.confidence} /></td><td className="px-3 py-4"><p className="font-label text-sm">{competitor.feedbackCount} items</p><div className="mt-2 flex flex-wrap gap-2">{competitor.sourceIds.map((id) => <SourceLink key={id} report={report} id={id} />)}</div></td></tr>)}</tbody></table></div></div>;
}

function RageWall({ report, items, filters, onChange, activeFilters, onClear }: { report: Report; items: Report["wallOfRage"]; filters: { competitor: string; category: string; rating: RageRating; confidence: RageConfidence }; onChange: { competitor: (value: string) => void; category: (value: string) => void; rating: (value: RageRating) => void; confidence: (value: RageConfidence) => void }; activeFilters: number; onClear: () => void }) {
  return <section><SectionHead kicker="02" title="Wall of Rage" rage /><p className="mt-3 max-w-[66ch] text-sm leading-6 text-muted">Collected excerpts. Confidence inherits matched competitor confidence; unmatched competitors say unavailable.</p><div className="mt-6 grid gap-3 rounded-xl border border-line bg-bg-elev/30 p-3 lg:grid-cols-4"><FilterSelect label="Competitor" value={filters.competitor} onChange={onChange.competitor} options={["all", ...report.competitors.map((item) => item.name)]} /><FilterSelect label="Theme" value={filters.category} onChange={onChange.category} options={["all", ...unique(report.wallOfRage.map((item) => item.category))]} /><FilterSelect label="Rating state" value={filters.rating} onChange={(value) => onChange.rating(value as RageRating)} options={["all", "rated", "mention"]} /><FilterSelect label="Evidence confidence" value={filters.confidence} onChange={(value) => onChange.confidence(value as RageConfidence)} options={["all", "high", "medium", "low", "unavailable"]} /><div className="lg:col-span-4 flex items-center justify-between border-t border-line pt-3 font-label text-[10px] uppercase tracking-[.14em] text-faint"><span>{items.length} of {report.wallOfRage.length} items · {activeFilters} filters</span>{activeFilters > 0 && <button type="button" onClick={onClear} className="text-acid hover:text-fg">clear filters</button>}</div></div><div className="mt-6 grid gap-3 lg:grid-cols-2">{items.map((item) => <RageCard key={item.id} report={report} item={item} />)}</div>{!items.length && <EmptyState>No collected evidence matches filters.</EmptyState>}</section>;
}

function RageCard({ report, item }: { report: Report; item: Report["wallOfRage"][number] }) {
  const confidence = rageConfidenceFor(report, item);
  return <article className="rounded-xl border border-rage/25 bg-rage-dim/25 p-4"><p className="font-serif text-[1.03rem] leading-7">“{item.excerpt}”</p><div className="mt-4 flex flex-wrap gap-2"><Stamp tone="rage">{item.category}</Stamp>{item.rating === null ? <Stamp>negative mention</Stamp> : <Stamp tone="rage">{item.rating}/5</Stamp>}<EvidenceConfidence value={confidence} /></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 font-label text-[10px] uppercase tracking-[.13em] text-muted"><span><CompetitorName name={item.competitor} url={matchCompetitor(report.competitors, item.competitor)?.url} className="text-muted hover:text-acid" /> · {item.platform}{formatDate(item.publishedAt) ? ` · ${formatDate(item.publishedAt)}` : ""}</span><SourceLink report={report} id={item.sourceId} /></div></article>;
}

function Heatmap({ report, maxFrequency }: { report: Report; maxFrequency: number }) {
  return <section><SectionHead kicker="03" title="Complaint heatmap" /><p className="mt-3 max-w-[70ch] text-sm leading-6 text-muted">Cells count collected Wall of Rage items by theme/category and competitor. Severity and confidence are separate aggregate theme measures. Zero means no collected evidence.</p><div className="mt-7 overflow-x-auto rounded-xl border border-line"><table className="w-full min-w-[880px] border-collapse text-left"><thead className="bg-bg-elev/70 font-label text-[10px] uppercase tracking-[.13em] text-faint"><tr><th className="sticky left-0 z-10 min-w-52 border-b border-line bg-bg-elev/70 px-4 py-3">Theme</th><th className="border-b border-line px-3 py-3">Frequency</th><th className="border-b border-line px-3 py-3">Severity</th><th className="border-b border-line px-3 py-3">Confidence</th>{report.competitors.map((competitor) => <th key={competitor.url} className="min-w-28 border-b border-line px-3 py-3">{competitor.name}</th>)}</tr></thead><tbody>{report.themes.map((theme) => <tr key={theme.id} className="align-top border-b border-line last:border-b-0"><td className="sticky left-0 z-10 bg-bg px-4 py-4"><p className="font-medium">{theme.theme}</p><p className="mt-1 max-w-56 text-xs leading-5 text-muted">{theme.explanation}</p><SourceLink report={report} id={theme.representativeSourceId} /></td><td className="px-3 py-4"><span className="font-label text-sm">{theme.evidenceCount}</span><p className="mt-1 text-[11px] text-faint">sample items</p></td><td className="px-3 py-4"><SeverityMark value={theme.severity} /></td><td className="px-3 py-4"><ConfidenceMark value={themeConfidence(theme)} /></td>{report.competitors.map((competitor) => <HeatmapCell key={competitor.url} count={themeCompetitorFrequency(report, theme, competitor)} max={maxFrequency} />)}</tr>)}</tbody></table></div></section>;
}

function HeatmapCell({ count, max }: { count: number; max: number }) {
  if (!count) return <td className="px-3 py-4"><span className="text-xs text-faint">0 · no evidence</span></td>;
  const intensity = 16 + Math.round((count / max) * 28);
  return <td className="px-3 py-4"><span className="inline-flex min-w-10 justify-center rounded border border-acid/35 px-2 py-1 font-label text-xs text-acid" style={{ backgroundColor: `color-mix(in oklab, var(--acid) ${intensity}%, transparent)` }}>{count}</span><p className="mt-1 text-[10px] text-faint">items</p></td>;
}

function Decisions({ report, selected, onSelect, prompt, onPrompt, onCopy, onDownload, onReset, copied }: { report: Report; selected: Report["opportunities"][number]; onSelect: (id: string) => void; prompt: string; onPrompt: (value: string) => void; onCopy: () => void; onDownload: () => void; onReset: () => void; copied: boolean }) {
  return <section><SectionHead kicker="04" title="Pain → proof → fix" acid /><p className="mt-3 max-w-[64ch] text-sm leading-6 text-muted">Pick one wedge. Each flow connects pain, evidence, fix, and smallest test.</p><div className="mt-7 grid gap-3 lg:grid-cols-[minmax(15rem,.65fr)_minmax(0,1.35fr)]"><div className="space-y-2">{report.opportunities.map((item, index) => <button key={item.id} type="button" onClick={() => onSelect(item.id)} className={`w-full border p-4 text-left ${item.id === selected.id ? "border-acid bg-acid-dim/45" : "border-line hover:border-acid/60"}`}><div className="flex items-center justify-between gap-3"><span className="font-label text-[11px] tracking-[.14em] text-acid">{String(index + 1).padStart(2, "0")}</span><ConfidenceMark value={item.confidence} /></div><p className="mt-3 text-sm leading-6">{item.customerPain}</p></button>)}</div><DecisionFlow report={report} opportunity={selected} /></div><AgentPrompt prompt={prompt} onChange={onPrompt} onCopy={onCopy} onDownload={onDownload} onReset={onReset} copied={copied} /></section>;
}

function DecisionFlow({ report, opportunity }: { report: Report; opportunity: Report["opportunities"][number] }) {
  const build = closestBuild(report, opportunity);
  return <article className="border border-line bg-bg-elev/25 p-5 md:p-6"><div className="grid gap-px bg-line md:grid-cols-2"><FlowBlock label="Pain" body={opportunity.customerPain} /><FlowBlock label="Proof" body={`${opportunity.evidenceSourceIds.length} linked sources in this collected sample.`} links={opportunity.evidenceSourceIds.map((id) => <SourceLink key={id} report={report} id={id} />)} /><FlowBlock label="Proposed fix" body={opportunity.recommendedSolution} acid /><FlowBlock label="Smallest experiment" body={experimentFor(report, opportunity)} /></div>{build && <div className="mt-5 border-t border-line pt-5"><Kicker tone="rage">Do not build</Kicker><p className="mt-2 text-sm leading-6 text-muted">{build.notThat}</p><p className="mt-2 text-xs leading-5 text-faint">{build.because}</p></div>}</article>;
}

function Blueprint({ report, opportunity, prompt, onPrompt, onCopy, onDownload, onReset, copied }: { report: Report; opportunity: Report["opportunities"][number]; prompt: string; onPrompt: (value: string) => void; onCopy: () => void; onDownload: () => void; onReset: () => void; copied: boolean }) {
  return <section className="rounded-2xl border border-acid/25 bg-acid-dim/25 p-5 md:p-8"><SectionHead kicker="05" title="Build brief" acid /><p className="mt-3 max-w-[60ch] text-sm leading-6 text-muted">Default view: decisions needed for first test.</p><div className="mt-8 grid gap-px border border-acid/20 bg-acid/15 md:grid-cols-2"><BriefBlock label="Target customer" body={opportunity.targetSegment} /><BriefBlock label="Core workflow" body={report.blueprint.smallestViableMvp} /><div className="bg-bg/65 p-5 md:p-6"><Kicker tone="acid">Three features</Kicker><ol className="mt-3 space-y-3">{report.blueprint.featuresToBuildFirst.slice(0, 3).map((item, index) => <li key={item} className="flex gap-3 text-sm leading-6"><span className="font-label text-acid">0{index + 1}</span>{item}</li>)}</ol></div><div className="bg-bg/65 p-5 md:p-6"><Kicker tone="rage">Exclusions</Kicker><ul className="mt-3 space-y-3">{report.blueprint.featuresToAvoid.slice(0, 3).map((item) => <li key={item} className="text-sm leading-6 text-muted">{item}</li>)}</ul></div><BriefBlock label="Riskiest assumption" body={report.blueprint.criticalAssumptions[0] ?? "Validate demand before build."} tone="rage" /><BriefBlock label="First experiment" body={firstExperiment(report)} /></div><AgentPrompt prompt={prompt} onChange={onPrompt} onCopy={onCopy} onDownload={onDownload} onReset={onReset} copied={copied} compact /></section>;
}

function AgentPrompt({ prompt, onChange, onCopy, onDownload, onReset, copied, compact = false }: { prompt: string; onChange: (value: string) => void; onCopy: () => void; onDownload: () => void; onReset: () => void; copied: boolean; compact?: boolean }) {
  return <div className={`border-t border-acid/20 ${compact ? "mt-7 pt-6" : "mt-8 pt-8"}`}><div className="flex flex-wrap items-end justify-between gap-3"><div><Kicker tone="acid">Custom agent prompt</Kicker><p className="mt-1 text-sm text-muted">Selected pain, evidence, first test. Edit before handoff.</p></div><button type="button" onClick={onReset} className="font-label text-[10px] uppercase tracking-[.14em] text-faint hover:text-fg">reset research draft</button></div><textarea value={prompt} onChange={(event) => onChange(event.target.value)} aria-label="Editable custom agent prompt" className="mt-4 min-h-60 w-full resize-y rounded-xl border border-line bg-bg px-4 py-3 font-mono text-xs leading-6 outline-none focus:border-acid" /><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={onCopy} className="inline-flex items-center gap-2 rounded-full bg-acid px-4 py-2 font-label text-[10px] uppercase tracking-[.14em] text-bg">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "copied" : "copy prompt"}</button><button type="button" onClick={onDownload} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 font-label text-[10px] uppercase tracking-[.14em] hover:border-acid hover:text-acid"><Download className="h-3.5 w-3.5" />download .md</button></div></div>;
}

function Sources({ report }: { report: Report }) { return <section><SectionHead kicker="06" title="Sources" /><details className="group mt-8 rounded-2xl border border-line"><summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4"><span className="font-semibold tracking-[-.03em]">All sources</span><ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" /></summary><ul className="divide-y divide-line border-t border-line">{report.sources.map((source) => <li key={source.id} className="px-4 py-4"><a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium hover:text-acid">{source.title} <ArrowUpRight className="h-3.5 w-3.5" /></a><p className="mt-1 font-label text-[12px] uppercase tracking-[.14em] text-faint">{source.domain}{formatDate(source.publishedAt) ? ` · ${formatDate(source.publishedAt)}` : ""}</p><p className="mt-2 text-sm text-muted">{source.findings}</p></li>)}</ul></details><ul className="mt-6 space-y-2">{report.caveats.map((item) => <li key={item} className="text-sm text-faint">{item}</li>)}</ul></section>; }
function Pagination({ activeIndex, onChange }: { activeIndex: number; onChange: (id: TabId) => void }) { return <div className="mt-12 flex items-center justify-between border-t border-line pt-6">{activeIndex > 0 ? <NavButton direction="previous" label={TABS[activeIndex - 1].label} onClick={() => onChange(TABS[activeIndex - 1].id)} /> : <span />}{activeIndex < TABS.length - 1 ? <NavButton direction="next" label={TABS[activeIndex + 1].label} onClick={() => onChange(TABS[activeIndex + 1].id)} /> : <span />}</div>; }
function SectionHead({ kicker, title, rage, acid }: { kicker: string; title: string; rage?: boolean; acid?: boolean }) { return <div><Kicker tone={rage ? "rage" : acid ? "acid" : "default"}>{kicker}</Kicker><h2 className="mt-2 text-[clamp(1.5rem,3vw,2.25rem)] font-medium tracking-[-.04em]">{title}</h2></div>; }
function Kicker({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "rage" | "acid" }) { return <p className={`font-label text-[10px] uppercase tracking-[.16em] ${tone === "rage" ? "text-rage" : tone === "acid" ? "text-acid" : "text-faint"}`}>{children}</p>; }
function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) { return <label className="block"><Kicker>{label}</Kicker><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-acid">{options.map((option) => <option key={option} value={option}>{option === "all" ? `All ${label.toLowerCase()}s` : option === "mention" ? "Negative mention" : option === "rated" ? "Published rating" : option === "unavailable" ? "Unavailable" : option}</option>)}</select></label>; }
function FlowBlock({ label, body, links, acid = false }: { label: string; body: string; links?: ReactNode; acid?: boolean }) { return <div className="bg-bg/70 p-4"><Kicker tone={acid ? "acid" : "default"}>{label}</Kicker><p className="mt-2 text-sm leading-6">{body}</p>{links && <div className="mt-3 flex flex-wrap gap-2">{links}</div>}</div>; }
function BriefBlock({ label, body, tone = "acid" }: { label: string; body: string; tone?: "acid" | "rage" }) { return <div className="bg-bg/65 p-5 md:p-6"><Kicker tone={tone}>{label}</Kicker><p className="mt-3 text-sm leading-6">{body}</p></div>; }
function SeverityMark({ value }: { value: Report["themes"][number]["severity"] }) { return <Stamp tone={value === "critical" || value === "high" ? "rage" : value === "medium" ? "acid" : "default"}>{value}</Stamp>; }
function EvidenceConfidence({ value }: { value: Confidence | null }) { return value ? <ConfidenceMark value={value} /> : <Stamp>confidence unavailable</Stamp>; }
function EmptyState({ children }: { children: ReactNode }) { return <p className="mt-6 rounded-xl border border-dashed border-line p-5 text-sm text-muted">{children}</p>; }
function SourceLink({ report, id }: { report: Report; id: string }) { const source = sourceById(report.sources, id); return source ? <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-label text-[10px] uppercase tracking-[.11em] text-acid hover:underline">{source.domain} <ExternalLink className="h-3 w-3" /></a> : null; }
function CompetitorName({ name, url, className = "hover:text-acid" }: { name: string; url?: string; className?: string }) { return !url?.startsWith("http") ? <span>{name}</span> : <a href={url} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 ${className}`}>{name}<ArrowUpRight className="h-3 w-3" /></a>; }
function NavButton({ direction, label, onClick }: { direction: "previous" | "next"; label: string; onClick: () => void }) { const Icon = direction === "previous" ? ChevronLeft : ChevronRight; return <button type="button" onClick={onClick} className={`group inline-flex items-center gap-2 text-muted hover:text-fg ${direction === "next" ? "text-right" : "text-left"}`}>{direction === "previous" && <Icon className="h-4 w-4 text-faint group-hover:text-acid" />}<span><Kicker>{direction}</Kicker><span className="text-sm font-medium">{label}</span></span>{direction === "next" && <Icon className="h-4 w-4 text-faint group-hover:text-acid" />}</button>; }
function matchCompetitor(competitors: Report["competitors"], name: string) { return competitors.find((item) => namesMatch(item.name, name)); }
function relevanceOf(competitor: Report["competitors"][number]) { return /find others to train with|workout[- ]partner|sports and pickup-game matching|sports[- ]partner/i.test(competitor.description) ? "direct" : "adjacent"; }
function rageConfidenceFor(report: Report, item: Report["wallOfRage"][number]) { return matchCompetitor(report.competitors, item.competitor)?.confidence ?? null; }
function themeCompetitorFrequency(report: Report, theme: Report["themes"][number], competitor: Report["competitors"][number]) { return report.wallOfRage.filter((item) => namesMatch(item.category, theme.theme) && namesMatch(item.competitor, competitor.name)).length; }
function themeConfidence(theme: Report["themes"][number]): Confidence { return theme.evidenceCount >= 4 ? "high" : theme.evidenceCount >= 2 ? "medium" : "low"; }
function closestBuild(report: Report, opportunity: Report["opportunities"][number]) { return [...report.buildThisNotThat].sort((left, right) => overlap(right.sourceIds, opportunity.evidenceSourceIds) - overlap(left.sourceIds, opportunity.evidenceSourceIds))[0]; }
function experimentFor(report: Report, opportunity: Report["opportunities"][number]) { const build = closestBuild(report, opportunity); const day = report.blueprint.validationPlan.find((item) => /interview|prototype|partner board|manager/i.test(item.action)); return build ? `${build.build}. Start: ${day?.action ?? firstExperiment(report)}` : firstExperiment(report); }
function firstExperiment(report: Report) { const first = report.blueprint.validationPlan[0]; return first ? `${first.action} Pass if: ${first.successSignal}` : "Run five customer interviews before building."; }
function overlap(left: string[], right: string[]) { return left.filter((item) => right.includes(item)).length; }
function unique(values: string[]) { return [...new Set(values)]; }
function agentPrompt(report: Report, opportunity: Report["opportunities"][number]) { const sources = opportunity.evidenceSourceIds.map((id) => sourceById(report.sources, id)).filter(Boolean).map((source) => `- ${source?.title} (${source?.url}): ${source?.findings}`).join("\n"); const rage = report.wallOfRage.filter((item) => opportunity.evidenceSourceIds.includes(item.sourceId)).slice(0, 3).map((item) => `- “${item.excerpt}” — ${item.competitor}, ${item.platform}`).join("\n"); return `You are product strategist. Turn this research into a smallest credible experiment.\n\nIdea\n${report.idea}\n\nSelected customer pain\n${opportunity.customerPain}\n\nTarget segment\n${opportunity.targetSegment}\n\nCompetitor weakness\n${opportunity.competitorWeakness}\n\nProposed fix\n${opportunity.recommendedSolution}\n\nEvidence excerpts\n${rage || "No excerpts linked."}\n\nSources\n${sources || "No linked sources."}\n\nConstraints\n- Keep scope to one falsifiable experiment.\n- State what not to build.\n- Separate evidence from assumptions.\n- Name success metric, failure signal, and next decision.\n\nReturn: experiment brief, recruit script, prototype scope, and decision rule.`; }
