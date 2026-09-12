import { getPresenceSnapshot, listSearches } from "@/lib/presence/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const limit = Number(url.searchParams.get("limit") || "20");
  const payload = listSearches(Number.isFinite(page) ? page : 1, Number.isFinite(limit) ? limit : 20);

  if (payload.items.length === 0) {
    const fallback = getPresenceSnapshot().recentIdeas;
    if (fallback.length) {
      return Response.json({
        items: fallback.slice(0, payload.pageSize),
        page: 1,
        pageSize: payload.pageSize,
        total: fallback.length,
        pages: 1,
      });
    }
  }

  return Response.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
