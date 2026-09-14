import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { attachSubjectCookie, resolveSubjectSession } from "@/lib/backend/session";
import { convexSubjectKey } from "@/lib/backend/convex";
import { fetchMutation, fetchQuery } from "convex/nextjs";

export const dynamic = "force-dynamic";

type ReportRouteContext = { params: Promise<{ id: string }> };

function looksLikeConvexId(value: string) {
  return /^[a-z0-9]{16,64}$/i.test(value);
}

export async function GET(request: Request, context: ReportRouteContext) {
  const session = await resolveSubjectSession(request);
  const subjectKey = await convexSubjectKey(session.subjectKey);
  const { id } = await context.params;
  if (!looksLikeConvexId(id)) {
    return attachSubjectCookie(Response.json({ error: "Report not found." }, { status: 404 }), session);
  }
  const payload = await fetchQuery(api.reports.getOwned, {
    subjectKey,
    reportId: id as Id<"reports">,
  });
  const response = payload
    ? Response.json(payload, { headers: { "Cache-Control": "private, no-store" } })
    : Response.json({ error: "Report not found." }, { status: 404 });
  return attachSubjectCookie(response, session);
}

export async function DELETE(request: Request, context: ReportRouteContext) {
  const session = await resolveSubjectSession(request);
  const subjectKey = await convexSubjectKey(session.subjectKey);
  const { id } = await context.params;
  if (!looksLikeConvexId(id)) {
    return attachSubjectCookie(Response.json({ error: "Report not found." }, { status: 404 }), session);
  }
  const removed = await fetchMutation(api.reports.removeOwned, {
    subjectKey,
    reportId: id as Id<"reports">,
    now: Date.now(),
  });
  const response = removed
    ? Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
    : Response.json({ error: "Report not found." }, { status: 404 });
  return attachSubjectCookie(response, session);
}
