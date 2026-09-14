import { sameIdea, uniqueRecentIdeas, type RecentIdea } from "./recent";
import type { AnalyzeError, AppStatus, Report } from "./schemas";

export const STORAGE_KEY = "onestar:last-session";
export const RECENT_KEY = "onestar:recent-ideas";
export const REPORTS_KEY = "onestar:saved-reports";
export const HOME_RECENT = 12;
const MAX_RECENT = 80;
const MAX_SAVED_REPORTS = 20;

export type { RecentIdea };

export type Session = {
  idea: string;
  competitorUrls: string;
  report: Report | null;
  reportId?: string | null;
};

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // private mode
  }
}

export function loadRecentIdeas(): RecentIdea[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentIdea[];
    if (!Array.isArray(parsed)) return [];
    const next = uniqueRecentIdeas(parsed).slice(0, MAX_RECENT);
    if (JSON.stringify(next) !== raw) {
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // private mode
      }
    }
    return next;
  } catch {
    return [];
  }
}

export function pushRecentIdea(idea: string): RecentIdea[] {
  const trimmed = idea.trim();
  if (!trimmed) return loadRecentIdeas();
  const next = uniqueRecentIdeas([{ idea: trimmed, at: Date.now() }, ...loadRecentIdeas()]).slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // private mode
  }
  return next;
}

type SavedReport = {
  idea: string;
  urls: string;
  report: Report;
  at: number;
};

export type ReportSummary = {
  id: string;
  idea: string;
  competitorUrls: string[];
  status: string;
  requestedAt: number;
  completedAt: number | null;
};

function loadSavedReportList(): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveIdeaReport(idea: string, urls: string, report: Report) {
  const trimmed = idea.trim();
  if (!trimmed || report.mode !== "live") return;
  const next = [
    { idea: trimmed, urls, report, at: Date.now() },
    ...loadSavedReportList().filter((item) => !sameIdea(item.idea, trimmed)),
  ].slice(0, MAX_SAVED_REPORTS);
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
  } catch {
    // private mode or quota
  }
}

export function findSavedReport(idea: string) {
  const trimmed = idea.trim();
  if (!trimmed) return null;
  return loadSavedReportList().find((item) => sameIdea(item.idea, trimmed)) ?? null;
}

export async function fetchSearches(page = 1, limit = 20) {
  const response = await fetch(`/api/searches?page=${page}&limit=${limit}`);
  if (!response.ok) {
    return { items: [] as RecentIdea[], page: 1, pageSize: limit, total: 0, pages: 1 };
  }
  return (await response.json()) as {
    items: RecentIdea[];
    page: number;
    pageSize: number;
    total: number;
    pages: number;
  };
}

export async function fetchReports(page = 1, limit = 20) {
  const response = await fetch(`/api/reports?page=${page}&limit=${limit}`);
  if (!response.ok) {
    return { items: [] as ReportSummary[], page: 1, pageSize: limit, total: 0, pages: 1 };
  }
  return (await response.json()) as {
    items: ReportSummary[];
    page: number;
    pageSize: number;
    total: number;
    pages: number;
  };
}

export async function fetchReport(reportId: string) {
  const response = await fetch(`/api/reports/${encodeURIComponent(reportId)}`, { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as ReportSummary & { report: Report | null };
}

export async function fetchStatus(): Promise<AppStatus | null> {
  try {
    const response = await fetch("/api/status");
    if (!response.ok) return null;
    return (await response.json()) as AppStatus;
  } catch {
    return null;
  }
}

export async function analyzeIdea(idea: string, competitorUrls: string[], idempotencyKey: string) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ idea, competitorUrls }),
  });
  const json = (await response.json()) as
    | { ok: true; reportId: string; report: Report; balance: number }
    | AnalyzeError;
  return json;
}

export function parseUrlField(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function sourceById<T extends { id: string }>(sources: T[], id: string) {
  return sources.find((item) => item.id === id);
}
