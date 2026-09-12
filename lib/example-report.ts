import type { Report } from "./schemas";

export const EXAMPLE_IDEA =
  "An app that matches people looking for workout partners at the same gym.";

export const EXAMPLE_COMPETITOR_URLS = [
  "https://www.sweatpals.com",
  "https://www.strava.com",
];

export const exampleReport: Report = {
  idea: EXAMPLE_IDEA,
  generatedAt: "2026-03-18T09:12:00.000Z",
  mode: "demo",
  market: {
    interpretedIdea:
      "A same-gym workout-partner matcher: people who already train at a specific facility find a reliable human to train with, not a citywide dating-adjacent fitness feed.",
    targetCustomer:
      "Regular gym-goers who want a consistent lifting or class partner at their own facility, especially women and beginners who feel unsafe or ignored in open social apps.",
    productCategory: "Local fitness matching / gym-operated social utility",
    competitorCount: 5,
    sourcesAnalyzed: 12,
    negativeFeedbackCount: 18,
    opportunityVerdict:
      "Open fitness social networks keep collapsing into spam, no-shows, and safety anxiety. The gap is not another citywide feed. It is a gym-bounded, identity-checked matching utility that gyms can run as a private network.",
  },
  competitors: [
    {
      name: "SweatPals",
      url: "https://www.sweatpals.com",
      description:
        "Fitness social app that organizes group workouts and lets people find others to train with.",
      targetAudience: "Social gym-goers and people looking for group fitness events",
      pricing: "Freemium with paid social/event features reported by users; exact current price unknown",
      feedbackCount: 6,
      mostCommonComplaint:
        "People match or RSVP and then never show up; weak identity and gym verification.",
      confidence: "high",
      sourceIds: ["s1", "s2", "s3"],
    },
    {
      name: "Strava",
      url: "https://www.strava.com",
      description:
        "Activity tracker with clubs, segments, and a social feed for endurance athletes.",
      targetAudience: "Runners, cyclists, and athletes who already log outdoor or tracked workouts",
      pricing: "Free tier plus Strava Subscription; public pages advertise a subscription, exact regional price unknown in this sample",
      feedbackCount: 4,
      mostCommonComplaint:
        "The social layer is a performance feed, not a way to find a real-world partner at a specific gym.",
      confidence: "medium",
      sourceIds: ["s4", "s5"],
    },
    {
      name: "Meetup",
      url: "https://www.meetup.com",
      description:
        "Event platform with fitness and running groups organized by volunteer hosts.",
      targetAudience: "People willing to join scheduled public group events",
      pricing: "Organizer fees exist; member pricing varies by group and is not a single consumer plan in this sample",
      feedbackCount: 3,
      mostCommonComplaint:
        "Groups go inactive, events feel cliquey, and showing up alone to a public meetup is a high social cost.",
      confidence: "medium",
      sourceIds: ["s6", "s7"],
    },
    {
      name: "ClassPass",
      url: "https://classpass.com",
      description:
        "Marketplace credits for boutique classes across many studios.",
      targetAudience: "Class hoppers who want variety more than a consistent training partner",
      pricing: "Subscription credit packs; specific plan prices not captured in this sample",
      feedbackCount: 3,
      mostCommonComplaint:
        "Credits, blackouts, and studio availability; it books classes, it does not match people.",
      confidence: "medium",
      sourceIds: ["s8", "s9"],
    },
    {
      name: "Sporty",
      url: "https://sporty.com",
      description:
        "Sports and pickup-game matching for people looking for partners or teams.",
      targetAudience: "People organizing pickup sports rather than same-gym lifting partners",
      pricing: null,
      feedbackCount: 2,
      mostCommonComplaint:
        "Sparse local liquidity; users report empty cities and abandoned chats.",
      confidence: "low",
      sourceIds: ["s10"],
    },
  ],
  wallOfRage: [
    {
      id: "e1",
      excerpt:
        "Matched with someone who said they trained at my gym. I waited 40 minutes. They never came, and there is no way to verify they even have a membership.",
      competitor: "SweatPals",
      platform: "Reddit",
      rating: null,
      publishedAt: "2025-11-02",
      sourceId: "s1",
      category: "Reliability",
    },
    {
      id: "e2",
      excerpt:
        "The feed is mostly thirst traps and leftover dating energy. I wanted a squat partner, not another inbox of creeps.",
      competitor: "SweatPals",
      platform: "Product Hunt",
      rating: null,
      publishedAt: "2025-06-14",
      sourceId: "s2",
      category: "Privacy or trust",
    },
    {
      id: "e3",
      excerpt:
        "As a woman I will not meet a stranger from a fitness app in the locker-room hallway. There is no gym staff involvement and no identity check.",
      competitor: "SweatPals",
      platform: "Blog review",
      rating: null,
      publishedAt: "2025-09-21",
      sourceId: "s3",
      category: "Privacy or trust",
    },
    {
      id: "e4",
      excerpt:
        "I already have Strava friends who live in other cities. It is useless for finding someone on the 6am squat rack next to me.",
      competitor: "Strava",
      platform: "Reddit",
      rating: null,
      publishedAt: "2026-01-08",
      sourceId: "s4",
      category: "Missing feature",
    },
    {
      id: "e5",
      excerpt:
        "Paid for months. The club chat is dead. Kudos are not a workout partner.",
      competitor: "Strava",
      platform: "Public forum",
      rating: null,
      publishedAt: "2025-12-03",
      sourceId: "s5",
      category: "User experience",
    },
    {
      id: "e6",
      excerpt:
        "Every running group on Meetup in my area is either abandoned or hosted by one person who never replies.",
      competitor: "Meetup",
      platform: "Reddit",
      rating: null,
      publishedAt: "2025-08-19",
      sourceId: "s6",
      category: "Reliability",
    },
    {
      id: "e7",
      excerpt:
        "Walking into a public fitness meetup alone is terrifying. If you miss one week you are the outsider again.",
      competitor: "Meetup",
      platform: "Blog review",
      rating: null,
      publishedAt: "2025-04-11",
      sourceId: "s7",
      category: "Difficult onboarding",
    },
    {
      id: "e8",
      excerpt:
        "Credits vanished, favorite studio was blacked out, and support sent a template. I just wanted a consistent person, not a marketplace.",
      competitor: "ClassPass",
      platform: "Twitter/X discussion",
      rating: null,
      publishedAt: "2026-02-02",
      sourceId: "s8",
      category: "Pricing",
    },
    {
      id: "e9",
      excerpt:
        "Tried to cancel after the intro period. The flow hid the button and I got billed again.",
      competitor: "ClassPass",
      platform: "Public review page",
      rating: 1,
      publishedAt: "2025-10-27",
      sourceId: "s9",
      category: "Cancellation difficulty",
    },
    {
      id: "e10",
      excerpt:
        "Downloaded it, selected my city, and there were three people, none at my gym, none active this month.",
      competitor: "Sporty",
      platform: "Reddit",
      rating: null,
      publishedAt: "2025-07-30",
      sourceId: "s10",
      category: "Reliability",
    },
  ],
  themes: [
    {
      id: "t1",
      theme: "Reliability",
      evidenceCount: 5,
      severity: "critical",
      competitorsAffected: ["SweatPals", "Meetup", "Sporty"],
      explanation:
        "No-shows, ghosted chats, and empty local liquidity dominate the sample. Matching without attendance consequences is treated as spam.",
      representativeSourceId: "s1",
    },
    {
      id: "t2",
      theme: "Privacy or trust",
      evidenceCount: 4,
      severity: "critical",
      competitorsAffected: ["SweatPals", "Meetup"],
      explanation:
        "Women and beginners repeatedly refuse stranger meetups that are not gym-verified. Open social graphs read as dating apps in gym clothes.",
      representativeSourceId: "s3",
    },
    {
      id: "t3",
      theme: "Missing feature",
      evidenceCount: 3,
      severity: "high",
      competitorsAffected: ["Strava", "ClassPass", "Sporty"],
      explanation:
        "Existing products optimize for logging, classes, or citywide sports. None of the sampled complaints describe a working same-gym identity check.",
      representativeSourceId: "s4",
    },
    {
      id: "t4",
      theme: "Difficult onboarding",
      evidenceCount: 2,
      severity: "high",
      competitorsAffected: ["Meetup", "SweatPals"],
      explanation:
        "Public group joining has a high social cost. People want a private first session, not a cold walk-in to a clique.",
      representativeSourceId: "s7",
    },
    {
      id: "t5",
      theme: "Pricing",
      evidenceCount: 2,
      severity: "medium",
      competitorsAffected: ["ClassPass", "Strava"],
      explanation:
        "Users in the sample resent paying for feeds, credits, or subscriptions that do not produce a real training partner.",
      representativeSourceId: "s8",
    },
    {
      id: "t6",
      theme: "Cancellation difficulty",
      evidenceCount: 1,
      severity: "medium",
      competitorsAffected: ["ClassPass"],
      explanation:
        "At least one captured review describes a buried cancel flow and an extra bill. Treat as a warning for any paid layer, not a market-wide pattern.",
      representativeSourceId: "s9",
    },
    {
      id: "t7",
      theme: "User experience",
      evidenceCount: 1,
      severity: "low",
      competitorsAffected: ["Strava"],
      explanation:
        "Performance-feed UX is celebrated by athletes and rejected by people who only want a local partner. The product shape is the issue, not polish.",
      representativeSourceId: "s5",
    },
  ],
  opportunities: [
    {
      id: "o1",
      customerPain:
        "Strangers from open fitness apps no-show, lurk, or make the gym feel unsafe.",
      competitorWeakness:
        "Open social graphs with self-reported gyms and no staff or membership proof.",
      recommendedSolution:
        "Issue matches only inside a gym-operated network after membership verification (front-desk code, scanner, or imported member list).",
      targetSegment:
        "Women, beginners, and early-morning regulars at a single big-box or boutique gym",
      evidenceSourceIds: ["s1", "s2", "s3"],
      confidence: "high",
    },
    {
      id: "o2",
      customerPain:
        "Citywide apps have empty rooms; activity trackers have friends in other cities.",
      competitorWeakness:
        "Liquidity is spread across a metro instead of concentrated on the people already in the building.",
      recommendedSolution:
        "Default the unit of network to one facility. Do not launch a city feed until several gyms are independently dense.",
      targetSegment: "Members of one busy gym who already overlap on schedule",
      evidenceSourceIds: ["s4", "s10"],
      confidence: "high",
    },
    {
      id: "o3",
      customerPain:
        "Public meetups feel cliquey and expensive in social risk.",
      competitorWeakness:
        "Event-based joining rather than quiet, two-person matching.",
      recommendedSolution:
        "Start with private 1:1 or 1:2 sessions at posted rack times, with a no-show mark that actually gates future matches.",
      targetSegment: "People who will not walk into a 20-person Saturday bootcamp alone",
      evidenceSourceIds: ["s6", "s7"],
      confidence: "medium",
    },
    {
      id: "o4",
      customerPain:
        "Paying for credits or a social subscription does not buy a partner.",
      competitorWeakness:
        "Monetizing access to classes or feeds instead of reliability.",
      recommendedSolution:
        "Charge the gym (B2B seat) or a small verified-member fee after two successful sessions. Do not sell a public social feed.",
      targetSegment: "Gym operators who lose members to isolation in the first 90 days",
      evidenceSourceIds: ["s5", "s8", "s9"],
      confidence: "medium",
    },
  ],
  buildThisNotThat: [
    {
      build: "Automatic gym verification (membership scan, staff code, or imported roster)",
      notThat: "Another open citywide social feed",
      because:
        "Users in this sample repeatedly report no-shows, creeps, and fake gym claims when anyone can join.",
      sourceIds: ["s1", "s2", "s3"],
    },
    {
      build: "No-show penalties that freeze matching until a make-good",
      notThat: "Unlimited unread chat threads",
      because:
        "Reliability, not messaging volume, is the complaint that kills trust after the first flake.",
      sourceIds: ["s1", "s6", "s10"],
    },
    {
      build: "Quiet 1:1 partner matching at overlapping gym hours",
      notThat: "Public group events and performance leaderboards",
      because:
        "Meetups feel cliquey and Strava already owns the kudos feed. The missing job is a reliable human on the same floor.",
      sourceIds: ["s4", "s5", "s7"],
    },
  ],
  blueprint: {
    underservedNiche:
      "Verified members of a single gym who want a standing training partner at known hours, with staff-backed identity and consequences for no-shows.",
    positioning:
      "The private matching layer a gym runs for its own members. Not a fitness social network. Not a dating app with kettlebells.",
    coreDifferentiator:
      "The network is the facility. Membership proof is the login. Matches never leave the building’s roster.",
    featuresToBuildFirst: [
      "Gym-admin roster or front-desk verification so only current members can match",
      "Schedule overlap matching (days, times, lift vs class) with a confirmed session object",
      "No-show mark, visible to staff, that pauses matching until resolved",
    ],
    featuresToAvoid: [
      "A public city feed, stories, or follower graph",
      "Open DMs before a session is confirmed",
      "Leaderboards, thirst-photo profiles, or dating-style swipes",
    ],
    smallestViableMvp:
      "One partner gym. Staff onboards members with a one-time code. A member posts the hours they will be on the floor this week. The app proposes at most three verified partners with overlapping hours. Both tap confirm. After the session, each marks showed / no-show. No chat beyond the confirmation.",
    pricingHypothesis:
      "Year 0: free to members, $200–$400/month per gym location for the staff dashboard and verification, sold as a retention tool. Do not launch a consumer subscription until two gyms report reduced 90-day churn. Consumer pricing in this sample is a trust hazard.",
    distributionWedge:
      "Sell the first ten gyms through general managers, not through App Store ads. Offer a 30-day front-desk pilot: they care about isolated beginners quitting, and they already have the roster you need.",
    criticalAssumptions: [
      "Gym managers will share or scan membership identity in exchange for a retention story.",
      "Enough members at one busy gym overlap on hours to create matches without a citywide pool.",
      "A no-show penalty enforced with staff visibility will not collapse usage.",
    ],
    validationPlan: [
      {
        day: 1,
        action:
          "Pick one busy gym you already use. Count 20 regulars at two peak hours and note gender mix, lift vs class, and whether they already train in pairs.",
        successSignal: "You can name at least eight people who arrive solo in those windows.",
      },
      {
        day: 2,
        action:
          "Talk to the general manager. Ask if first-90-day churn is a problem and whether they would trial a verified partner board at the desk.",
        successSignal: "A manager agrees to a 15-minute follow-up or says churn of beginners is painful.",
      },
      {
        day: 3,
        action:
          "Run five hallway interviews with solo members using the complaints from this report. Ask if they would match if the other person had to be a current member.",
        successSignal: "At least three say membership verification is the difference between yes and never.",
      },
      {
        day: 4,
        action:
          "Paper prototype: a printed weekly hour grid plus a staff stamp. Recruit six members to mark hours and proposed partners.",
        successSignal: "Two confirmed pairs for the coming week without a chat app.",
      },
      {
        day: 5,
        action:
          "Watch those sessions happen. Log show / no-show and whether staff had to intervene.",
        successSignal: "At least one session occurs. If both flake, the penalty design is the next interview, not the feed.",
      },
      {
        day: 6,
        action:
          "Draft a one-location landing page with the headline in this blueprint. Show it only to that gym’s members (QR at the desk).",
        successSignal: "Ten waitlist emails or staff-collected names from one facility.",
      },
      {
        day: 7,
        action:
          "Write a one-page gym pilot offer: price, staff time, what you need from the roster, what you will not build (city feed).",
        successSignal: "One manager will take the PDF to an owner, or you have a written no with a reason.",
      },
    ],
    rewrittenPitch:
      "A private, gym-operated matching layer that pairs verified members who already train at the same facility, with no public feed and real consequences for no-shows.",
    landingHeadline: "Find a partner who actually has a membership. At your gym.",
    primaryCta: "Ask your gym to turn it on",
  },
  sources: [
    {
      id: "s1",
      title: "Reddit thread: fitness app no-shows and fake gym claims",
      url: "https://www.reddit.com/r/fitness/comments/example-no-shows",
      domain: "reddit.com",
      publishedAt: "2025-11-02",
      findings: "Users describe waiting for matches who never arrive and cannot be verified as members.",
    },
    {
      id: "s2",
      title: "Product Hunt discussion: SweatPals comments on dating energy",
      url: "https://www.producthunt.com/posts/example-sweatpals",
      domain: "producthunt.com",
      publishedAt: "2025-06-14",
      findings: "Commenters say the social feed attracts dating behavior instead of training partners.",
    },
    {
      id: "s3",
      title: "Blog: why women bounce off fitness meetup apps",
      url: "https://example.com/blog/women-fitness-app-safety",
      domain: "example.com",
      publishedAt: "2025-09-21",
      findings: "Safety and identity checks are described as missing before in-person gym meets.",
    },
    {
      id: "s4",
      title: "Reddit: Strava is not a gym-partner tool",
      url: "https://www.reddit.com/r/Strava/comments/example-gym-partner",
      domain: "reddit.com",
      publishedAt: "2026-01-08",
      findings: "Athletes say Strava friends are geographic and sport-mismatched for gym pairing.",
    },
    {
      id: "s5",
      title: "Forum post: paying for a dead Strava club",
      url: "https://forum.example.com/strava-club-dead",
      domain: "forum.example.com",
      publishedAt: "2025-12-03",
      findings: "Subscription value is questioned when clubs and chats are inactive.",
    },
    {
      id: "s6",
      title: "Reddit: abandoned Meetup running groups",
      url: "https://www.reddit.com/r/running/comments/example-meetup-dead",
      domain: "reddit.com",
      publishedAt: "2025-08-19",
      findings: "Local fitness groups on Meetup are reported as inactive or unresponsive.",
    },
    {
      id: "s7",
      title: "Personal essay: showing up alone to a fitness meetup",
      url: "https://example.com/showing-up-alone",
      domain: "example.com",
      publishedAt: "2025-04-11",
      findings: "High social cost of joining public groups as a newcomer.",
    },
    {
      id: "s8",
      title: "Public discussion: ClassPass credits and blackouts",
      url: "https://x.com/example/status/classpass-credits",
      domain: "x.com",
      publishedAt: "2026-02-02",
      findings: "Users complain that credit marketplaces do not produce a consistent partner.",
    },
    {
      id: "s9",
      title: "Public review: ClassPass cancellation",
      url: "https://example-reviews.com/classpass-cancel",
      domain: "example-reviews.com",
      publishedAt: "2025-10-27",
      findings: "One captured 1-star review describes a hidden cancel path and an extra charge.",
    },
    {
      id: "s10",
      title: "Reddit: empty city in a sports matching app",
      url: "https://www.reddit.com/r/apps/comments/example-sporty-empty",
      domain: "reddit.com",
      publishedAt: "2025-07-30",
      findings: "Cold-start failure when liquidity is spread across a city instead of one venue.",
    },
    {
      id: "s11",
      title: "SweatPals marketing site",
      url: "https://www.sweatpals.com",
      domain: "sweatpals.com",
      publishedAt: null,
      findings: "Positions as a fitness social/event product; used to confirm competitor shape, not complaints.",
    },
    {
      id: "s12",
      title: "Strava product site",
      url: "https://www.strava.com",
      domain: "strava.com",
      publishedAt: null,
      findings: "Confirms tracking-plus-clubs positioning rather than same-gym matching.",
    },
  ],
  caveats: [
    "This is bundled example data for the gym-partner idea. It is labeled Example data and is not a live web crawl.",
    "Counts refer to this collected sample of 12 sources, not the entire market.",
    "Pricing is recorded only when a source mentioned it; several prices remain unknown.",
    "One complaint is not a market-wide pattern. Treat low-count themes as leads to validate, not proof of demand.",
  ],
  warnings: [],
};

export function labeledExampleReport(idea?: string): Report {
  const nextIdea = idea?.trim() || EXAMPLE_IDEA;
  return {
    ...exampleReport,
    idea: nextIdea,
    generatedAt: new Date().toISOString(),
    mode: "demo",
    caveats: [
      `Example data for: “${nextIdea}”. Not live research.`,
      ...exampleReport.caveats.filter((item) => !item.startsWith("This is bundled")),
    ],
  };
}
