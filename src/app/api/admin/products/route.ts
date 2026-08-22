import { NextResponse, type NextRequest } from "next/server";
import { getRemoteFile, githubConfig, putRemoteFile } from "@/lib/github-store";
import { sanitiseCatalog, serializeCatalog } from "@/lib/product-schema";
import { rateLimit, requestKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRODUCTS_PATH = process.env.GITHUB_PRODUCTS_PATH || "src/data/products.json";

/** Commit spam brake: 10 writes / 5 min per IP (admin UI needs only a few). */
function writeLimited(request: NextRequest): boolean {
  return rateLimit(`put:${requestKey(request)}`, { limit: 10, windowMs: 5 * 60_000 }).ok;
}

/** Same-origin enforcement for mutating requests (CSRF defence on top of SameSite=Lax). */
function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; /* non-browser clients without Origin still need the cookie anyway */
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

/** Latest committed catalog + blob sha for optimistic concurrency. */
export async function GET() {
  if (!githubConfig()) {
    return NextResponse.json({ error: "GitHub inteqrasiyası konfiqurasiya edilməyib" }, { status: 503 });
  }
  try {
    const file = await getRemoteFile(PRODUCTS_PATH);
    if (!file) return NextResponse.json({ products: [], sha: "" });
    return NextResponse.json({ products: sanitiseCatalog(JSON.parse(file.content)), sha: file.sha });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kataloq oxunmadı" },
      { status: 502 },
    );
  }
}

/** Commits a full sanitized catalog back to GitHub (Vercel then redeploys). */
export async function PUT(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin sorğu rədd edildi" }, { status: 403 });
  }
  if (!writeLimited(request)) {
    return NextResponse.json({ error: "Çox tez-tez yadda saxlanılır. Bir az gözləyin." }, { status: 429 });
  }
  if (!githubConfig()) {
    return NextResponse.json({ error: "GitHub inteqrasiyası konfiqurasiya edilməyib" }, { status: 503 });
  }
  let payload: { products?: unknown; sha?: string };
  try {
    payload = await request.json() as { products?: unknown; sha?: string };
  } catch {
    return NextResponse.json({ error: "Sorğu formatı yanlışdır" }, { status: 400 });
  }

  let products;
  try {
    products = sanitiseCatalog(payload.products);
    if (!products.length) throw new Error("Kataloq boş ola bilməz");
  } catch (error) {
    return NextResponse.json(
      { error: `Məlumat validasiyası alınmadı: ${error instanceof Error ? error.message : "naməlum səhv"}` },
      { status: 422 },
    );
  }

  try {
    const current = await getRemoteFile(PRODUCTS_PATH);
    /* Optimistic locking: refuse to clobber changes made elsewhere meanwhile. */
    if ((current?.sha ?? "") !== (payload.sha ?? "")) {
      return NextResponse.json({ error: "Kataloq arxa planda dəyişib. Yeniləyin." }, { status: 409 });
    }
    const result = await putRemoteFile(
      PRODUCTS_PATH,
      serializeCatalog(products),
      "admin: kataloq yeniləndi",
      current?.sha,
    );
    return NextResponse.json({ ok: true, commit: result });
  } catch (error) {
    if (error instanceof Error && error.name === "ConflictError") {
      return NextResponse.json({ error: "Konflikt: fayl başqa commit ilə dəyişib" }, { status: 409 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Yadda saxlanmadı" },
      { status: 502 },
    );
  }
}
