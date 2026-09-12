"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  analyzeIdea,
  fetchStatus,
  parseUrlField,
  saveSession,
  STORAGE_KEY,
} from "@/lib/client";
import { EXAMPLE_COMPETITOR_URLS, EXAMPLE_IDEA, labeledExampleReport } from "@/lib/example-report";
import type { AnalyzeError, AppStatus, Report } from "@/lib/schemas";
import { ErrorScreen } from "./error-screen";
import { Landing } from "./landing";
import { ReportView } from "./report-view";
import { ResearchScreen } from "./research-screen";

type View = "landing" | "research" | "report" | "error";

type Draft = {
  idea: string;
  urls: string;
  report: Report | null;
  view: View;
  error: AnalyzeError["error"] | null;
};

function subscribeSession(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSessionSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function OneStarApp() {
  const storedRaw = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    () => null,
  );
  const stored = storedRaw
    ? (JSON.parse(storedRaw) as {
        idea: string;
        competitorUrls: string;
        report: Report | null;
      })
    : null;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [status, setStatus] = useState<AppStatus | null>(null);

  const idea = draft?.idea ?? stored?.idea ?? "";
  const urls = draft?.urls ?? stored?.competitorUrls ?? "";
  const report = draft ? draft.report : stored?.report ?? null;
  const view = draft?.view ?? (stored?.report ? "report" : "landing");
  const error = draft?.error ?? null;

  useEffect(() => {
    void fetchStatus().then(setStatus);
  }, []);

  function commit(next: Partial<Draft>) {
    const merged: Draft = {
      idea: next.idea ?? idea,
      urls: next.urls ?? urls,
      report: next.report === undefined ? report : next.report,
      view: next.view ?? view,
      error: next.error === undefined ? error : next.error,
    };
    setDraft(merged);
    saveSession({
      idea: merged.idea,
      competitorUrls: merged.urls,
      report: merged.report,
    });
  }

  function showExample() {
    const example = labeledExampleReport(EXAMPLE_IDEA);
    commit({
      idea: EXAMPLE_IDEA,
      urls: EXAMPLE_COMPETITOR_URLS.join("\n"),
      report: example,
      view: "report",
      error: null,
    });
  }

  async function run(nextIdea = idea, nextUrls = urls) {
    const trimmed = nextIdea.trim();
    if (trimmed.length < 12) return;
    commit({
      idea: trimmed,
      urls: nextUrls,
      report: null,
      view: "research",
      error: null,
    });

    const json = await analyzeIdea(trimmed, parseUrlField(nextUrls));
    if (!json.ok) {
      commit({
        idea: trimmed,
        urls: nextUrls,
        report: null,
        view: "error",
        error: json.error,
      });
      return;
    }
    commit({
      idea: trimmed,
      urls: nextUrls,
      report: json.report,
      view: "report",
      error: null,
    });
  }

  if (view === "research") {
    return <ResearchScreen idea={idea} />;
  }

  if (view === "error" && error) {
    return (
      <ErrorScreen
        error={error}
        onRetry={() => void run()}
        onEdit={() => commit({ view: "landing" })}
        onExample={showExample}
      />
    );
  }

  if (view === "report" && report) {
    return (
      <ReportView
        report={report}
        onReset={() => commit({ view: "landing" })}
      />
    );
  }

  return (
    <Landing
      idea={idea}
      urls={urls}
      busy={false}
      demoMode={Boolean(status?.demoMode)}
      onIdea={(value) => commit({ idea: value, view: "landing" })}
      onUrls={(value) => commit({ urls: value, view: "landing" })}
      onSubmit={() => void run()}
      onExample={showExample}
    />
  );
}
