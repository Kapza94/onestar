"use client";

import { useEffect, useRef, useState } from "react";
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
  findSavedReport,
  saveIdeaReport,
  saveSession,
  type RecentIdea,
} from "@/lib/client";
import { EXAMPLE_COMPETITOR_URLS, EXAMPLE_IDEA, labeledExampleReport } from "@/lib/example-report";
import { SEEDED_PREVIEW } from "@/lib/flags";
import { sameIdea, uniqueRecentIdeas } from "@/lib/recent";
import { LANDING_IDEA } from "@/lib/landing-sample";
import type { PresenceSnapshot } from "@/lib/presence/store";
import type { AnalyzeError, AppStatus, Report } from "@/lib/schemas";
import { ErrorScreen } from "./error-screen";
import { Landing } from "./landing";
import { LivePresence } from "./live-presence";
import { ReportView } from "./report-view";
import { ResearchScreen } from "./research-screen";
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
  const [, setRecent] = useState<RecentIdea[]>([]);
  const [, setArchiveTotal] = useState(0);
  const [presence, setPresence] = useState<PresenceSnapshot | null>(null);
  const requestSeq = useRef(0);
  const running = useRef(false);

  const idea = draft?.idea ?? queryIdea;
  const urls = (draft?.urls ?? "").replace(/\n+/g, ", ");
  const report = draft?.report ?? null;
  const view = draft?.view ?? "home";
  const error = draft?.error ?? null;
  const busy = view === "research";

  useEffect(() => {
    void fetchStatus().then(setStatus);
    const session = loadSession();
    let recents = loadRecentIdeas();
    if (session?.report?.mode === "live") {
      recents = pushRecentIdea(session.idea);
    }
    setRecent(recents);

    if (queryIdea) {
      const saved = findSavedReport(queryIdea);
      commit({
        idea: queryIdea,
        urls: saved?.urls ?? "",
        report: saved?.report ?? (session?.report && sameIdea(session.report.idea, queryIdea) ? session.report : null),
        view: "home",
      });
    } else if (session?.report?.mode === "live") {
      commit({
        idea: session.idea,
        urls: session.competitorUrls,
        report: session.report,
        view: "home",
      });
    } else {
      commit({ idea: LANDING_IDEA });
    }

    void fetchSearches(1, HOME_RECENT).then((result) => {
      setArchiveTotal(result.total);
      if (result.items.length) {
        setRecent((current) => uniqueRecentIdeas([...current, ...result.items]));
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
      const reportForIdea =
        merged.report && sameIdea(merged.report.idea, merged.idea)
          ? merged.report
          : session?.report && sameIdea(session.report.idea, merged.idea)
            ? session.report
            : null;
      saveSession({
        idea: merged.idea,
        competitorUrls: merged.urls,
        report: reportForIdea,
      });
      return merged;
    });
  }

  useEffect(() => {
    if (!queryIdea) return;
    const saved = findSavedReport(queryIdea);
    const session = loadSession();
    commit({
      idea: queryIdea,
      urls: saved?.urls ?? "",
      report: saved?.report ?? (session?.report && sameIdea(session.report.idea, queryIdea) ? session.report : null),
      view: "home",
    });
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
    requestAnimationFrame(() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth" }));
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
    if (running.current) return;
    running.current = true;
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

    try {
      const json = await analyzeIdea(trimmed, parseUrlField(nextUrls));
      if (seq !== requestSeq.current) {
        if (json.ok) {
          saveIdeaReport(trimmed, nextUrls, json.report);
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
      saveIdeaReport(trimmed, nextUrls, json.report);
      commit({
        idea: trimmed,
        urls: nextUrls,
        report: json.report,
        view: "home",
        error: null,
      });
      requestAnimationFrame(() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth" }));
    } finally {
      running.current = false;
    }
  }

  const showLanding = view === "home" && !report;

  return (
    <div className="min-h-[100dvh]">
      {showLanding ? (
        <Landing
          idea={idea}
          busy={busy}
          onIdea={(value) => commit({ idea: value })}
          onSubmit={(override) => void run(override ?? idea)}
        />
      ) : (
        <>
          <TopNav
            demoMode={Boolean(status?.demoMode)}
            model={status?.aiModel}
            hasReport={Boolean(report)}
            current="home"
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
        </>
      )}
    </div>
  );
}
