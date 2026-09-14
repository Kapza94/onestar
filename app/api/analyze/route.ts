import { api } from "@/convex/_generated/api";
import { hashAnalysisInput, requestId } from "@/lib/backend/input";
import { convexSubjectKey } from "@/lib/backend/convex";
import { attachSubjectCookie, resolveSubjectSession, type SubjectSession } from "@/lib/backend/session";
import { getEnv } from "@/lib/env";
import { AnalyzeFailure } from "@/lib/errors";
import { checkAnalyzeRateLimit } from "@/lib/rate-limit";
import { runAnalysis } from "@/lib/research/pipeline";
import { analyzeInputSchema, type AnalyzeError } from "@/lib/schemas";
import { fetchMutation } from "convex/nextjs";

export const maxDuration = 120;

function parseUrls(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function errorResponse(session: SubjectSession, error: AnalyzeError["error"], status: number, headers?: HeadersInit) {
  return attachSubjectCookie(Response.json({ ok: false, error }, { status, headers }), session);
}

export async function POST(request: Request) {
  const session = await resolveSubjectSession(request);
  const subjectKey = await convexSubjectKey(session.subjectKey);
  let reservedRequestId: string | null = null;

  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > 32_000) {
      return errorResponse(
        session,
        { code: "invalid_input", message: "Request body is too large.", retryable: false },
        413,
      );
    }
    if (process.env.RESEARCH_ENABLED === "false") {
      return errorResponse(
        session,
        { code: "research_paused", message: "Research is temporarily paused. Try again later.", retryable: true },
        503,
        { "Retry-After": "300" },
      );
    }

    const rateLimit = await checkAnalyzeRateLimit(request);
    if (!rateLimit.allowed) {
      const overloaded = rateLimit.reason === "global" || rateLimit.reason === "unavailable";
      return errorResponse(
        session,
        {
          code: overloaded ? "research_busy" : "rate_limited",
          message: overloaded
            ? "Research is busy right now. Try again in a minute."
            : "You’ve reached the research limit. Try again in a minute.",
          retryable: true,
        },
        overloaded ? 503 : 429,
        { "Retry-After": String(rateLimit.retryAfterSeconds) },
      );
    }

    const body = (await request.json()) as { idea?: unknown; competitorUrls?: unknown };
    const urls = parseUrls(body.competitorUrls).map((item) =>
      /^https?:\/\//i.test(item) ? item : `https://${item}`,
    );

    const parsed = analyzeInputSchema.safeParse({
      idea: body.idea,
      competitorUrls: urls,
    });

    if (!parsed.success) {
      return errorResponse(
        session,
        {
          code: "invalid_input",
          message: parsed.error.issues[0]?.message || "Invalid input.",
          retryable: false,
        },
        400,
      );
    }

    const currentRequestId = requestId(request);
    const reservation = await fetchMutation(api.analysis.reserve, {
      subjectKey,
      requestId: currentRequestId,
      inputHash: await hashAnalysisInput(parsed.data),
      idea: parsed.data.idea,
      competitorUrls: parsed.data.competitorUrls,
      traceId: crypto.randomUUID(),
      chargeCredit: !getEnv().demoMode,
      now: Date.now(),
    });

    if (reservation.kind === "replay_complete") {
      return attachSubjectCookie(
        Response.json({ ok: true, reportId: reservation.reportId, report: reservation.report, balance: reservation.balance }),
        session,
      );
    }
    if (reservation.kind === "replay_failed") {
      return errorResponse(
        session,
        {
          code: reservation.error.code as AnalyzeError["error"]["code"],
          message: reservation.error.message,
          retryable: reservation.error.retryable,
        },
        reservation.error.status,
      );
    }
    if (reservation.kind === "conflict") {
      return errorResponse(
        session,
        { code: "request_conflict", message: "That request key was already used for different input.", retryable: false },
        409,
      );
    }
    if (reservation.kind === "insufficient_credits") {
      return errorResponse(
        session,
        { code: "insufficient_credits", message: "No research credits remain for this session.", retryable: false },
        402,
      );
    }
    if (reservation.kind === "in_progress" || reservation.kind === "active_analysis") {
      return errorResponse(
        session,
        { code: "research_busy", message: "A research run is already active. Try again shortly.", retryable: true },
        409,
        { "Retry-After": "10" },
      );
    }

    reservedRequestId = currentRequestId;
    const report = await runAnalysis(parsed.data);
    const completed = await fetchMutation(api.analysis.complete, {
      subjectKey,
      requestId: currentRequestId,
      report,
      now: Date.now(),
    });
    return attachSubjectCookie(
      Response.json({ ok: true, reportId: completed.reportId, report, balance: completed.balance }),
      session,
    );
  } catch (error) {
    const failure =
      error instanceof AnalyzeFailure
        ? error
        : new AnalyzeFailure(
            "unknown",
            "Something broke during research. Try again.",
            { retryable: true, status: 500 },
          );
    if (reservedRequestId) {
      try {
        await fetchMutation(api.analysis.fail, {
          subjectKey,
          requestId: reservedRequestId,
          code: failure.code,
          message: failure.message,
          retryable: failure.retryable,
          status: failure.status,
          now: Date.now(),
        });
      } catch {
        // Running reservation remains visible for reconciliation.
      }
    }
    return errorResponse(session, failure.toJSON().error, failure.status);
  }
}
