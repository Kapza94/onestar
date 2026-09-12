import type { AnalyzeError, AppStatus, Report } from "./schemas";

export const STORAGE_KEY = "onestar:last-session";

export type Session = {
  idea: string;
  competitorUrls: string;
  report: Report | null;
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

export async function fetchStatus(): Promise<AppStatus | null> {
  try {
    const response = await fetch("/api/status");
    if (!response.ok) return null;
    return (await response.json()) as AppStatus;
  } catch {
    return null;
  }
}

export async function analyzeIdea(idea: string, competitorUrls: string[]) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea, competitorUrls }),
  });
  const json = (await response.json()) as
    | { ok: true; report: Report }
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
