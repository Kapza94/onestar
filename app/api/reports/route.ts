import { api } from "@/convex/_generated/api";
import { attachSubjectCookie, resolveSubjectSession } from "@/lib/backend/session";
import { convexSubjectKey } from "@/lib/backend/convex";
import { fetchQuery } from "convex/nextjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await resolveSubjectSession(request);
  const subjectKey = await convexSubjectKey(session.subjectKey);
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const pageSize = Number(url.searchParams.get("limit") ?? 20);
  const payload = await fetchQuery(api.reports.listOwned, {
    subjectKey,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 20,
  });
  return attachSubjectCookie(Response.json(payload, { headers: { "Cache-Control": "no-store" } }), session);
}
