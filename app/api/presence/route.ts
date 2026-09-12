import { geoFromHeaders, clientIp, hashIp } from "@/lib/presence/geo";
import { getPresenceSnapshot, recordPing, shouldAcceptPing } from "@/lib/presence/store";

export const revalidate = 300;

export async function GET() {
  const snapshot = getPresenceSnapshot();
  return Response.json(snapshot, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
    },
  });
}

export async function POST(request: Request) {
  const headers = request.headers;
  const ip = clientIp(headers);
  const ipHash = hashIp(ip);
  const now = Date.now();
  const accepted = shouldAcceptPing(ipHash, now);

  let action: "visit" | "search" = "visit";
  let idea: string | null = null;
  try {
    const body = (await request.json()) as { action?: string; idea?: string };
    if (body.action === "search") action = "search";
    if (typeof body.idea === "string") {
      idea = body.idea.trim().slice(0, 80) || null;
    }
  } catch {
    // empty body is a visit ping
  }

  if (accepted || action === "search") {
    const geo = geoFromHeaders(headers);
    recordPing({
      at: now,
      ipHash,
      country: geo.country,
      city: geo.city,
      lat: geo.lat,
      lng: geo.lng,
      action,
      idea,
    });
  }

  const snapshot = getPresenceSnapshot();
  return Response.json(
    { ok: true, recorded: accepted || action === "search", ...snapshot },
    { headers: { "Cache-Control": "no-store" } },
  );
}
