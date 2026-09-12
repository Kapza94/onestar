"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  analyzeIdea,
  fetchSearches,
  fetchStatus,
  HOME_RECENT,
  loadRecentIdeas,
  loadSession,
  parseUrlField,
  pushRecentIdea,
  saveSession,
  type RecentIdea,
} from "@/lib/client";
import { EXAMPLE_COMPETITOR_URLS, EXAMPLE_IDEA, labeledExampleReport } from "@/lib/example-report";
import { SEEDED_PREVIEW } from "@/lib/flags";
import type { PresenceSnapshot } from "@/lib/presence/store";
import type { AnalyzeError, AppStatus, Report } from "@/lib/schemas";
import { ErrorScreen } from "./error-screen";
import { LivePresence } from "./live-presence";
import { RecentProjects } from "./recent-projects";
import { ReportView } from "./report-view";
import { ResearchScreen } from "./research-screen";
import { SearchHero } from "./search-hero";
import { TopNav } from "./top-nav";

type View = "home" | "research" | "error";

type Draft = {
  idea: string;
  urls: string;
  report: Report | null;
  view: View;
  error: AnalyzeError["error"] | null;
};

const PRESENCE_MS = 5 * 60 * 1000;
const LAST_PING_KEY = "onestar:last-presence-at";

async function pingPresence(body?: { action: "visit" | "search"; idea?: string }) {
  const response = await fetch("/api/presence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? { action: "visit" }),
  });
  if (!response.ok) return null;
  return (await response.json()) as PresenceSnapshot & { ok: boolean };
}

async function fetchPresence() {
  const response = await fetch("/api/presence");
  if (!response.ok) return null;
  return (await response.json()) as PresenceSnapshot;
}

export function OneStarApp() {
  const searchParams = useSearchParams();
  const queryIdea = searchParams.get("q")?.trim() || "";
  const [draft, setDraft] = useState<Draft | null>(null);
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [recent, setRecent] = useState<RecentIdea[]>([]);
  const [archiveTotal, setArchiveTotal] = useState(0);
  const [presence, setPresence] = useState<PresenceSnapshot | null>(null);
  const requestSeq = useRef(0);

  const idea = draft?.idea ?? queryIdea;
  const urls = (draft?.urls ?? "").replace(/\n+/g, ", ");
  const report = draft?.report ?? null;
  const view = draft?.view ?? "home";
  const error = draft?.error ?? null;
  const busy = view === "research";

  useEffect(() => {
    void fetchStatus().then(setStatus);
    setRecent(loadRecentIdeas());
    void fetchSearches(1, HOME_RECENT).then((result) => {
      setArchiveTotal(result.total);
      if (result.items.length) {
        setRecent((current) => mergeRecent(current, result.items));
      }
    });

    let lastPing = 0;
    try {
      lastPing = Number(localStorage.getItem(LAST_PING_KEY) || 0);
    } catch {
      lastPing = 0;
    }
    const load =
      Date.now() - lastPing > PRESENCE_MS
        ? pingPresence({ action: "visit" }).then((snapshot) => {
            if (snapshot) {
              try {
                localStorage.setItem(LAST_PING_KEY, String(Date.now()));
              } catch {
                // private mode
              }
            }
            return snapshot;
          })
        : fetchPresence();
    void load.then((snapshot) => {
      if (snapshot) setPresence(snapshot);
    });

    const timer = window.setInterval(() => {
      void fetchPresence().then((snapshot) => {
        if (snapshot) setPresence(snapshot);
      });
    }, PRESENCE_MS);
    return () => window.clearInterval(timer);
  }, []);

  const homeRecent = useMemo(() => mergeRecent(recent, presence?.recentIdeas ?? []).slice(0, HOME_RECENT), [recent, presence]);

  function commit(next: Partial<Draft>) {
    setDraft((prev) => {
      const base: Draft = prev ?? {
        idea: queryIdea,
        urls: "",
        report: null,
        view: "home",
        error: null,
      };
      const merged: Draft = {
        idea: next.idea ?? base.idea,
        urls: next.urls ?? base.urls,
        report: next.report === undefined ? base.report : next.report,
        view: next.view ?? base.view,
        error: next.error === undefined ? base.error : next.error,
      };
      const session = loadSession();
      saveSession({
        idea: merged.idea,
        competitorUrls: merged.urls,
        report: merged.report ?? session?.report ?? null,
      });
      return merged;
    });
  }

  useEffect(() => {
    if (!queryIdea) return;
    commit({ idea: queryIdea, view: "home" });
  }, [queryIdea]);

  function showExample() {
    const example = labeledExampleReport(EXAMPLE_IDEA);
    setRecent(pushRecentIdea(EXAMPLE_IDEA));
    void pingPresence({ action: "search", idea: EXAMPLE_IDEA }).then((snapshot) => {
      if (snapshot) {
        setPresence(snapshot);
        setArchiveTotal((current) => Math.max(current, snapshot.recentIdeas.length));
      }
    });
    commit({
      idea: EXAMPLE_IDEA,
      urls: EXAMPLE_COMPETITOR_URLS.join(", "),
      report: example,
      view: "home",
      error: null,
    });
    requestAnimationFrame(() => document.getElementById("snapshot")?.scrollIntoView({ behavior: "smooth" }));
  }

  useEffect(() => {
    if (!SEEDED_PREVIEW) return;
    const example = labeledExampleReport(EXAMPLE_IDEA);
    commit({
      idea: EXAMPLE_IDEA,
      urls: EXAMPLE_COMPETITOR_URLS.join(", "),
      report: example,
      view: "home",
      error: null,
    });
  }, []);

  async function run(nextIdea = idea, nextUrls = urls) {
    const trimmed = nextIdea.trim();
    if (trimmed.length < 12) return;
    const seq = ++requestSeq.current;
    setRecent(pushRecentIdea(trimmed));
    void pingPresence({ action: "search", idea: trimmed }).then((snapshot) => {
      if (snapshot) {
        setPresence(snapshot);
        setArchiveTotal((current) => Math.max(current, snapshot.recentIdeas.length));
        try {
          localStorage.setItem(LAST_PING_KEY, String(Date.now()));
        } catch {
          // private mode
        }
      }
    });
    commit({
      idea: trimmed,
      urls: nextUrls,
      view: "research",
      error: null,
    });

    const json = await analyzeIdea(trimmed, parseUrlField(nextUrls));
    if (seq !== requestSeq.current) {
      if (json.ok) {
        commit({
          idea: trimmed,
          urls: nextUrls,
          report: json.report,
          error: null,
        });
      }
      return;
    }
    if (!json.ok) {
      commit({
        idea: trimmed,
        urls: nextUrls,
        view: "error",
        error: json.error,
      });
      return;
    }
    commit({
      idea: trimmed,
      urls: nextUrls,
      report: json.report,
      view: "home",
      error: null,
    });
    requestAnimationFrame(() => document.getElementById("snapshot")?.scrollIntoView({ behavior: "smooth" }));
  }

  function onPickRecent(item: RecentIdea) {
    const storedReport = loadSession()?.report ?? report;
    const sameReport =
      Boolean(storedReport?.idea) &&
      item.idea.trim().toLowerCase() === storedReport!.idea.trim().toLowerCase();
    commit({
      idea: item.idea,
      report: sameReport ? storedReport : null,
      view: "home",
      error: null,
    });
    if (sameReport) {
      requestAnimationFrame(() => document.getElementById("snapshot")?.scrollIntoView({ behavior: "smooth" }));
    } else {
      requestAnimationFrame(() => document.getElementById("search")?.scrollIntoView({ behavior: "smooth" }));
    }
  }

  return (
    <div className="min-h-[100dvh]">
      <TopNav
        demoMode={Boolean(status?.demoMode)}
        model={status?.aiModel}
        hasReport={Boolean(report)}
        current="home"
      />
      <SearchHero
        idea={idea}
        urls={urls}
        busy={busy}
        onIdea={(value) => commit({ idea: value })}
        onUrls={(value) => commit({ urls: value })}
        onSubmit={() => void run()}
        onExample={SEEDED_PREVIEW ? showExample : undefined}
      />
      <RecentProjects
        items={homeRecent}
        total={Math.max(archiveTotal, recent.length, homeRecent.length)}
        onPick={onPickRecent}
      />
      {view === "research" ? <ResearchScreen idea={idea} /> : null}
      {view === "error" && error ? (
        <ErrorScreen
          error={error}
          onRetry={() => void run()}
          onEdit={() => commit({ view: "home" })}
          onExample={SEEDED_PREVIEW ? showExample : undefined}
        />
      ) : null}
      {view !== "research" && report ? <ReportView report={report} /> : null}
      <LivePresence snapshot={presence} />
    </div>
  );
}

function mergeRecent(primary: RecentIdea[], secondary: RecentIdea[]) {
  const seen = new Set<string>();
  const out: RecentIdea[] = [];
  for (const item of [...primary, ...secondary]) {
    const key = item.idea.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
