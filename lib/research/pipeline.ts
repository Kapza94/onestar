import { generateReportJson } from "../ai/provider";
import { buildUserPrompt, SYSTEM_PROMPT } from "../ai/prompt";
import { getEnv, isAiConfigured, isResearchConfigured } from "../env";
import { AnalyzeFailure } from "../errors";
import { labeledExampleReport } from "../example-report";
import { reportSchema, type AnalyzeInput, type Report } from "../schemas";
import { exaContents, exaSearch, mapLimit, type ExaResult } from "./exa";
import { firecrawlScrape } from "./firecrawl";
import {
  clip,
  displayNameFromUrl,
  hostnameOf,
  isBrittleHost,
  sourceQuality,
  uniqueBy,
} from "./util";

export type EvidencePage = {
  id: string;
  title: string;
  url: string;
  domain: string;
  publishedAt: string | null;
  text: string;
  competitorHint: string | null;
  via: "exa" | "firecrawl" | "seed";
};

type CompetitorHint = {
  name: string;
  url: string;
};

const COMPLAINT_PATTERNS = [
  (name: string) => `${name} reviews complaints`,
  (name: string) => `${name} problems disappointed`,
  (name: string) => `site:reddit.com ${name} problems`,
];

function asHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function toPage(result: ExaResult, index: number, competitorHint: string | null, via: EvidencePage["via"]): EvidencePage {
  const text = clip([result.text, ...result.highlights].filter(Boolean).join("\n"), 2800);
  return {
    id: `s${index + 1}`,
    title: result.title,
    url: result.url,
    domain: hostnameOf(result.url),
    publishedAt: result.publishedDate,
    text,
    competitorHint,
    via,
  };
}

function looksLikeCompanyPage(result: ExaResult) {
  const host = hostnameOf(result.url);
  if (["reddit.com", "producthunt.com", "github.com", "youtube.com", "wikipedia.org"].some((item) => host.endsWith(item))) {
    return false;
  }
  return sourceQuality(result.url) >= 1;
}

async function discoverCompetitors(
  apiKey: string,
  idea: string,
  seedUrls: string[],
): Promise<{ hints: CompetitorHint[]; warnings: string[]; seedPages: EvidencePage[] }> {
  const warnings: string[] = [];
  const seedPages: EvidencePage[] = [];

  const seeded = seedUrls
    .map(asHttpUrl)
    .filter((item): item is string => Boolean(item));

  if (seeded.length) {
    try {
      const contents = await exaContents(apiKey, seeded, 1600);
      contents.forEach((result, index) => {
        seedPages.push(toPage(result, index, displayNameFromUrl(result.url), "seed"));
      });
    } catch {
      warnings.push("Could not fetch the competitor URLs you provided. Continuing with search.");
    }
  }

  const discoveryQueries = [
    `${idea} alternatives competitors apps`,
    `best alternatives to ${clip(idea, 80)}`,
  ];

  const discovery: ExaResult[] = [];
  const discovered = await mapLimit(discoveryQueries, 2, async (query) => {
    try {
      return await exaSearch(apiKey, query, {
        numResults: 6,
        type: "auto",
        maxCharacters: 900,
        highlightQuery: "product customers pricing audience",
      });
    } catch (error) {
      warnings.push(
        error instanceof Error
          ? `Competitor search failed: ${error.message}`
          : "Competitor search failed.",
      );
      return [] as ExaResult[];
    }
  });
  discovery.push(...discovered.flat());

  const companyResults = uniqueBy(
    discovery.filter(looksLikeCompanyPage),
    (item) => hostnameOf(item.url),
  );

  const fromSeeds: CompetitorHint[] = (seeded.length ? seeded : []).map((url) => {
    const page = seedPages.find((item) => hostnameOf(item.url) === hostnameOf(url));
    return {
      name: page ? displayNameFromUrl(page.url) : displayNameFromUrl(url),
      url,
    };
  });

  const fromSearch: CompetitorHint[] = companyResults.map((result) => ({
    name: displayNameFromUrl(result.url),
    url: result.url,
  }));

  const hints = uniqueBy([...fromSeeds, ...fromSearch], (item) => hostnameOf(item.url)).slice(0, 5);

  return { hints, warnings, seedPages };
}

async function collectComplaints(
  apiKey: string,
  hints: CompetitorHint[],
  idea: string,
): Promise<{ results: Array<ExaResult & { competitorHint: string }>; warnings: string[] }> {
  const warnings: string[] = [];
  const jobs: Array<{ query: string; competitorHint: string; includeDomains?: string[] }> = [];

  for (const hint of hints) {
    for (const pattern of COMPLAINT_PATTERNS) {
      jobs.push({ query: pattern(hint.name), competitorHint: hint.name });
    }
  }

  jobs.push({
    query: `${clip(idea, 70)} complaints problems "stopped using" OR disappointed OR "does not work"`,
    competitorHint: "unknown",
  });

  const batches = await mapLimit(jobs.slice(0, 16), 4, async (job) => {
    try {
      const results = await exaSearch(apiKey, job.query, {
        numResults: 4,
        type: "fast",
        maxCharacters: 1600,
        highlightQuery: `${job.competitorHint} complaints problems negative disappointed cancellation`,
        excludeDomains: ["g2.com", "capterra.com", "trustpilot.com"],
      });
      return results.map((result) => ({ ...result, competitorHint: job.competitorHint }));
    } catch {
      warnings.push(`Search failed for “${job.query}”.`);
      return [];
    }
  });

  return { results: batches.flat(), warnings };
}

async function enrichWithFirecrawl(
  apiKey: string | undefined,
  pages: EvidencePage[],
): Promise<{ pages: EvidencePage[]; warnings: string[] }> {
  const warnings: string[] = [];
  if (!apiKey) {
    warnings.push("Firecrawl is not configured. Continuing with Exa text only.");
    return { pages, warnings };
  }

  const thin = pages
    .filter((page) => page.text.length < 500 && !isBrittleHost(page.url) && sourceQuality(page.url) > 0)
    .slice(0, 4);

  if (thin.length === 0) return { pages, warnings };

  const scraped = await mapLimit(thin, 2, (page) => firecrawlScrape(apiKey, page.url));
  const next = pages.map((page) => {
    const matchIndex = thin.findIndex((item) => item.url === page.url);
    if (matchIndex === -1) return page;
    const doc = scraped[matchIndex];
    if (!doc) {
      warnings.push(`Skipped inaccessible page: ${page.url}`);
      return page;
    }
    return {
      ...page,
      title: doc.title || page.title,
      text: clip(doc.markdown, 2800),
      publishedAt: page.publishedAt || doc.publishedAt,
      via: "firecrawl" as const,
    };
  });

  return { pages: next, warnings };
}

function packEvidence(pages: EvidencePage[]) {
  return pages
    .map((page) => {
      return [
        `[SRC:${page.id}]`,
        `title=${page.title}`,
        `url=${page.url}`,
        `domain=${page.domain}`,
        `date=${page.publishedAt || "unknown"}`,
        `competitor_hint=${page.competitorHint || "unknown"}`,
        `text=`,
        page.text || "(no extractable text)",
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

function coerceReport(raw: unknown, idea: string, pages: EvidencePage[], warnings: string[]): Report {
  const parsed = reportSchema.safeParse({
    ...(typeof raw === "object" && raw !== null ? raw : {}),
    idea,
    generatedAt: new Date().toISOString(),
    mode: "live",
    warnings,
    caveats:
      typeof raw === "object" &&
      raw !== null &&
      "caveats" in raw &&
      Array.isArray((raw as { caveats?: unknown }).caveats)
        ? (raw as { caveats: unknown[] }).caveats
        : [
            "Counts refer to this collected sample, not the entire market.",
            "Unavailable facts are marked unknown.",
          ],
  });

  if (!parsed.success) {
    throw new AnalyzeFailure(
      "invalid_ai_json",
      `The model JSON failed validation: ${parsed.error.issues
        .slice(0, 4)
        .map((issue) => issue.path.join(".") + " " + issue.message)
        .join("; ")}`,
      { retryable: true, status: 502 },
    );
  }

  const report = parsed.data;
  const allowed = new Set(pages.map((page) => page.id));
  const knownUrls = new Map(pages.map((page) => [page.id, page]));

  const sources = report.sources
    .filter((source) => allowed.has(source.id))
    .map((source) => {
      const page = knownUrls.get(source.id);
      if (!page) return source;
      return {
        ...source,
        url: page.url,
        domain: page.domain,
        title: source.title || page.title,
        publishedAt: source.publishedAt || page.publishedAt,
      };
    });

  const sourceIds = new Set(sources.map((source) => source.id));

  return {
    ...report,
    sources,
    wallOfRage: report.wallOfRage.filter((item) => sourceIds.has(item.sourceId)),
    competitors: report.competitors.map((competitor) => ({
      ...competitor,
      sourceIds: competitor.sourceIds.filter((id) => sourceIds.has(id)),
    })).filter((competitor) => competitor.sourceIds.length > 0 || competitor.url.startsWith("http")),
    themes: report.themes.filter((theme) => sourceIds.has(theme.representativeSourceId)),
    opportunities: report.opportunities.map((item) => ({
      ...item,
      evidenceSourceIds: item.evidenceSourceIds.filter((id) => sourceIds.has(id)),
    })).filter((item) => item.evidenceSourceIds.length > 0),
    buildThisNotThat: report.buildThisNotThat.map((item) => ({
      ...item,
      sourceIds: item.sourceIds.filter((id) => sourceIds.has(id)),
    })),
    market: {
      ...report.market,
      competitorCount: report.competitors.length,
      sourcesAnalyzed: pages.length,
      negativeFeedbackCount: report.wallOfRage.filter((item) => sourceIds.has(item.sourceId)).length,
    },
    warnings,
  };
}

export async function runAnalysis(input: AnalyzeInput): Promise<Report> {
  const env = getEnv();

  if (env.demoMode) {
    return labeledExampleReport(input.idea);
  }

  if (!isResearchConfigured()) {
    throw new AnalyzeFailure(
      "missing_keys",
      "EXA_API_KEY is missing. Add free Exa credits, or set DEMO_MODE=true.",
      { retryable: false, status: 501 },
    );
  }
  if (!isAiConfigured()) {
    const missing =
      env.aiProvider === "xai"
        ? "XAI_API_KEY is missing. Set it, switch AI_PROVIDER=openai, or enable DEMO_MODE."
        : env.aiProvider === "openai"
          ? "OPENAI_API_KEY is missing. Set it, or enable DEMO_MODE."
          : "GEMINI_API_KEY is missing. Set it, switch AI_PROVIDER=openai, or enable DEMO_MODE.";
    throw new AnalyzeFailure("missing_keys", missing, { retryable: false, status: 501 });
  }

  const warnings: string[] = [];

  let discovery;
  try {
    discovery = await discoverCompetitors(env.exaApiKey, input.idea, input.competitorUrls);
    warnings.push(...discovery.warnings);
  } catch (error) {
    throw new AnalyzeFailure(
      "exa_failed",
      error instanceof Error ? error.message : "Exa competitor search failed.",
      { retryable: true, status: 502 },
    );
  }

  if (discovery.hints.length === 0) {
    throw new AnalyzeFailure(
      "no_competitors",
      "No relevant competitors showed up in public search. Add a competitor URL and retry.",
      { retryable: true, status: 422 },
    );
  }

  let complaintPack;
  try {
    complaintPack = await collectComplaints(env.exaApiKey, discovery.hints, input.idea);
    warnings.push(...complaintPack.warnings);
  } catch (error) {
    throw new AnalyzeFailure(
      "exa_failed",
      error instanceof Error ? error.message : "Exa complaint search failed.",
      { retryable: true, status: 502 },
    );
  }

  const merged = uniqueBy(
    [
      ...discovery.seedPages,
      ...complaintPack.results.map((result, index) =>
        toPage(result, index + discovery.seedPages.length, result.competitorHint, "exa"),
      ),
    ],
    (item) => item.url,
  )
    .sort((a, b) => sourceQuality(b.url) - sourceQuality(a.url) || b.text.length - a.text.length)
    .slice(0, 15)
    .map((page, index) => ({ ...page, id: `s${index + 1}` }));

  const enriched = await enrichWithFirecrawl(env.firecrawlApiKey, merged);
  warnings.push(...enriched.warnings);

  const usable = enriched.pages.filter((page) => page.text.length > 40);
  if (usable.length === 0) {
    throw new AnalyzeFailure(
      "no_feedback",
      "Public sources were found, but none yielded usable complaint text. Try a more specific idea or a competitor URL.",
      { retryable: true, status: 422 },
    );
  }

  const evidence = packEvidence(usable);
  const competitorHints = discovery.hints.map((hint) => `${hint.name} — ${hint.url}`);
  const userPrompt = buildUserPrompt({
    idea: input.idea,
    competitorHints,
    evidence,
    sourcesAnalyzed: usable.length,
    warnings,
  });

  let jsonText = await generateReportJson(SYSTEM_PROMPT, userPrompt);
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    throw new AnalyzeFailure("invalid_ai_json", "The model returned malformed JSON.", {
      retryable: true,
      status: 502,
    });
  }

  try {
    return coerceReport(raw, input.idea, usable, uniqueBy(warnings, (item) => item));
  } catch (error) {
    if (!(error instanceof AnalyzeFailure) || error.code !== "invalid_ai_json") throw error;
    jsonText = await generateReportJson(
      SYSTEM_PROMPT,
      `${userPrompt}\n\nYour previous JSON failed validation:\n${error.message}\nReturn corrected JSON only.`,
    );
    try {
      raw = JSON.parse(jsonText);
    } catch {
      throw error;
    }
    return coerceReport(raw, input.idea, usable, uniqueBy(warnings, (item) => item));
  }
}
