export type RecentIdea = { idea: string; at: number };

export function normalizeIdea(idea: string) {
  return idea.trim().replace(/\s+/g, " ");
}

export function sameIdea(a: string, b: string) {
  const left = normalizeIdea(a).toLowerCase();
  const right = normalizeIdea(b).toLowerCase();
  if (!left || !right) return false;
  if (left === right) return true;
  const [shorter, longer] = left.length <= right.length ? [left, right] : [right, left];
  if (shorter.length < 24) return false;
  return longer.startsWith(shorter);
}

export function uniqueRecentIdeas(items: RecentIdea[]): RecentIdea[] {
  const out: RecentIdea[] = [];
  for (const item of items) {
    const idea = normalizeIdea(item.idea);
    if (!idea) continue;
    const index = out.findIndex((existing) => sameIdea(existing.idea, idea));
    if (index === -1) {
      out.push({ idea, at: item.at });
      continue;
    }
    const existing = out[index];
    out[index] = {
      idea: idea.length > existing.idea.length ? idea : existing.idea,
      at: Math.max(existing.at, item.at),
    };
  }
  return out.sort((a, b) => b.at - a.at);
}
