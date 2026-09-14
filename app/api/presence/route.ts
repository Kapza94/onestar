import { api } from "@/convex/_generated/api";
import { geoFromHeaders, clientIp, hashIp } from "@/lib/presence/geo";
import { fetchMutation, fetchQuery } from "convex/nextjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await fetchQuery(api.presence.snapshot, { now: Date.now() });
  return Response.json(snapshot, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=60" },
  });
}

export async function POST(request: Request) {
  const headers = request.headers;
  const ip = clientIp(headers);
  const ipHash = hashIp(ip);
  const now = Date.now();

  let action: "visit" | "search" = "visit";
  let idea: string | null = null;
  try {
    const body = (await request.json()) as { action?: string; idea?: string };
    if (body.action === "search") action = "search";
    if (typeof body.idea === "string") {
      idea = body.idea.trim().slice(0, 2000) || null;
    }
  } catch {
    // empty body is a visit ping
  }

  const geo = geoFromHeaders(headers);
  const result = await fetchMutation(api.presence.record, {
    visitorHash: ipHash,
    country: geo.country,
    city: geo.city,
    lat: geo.lat,
    lng: geo.lng,
    action,
    idea,
    now,
  });
  const snapshot = await fetchQuery(api.presence.snapshot, { now });
  return Response.json(
    { ok: true, recorded: result.recorded, ...snapshot },
    { headers: { "Cache-Control": "no-store" } },
  );
}
