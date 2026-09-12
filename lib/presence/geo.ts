import { createHash } from "node:crypto";
import { COUNTRY_META } from "./countries";

export function hashIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export function clientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") || "unknown";
}

export function geoFromHeaders(headers: Headers) {
  const country = (headers.get("x-vercel-ip-country") || "").toUpperCase() || null;
  const city = headers.get("x-vercel-ip-city");
  const latRaw = headers.get("x-vercel-ip-latitude");
  const lngRaw = headers.get("x-vercel-ip-longitude");
  const lat = latRaw ? Number(latRaw) : COUNTRY_META[country || ""]?.lat ?? null;
  const lng = lngRaw ? Number(lngRaw) : COUNTRY_META[country || ""]?.lng ?? null;
  return {
    country,
    city: city ? decodeURIComponent(city) : null,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
}
