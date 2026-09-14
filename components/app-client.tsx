"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  analyzeIdea,
  fetchReport,
  fetchReports,
  fetchSearches,
  fetchStatus,
  HOME_RECENT,
  loadRecentIdeas,
  loadSession,
  parseUrlField,
  pushRecentIdea,
  findSavedReport,
  saveSession,
  type RecentIdea,
} from "@/lib/client";
import { EXAMPLE_COMPETITOR_URLS, EXAMPLE_IDEA, labeledExampleReport } from "@/lib/example-report";
import { SEEDED_PREVIEW } from "@/lib/flags";
import { sameIdea } from "@/lib/recent";
import type { PresenceSnapshot } from "@/lib/presence/store";
import type { AnalyzeError, AppStatus, Report } from "@/lib/schemas";
import { ErrorScreen } from "./error-screen";
import { Landing } from "./landing";
import { ReportView } from "./report-view";
import { ResearchScreen } from "./research-screen";
import { TopNav } from "./top-nav";

type View = "home" | "research" | "error";

type Draft = {
  idea: string;
  urls: string;
  report: Report | null;
  reportId: string | null;
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
  const [, setStatus] = useState<AppStatus | null>(null);
  const [goLanding, setGoLanding] = useState(false);
  const [, setRecent] = useState<RecentIdea[]>([]);
  const [, setArchiveTotal] = useState(0);
  const [, setPresence] = useState<PresenceSnapshot | null>(null);
  const [backendReady, setBackendReady] = useState(false);
  const requestSeq = useRef(0);
  const idempotencyKey = useRef<string | null>(null);
  const firstQueryEffect = useRef(true);
  const initialQueryIdea = useRef(queryIdea);
  const running = useRef(false);

  const idea = draft?.idea ?? queryIdea;
  const urls = (draft?.urls ?? "").replace(/\n+/g, ", ");
  const report = draft?.report ?? null;
  const view = draft?.view ?? "home";
  const error = draft?.error ?? null;
  const busy = view === "research";

  const commit = useCallback((next: Partial<Draft>) => {
    setDraft((prev) => {
      const base: Draft = prev ?? {
        idea: initialQueryIdea.current,
        urls: "",
        report: null,
        reportId: null,
        view: "home",
        error: null,
      };
      const merged: Draft = {
        idea: next.idea ?? base.idea,
        urls: next.urls ?? base.urls,
        report: next.report === undefined ? base.report : next.report,
        reportId: next.reportId === undefined ? base.reportId : next.reportId,
        view: next.view ?? base.view,
        error: next.error === undefined ? base.error : next.error,
      };
      const reportIdForIdea =
        merged.reportId && (!merged.report || sameIdea(merged.report.idea, merged.idea)) ? merged.reportId : null;
      saveSession({
        idea: merged.idea,
        competitorUrls: merged.urls,
        report: null,
        reportId: reportIdForIdea,
      });
      return merged;
    });
  }, []);

  useEffect(() => {
    const initialIdea = initialQueryIdea.current;
    void fetchStatus().then(setStatus);
    const session = loadSession();
    let recents = loadRecentIdeas();
    if (session?.report?.mode === "live") {
      recents = pushRecentIdea(session.idea);
    }
    queueMicrotask(() => setRecent(recents));

    if (initialIdea) {
      const saved = findSavedReport(initialIdea);
      commit({
        idea: initialIdea,
        urls: saved?.urls ?? "",
        report: saved?.report ?? (session?.report && sameIdea(session.report.idea, initialIdea) ? session.report : null),
        reportId: session?.reportId ?? null,
        view: "home",
      });
    } else if (session?.report?.mode === "live") {
      commit({
        idea: session.idea,
        urls: session.competitorUrls,
        report: session.report,
        reportId: session.reportId ?? null,
        view: "home",
      });
    } else {
      commit({ idea: "", reportId: null });
    }

    void fetchSearches(1, HOME_RECENT).then((result) => {
      setArchiveTotal(result.total);
      setRecent(result.items);
    });

    void fetchReports(1, 50)
      .then(async (result) => {
        const match = initialIdea
          ? result.items.find((item) => item.status === "complete" && sameIdea(item.idea, initialIdea))
          : result.items.find((item) => item.id === session?.reportId) ??
            result.items.find((item) => item.status === "complete");
        if (!match || match.status !== "complete") return;
        const stored = await fetchReport(match.id);
        if (!stored?.report) return;
        commit({
          idea: stored.idea,
          urls: stored.competitorUrls.join(", "),
          report: stored.report,
          reportId: stored.id,
          view: "home",
          error: null,
        });
      })
      .catch(() => null)
      .finally(() => setBackendReady(true));

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
  }, [commit]);

  useEffect(() => {
    if (firstQueryEffect.current) {
      firstQueryEffect.current = false;
      return;
    }
    if (!queryIdea) return;
    const saved = findSavedReport(queryIdea);
    const session = loadSession();
    commit({
      idea: queryIdea,
      urls: saved?.urls ?? "",
      report: saved?.report ?? (session?.report && sameIdea(session.report.idea, queryIdea) ? session.report : null),
      reportId: session?.reportId ?? null,
      view: "home",
    });
    void fetchReports(1, 50).then(async (result) => {
      const match = result.items.find((item) => item.status === "complete" && sameIdea(item.idea, queryIdea));
      if (!match) return;
      const stored = await fetchReport(match.id);
      if (!stored?.report) return;
      commit({
        idea: stored.idea,
        urls: stored.competitorUrls.join(", "),
        report: stored.report,
        reportId: stored.id,
        view: "home",
        error: null,
      });
    });
  }, [commit, queryIdea]);

  function showExample() {
    setGoLanding(false);
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
      reportId: null,
      view: "home",
      error: null,
    });
    requestAnimationFrame(() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth" }));
  }

  async function run(nextIdea = idea, nextUrls = urls) {
    const trimmed = nextIdea.trim();
    if (trimmed.length < 12) return;
    if (running.current) return;
    running.current = true;
    setGoLanding(false);
    const seq = ++requestSeq.current;
    idempotencyKey.current ??= crypto.randomUUID();
    const currentIdempotencyKey = idempotencyKey.current;
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
      report: null,
      reportId: null,
      view: "research",
      error: null,
    });

    try {
      const json = await analyzeIdea(trimmed, parseUrlField(nextUrls), currentIdempotencyKey);
      if (seq !== requestSeq.current) {
        idempotencyKey.current = null;
        if (json.ok) {
          commit({
            idea: trimmed,
            urls: nextUrls,
            report: json.report,
            reportId: json.reportId,
            error: null,
          });
        }
        return;
      }
      if (!json.ok) {
        idempotencyKey.current = null;
        commit({
          idea: trimmed,
          urls: nextUrls,
          view: "error",
          error: json.error,
        });
        return;
      }
      idempotencyKey.current = null;
      commit({
        idea: trimmed,
        urls: nextUrls,
        report: json.report,
        reportId: json.reportId,
        view: "home",
        error: null,
      });
      requestAnimationFrame(() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth" }));
    } catch {
      if (seq === requestSeq.current) {
        commit({
          idea: trimmed,
          urls: nextUrls,
          view: "error",
          error: {
            code: "unknown",
            message: "Connection lost while saving research. Retry to check the original request.",
            retryable: true,
          },
        });
      }
    } finally {
      running.current = false;
    }
  }

  const showLanding = goLanding || (view === "home" && !report);

  return (
    <div className="min-h-[100dvh]">
      {showLanding ? (
        <Landing
          idea={idea}
          busy={busy || !backendReady}
          onIdea={(value) => {
            idempotencyKey.current = null;
            commit({ idea: value });
          }}
          onSubmit={(override) => void run(override ?? idea)}
          onOpenReport={report ? () => setGoLanding(false) : undefined}
        />
      ) : (
        <>
          <TopNav
            hasReport={Boolean(report)}
            current="home"
            onHome={() => setGoLanding(true)}
            onOpenReport={() =>
              document.getElementById("report")?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          />
          {view === "research" ? <ResearchScreen idea={idea} /> : null}
          {view === "error" && error ? (
            <ErrorScreen
              error={error}
              onRetry={() => void run()}
              onEdit={() => {
                idempotencyKey.current = null;
                commit({ view: "home" });
              }}
              onExample={SEEDED_PREVIEW ? showExample : undefined}
            />
          ) : null}
          {view !== "research" && report ? <ReportView report={report} /> : null}
        </>
      )}
    </div>
  );
}
