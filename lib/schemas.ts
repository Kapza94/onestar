import { z } from "zod";

export const confidenceSchema = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof confidenceSchema>;

export const analyzeInputSchema = z.object({
  idea: z
    .string()
    .trim()
    .min(12, "Describe the idea in at least a sentence.")
    .max(2000, "Keep the idea under 2,000 characters."),
  competitorUrls: z
    .array(z.string().url("Each competitor must be a valid URL."))
    .max(3, "Provide at most three competitor URLs.")
    .default([]),
});
export type AnalyzeInput = z.infer<typeof analyzeInputSchema>;

export const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().min(1),
  domain: z.string().min(1),
  publishedAt: z.string().nullable(),
  findings: z.string().min(1),
});
export type Source = z.infer<typeof sourceSchema>;

export const evidenceItemSchema = z.object({
  id: z.string().min(1),
  excerpt: z.string().min(1).max(320),
  competitor: z.string().min(1),
  platform: z.string().min(1),
  rating: z.number().min(0).max(5).nullable(),
  publishedAt: z.string().nullable(),
  sourceId: z.string().min(1),
  category: z.string().min(1),
});
export type EvidenceItem = z.infer<typeof evidenceItemSchema>;

export const competitorSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  description: z.string().min(1),
  targetAudience: z.string().min(1),
  pricing: z.string().nullable(),
  feedbackCount: z.number().int().min(0),
  mostCommonComplaint: z.string().min(1),
  confidence: confidenceSchema,
  sourceIds: z.array(z.string()).min(1),
});
export type Competitor = z.infer<typeof competitorSchema>;

export const themeSchema = z.object({
  id: z.string().min(1),
  theme: z.string().min(1),
  evidenceCount: z.number().int().min(0),
  severity: z.enum(["critical", "high", "medium", "low"]),
  competitorsAffected: z.array(z.string()).min(1),
  explanation: z.string().min(1),
  representativeSourceId: z.string().min(1),
});
export type ComplaintTheme = z.infer<typeof themeSchema>;

export const opportunitySchema = z.object({
  id: z.string().min(1),
  customerPain: z.string().min(1),
  competitorWeakness: z.string().min(1),
  recommendedSolution: z.string().min(1),
  targetSegment: z.string().min(1),
  evidenceSourceIds: z.array(z.string()).min(1),
  confidence: confidenceSchema,
});
export type Opportunity = z.infer<typeof opportunitySchema>;

export const buildThisNotThatSchema = z.object({
  build: z.string().min(1),
  notThat: z.string().min(1),
  because: z.string().min(1),
  sourceIds: z.array(z.string()).min(1),
});
export type BuildThisNotThat = z.infer<typeof buildThisNotThatSchema>;

export const validationDaySchema = z.object({
  day: z.number().int().min(1).max(7),
  action: z.string().min(1),
  successSignal: z.string().min(1),
});

export const blueprintSchema = z.object({
  underservedNiche: z.string().min(1),
  positioning: z.string().min(1),
  coreDifferentiator: z.string().min(1),
  featuresToBuildFirst: z.array(z.string().min(1)).min(1).max(5),
  featuresToAvoid: z.array(z.string().min(1)).min(1).max(5),
  smallestViableMvp: z.string().min(1),
  pricingHypothesis: z.string().min(1),
  distributionWedge: z.string().min(1),
  criticalAssumptions: z.array(z.string().min(1)).min(1).max(5),
  validationPlan: z.array(validationDaySchema).min(3).max(7),
  rewrittenPitch: z.string().min(1),
  landingHeadline: z.string().min(1),
  primaryCta: z.string().min(1),
});
export type Blueprint = z.infer<typeof blueprintSchema>;

export const marketSnapshotSchema = z.object({
  interpretedIdea: z.string().min(1),
  targetCustomer: z.string().min(1),
  productCategory: z.string().min(1),
  competitorCount: z.number().int().min(0),
  sourcesAnalyzed: z.number().int().min(0),
  negativeFeedbackCount: z.number().int().min(0),
  opportunityVerdict: z.string().min(1),
});
export type MarketSnapshot = z.infer<typeof marketSnapshotSchema>;

export const reportSchema = z.object({
  idea: z.string().min(1),
  generatedAt: z.string().min(1),
  mode: z.enum(["live", "demo"]),
  market: marketSnapshotSchema,
  competitors: z.array(competitorSchema).max(8),
  wallOfRage: z.array(evidenceItemSchema).max(16),
  themes: z.array(themeSchema).max(12),
  opportunities: z.array(opportunitySchema).max(8),
  buildThisNotThat: z.array(buildThisNotThatSchema).max(6),
  blueprint: blueprintSchema,
  sources: z.array(sourceSchema).max(24),
  caveats: z.array(z.string()).min(1),
  warnings: z.array(z.string()).default([]),
});
export type Report = z.infer<typeof reportSchema>;

export const analyzeSuccessSchema = z.object({
  ok: z.literal(true),
  report: reportSchema,
});
export type AnalyzeSuccess = z.infer<typeof analyzeSuccessSchema>;

export const analyzeErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.enum([
      "invalid_input",
      "missing_keys",
      "exa_failed",
      "no_competitors",
      "no_feedback",
      "rate_limited",
      "research_busy",
      "research_paused",
      "ai_timeout",
      "invalid_ai_json",
      "unknown",
    ]),
    message: z.string(),
    retryable: z.boolean(),
  }),
});
export type AnalyzeError = z.infer<typeof analyzeErrorSchema>;

export const analyzeResponseSchema = z.discriminatedUnion("ok", [
  analyzeSuccessSchema,
  analyzeErrorSchema,
]);
export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;

export const statusSchema = z.object({
  demoMode: z.boolean(),
  aiProvider: z.enum(["xai", "gemini", "openai"]),
  aiModel: z.string(),
  exaConfigured: z.boolean(),
  firecrawlConfigured: z.boolean(),
  aiConfigured: z.boolean(),
});
export type AppStatus = z.infer<typeof statusSchema>;
