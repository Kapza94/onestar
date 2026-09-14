export async function hashAnalysisInput(input: { idea: string; competitorUrls: string[] }) {
  const canonical = JSON.stringify({
    idea: input.idea.trim().replace(/\s+/g, " "),
    competitorUrls: [...input.competitorUrls].sort(),
  });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function requestId(request: Request) {
  const value = request.headers.get("idempotency-key")?.trim() ?? "";
  return /^[A-Za-z0-9._:-]{8,128}$/.test(value) ? value : crypto.randomUUID();
}
