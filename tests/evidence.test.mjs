import assert from "node:assert/strict";
import test from "node:test";

import {
  buildProductIdentity,
  canonicalEvidenceUrl,
  claimExistsInSource,
  excerptExistsInSource,
  identitiesMatch,
  productRelationshipToIdea,
  ratingExistsInSource,
  sourceMatchesProduct,
} from "../lib/research/evidence.ts";

test("CoFoundMe search hint cannot relabel a CoFoundersLab result", () => {
  const coFoundMe = buildProductIdentity("CoFoundMe", "https://cofoundme.example");
  const result = {
    title: "CoFoundersLab reviews and alternatives",
    url: "https://reviews.example/cofounderslab",
    text: "Members discuss CoFoundersLab pricing and account problems.",
    highlights: [],
  };

  assert.equal(sourceMatchesProduct(result, coFoundMe), false);
  assert.equal(
    identitiesMatch(
      { name: "CoFoundMe", url: "https://cofoundme.example" },
      { name: "CoFoundersLab", url: "https://cofounderslab.com" },
    ),
    false,
  );
});

test("B-Match search hint cannot relabel b2match content", () => {
  const bMatch = buildProductIdentity("B-Match", "https://b-match.example");
  const result = {
    title: "b2match event networking platform",
    url: "https://community.example/b2match-review",
    text: "A review of b2match tools for conferences and hosted events.",
    highlights: ["b2match attendee scheduling"],
  };

  assert.equal(sourceMatchesProduct(result, bMatch), false);
  assert.equal(
    identitiesMatch(
      { name: "B-Match", url: "https://b-match.example" },
      { name: "b2match", url: "https://b2match.com" },
    ),
    false,
  );
});

test("official domain or exact alias verifies product identity", () => {
  const identity = buildProductIdentity("CoFoundersLab", "https://cofounderslab.com");
  assert.equal(
    sourceMatchesProduct(
      { title: "Pricing", url: "https://www.cofounderslab.com/pricing", text: "Choose a plan." },
      identity,
    ),
    true,
  );
  assert.equal(
    sourceMatchesProduct(
      {
        title: "Founder tools I stopped using",
        url: "https://reddit.com/r/startups/example",
        text: "CoFoundersLab made account discovery difficult for me.",
      },
      identity,
    ),
    true,
  );
});

test("adjacent products stay separate from direct lexical matches", () => {
  const idea = "A cofounder matching product for startup founders";
  assert.equal(
    productRelationshipToIdea(
      {
        title: "CoFoundersLab",
        url: "https://cofounderslab.com",
        text: "Find a cofounder and meet startup founders.",
      },
      idea,
    ),
    "direct",
  );
  assert.equal(
    productRelationshipToIdea(
      {
        title: "b2match",
        url: "https://b2match.com",
        text: "Event management and attendee networking for conferences.",
      },
      idea,
    ),
    "adjacent",
  );
});

test("excerpt must exist in retrieved source text", () => {
  const source = "Setup took three days, and support never replied to my ticket.";
  assert.equal(excerptExistsInSource("support never replied to my ticket", source), true);
  assert.equal(excerptExistsInSource("support was slow and unhelpful", source), false);
  assert.equal(excerptExistsInSource("too slow", source), false);
  assert.equal(claimExistsInSource("three days", source), true);
});

test("ratings survive only when source states them", () => {
  assert.equal(ratingExistsInSource(1.5, "My rating is 1.5 out of 5."), true);
  assert.equal(ratingExistsInSource(1, "Bad experience, would not recommend."), false);
});

test("tracking parameters do not defeat URL deduplication", () => {
  assert.equal(
    canonicalEvidenceUrl("https://example.com/review/?utm_source=newsletter&ref=home#comments"),
    "https://example.com/review",
  );
});
