import { COUNTRY_META, countryName } from "./countries";

type Ping = {
  id: string;
  at: number;
  ipHash: string;
  country: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  action: "visit" | "search";
  idea: string | null;
};

export type PresenceEvent = {
  country: string | null;
  countryName: string;
  city: string | null;
  ago: string;
  action: string;
};

export type PresenceDot = {
  lat: number;
  lng: number;
  live: boolean;
  count: number;
};

export type PresenceSnapshot = {
  live: number;
  countries: number;
  total: number;
  since: string;
  events: PresenceEvent[];
  topCountries: { code: string; name: string; count: number }[];
  dots: PresenceDot[];
  recentIdeas: { idea: string; at: number }[];
};

const WINDOW_MS = 15 * 60 * 1000;
const KEEP_MS = 6 * 60 * 60 * 1000;
const MAX_PINGS = 400;
const PING_EVERY_MS = 5 * 60 * 1000;

type Store = {
  startedAt: number;
  pings: Ping[];
  lastByIp: Map<string, number>;
  searches: { idea: string; at: number }[];
};

const g = globalThis as typeof globalThis & { __onestarPresence?: Store };

function store(): Store {
  if (!g.__onestarPresence) {
    g.__onestarPresence = {
      startedAt: Date.now(),
      pings: [],
      lastByIp: new Map(),
      searches: [],
    };
  }
  if (!g.__onestarPresence.searches) g.__onestarPresence.searches = [];
  return g.__onestarPresence;
}

function prune(now: number) {
  const data = store();
  data.pings = data.pings.filter((ping) => now - ping.at < KEEP_MS).slice(-MAX_PINGS);
  for (const [ip, at] of data.lastByIp) {
    if (now - at > KEEP_MS) data.lastByIp.delete(ip);
  }
}

export function shouldAcceptPing(ipHash: string, now = Date.now()) {
  const last = store().lastByIp.get(ipHash);
  if (last && now - last < PING_EVERY_MS) return false;
  return true;
}

export function recordPing(ping: Omit<Ping, "id">) {
  const data = store();
  const now = ping.at;
  prune(now);
  data.lastByIp.set(ping.ipHash, now);
  data.pings.push({ ...ping, id: `${ping.ipHash}-${now}` });
  if (ping.action === "search" && ping.idea) {
    const key = ping.idea.toLowerCase();
    data.searches = [{ idea: ping.idea, at: now }, ...data.searches.filter((item) => item.idea.toLowerCase() !== key)].slice(
      0,
      400,
    );
  }
}

export function listSearches(page = 1, pageSize = 20) {
  const items = uniqueIdeas(store().searches);
  const safeSize = Math.min(50, Math.max(1, pageSize));
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / safeSize));
  const safePage = Math.min(pages, Math.max(1, page));
  const start = (safePage - 1) * safeSize;
  return {
    items: items.slice(start, start + safeSize),
    page: safePage,
    pageSize: safeSize,
    total,
    pages,
  };
}

function relativeTime(at: number, now: number) {
  const delta = Math.max(0, Math.round((now - at) / 1000));
  if (delta < 60) return `${delta}s ago`;
  const minutes = Math.round(delta / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

function actionCopy(ping: Ping) {
  if (ping.action === "search" && ping.idea) {
    return `searched “${ping.idea}”`;
  }
  if (ping.action === "search") return "searched an idea";
  return "is reading";
}

export function getPresenceSnapshot(): PresenceSnapshot {
  const data = store();
  const now = Date.now();
  prune(now);
  const livePings = data.pings.filter((ping) => now - ping.at < WINDOW_MS);
  const liveIds = new Set(livePings.map((ping) => ping.ipHash));
  const live = liveIds.size;

  const counts = new Map<string, { count: number; live: number; lat: number | null; lng: number | null }>();
  for (const ping of data.pings) {
    const code = ping.country;
    if (!code) continue;
    const current = counts.get(code) || {
      count: 0,
      live: 0,
      lat: ping.lat,
      lng: ping.lng,
    };
    current.count += 1;
    if (now - ping.at < WINDOW_MS) current.live += 1;
    current.lat = ping.lat ?? current.lat;
    current.lng = ping.lng ?? current.lng;
    counts.set(code, current);
  }

  const topCountries = [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([code, value]) => ({
      code,
      name: countryName(code),
      count: value.count,
    }));

  const dots: PresenceDot[] = [...counts.entries()]
    .map(([code, value]) => {
      const meta = COUNTRY_META[code];
      const lat = value.lat ?? meta?.lat;
      const lng = value.lng ?? meta?.lng;
      if (lat == null || lng == null) return null;
      return { lat, lng, live: value.live > 0, count: value.count };
    })
    .filter((item): item is PresenceDot => Boolean(item));

  const events = [...data.pings]
    .reverse()
    .slice(0, 8)
    .map((ping) => ({
      country: ping.country,
      countryName: ping.country ? countryName(ping.country) : "Unknown",
      city: ping.city,
      ago: relativeTime(ping.at, now),
      action: actionCopy(ping),
    }));

  const recentIdeas = uniqueIdeas(data.searches).slice(0, 15);

  return {
    live,
    countries: counts.size,
    total: data.pings.length,
    since: new Date(data.startedAt).toISOString(),
    events,
    topCountries,
    dots,
    recentIdeas,
  };
}

function uniqueIdeas(items: { idea: string; at: number }[]) {
  const seen = new Set<string>();
  const out: { idea: string; at: number }[] = [];
  for (const item of items) {
    const key = item.idea.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
