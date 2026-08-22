import { NextResponse, type NextRequest } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/session";
import { timingSafeEqual } from "node:crypto";
import { createHash } from "node:crypto";

/** Basic in-memory brute-force throttle: 5 failed attempts per IP → 15 min lockout. */
const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function clientKey(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
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
  const key = clientKey(request);
  const entry = attempts.get(key);

  if (!process.env.ADMIN_PASSWORD) {
    /* Fail closed: without a configured password nothing ever authenticates. */
    return NextResponse.json({ error: "Server konfiqurasiyası tamam deyil" }, { status: 503 });
  }
  if (entry && entry.lockedUntil > Date.now()) {
    return NextResponse.json({ error: "Çox cəhd edildi. 15 dəqiqə sonra yenidən yoxlayın." }, { status: 429 });
  }

  let password = "";
  try {
    const body = await request.json() as { password?: unknown };
    if (typeof body.password === "string") password = body.password.slice(0, 200);
  } catch {
    return NextResponse.json({ error: "Sorğu formatı yanlışdır" }, { status: 400 });
  }

  if (!passwordMatches(password)) {
    const count = (entry?.count ?? 0) + 1;
    attempts.set(key, {
      count,
      lockedUntil: count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0,
    });
    /* Small constant delay blunts online guessing without hurting honest users. */
    await new Promise((resolve) => setTimeout(resolve, 350));
    return NextResponse.json({ error: "Şifrə yanlışdır" }, { status: 401 });
  }

  attempts.delete(key);
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
