import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  subjects: defineTable({
    subjectKey: v.string(),
    kind: v.union(v.literal("anonymous"), v.literal("account")),
    accountId: v.optional(v.id("accounts")),
    creditBalance: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_subject_key", ["subjectKey"]),

  accounts: defineTable({
    authProvider: v.string(),
    externalSubject: v.string(),
    createdAt: v.number(),
  }).index("by_provider_subject", ["authProvider", "externalSubject"]),

  reports: defineTable({
    subjectId: v.id("subjects"),
    requestId: v.string(),
    inputHash: v.string(),
    idea: v.string(),
    competitorUrls: v.array(v.string()),
    status: v.union(
      v.literal("running"),
      v.literal("complete"),
      v.literal("failed"),
      v.literal("deleted"),
    ),
    report: v.optional(v.any()),
    failureCode: v.optional(v.string()),
    traceId: v.string(),
    chargedCredits: v.number(),
    requestedAt: v.number(),
    completedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_subject_requested", ["subjectId", "requestedAt"])
    .index("by_subject_request", ["subjectId", "requestId"])
    .index("by_subject_status_requested", ["subjectId", "status", "requestedAt"]),

  analysisRequests: defineTable({
    subjectId: v.id("subjects"),
    requestId: v.string(),
    inputHash: v.string(),
    reportId: v.id("reports"),
    status: v.union(v.literal("running"), v.literal("complete"), v.literal("failed")),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    errorRetryable: v.optional(v.boolean()),
    errorStatus: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_subject_request", ["subjectId", "requestId"]),

  usageLedger: defineTable({
    subjectId: v.id("subjects"),
    reportId: v.optional(v.id("reports")),
    kind: v.union(
      v.literal("grant"),
      v.literal("reserve"),
      v.literal("consume"),
      v.literal("release"),
      v.literal("adjustment"),
    ),
    creditsDelta: v.number(),
    idempotencyKey: v.string(),
    createdAt: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_subject_at", ["subjectId", "createdAt"])
    .index("by_idempotency_key", ["idempotencyKey"]),

  searches: defineTable({
    subjectId: v.optional(v.id("subjects")),
    reportId: v.optional(v.id("reports")),
    idea: v.string(),
    normalizedIdea: v.string(),
    createdAt: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_report", ["reportId"]),

  presence: defineTable({
    visitorHash: v.string(),
    country: v.union(v.string(), v.null()),
    city: v.union(v.string(), v.null()),
    lat: v.union(v.number(), v.null()),
    lng: v.union(v.number(), v.null()),
    action: v.union(v.literal("visit"), v.literal("search")),
    idea: v.union(v.string(), v.null()),
    createdAt: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_visitor_at", ["visitorHash", "createdAt"]),
});
