import type { Report } from "./schemas";

const KEEP_KEYS = new Set([
  "id",
  "url",
  "domain",
  "sourceId",
  "sourceIds",
  "evidenceSourceIds",
  "representativeSourceId",
  "generatedAt",
  "publishedAt",
  "mode",
  "confidence",
  "severity",
]);

export function namesMatch(a: string, b: string) {
  const left = a.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  const right = b.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

export function stripSourceMarks(value: string) {
  return value
    .replace(/\[s\d+\]/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +\n/g, "\n")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/^[ \t]+/gm, "")
    .trim();
}

export function withEvidenceCounts(report: Report): Report {
  const competitors = report.competitors.map((competitor) => ({
    ...competitor,
    feedbackCount: report.wallOfRage.filter((item) => namesMatch(item.competitor, competitor.name)).length,
  }));
  return {
    ...report,
    competitors,
    market: {
      ...report.market,
      competitorCount: competitors.length,
      negativeFeedbackCount: report.wallOfRage.length,
    },
  };
}

export function sanitizeReportCopy(report: Report): Report {
  return sanitizeValue(report) as Report;
}

function sanitizeValue(value: unknown, key?: string): unknown {
  if (typeof value === "string") {
    if (key && KEEP_KEYS.has(key)) return value;
    return stripSourceMarks(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, key));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([nextKey, nextValue]) => [nextKey, sanitizeValue(nextValue, nextKey)]),
    );
  }
  return value;
}
