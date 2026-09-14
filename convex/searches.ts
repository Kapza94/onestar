import { v } from "convex/values";
import { query } from "./_generated/server";

function unique(items: { idea: string; createdAt: number; normalizedIdea: string }[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.normalizedIdea)) return false;
    seen.add(item.normalizedIdea);
    return true;
  });
}

export const list = query({
  args: { page: v.number(), pageSize: v.number() },
  returns: v.object({
    items: v.array(v.object({ idea: v.string(), at: v.number() })),
    page: v.number(),
    pageSize: v.number(),
    total: v.number(),
    pages: v.number(),
  }),
  handler: async (ctx, args) => {
    const pageSize = Math.min(50, Math.max(1, Math.floor(args.pageSize)));
    const searches = await ctx.db.query("searches").withIndex("by_created_at").order("desc").take(500);
    const items = unique(searches);
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(pages, Math.max(1, Math.floor(args.page)));
    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize).map((item) => ({ idea: item.idea, at: item.createdAt })),
      page,
      pageSize,
      total,
      pages,
    };
  },
});
