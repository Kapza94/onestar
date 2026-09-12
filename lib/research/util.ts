export const BLOCKED_OR_BRITTLE_HOSTS = [
  "g2.com",
  "www.g2.com",
  "capterra.com",
  "www.capterra.com",
  "trustpilot.com",
  "www.trustpilot.com",
  "play.google.com",
  "apps.apple.com",
  "itunes.apple.com",
];

export const PREFERRED_HOST_HINTS = [
  "reddit.com",
  "producthunt.com",
  "github.com",
  "news.ycombinator.com",
  "medium.com",
  "substack.com",
  "x.com",
  "twitter.com",
];

export function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function isBrittleHost(url: string) {
  const host = hostnameOf(url);
  return BLOCKED_OR_BRITTLE_HOSTS.some(
    (item) => host === item.replace(/^www\./, "") || host.endsWith(`.${item.replace(/^www\./, "")}`),
  );
}

export function sourceQuality(url: string) {
  const host = hostnameOf(url);
  if (PREFERRED_HOST_HINTS.some((item) => host === item || host.endsWith(`.${item}`))) {
    return 3;
  }
  if (isBrittleHost(url)) return 0;
  return 1;
}

export function displayNameFromUrl(url: string) {
  const host = hostnameOf(url);
  const stem = host.split(".")[0] ?? host;
  return stem.charAt(0).toUpperCase() + stem.slice(1);
}

export function clip(text: string, max: number) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trim()}…`;
}

export function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const value = key(item);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(item);
  }
  return out;
}
