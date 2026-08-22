import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { rateLimit, requestKey } from "@/lib/rate-limit";

/**
 * Edge guard for the whole site:
 * - scanner/noise paths (.env, .git, wp-*, *.php …) are dropped instantly;
 * - /api/* is throttled per IP (cheap DDoS/abuse brake at app level);
 * - /admin and /api/admin/* additionally require a signed session cookie.
 */
const SCANNER_PATTERN =
  /^\/(?:\.env|\.git|\.svn|\.hg|\.aws|\.ssh|wp-(?:admin|content|login)|phpmyadmin|pma|xmlrpc\.php|adminer|\.well-known\/security\.txt$|vendor\/phpunit|cgi-bin|\.DS_Store|composer\.(?:json|lock)|web\.config|\.aspx?|\.php$)/i;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* Drop vulnerability scanners before touching any app logic. */
  if (SCANNER_PATTERN.test(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  /* App-level throttle for API surfaces only — never for pages/assets,
     so real users behind shared IPs are unaffected. */
  if (pathname.startsWith("/api/")) {
    const verdict = rateLimit(`api:${requestKey(request)}`, { limit: 30, windowMs: 60_000, lockoutMs: 60_000 });
    if (!verdict.ok) {
      return NextResponse.json(
        { error: "Çox sorğu göndərildi" },
        { status: 429, headers: { "Retry-After": String(verdict.retryAfterSec) } },
      );
    }
  }

  /* The login screen and the login endpoint itself must stay public
     (the login route applies its own strict brute-force limiter). */
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const authenticated = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (authenticated) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /* Run on everything except static assets to keep the edge work minimal. */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|manifest.webmanifest|robots.txt|sitemap.xml|brand/|media/|products/).*)",
  ],
};
