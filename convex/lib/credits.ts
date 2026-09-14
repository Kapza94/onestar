export const ANONYMOUS_INITIAL_CREDITS = 5;

export type AnalysisState = "running" | "complete" | "failed";

export function idempotencyDecision(
  storedInputHash: string,
  incomingInputHash: string,
  state: AnalysisState,
) {
  if (storedInputHash !== incomingInputHash) return "conflict" as const;
  if (state === "complete") return "replay_complete" as const;
  if (state === "failed") return "replay_failed" as const;
  return "in_progress" as const;
}

export function canReserveCredits(balance: number, cost: number) {
  return Number.isInteger(cost) && cost >= 0 && balance >= cost;
}

export function ownsResource(resourceSubjectId: string, actorSubjectId: string) {
  return resourceSubjectId === actorSubjectId;
}

export function isReservationStale(startedAt: number, now: number, timeoutMs: number) {
  return timeoutMs > 0 && now - startedAt > timeoutMs;
}
