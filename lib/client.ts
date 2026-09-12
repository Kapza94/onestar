import type { AnalyzeError, AppStatus, Report } from "./schemas";

export const STORAGE_KEY = "onestar:last-session";
export const RECENT_KEY = "onestar:recent-ideas";
export const HOME_RECENT = 12;
const MAX_RECENT = 80;

export type RecentIdea = { idea: string; at: number };

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

export function loadRecentIdeas(): RecentIdea[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentIdea[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function pushRecentIdea(idea: string): RecentIdea[] {
  const trimmed = idea.trim();
  if (!trimmed) return loadRecentIdeas();
  const next = [
    { idea: trimmed, at: Date.now() },
    ...loadRecentIdeas().filter((item) => item.idea.toLowerCase() !== trimmed.toLowerCase()),
  ].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // private mode
  }
  return next;
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
