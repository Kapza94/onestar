import { AnalyzeFailure } from "@/lib/errors";
import { runAnalysis } from "@/lib/research/pipeline";
import { analyzeInputSchema } from "@/lib/schemas";

export const maxDuration = 120;

function parseUrls(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { idea?: unknown; competitorUrls?: unknown };
    const urls = parseUrls(body.competitorUrls).map((item) => {
      if (/^https?:\/\//i.test(item)) return item;
      return `https://${item}`;
    });

    const parsed = analyzeInputSchema.safeParse({
      idea: body.idea,
      competitorUrls: urls,
    });

    if (!parsed.success) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "invalid_input",
            message: parsed.error.issues[0]?.message || "Invalid input.",
            retryable: false,
          },
        },
        { status: 400 },
      );
    }

    const report = await runAnalysis(parsed.data);
    return Response.json({ ok: true, report });
  } catch (error) {
    if (error instanceof AnalyzeFailure) {
      return Response.json(error.toJSON(), { status: error.status });
    }
    return Response.json(
      {
        ok: false,
        error: {
          code: "unknown",
          message: error instanceof Error ? error.message : "Something broke during research.",
          retryable: true,
        },
      },
      { status: 500 },
    );
  }
}
