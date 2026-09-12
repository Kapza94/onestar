import { getCloudflareContext } from "@opennextjs/cloudflare";

type RateLimitBinding = {
  limit(input: { key: string }): Promise<{ success: boolean }>;
};

type RateLimitEnv = CloudflareEnv & {
  ANALYZE_BURST_LIMITER?: RateLimitBinding;
  ANALYZE_GLOBAL_LIMITER?: RateLimitBinding;
};

export type AnalyzeRateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: "visitor" | "global" | "unavailable"; retryAfterSeconds: number };

const LOCAL_WINDOW_MS = 60_000;
const LOCAL_VISITOR_LIMIT = 2;
const localVisitors = new Map<string, { count: number; resetAt: number }>();

function clientFingerprint(request: Request) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = request.headers.get("user-agent") || "unknown";
  return `${ip || "local"}:${userAgent.slice(0, 160)}`;
}

async function hashFingerprint(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function checkLocalLimit(key: string): AnalyzeRateLimitResult {
  const now = Date.now();
  const current = localVisitors.get(key);
  if (!current || current.resetAt <= now) {
    localVisitors.set(key, { count: 1, resetAt: now + LOCAL_WINDOW_MS });
    return { allowed: true };
  }
  if (current.count >= LOCAL_VISITOR_LIMIT) {
    return {
      allowed: false,
      reason: "visitor",
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  current.count += 1;
  return { allowed: true };
}

export async function checkAnalyzeRateLimit(request: Request): Promise<AnalyzeRateLimitResult> {
  const key = await hashFingerprint(clientFingerprint(request));

  try {
    const { env } = await getCloudflareContext({ async: true });
    const bindings = env as RateLimitEnv;
    if (!bindings.ANALYZE_BURST_LIMITER || !bindings.ANALYZE_GLOBAL_LIMITER) {
      if (process.env.NODE_ENV === "production") {
        return { allowed: false, reason: "unavailable", retryAfterSeconds: 60 };
      }
      return checkLocalLimit(key);
    }

    const [visitor, global] = await Promise.all([
      bindings.ANALYZE_BURST_LIMITER.limit({ key }),
      bindings.ANALYZE_GLOBAL_LIMITER.limit({ key: "analyze" }),
    ]);
    if (!global.success) return { allowed: false, reason: "global", retryAfterSeconds: 60 };
    if (!visitor.success) return { allowed: false, reason: "visitor", retryAfterSeconds: 60 };
    return { allowed: true };
  } catch {
    if (process.env.NODE_ENV === "production") {
      return { allowed: false, reason: "unavailable", retryAfterSeconds: 60 };
    }
    return checkLocalLimit(key);
  }
}
