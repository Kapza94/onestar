import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, mutation, type MutationCtx } from "./_generated/server";
import {
  ANONYMOUS_INITIAL_CREDITS,
  canReserveCredits,
  idempotencyDecision,
  isReservationStale,
} from "./lib/credits";

const reserveResult = v.union(
  v.object({ kind: v.literal("reserved"), reportId: v.string(), balance: v.number() }),
  v.object({ kind: v.literal("replay_complete"), reportId: v.string(), balance: v.number(), report: v.any() }),
  v.object({
    kind: v.literal("replay_failed"),
    reportId: v.string(),
    balance: v.number(),
    error: v.object({ code: v.string(), message: v.string(), retryable: v.boolean(), status: v.number() }),
  }),
  v.object({ kind: v.literal("in_progress"), reportId: v.string(), balance: v.number() }),
  v.object({ kind: v.literal("conflict"), balance: v.number() }),
  v.object({ kind: v.literal("active_analysis"), reportId: v.string(), balance: v.number() }),
  v.object({ kind: v.literal("insufficient_credits"), balance: v.number() }),
);
const STALE_RESERVATION_MS = 3 * 60 * 1000;

async function subjectForKey(ctx: MutationCtx, subjectKey: string, now: number) {
  let subject = await ctx.db
    .query("subjects")
    .withIndex("by_subject_key", (q) => q.eq("subjectKey", subjectKey))
    .unique();
  if (subject) return subject;

  const subjectId = await ctx.db.insert("subjects", {
    subjectKey,
    kind: "anonymous",
    creditBalance: ANONYMOUS_INITIAL_CREDITS,
    createdAt: now,
    updatedAt: now,
  });
  await ctx.db.insert("usageLedger", {
    subjectId,
    kind: "grant",
    creditsDelta: ANONYMOUS_INITIAL_CREDITS,
    idempotencyKey: `subject:${subjectKey}:initial-grant`,
    createdAt: now,
    metadata: { reason: "anonymous_initial_grant" },
  });
  subject = await ctx.db.get("subjects", subjectId);
  if (!subject) throw new Error("subject creation failed");
  return subject;
}

export const reserve = mutation({
  args: {
    subjectKey: v.string(),
    requestId: v.string(),
    inputHash: v.string(),
    idea: v.string(),
    competitorUrls: v.array(v.string()),
    traceId: v.string(),
    chargeCredit: v.boolean(),
    now: v.number(),
  },
  returns: reserveResult,
  handler: async (ctx, args) => {
    const subject = await subjectForKey(ctx, args.subjectKey, args.now);
    let balance = subject.creditBalance;

    const releaseStale = async (
      report: Doc<"reports">,
      request: Doc<"analysisRequests">,
    ) => {
      await ctx.db.patch(report._id, {
        status: "failed",
        failureCode: "research_interrupted",
        completedAt: args.now,
      });
      await ctx.db.patch(request._id, {
        status: "failed",
        errorCode: "research_busy",
        errorMessage: "Previous research was interrupted. Start a new run.",
        errorRetryable: true,
        errorStatus: 503,
        updatedAt: args.now,
      });
      if (report.chargedCredits > 0) {
        balance += report.chargedCredits;
        await ctx.db.patch(subject._id, { creditBalance: balance, updatedAt: args.now });
        await ctx.db.insert("usageLedger", {
          subjectId: subject._id,
          reportId: report._id,
          kind: "release",
          creditsDelta: report.chargedCredits,
          idempotencyKey: `analysis:${subject._id}:${report.requestId}:stale-release`,
          createdAt: args.now,
          metadata: { failureCode: "research_interrupted" },
        });
      }
    };
    const existing = await ctx.db
      .query("analysisRequests")
      .withIndex("by_subject_request", (q) => q.eq("subjectId", subject._id).eq("requestId", args.requestId))
      .unique();

    if (existing) {
      const decision = idempotencyDecision(existing.inputHash, args.inputHash, existing.status);
      if (decision === "conflict") return { kind: decision, balance };
      const report = await ctx.db.get("reports", existing.reportId);
      if (!report) throw new Error("idempotent report missing");
      if (decision === "in_progress" && isReservationStale(report.requestedAt, args.now, STALE_RESERVATION_MS)) {
        await releaseStale(report, existing);
        return {
          kind: "replay_failed" as const,
          reportId: String(report._id),
          balance,
          error: {
            code: "research_busy",
            message: "Previous research was interrupted. Start a new run.",
            retryable: true,
            status: 503,
          },
        };
      }
      if (decision === "replay_complete") {
        return {
          kind: decision,
          reportId: String(report._id),
          balance,
          report: report.report ?? null,
        };
      }
      if (decision === "replay_failed") {
        return {
          kind: decision,
          reportId: String(report._id),
          balance,
          error: {
            code: existing.errorCode ?? "unknown",
            message: existing.errorMessage ?? "Research failed.",
            retryable: existing.errorRetryable ?? true,
            status: existing.errorStatus ?? 500,
          },
        };
      }
      return { kind: "in_progress" as const, reportId: String(report._id), balance };
    }

    const active = await ctx.db
      .query("reports")
      .withIndex("by_subject_status_requested", (q) => q.eq("subjectId", subject._id).eq("status", "running"))
      .order("desc")
      .first();
    if (active) {
      if (!isReservationStale(active.requestedAt, args.now, STALE_RESERVATION_MS)) {
        return { kind: "active_analysis" as const, reportId: String(active._id), balance };
      }
      const activeRequest = await ctx.db
        .query("analysisRequests")
        .withIndex("by_subject_request", (q) =>
          q.eq("subjectId", subject._id).eq("requestId", active.requestId),
        )
        .unique();
      if (!activeRequest) throw new Error("active analysis request missing");
      await releaseStale(active, activeRequest);
    }

    const cost = args.chargeCredit ? 1 : 0;
    if (!canReserveCredits(balance, cost)) {
      return { kind: "insufficient_credits" as const, balance };
    }

    const reportId = await ctx.db.insert("reports", {
      subjectId: subject._id,
      requestId: args.requestId,
      inputHash: args.inputHash,
      idea: args.idea,
      competitorUrls: args.competitorUrls,
      status: "running",
      traceId: args.traceId,
      chargedCredits: cost,
      requestedAt: args.now,
    });
    await ctx.db.insert("analysisRequests", {
      subjectId: subject._id,
      requestId: args.requestId,
      inputHash: args.inputHash,
      reportId,
      status: "running",
      createdAt: args.now,
      updatedAt: args.now,
    });
    await ctx.db.insert("searches", {
      subjectId: subject._id,
      reportId,
      idea: args.idea,
      normalizedIdea: args.idea.trim().replace(/\s+/g, " ").toLowerCase(),
      createdAt: args.now,
    });
    if (cost > 0) {
      await ctx.db.patch(subject._id, { creditBalance: balance - cost, updatedAt: args.now });
      await ctx.db.insert("usageLedger", {
        subjectId: subject._id,
        reportId,
        kind: "reserve",
        creditsDelta: -cost,
        idempotencyKey: `analysis:${subject._id}:${args.requestId}:reserve`,
        createdAt: args.now,
      });
    }
    return { kind: "reserved" as const, reportId: String(reportId), balance: balance - cost };
  },
});

export const complete = mutation({
  args: { subjectKey: v.string(), requestId: v.string(), report: v.any(), now: v.number() },
  returns: v.object({ reportId: v.string(), balance: v.number() }),
  handler: async (ctx, args) => {
    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_subject_key", (q) => q.eq("subjectKey", args.subjectKey))
      .unique();
    if (!subject) throw new Error("subject missing");
    const request = await ctx.db
      .query("analysisRequests")
      .withIndex("by_subject_request", (q) => q.eq("subjectId", subject._id).eq("requestId", args.requestId))
      .unique();
    if (!request) throw new Error("analysis reservation missing");
    const report = await ctx.db.get("reports", request.reportId);
    if (!report || report.subjectId !== subject._id) throw new Error("report missing");
    if (request.status === "failed") throw new Error("failed analysis cannot complete");
    if (request.status === "running") {
      await ctx.db.patch(report._id, { status: "complete", report: args.report, completedAt: args.now });
      await ctx.db.patch(request._id, { status: "complete", updatedAt: args.now });
      if (report.chargedCredits > 0) {
        await ctx.db.insert("usageLedger", {
          subjectId: subject._id,
          reportId: report._id,
          kind: "consume",
          creditsDelta: 0,
          idempotencyKey: `analysis:${subject._id}:${args.requestId}:consume`,
          createdAt: args.now,
        });
      }
    }
    return { reportId: String(report._id), balance: subject.creditBalance };
  },
});

export const fail = mutation({
  args: {
    subjectKey: v.string(),
    requestId: v.string(),
    code: v.string(),
    message: v.string(),
    retryable: v.boolean(),
    status: v.number(),
    now: v.number(),
  },
  returns: v.object({ reportId: v.string(), balance: v.number() }),
  handler: async (ctx, args) => {
    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_subject_key", (q) => q.eq("subjectKey", args.subjectKey))
      .unique();
    if (!subject) throw new Error("subject missing");
    const request = await ctx.db
      .query("analysisRequests")
      .withIndex("by_subject_request", (q) => q.eq("subjectId", subject._id).eq("requestId", args.requestId))
      .unique();
    if (!request) throw new Error("analysis reservation missing");
    const report = await ctx.db.get("reports", request.reportId);
    if (!report || report.subjectId !== subject._id) throw new Error("report missing");
    if (request.status === "running") {
      await ctx.db.patch(report._id, { status: "failed", failureCode: args.code, completedAt: args.now });
      await ctx.db.patch(request._id, {
        status: "failed",
        errorCode: args.code,
        errorMessage: args.message,
        errorRetryable: args.retryable,
        errorStatus: args.status,
        updatedAt: args.now,
      });
      if (report.chargedCredits > 0) {
        await ctx.db.patch(subject._id, {
          creditBalance: subject.creditBalance + report.chargedCredits,
          updatedAt: args.now,
        });
        await ctx.db.insert("usageLedger", {
          subjectId: subject._id,
          reportId: report._id,
          kind: "release",
          creditsDelta: report.chargedCredits,
          idempotencyKey: `analysis:${subject._id}:${args.requestId}:release`,
          createdAt: args.now,
          metadata: { failureCode: args.code },
        });
      }
    }
    const latest = await ctx.db.get("subjects", subject._id);
    return { reportId: String(report._id), balance: latest?.creditBalance ?? subject.creditBalance };
  },
});

export const ensureSubject = mutation({
  args: { subjectKey: v.string(), now: v.number() },
  returns: v.object({ balance: v.number() }),
  handler: async (ctx, args) => {
    const subject = await subjectForKey(ctx, args.subjectKey, args.now);
    return { balance: subject.creditBalance };
  },
});

export const claimSubject = internalMutation({
  args: { subjectKey: v.string(), authProvider: v.string(), externalSubject: v.string(), now: v.number() },
  returns: v.id("subjects"),
  handler: async (ctx, args) => {
    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_subject_key", (q) => q.eq("subjectKey", args.subjectKey))
      .unique();
    if (!subject) throw new Error("subject missing");
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_provider_subject", (q) =>
        q.eq("authProvider", args.authProvider).eq("externalSubject", args.externalSubject),
      )
      .unique();
    if (existing && subject.accountId !== existing._id) throw new Error("account already belongs to another subject");
    const accountId = existing?._id ?? (await ctx.db.insert("accounts", {
      authProvider: args.authProvider,
      externalSubject: args.externalSubject,
      createdAt: args.now,
    }));
    await ctx.db.patch(subject._id, { kind: "account", accountId, updatedAt: args.now });
    return subject._id;
  },
});
