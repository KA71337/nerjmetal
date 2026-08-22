import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  /* Full logout: the signed cookie is dropped client-side; statelessness means
     there is no server-side session left to revoke. Old tokens die with TTL. */
  response.cookies.set({ name: SESSION_COOKIE, value: "", path: "/", maxAge: 0 });
  return response;
}
