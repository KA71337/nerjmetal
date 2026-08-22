import { NextResponse, type NextRequest } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/session";
import { timingSafeEqual } from "node:crypto";
import { createHash } from "node:crypto";
import { rateLimit, rateLimitReset } from "@/lib/rate-limit";

/** Strict brute-force brake: 5 attempts / 10 min, then a 15 min lockout. */
const MAX_ATTEMPTS = 5;

function clientKey(request: NextRequest): string {
  return `login:${request.headers.get("x-real-ip") || request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"}`;
}

/** Length-safe constant-time comparison of the two secrets. */
function passwordMatches(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const a = createHash("sha256").update(expected).digest();
  const b = createHash("sha256").update(candidate).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    /* Fail closed: without a configured password nothing ever authenticates. */
    return NextResponse.json({ error: "Server konfiqurasiyası tamam deyil" }, { status: 503 });
  }

  const verdict = rateLimit(clientKey(request), { limit: MAX_ATTEMPTS, windowMs: 10 * 60_000, lockoutMs: 15 * 60_000 });
  if (!verdict.ok) {
    const minutes = Math.max(1, Math.ceil(verdict.retryAfterSec / 60));
    return NextResponse.json(
      { error: `Çox cəhd edildi. Təxminən ${minutes} dəq sonra yenidən yoxlayın.` },
      { status: 429, headers: { "Retry-After": String(verdict.retryAfterSec) } },
    );
  }

  let password = "";
  try {
    const body = await request.json() as { password?: unknown };
    if (typeof body.password === "string") password = body.password.slice(0, 200);
  } catch {
    return NextResponse.json({ error: "Sorğu formatı yanlışdır" }, { status: 400 });
  }

  if (!passwordMatches(password)) {
    /* Small constant delay blunts online guessing without hurting honest users. */
    await new Promise((resolve) => setTimeout(resolve, 350));
    return NextResponse.json({ error: "Şifrə yanlışdır" }, { status: 401 });
  }

  rateLimitReset(clientKey(request));
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: await createSessionToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return response;
}
