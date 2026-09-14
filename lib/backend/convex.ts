export async function convexSubjectKey(subjectKey: string) {
  const bytes = new TextEncoder().encode(`onestar-subject:${subjectKey}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
