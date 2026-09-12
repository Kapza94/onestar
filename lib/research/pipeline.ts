import { generateReportJson } from "../ai/provider";
import { buildUserPrompt, SYSTEM_PROMPT } from "../ai/prompt";
import { getEnv, isAiConfigured, isResearchConfigured } from "../env";
import { AnalyzeFailure } from "../errors";
import { namesMatch, sanitizeReportCopy } from "../copy";
import { labeledExampleReport } from "../example-report";
import { reportSchema, type AnalyzeInput, type Report } from "../schemas";
import { exaContents, exaSearch, mapLimit, type ExaResult } from "./exa";
import { firecrawlScrape } from "./firecrawl";
import {
  buildProductIdentity,
  canonicalEvidenceUrl,
  claimExistsInSource,
  evidenceSourceType,
  excerptExistsInSource,
  identitiesMatch,
  productRelationshipToIdea,
  ratingExistsInSource,
  sourceMatchesProduct,
} from "./evidence";
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

const COMPLAINT_SEARCH_WAVES = [
  {
    type: "reddit",
    query: (name: string) =>
      `site:reddit.com "${name}" (problem OR disappointed OR "stopped using" OR cancellation)`,
  },
  {
    type: "forum",
    query: (name: string) =>
      `"${name}" (forum OR community OR discussion) (problem OR frustrating OR alternative)`,
  },
  {
    type: "community",
    query: (name: string) =>
      `(site:news.ycombinator.com OR site:github.com) "${name}" (issue OR problem OR alternative)`,
  },
  {
    type: "web",
    query: (name: string) =>
      `"${name}" (review OR complaints) ("customer support" OR "does not work" OR "waste of money")`,
  },
];

const MAX_COMPLAINT_RESULTS = 32;
const MAX_RESULTS_PER_COMPETITOR = 8;
const DIVERSE_RESULT_TARGET = 5;
const DIVERSE_SOURCE_TARGET = 3;

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
  try {
    const path = new URL(result.url).pathname.replace(/\/+$/, "") || "/";
    return sourceQuality(result.url) >= 1 && (path === "/" || path === "/home");
  } catch {
    return false;
  }
}

function productNameFromResult(result: ExaResult) {
  const domainLabel = hostnameOf(result.url).split(".")[0]?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "";
  const genericTitles = new Set(["home", "homepage", "official site", "welcome"]);
  const titleParts = result.title
    .split(/\s+[|—–:]\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2 && part.length <= 48 && part.split(/\s+/).length <= 5)
    .filter((part) => !genericTitles.has(part.toLowerCase()))
    .sort((a, b) => {
      const aCompact = a.replace(/[^a-z0-9]/gi, "").toLowerCase();
      const bCompact = b.replace(/[^a-z0-9]/gi, "").toLowerCase();
      const aDomainMatch = aCompact === domainLabel || aCompact.includes(domainLabel) ? 1 : 0;
      const bDomainMatch = bCompact === domainLabel || bCompact.includes(domainLabel) ? 1 : 0;
      return bDomainMatch - aDomainMatch ||
        a.split(/\s+/).length - b.split(/\s+/).length ||
        a.length - b.length;
    });
  if (titleParts[0]) {
    return titleParts[0];
  }
  return displayNameFromUrl(result.url);
}

function productNameFromUrl(value: string) {
  const host = hostnameOf(value);
  const [label, suffix] = host.split(".");
  if (label && suffix && ["ai", "app", "co", "io", "me"].includes(suffix)) {
    return `${label}.${suffix}`;
  }
  return displayNameFromUrl(value);
}

function homepageUrl(value: string) {
  const url = new URL(value);
  return `${url.protocol}//${url.host}/`;
}

function isOfficialHomepage(url: string) {
  const host = hostnameOf(url);
  if (
    ["reddit.com", "producthunt.com", "github.com", "youtube.com", "wikipedia.org"].some(
      (item) => host === item || host.endsWith(`.${item}`),
    )
  ) {
    return false;
  }
  return Boolean(asHttpUrl(url)) && sourceQuality(url) >= 1 && !isBrittleHost(url);
}

function resolveCompetitorHint(name: string, url: string | null, hints: CompetitorHint[]) {
  const byName = hints.filter((hint) =>
    identitiesMatch({ name, url: "" }, { name: hint.name, url: "" }),
  );
  const modelHost = url ? hostnameOf(url) : "";
  const byUrl = modelHost
    ? hints.filter((hint) => hostnameOf(hint.url) === modelHost)
    : [];

  if (byName.length === 1 && byUrl.length === 1 && byName[0] !== byUrl[0]) return null;
  if (byName.length === 1) return byName[0];
  if (byName.length === 0 && byUrl.length === 1) return byUrl[0];
  return null;
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
    `${clip(idea, 120)} direct competitors alternatives`,
    `${clip(idea, 120)} products for the same customer problem`,
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
      name: page
        ? productNameFromResult({
            title: page.title,
            url: page.url,
            text: page.text,
            highlights: [],
            publishedDate: page.publishedAt,
            author: null,
          })
        : productNameFromUrl(url),
      url: homepageUrl(url),
    };
  });

  const directResults = companyResults.filter(
    (result) => productRelationshipToIdea(result, idea) === "direct",
  );
  const adjacentResults = companyResults.filter(
    (result) => productRelationshipToIdea(result, idea) === "adjacent",
  );

  const fromSearch: CompetitorHint[] = directResults.map((result) => ({
    name: productNameFromResult(result),
    url: homepageUrl(result.url),
  }));

  if (adjacentResults.length > 0) {
    warnings.push(
      `Excluded ${adjacentResults.length} adjacent or weakly matched product${adjacentResults.length === 1 ? "" : "s"} from direct-competitor complaint search.`,
    );
  }

  const hints = uniqueBy([...fromSeeds, ...fromSearch], (item) => hostnameOf(item.url)).slice(0, 5);

  const verifiedSeedPages = seedPages.map((page) => {
    const hint = hints.find((item) => hostnameOf(item.url) === hostnameOf(page.url));
    return hint ? { ...page, competitorHint: hint.name } : page;
  });

  return { hints, warnings, seedPages: verifiedSeedPages };
}

async function collectComplaints(
  apiKey: string,
  hints: CompetitorHint[],
): Promise<{ results: Array<ExaResult & { competitorHint: string }>; warnings: string[] }> {
  const warnings: string[] = [];
  const collected: Array<ExaResult & { competitorHint: string }> = [];
  const seenUrls = new Set<string>();
  const seenDocuments = new Set<string>();
  const resultCount = new Map<string, number>();
  const sourceTypes = new Map<string, Set<string>>();

  const hasEnough = (hint: CompetitorHint) => {
    const count = resultCount.get(hint.name) || 0;
    const diversity = sourceTypes.get(hint.name)?.size || 0;
    return count >= MAX_RESULTS_PER_COMPETITOR ||
      (count >= DIVERSE_RESULT_TARGET && diversity >= DIVERSE_SOURCE_TARGET);
  };

  for (const wave of COMPLAINT_SEARCH_WAVES) {
    if (collected.length >= MAX_COMPLAINT_RESULTS) break;
    const activeHints = hints.filter((hint) => !hasEnough(hint));
    if (activeHints.length === 0) break;

    const batches = await mapLimit(activeHints, 4, async (hint) => {
      const query = wave.query(hint.name);
      try {
        const results = await exaSearch(apiKey, query, {
          numResults: 6,
          type: "fast",
          maxCharacters: 1800,
          highlightQuery: `${hint.name} complaints problems negative disappointed cancellation`,
          excludeDomains: ["g2.com", "capterra.com", "trustpilot.com"],
        });
        const identity = buildProductIdentity(hint.name, hint.url);
        return results
          .filter((result) => sourceMatchesProduct(result, identity))
          .map((result) => ({ ...result, competitorHint: hint.name }));
      } catch {
        warnings.push(`Search failed for “${query}”.`);
        return [];
      }
    });

    for (const result of batches.flat()) {
      if (collected.length >= MAX_COMPLAINT_RESULTS) break;
      const count = resultCount.get(result.competitorHint) || 0;
      if (count >= MAX_RESULTS_PER_COMPETITOR) continue;

      const canonicalUrl = canonicalEvidenceUrl(result.url);
      const documentKey = `${result.competitorHint}:${clip(`${result.title} ${result.text}`, 240).toLowerCase()}`;
      if (seenUrls.has(canonicalUrl) || seenDocuments.has(documentKey)) continue;

      const type = evidenceSourceType(result.url) || wave.type;
      const hostCount = collected.filter(
        (item) =>
          item.competitorHint === result.competitorHint &&
          hostnameOf(item.url) === hostnameOf(result.url),
      ).length;
      if (hostCount >= 3) continue;

      seenUrls.add(canonicalUrl);
      seenDocuments.add(documentKey);
      collected.push(result);
      resultCount.set(result.competitorHint, count + 1);
      const types = sourceTypes.get(result.competitorHint) || new Set<string>();
      types.add(type);
      sourceTypes.set(result.competitorHint, types);
    }
  }

  const missing = hints.filter((hint) => (resultCount.get(hint.name) || 0) === 0);
  if (missing.length > 0) {
    warnings.push(
      `No identity-verified complaint pages found for: ${missing.map((hint) => hint.name).join(", ")}.`,
    );
  }

  return { results: collected, warnings };
}

function selectDiversePages(pages: EvidencePage[], limit: number) {
  const selected = pages.filter((page) => page.via === "seed").slice(0, limit);
  const selectedUrls = new Set(selected.map((page) => canonicalEvidenceUrl(page.url)));
  const buckets = new Map<string, EvidencePage[]>();

  for (const page of pages
    .filter((item) => item.via !== "seed")
    .sort((a, b) => sourceQuality(b.url) - sourceQuality(a.url) || b.text.length - a.text.length)) {
    const key = `${page.competitorHint || "unknown"}:${evidenceSourceType(page.url)}`;
    const bucket = buckets.get(key) || [];
    bucket.push(page);
    buckets.set(key, bucket);
  }

  while (selected.length < limit) {
    let added = false;
    for (const bucket of buckets.values()) {
      const page = bucket.shift();
      if (!page) continue;
      const url = canonicalEvidenceUrl(page.url);
      if (selectedUrls.has(url)) continue;
      selected.push(page);
      selectedUrls.add(url);
      added = true;
      if (selected.length >= limit) break;
    }
    if (!added) break;
  }

  return selected;
}

async function enrichWithFirecrawl(
  apiKey: string | undefined,
  pages: EvidencePage[],
  hints: CompetitorHint[],
): Promise<{ pages: EvidencePage[]; warnings: string[] }> {
  const warnings: string[] = [];
  if (!apiKey) {
    warnings.push("Firecrawl is not configured. Continuing with Exa text only.");
    return { pages, warnings };
  }

  const thin = pages
    .filter((page) => page.text.length < 1200 && !isBrittleHost(page.url) && sourceQuality(page.url) > 0)
    .slice(0, 12);

  if (thin.length === 0) return { pages, warnings };

  const scraped = await mapLimit(thin, 4, (page) => firecrawlScrape(apiKey, page.url));
  const next = pages.map((page) => {
    const matchIndex = thin.findIndex((item) => item.url === page.url);
    if (matchIndex === -1) return page;
    const doc = scraped[matchIndex];
    if (!doc) {
      warnings.push(`Skipped inaccessible page: ${page.url}`);
      return page;
    }
    const hint = page.competitorHint
      ? hints.find((item) => identitiesMatch(item, { name: page.competitorHint || "", url: "" }))
      : null;
    if (
      hint &&
      !sourceMatchesProduct(
        { title: doc.title, url: doc.url, text: doc.markdown },
        buildProductIdentity(hint.name, hint.url),
      )
    ) {
      warnings.push(`Ignored scraped replacement that did not verify ${hint.name}: ${page.url}`);
      return page;
    }
    return {
      ...page,
      title: doc.title || page.title,
      text: clip(doc.markdown, 4200),
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

function coerceReport(
  raw: unknown,
  idea: string,
  pages: EvidencePage[],
  warnings: string[],
  hints: CompetitorHint[],
): Report {
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

  const collectedSources = report.sources
    .filter((source) => allowed.has(source.id))
    .map((source) => {
      const page = knownUrls.get(source.id);
      if (!page) return source;
      return {
        ...source,
        url: page.url,
        domain: page.domain,
        title: page.title,
        publishedAt: page.publishedAt,
      };
    });

  const sourceIds = new Set(collectedSources.map((source) => source.id));
  const pageById = new Map(pages.map((page) => [page.id, page]));

  const wallOfRage = report.wallOfRage
    .filter((item) => sourceIds.has(item.sourceId))
    .map((item) => {
      const page = pageById.get(item.sourceId);
      if (!page || !excerptExistsInSource(item.excerpt, page.text)) return null;

      const claimedHint = resolveCompetitorHint(item.competitor, null, hints);
      const pageHint = page.competitorHint
        ? resolveCompetitorHint(page.competitorHint, null, hints)
        : null;
      if (!claimedHint || (pageHint && pageHint !== claimedHint)) return null;
      if (!sourceMatchesProduct(page, buildProductIdentity(claimedHint.name, claimedHint.url))) {
        return null;
      }
      return {
        ...item,
        competitor: claimedHint.name,
        platform: page.domain,
        publishedAt: page.publishedAt,
        rating:
          item.rating !== null && ratingExistsInSource(item.rating, page.text)
            ? item.rating
            : null,
      };
    })
    .filter((item): item is Report["wallOfRage"][number] => Boolean(item));

  if (wallOfRage.length === 0) {
    throw new AnalyzeFailure(
      "no_feedback",
      "Sources were collected, but no complaint excerpt could be verified against the retrieved text.",
      { retryable: true, status: 422 },
    );
  }

  const discardedExcerpts = report.wallOfRage.length - wallOfRage.length;
  const verifiedWarnings = [...warnings];
  if (discardedExcerpts > 0) {
    verifiedWarnings.push(
      `Discarded ${discardedExcerpts} complaint excerpt${discardedExcerpts === 1 ? "" : "s"} that failed source or product verification.`,
    );
  }

  const competitors = report.competitors
    .map((competitor) => {
      const hint = resolveCompetitorHint(competitor.name, competitor.url, hints);
      if (!hint || !isOfficialHomepage(hint.url)) return null;
      const complaintItems = wallOfRage.filter((item) => namesMatch(item.competitor, hint.name));
      const complaintIds = complaintItems.map((item) => item.sourceId);
      const identitySourceIds = competitor.sourceIds.filter((id) => {
        if (!sourceIds.has(id)) return false;
        const page = pageById.get(id);
        if (!page) return false;
        if (hostnameOf(page.url) === hostnameOf(hint.url)) return true;
        const pageHint = page.competitorHint
          ? resolveCompetitorHint(page.competitorHint, null, hints)
          : null;
        return pageHint === hint;
      });
      const ids = uniqueBy(
        [...identitySourceIds, ...complaintIds],
        (id) => id,
      );
      const categoryCounts = new Map<string, number>();
      for (const item of complaintItems) {
        categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
      }
      const mostCommonCategory = [...categoryCounts.entries()]
        .sort((a, b) => b[1] - a[1])[0];
      const pricingSupported = competitor.pricing
        ? ids.some((id) => claimExistsInSource(competitor.pricing || "", pageById.get(id)?.text || ""))
        : false;
      return {
        ...competitor,
        name: hint.name,
        url: hint.url,
        sourceIds: ids,
        pricing: pricingSupported ? competitor.pricing : null,
        feedbackCount: complaintItems.length,
        mostCommonComplaint: mostCommonCategory
          ? `${mostCommonCategory[0]} (${mostCommonCategory[1]} verified excerpt${mostCommonCategory[1] === 1 ? "" : "s"} in this sample).`
          : "Unknown.",
      };
    })
    .filter((competitor): competitor is Report["competitors"][number] =>
      Boolean(competitor && competitor.feedbackCount > 0),
    );

  if (competitors.length === 0) {
    throw new AnalyzeFailure(
      "no_feedback",
      "Complaint excerpts were found, but none belonged to a verified direct competitor.",
      { retryable: true, status: 422 },
    );
  }

  const competitorNames = new Set(competitors.map((competitor) => competitor.name));
  const verifiedWall = wallOfRage.filter((item) => competitorNames.has(item.competitor));
  const complaintSourceIds = new Set(verifiedWall.map((item) => item.sourceId));
  const sources = collectedSources.map((source) => {
    const excerpts = verifiedWall.filter((item) => item.sourceId === source.id);
    const page = pageById.get(source.id);
    const identityHint = page?.competitorHint
      ? resolveCompetitorHint(page.competitorHint, null, hints)
      : null;
    return {
      ...source,
      findings: excerpts.length > 0
        ? `Retrieved text contains ${excerpts.length} verified complaint excerpt${excerpts.length === 1 ? "" : "s"} attributed to ${uniqueBy(excerpts, (item) => item.competitor).map((item) => item.competitor).join(", ")}.`
        : identityHint && hostnameOf(page?.url || "") === hostnameOf(identityHint.url)
          ? `Official product page used to verify ${identityHint.name} identity and domain.`
          : "Retrieved as supporting context; no complaint excerpt from this page appears in the report.",
    };
  });

  const themes = report.themes
    .filter((theme) => complaintSourceIds.has(theme.representativeSourceId))
    .map((theme) => {
      const matching = verifiedWall.filter((item) => namesMatch(item.category, theme.theme));
      const evidence = matching.length > 0
        ? matching
        : verifiedWall.filter((item) => item.sourceId === theme.representativeSourceId);
      return {
        ...theme,
        evidenceCount: evidence.length,
        competitorsAffected: uniqueBy(evidence, (item) => item.competitor).map(
          (item) => item.competitor,
        ),
      };
    })
    .filter((theme) => theme.evidenceCount > 0 && theme.competitorsAffected.length > 0);

  return sanitizeReportCopy({
    ...report,
    sources,
    wallOfRage: verifiedWall,
    competitors,
    themes,
    opportunities: report.opportunities.map((item) => ({
      ...item,
      evidenceSourceIds: item.evidenceSourceIds.filter((id) => complaintSourceIds.has(id)),
    })).filter((item) => item.evidenceSourceIds.length > 0),
    buildThisNotThat: report.buildThisNotThat.map((item) => ({
      ...item,
      sourceIds: item.sourceIds.filter((id) => complaintSourceIds.has(id)),
    })).filter((item) => item.sourceIds.length > 0),
    market: {
      ...report.market,
      competitorCount: competitors.length,
      sourcesAnalyzed: pages.length,
      negativeFeedbackCount: verifiedWall.length,
    },
    warnings: uniqueBy(verifiedWarnings, (item) => item),
  });
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
    complaintPack = await collectComplaints(env.exaApiKey, discovery.hints);
    warnings.push(...complaintPack.warnings);
  } catch (error) {
    throw new AnalyzeFailure(
      "exa_failed",
      error instanceof Error ? error.message : "Exa complaint search failed.",
      { retryable: true, status: 502 },
    );
  }

  const merged = selectDiversePages(uniqueBy(
    [
      ...discovery.seedPages,
      ...complaintPack.results.map((result, index) =>
        toPage(result, index + discovery.seedPages.length, result.competitorHint, "exa"),
      ),
    ],
    (item) => canonicalEvidenceUrl(item.url),
  ), 24)
    .map((page, index) => ({ ...page, id: `s${index + 1}` }));

  const enriched = await enrichWithFirecrawl(env.firecrawlApiKey, merged, discovery.hints);
  warnings.push(...enriched.warnings);

  const usable = enriched.pages.filter((page) => page.text.length > 40);
  if (usable.length === 0) {
    throw new AnalyzeFailure(
      "no_feedback",
      "Public sources were found, but none yielded usable complaint text. Try a more specific idea or a competitor URL.",
      { retryable: true, status: 422 },
    );
  }

  const complaintPages = usable.filter((page) => page.via !== "seed" && page.competitorHint);
  if (complaintPages.length === 0) {
    throw new AnalyzeFailure(
      "no_feedback",
      "No identity-verified complaint pages yielded usable text. Try a more specific idea or competitor URL.",
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
    return coerceReport(raw, input.idea, usable, uniqueBy(warnings, (item) => item), discovery.hints);
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
    return coerceReport(raw, input.idea, usable, uniqueBy(warnings, (item) => item), discovery.hints);
  }
}
