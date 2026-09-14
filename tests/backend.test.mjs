import assert from "node:assert/strict";
import test from "node:test";

import {
  canReserveCredits,
  idempotencyDecision,
  isReservationStale,
  ownsResource,
} from "../convex/lib/credits.ts";

test("credit reservation rejects negative cost and insufficient balance", () => {
  assert.equal(canReserveCredits(1, 1), true);
  assert.equal(canReserveCredits(0, 1), false);
  assert.equal(canReserveCredits(5, -1), false);
});

test("idempotency replays only matching input", () => {
  assert.equal(idempotencyDecision("same", "same", "complete"), "replay_complete");
  assert.equal(idempotencyDecision("same", "same", "failed"), "replay_failed");
  assert.equal(idempotencyDecision("same", "same", "running"), "in_progress");
  assert.equal(idempotencyDecision("first", "second", "complete"), "conflict");
});

test("resource ownership requires exact subject match", () => {
  assert.equal(ownsResource("subject-a", "subject-a"), true);
  assert.equal(ownsResource("subject-a", "subject-b"), false);
});

test("stale reservation starts only after timeout", () => {
  assert.equal(isReservationStale(1_000, 181_000, 180_000), false);
  assert.equal(isReservationStale(1_000, 181_001, 180_000), true);
});
