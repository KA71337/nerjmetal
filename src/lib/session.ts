/**
 * Stateless admin session tokens.
 *
 * A session is `base64url(payload).base64url(HMAC-SHA256(payload, secret))`.
 * Verification is timing-safe and only ever runs server-side (route handlers +
 * middleware); the secret never reaches the browser because the cookie value is
 * just the signed payload — the key stays in the runtime environment.
 *
 * Uses Web Crypto so the same helpers work in Node route handlers and in the
 * Edge middleware runtime.
 */
const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** SESSION_SECRET when present; otherwise a deterministic dev fallback derived from ADMIN_PASSWORD. */
export function sessionSecret(): string {
  return process.env.SESSION_SECRET || `nerj-derived:${process.env.ADMIN_PASSWORD ?? "unset"}`;
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toBase64Url(new Uint8Array(signature));
}

/** Constant-time string comparison (equalises length first via SHA-256 digests). */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ]);
  if (da.byteLength !== db.byteLength) return false;
  let diff = 0;
  for (const [index, byte] of new Uint8Array(da).entries()) diff |= byte ^ new Uint8Array(db)[index];
  return diff === 0;
}

export const SESSION_COOKIE = "nerj_admin";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; /* one working day */

export async function createSessionToken(): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ v: 1, exp: Date.now() + SESSION_TTL_MS })));
  const signature = await hmac(sessionSecret(), payload);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (signature.length > 128) return false;
  try {
    const expected = await hmac(sessionSecret(), payload);
    if (!(await safeEqual(expected, signature))) return false;
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { v?: number; exp?: number };
    return data.v === 1 && typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}
