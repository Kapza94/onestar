export type FirecrawlPage = {
  url: string;
  title: string;
  markdown: string;
  publishedAt: string | null;
};

export async function firecrawlScrape(
  apiKey: string,
  url: string,
): Promise<FirecrawlPage | null> {
  try {
    const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) return null;
    const json = (await response.json()) as {
      success?: boolean;
      data?: {
        markdown?: string;
        metadata?: { title?: string; url?: string; publishedTime?: string };
      };
      markdown?: string;
    };

    const markdown = json.data?.markdown || json.markdown || "";
    if (!markdown.trim()) return null;

    return {
      url: json.data?.metadata?.url || url,
      title: json.data?.metadata?.title || new URL(url).hostname,
      markdown: markdown.slice(0, 5000),
      publishedAt: json.data?.metadata?.publishedTime ?? null,
    };
  } catch {
    return null;
  }
}
