const EXA_SEARCH = "https://api.exa.ai/search";
const EXA_CONTENTS = "https://api.exa.ai/contents";

export type ExaResult = {
  title: string;
  url: string;
  publishedDate: string | null;
  author: string | null;
  text: string;
  highlights: string[];
};

type ExaRawResult = {
  title?: string;
  url?: string;
  publishedDate?: string | null;
  author?: string | null;
  text?: string;
  highlights?: string[];
};

async function exaPost<T>(
  path: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Exa ${path} failed (${response.status})${detail ? `: ${detail.slice(0, 240)}` : ""}`,
    );
  }

  return (await response.json()) as T;
}

function normalize(raw: ExaRawResult): ExaResult | null {
  if (!raw.url) return null;
  const highlights = Array.isArray(raw.highlights)
    ? raw.highlights.filter((item): item is string => typeof item === "string")
    : [];
  return {
    title: raw.title?.trim() || new URL(raw.url).hostname,
    url: raw.url,
    publishedDate: raw.publishedDate ?? null,
    author: raw.author ?? null,
    text: raw.text?.trim() || "",
    highlights,
  };
}

export async function exaSearch(
  apiKey: string,
  query: string,
  options?: {
    numResults?: number;
    includeDomains?: string[];
    excludeDomains?: string[];
    type?: "auto" | "fast" | "neural";
    highlightQuery?: string;
    maxCharacters?: number;
  },
): Promise<ExaResult[]> {
  const data = await exaPost<{ results?: ExaRawResult[] }>(EXA_SEARCH, apiKey, {
    query,
    type: options?.type ?? "auto",
    numResults: options?.numResults ?? 5,
    includeDomains: options?.includeDomains,
    excludeDomains: options?.excludeDomains,
    contents: {
      text: { maxCharacters: options?.maxCharacters ?? 1800 },
      highlights: {
        query: options?.highlightQuery ?? "complaints problems negative reviews issues disappointed",
        maxCharacters: 500,
      },
    },
  });

  return (data.results ?? []).map(normalize).filter((item): item is ExaResult => Boolean(item));
}

export async function exaContents(
  apiKey: string,
  urls: string[],
  maxCharacters = 2400,
): Promise<ExaResult[]> {
  if (urls.length === 0) return [];
  const data = await exaPost<{ results?: ExaRawResult[] }>(EXA_CONTENTS, apiKey, {
    urls,
    text: { maxCharacters },
    highlights: {
      query: "product pricing audience customers",
      maxCharacters: 400,
    },
  });
  return (data.results ?? []).map(normalize).filter((item): item is ExaResult => Boolean(item));
}

export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => run());
  await Promise.all(workers);
  return results;
}
