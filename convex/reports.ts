import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ownsResource } from "./lib/credits";

const reportSummary = v.object({
  id: v.string(),
  idea: v.string(),
  competitorUrls: v.array(v.string()),
  status: v.string(),
  requestedAt: v.number(),
  completedAt: v.union(v.number(), v.null()),
});

export const listOwned = query({
  args: { subjectKey: v.string(), page: v.number(), pageSize: v.number() },
  returns: v.object({
    items: v.array(reportSummary),
    page: v.number(),
    pageSize: v.number(),
    total: v.number(),
    pages: v.number(),
  }),
  handler: async (ctx, args) => {
    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_subject_key", (q) => q.eq("subjectKey", args.subjectKey))
      .unique();
    const pageSize = Math.min(50, Math.max(1, Math.floor(args.pageSize)));
    if (!subject) return { items: [], page: 1, pageSize, total: 0, pages: 1 };
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_subject_requested", (q) => q.eq("subjectId", subject._id))
      .order("desc")
      .take(200);
    const visible = reports.filter((item) => item.status !== "deleted");
    const total = visible.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(pages, Math.max(1, Math.floor(args.page)));
    const start = (page - 1) * pageSize;
    return {
      items: visible.slice(start, start + pageSize).map((item) => ({
        id: String(item._id),
        idea: item.idea,
        competitorUrls: item.competitorUrls,
        status: item.status,
        requestedAt: item.requestedAt,
        completedAt: item.completedAt ?? null,
      })),
      page,
      pageSize,
      total,
      pages,
    };
  },
});

export const getOwned = query({
  args: { subjectKey: v.string(), reportId: v.id("reports") },
  returns: v.union(
    v.null(),
    v.object({
      id: v.string(),
      idea: v.string(),
      competitorUrls: v.array(v.string()),
      status: v.string(),
      requestedAt: v.number(),
      completedAt: v.union(v.number(), v.null()),
      report: v.any(),
    }),
  ),
  handler: async (ctx, args) => {
    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_subject_key", (q) => q.eq("subjectKey", args.subjectKey))
      .unique();
    const report = await ctx.db.get("reports", args.reportId);
    if (!subject || !report || !ownsResource(String(report.subjectId), String(subject._id))) return null;
    if (report.status === "deleted") return null;
    return {
      id: String(report._id),
      idea: report.idea,
      competitorUrls: report.competitorUrls,
      status: report.status,
      requestedAt: report.requestedAt,
      completedAt: report.completedAt ?? null,
      report: report.report ?? null,
    };
  },
});

export const removeOwned = mutation({
  args: { subjectKey: v.string(), reportId: v.id("reports"), now: v.number() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_subject_key", (q) => q.eq("subjectKey", args.subjectKey))
      .unique();
    const report = await ctx.db.get("reports", args.reportId);
    if (!subject || !report || !ownsResource(String(report.subjectId), String(subject._id))) return false;
    if (report.status === "running") return false;
    if (report.status !== "deleted") {
      await ctx.db.patch(report._id, { status: "deleted", report: null, deletedAt: args.now });
    }
    return true;
  },
});

export const usage = query({
  args: { subjectKey: v.string(), limit: v.number() },
  returns: v.object({
    balance: v.number(),
    entries: v.array(v.object({ kind: v.string(), creditsDelta: v.number(), createdAt: v.number() })),
  }),
  handler: async (ctx, args) => {
    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_subject_key", (q) => q.eq("subjectKey", args.subjectKey))
      .unique();
    if (!subject) return { balance: 0, entries: [] };
    const entries = await ctx.db
      .query("usageLedger")
      .withIndex("by_subject_at", (q) => q.eq("subjectId", subject._id))
      .order("desc")
      .take(Math.min(50, Math.max(1, Math.floor(args.limit))));
    return {
      balance: subject.creditBalance,
      entries: entries.map((entry) => ({
        kind: entry.kind,
        creditsDelta: entry.creditsDelta,
        createdAt: entry.createdAt,
      })),
    };
  },
});
