import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/**
 * Edge guard for the admin surface:
 * - `/admin` (except `/admin/login`) redirects anonymous visitors to the login screen;
 * - `/api/admin/*` (except `/api/admin/login`) answers 401 JSON instead.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  /* The login screen and the login endpoint itself must stay public. */
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
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
