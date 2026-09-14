import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const WINDOW_MS = 15 * 60 * 1000;
const KEEP_MS = 6 * 60 * 60 * 1000;
const PING_EVERY_MS = 5 * 60 * 1000;

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", DE: "Germany", FR: "France", CA: "Canada",
  AU: "Australia", IN: "India", NL: "Netherlands", ES: "Spain", IT: "Italy", BR: "Brazil",
  SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland", PL: "Poland", RS: "Serbia",
};

function relativeTime(at: number, now: number) {
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

function actionCopy(action: "visit" | "search", idea: string | null) {
  if (action === "search" && idea) {
    const label = idea.length > 80 ? `${idea.slice(0, 77).trimEnd()}…` : idea;
    return `searched “${label}”`;
  }
  return action === "search" ? "searched an idea" : "is reading";
}

export const record = mutation({
  args: {
    visitorHash: v.string(),
    country: v.union(v.string(), v.null()),
    city: v.union(v.string(), v.null()),
    lat: v.union(v.number(), v.null()),
    lng: v.union(v.number(), v.null()),
    action: v.union(v.literal("visit"), v.literal("search")),
    idea: v.union(v.string(), v.null()),
    now: v.number(),
  },
  returns: v.object({ recorded: v.boolean() }),
  handler: async (ctx, args) => {
    const last = await ctx.db
      .query("presence")
      .withIndex("by_visitor_at", (q) => q.eq("visitorHash", args.visitorHash))
      .order("desc")
      .first();
    if (args.action === "visit" && last && args.now - last.createdAt < PING_EVERY_MS) {
      return { recorded: false };
    }
    await ctx.db.insert("presence", {
      visitorHash: args.visitorHash,
      country: args.country,
      city: args.city,
      lat: args.lat,
      lng: args.lng,
      action: args.action,
      idea: args.idea,
      createdAt: args.now,
    });
    return { recorded: true };
  },
});

export const snapshot = query({
  args: { now: v.number() },
  returns: v.object({
    live: v.number(), countries: v.number(), total: v.number(), since: v.string(),
    events: v.array(v.object({ country: v.union(v.string(), v.null()), countryName: v.string(), city: v.union(v.string(), v.null()), ago: v.string(), action: v.string() })),
    topCountries: v.array(v.object({ code: v.string(), name: v.string(), count: v.number() })),
    dots: v.array(v.object({ lat: v.number(), lng: v.number(), live: v.boolean(), count: v.number() })),
    recentIdeas: v.array(v.object({ idea: v.string(), at: v.number() })),
  }),
  handler: async (ctx, args) => {
    const all = await ctx.db.query("presence").withIndex("by_created_at").order("desc").take(400);
    const items = all.filter((item) => args.now - item.createdAt < KEEP_MS);
    const liveItems = items.filter((item) => args.now - item.createdAt < WINDOW_MS);
    const live = new Set(liveItems.map((item) => item.visitorHash)).size;
    const counts = new Map<string, { count: number; live: boolean; lat: number | null; lng: number | null }>();
    for (const item of items) {
      if (!item.country) continue;
      const value = counts.get(item.country) ?? { count: 0, live: false, lat: item.lat, lng: item.lng };
      value.count += 1;
      value.live ||= args.now - item.createdAt < WINDOW_MS;
      value.lat ??= item.lat;
      value.lng ??= item.lng;
      counts.set(item.country, value);
    }
    const topCountries = [...counts.entries()]
      .sort((left, right) => right[1].count - left[1].count)
      .slice(0, 6)
      .map(([code, value]) => ({ code, name: COUNTRY_NAMES[code] ?? code, count: value.count }));
    const dots = [...counts.values()]
      .filter((item): item is typeof item & { lat: number; lng: number } => item.lat !== null && item.lng !== null)
      .map((item) => ({ lat: item.lat, lng: item.lng, live: item.live, count: item.count }));
    const recentIdeas: { idea: string; at: number }[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      if (item.action !== "search" || !item.idea) continue;
      const key = item.idea.trim().replace(/\s+/g, " ").toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      recentIdeas.push({ idea: item.idea, at: item.createdAt });
      if (recentIdeas.length === 15) break;
    }
    return {
      live,
      countries: counts.size,
      total: items.length,
      since: new Date(items.at(-1)?.createdAt ?? args.now).toISOString(),
      events: items.slice(0, 8).map((item) => ({
        country: item.country,
        countryName: item.country ? COUNTRY_NAMES[item.country] ?? item.country : "Unknown",
        city: item.city,
        ago: relativeTime(item.createdAt, args.now),
        action: actionCopy(item.action, item.idea),
      })),
      topCountries,
      dots,
      recentIdeas,
    };
  },
});
