export type ProductIdentity = {
  name: string;
  url: string;
  aliases: string[];
  officialHost: string;
};

type IdentitySource = {
  title: string;
  url: string;
  text: string;
  highlights?: string[];
};

const GENERIC_ALIASES = new Set([
  "app",
  "apps",
  "connect",
  "match",
  "matching",
  "network",
  "platform",
  "software",
]);

const IDEA_STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "app",
  "application",
  "build",
  "business",
  "company",
  "could",
  "customer",
  "customers",
  "find",
  "helps",
  "idea",
  "into",
  "people",
  "platform",
  "product",
  "service",
  "software",
  "their",
  "them",
  "that",
  "this",
  "users",
  "using",
  "want",
  "with",
]);

function hostname(url: string) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function words(value: string) {
  return value
    .normalize("NFKD")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compact(value: string) {
  return words(value).replace(/\s+/g, "");
}

function domainAliases(url: string) {
  const host = hostname(url);
  const label = host.split(".")[0] || "";
  const aliases = [words(label), compact(label)];
  return aliases.filter((alias) => alias.length >= 4 && !GENERIC_ALIASES.has(alias));
}

export function buildProductIdentity(name: string, url: string): ProductIdentity {
  const aliases = new Set<string>();
  const normalizedName = words(name);
  const compactName = compact(name);
  if (normalizedName.length >= 4 && !GENERIC_ALIASES.has(normalizedName)) aliases.add(normalizedName);
  if (compactName.length >= 4 && !GENERIC_ALIASES.has(compactName)) aliases.add(compactName);
  domainAliases(url).forEach((alias) => aliases.add(alias));
  return { name, url, aliases: [...aliases], officialHost: hostname(url) };
}

function containsAlias(value: string, alias: string) {
  const normalized = words(value);
  if (!normalized || !alias) return false;
  if (alias.includes(" ")) return ` ${normalized} `.includes(` ${alias} `);
  return normalized.split(" ").includes(alias);
}

export function sourceMatchesProduct(source: IdentitySource, identity: ProductIdentity) {
  const sourceHost = hostname(source.url);
  if (
    identity.officialHost &&
    (sourceHost === identity.officialHost || sourceHost.endsWith(`.${identity.officialHost}`))
  ) {
    return true;
  }

  const title = source.title || "";
  const body = [source.text, ...(source.highlights || [])].join("\n");
  return identity.aliases.some((alias) => containsAlias(title, alias) || containsAlias(body, alias));
}

export function productRelationshipToIdea(source: IdentitySource, idea: string): "direct" | "adjacent" {
  const ideaTerms = new Set(
    words(idea)
      .split(" ")
      .filter((term) => term.length >= 4 && !IDEA_STOP_WORDS.has(term)),
  );
  const sourceTerms = new Set(words(`${source.title} ${source.text}`).split(" "));
  const overlap = [...ideaTerms].filter((term) => sourceTerms.has(term));
  const needed = ideaTerms.size <= 2 ? 1 : 2;
  return overlap.length >= needed ? "direct" : "adjacent";
}

export function identitiesMatch(
  left: Pick<ProductIdentity, "name" | "url">,
  right: Pick<ProductIdentity, "name" | "url">,
) {
  const leftIdentity = buildProductIdentity(left.name, left.url);
  const rightIdentity = buildProductIdentity(right.name, right.url);
  if (leftIdentity.officialHost && leftIdentity.officialHost === rightIdentity.officialHost) return true;
  return leftIdentity.aliases.some((alias) => rightIdentity.aliases.includes(alias));
}

function normalizedExcerpt(value: string) {
  return value
    .replace(/^[\s“”"'‘’…\.]+|[\s“”"'‘’…\.]+$/g, "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function claimExistsInSource(claim: string, sourceText: string) {
  const needle = normalizedExcerpt(claim);
  const haystack = normalizedExcerpt(sourceText);
  if (!needle || !haystack) return false;
  return ` ${haystack} `.includes(` ${needle} `);
}

export function excerptExistsInSource(excerpt: string, sourceText: string) {
  const needle = normalizedExcerpt(excerpt);
  if (needle.length < 12 || needle.split(" ").length < 3) return false;
  return claimExistsInSource(excerpt, sourceText);
}

export function ratingExistsInSource(rating: number, sourceText: string) {
  const escaped = String(rating).replace(".", "\\.");
  return [
    new RegExp(`\\b${escaped}\\s*(?:/|out of)\\s*5\\b`, "i"),
    new RegExp(`\\b${escaped}[- ]star\\b`, "i"),
    new RegExp(`\\brating\\s*(?:of|:|is)?\\s*${escaped}\\b`, "i"),
  ].some((pattern) => pattern.test(sourceText));
}

export function canonicalEvidenceUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("utm_") || ["ref", "source", "share"].includes(key)) {
        url.searchParams.delete(key);
      }
    }
    url.pathname = url.pathname.replace(/\/$/, "") || "/";
    return url.toString();
  } catch {
    return value;
  }
}

export function evidenceSourceType(url: string) {
  const host = hostname(url);
  if (host === "reddit.com" || host.endsWith(".reddit.com")) return "reddit";
  if (host === "news.ycombinator.com") return "community";
  if (host === "github.com" || host.endsWith(".github.com")) return "community";
  if (/forum|community|discuss/.test(host)) return "forum";
  if (host === "x.com" || host === "twitter.com") return "social";
  return "web";
}
