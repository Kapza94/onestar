const COOKIE_NAME = "onestar_sid";
const COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
const SUBJECT_PATTERN = /^[0-9a-f-]{36}$/i;

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function signingSecret() {
  const value = process.env.ANON_SESSION_SECRET?.trim();
  if (value && (process.env.NODE_ENV !== "production" || value.length >= 32)) return value;
  if (process.env.NODE_ENV !== "production") return "onestar-local-development-cookie-secret";
  throw new Error("ANON_SESSION_SECRET must contain at least 32 characters in production");
}

async function signature(subjectKey: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(subjectKey))));
}

function secureEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function cookieValue(request: Request) {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export type SubjectSession = {
  subjectKey: string;
  cookie: string | null;
};

export async function resolveSubjectSession(request: Request): Promise<SubjectSession> {
  const token = cookieValue(request);
  if (token) {
    const separator = token.lastIndexOf(".");
    const subjectKey = token.slice(0, separator);
    const suppliedSignature = token.slice(separator + 1);
    if (separator > 0 && SUBJECT_PATTERN.test(subjectKey)) {
      const expectedSignature = await signature(subjectKey);
      if (secureEqual(suppliedSignature, expectedSignature)) return { subjectKey, cookie: null };
    }
  }

  const subjectKey = crypto.randomUUID();
  const tokenValue = `${subjectKey}.${await signature(subjectKey)}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return {
    subjectKey,
    cookie: `${COOKIE_NAME}=${encodeURIComponent(tokenValue)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${secure}`,
  };
}

export function attachSubjectCookie(response: Response, session: SubjectSession) {
  if (session.cookie) response.headers.append("Set-Cookie", session.cookie);
  return response;
}
