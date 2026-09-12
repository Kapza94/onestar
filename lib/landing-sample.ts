// Lightweight, hand-authored content for the marketing landing page only.
// Live searches use the full Report pipeline; this just powers the static preview.

export type SampleQuote = { quote: string; source: string; date: string };
export type SamplePoint = { title: string; body: string };

export const landingSample = {
  reportNo: "001",
  headline: "the market does not need another budgeting app.",
  subhead: "the defensible wedge is effortless tracking people actually keep up with.",

  hero: {
    rawEvidence: "bank sync broke again. i just gave up.",
    repeatedPain: "broken bank sync",
    mentions: 47,
    productDecision: "make reliability the product, not a feature.",
  },

  evidence: [
    {
      quote: "bank sync broke again and i had to reconnect every account.",
      source: "Reddit · r/personalfinance",
      date: "2024-03-12",
    },
    {
      quote: "cancelled after the trial — $99/yr for a spreadsheet is steep.",
      source: "App Store review",
      date: "2024-02-18",
    },
    {
      quote: "logging every coffee is exhausting, so i just stopped.",
      source: "Trustpilot",
      date: "2024-01-27",
    },
  ] satisfies SampleQuote[],

  interpretation: [
    {
      title: "Fragile bank connections",
      body: "Users re-authenticate constantly; every sync failure erodes trust in the numbers.",
    },
    {
      title: "Manual logging fatigue",
      body: "People abandon apps that expect them to enter every transaction by hand.",
    },
    {
      title: "Pricing resentment",
      body: "Subscriptions feel too high for what is mostly a read-only dashboard.",
    },
  ] satisfies SamplePoint[],

  blueprint: [
    {
      title: "Make sync the product",
      body: "Prioritize connection stability and clear recovery over feature count.",
    },
    {
      title: "Zero-entry tracking",
      body: "Categorize automatically; only ask the user when genuinely unsure.",
    },
    {
      title: "One fair price",
      body: "A single low tier with no paywalled essentials or trial traps.",
    },
  ] satisfies SamplePoint[],

  instead: [
    {
      title: "an app you don't have to babysit",
      body: "Automatic categorization so people stop logging spend by hand.",
    },
    {
      title: "sync that stays connected",
      body: "Treat connection reliability as the core feature, not a footnote.",
    },
    {
      title: "pricing that matches the value",
      body: "One honest tier people don't resent renewing every year.",
    },
  ] satisfies SamplePoint[],

  stats: { sources: 12, negatives: 18, clusters: 3 },
} as const;
