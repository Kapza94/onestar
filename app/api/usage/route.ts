import { api } from "@/convex/_generated/api";
import { attachSubjectCookie, resolveSubjectSession } from "@/lib/backend/session";
import { convexSubjectKey } from "@/lib/backend/convex";
import { fetchMutation, fetchQuery } from "convex/nextjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await resolveSubjectSession(request);
  const subjectKey = await convexSubjectKey(session.subjectKey);
  await fetchMutation(api.analysis.ensureSubject, { subjectKey, now: Date.now() });
  const payload = await fetchQuery(api.reports.usage, { subjectKey, limit: 20 });
  return attachSubjectCookie(Response.json(payload, { headers: { "Cache-Control": "private, no-store" } }), session);
}
