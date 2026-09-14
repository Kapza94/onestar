import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const limit = Number(url.searchParams.get("limit") || "20");
  const payload = await fetchQuery(api.searches.list, {
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(limit) ? limit : 20,
  });

  return Response.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
