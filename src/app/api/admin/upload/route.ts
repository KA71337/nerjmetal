import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { githubConfig, putRemoteFile } from "@/lib/github-store";
import { rateLimit, requestKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 900 * 1024; /* GitHub Contents API + repo friendliness */
const MAX_FILES = 8;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const UPLOAD_DIR = "public/products/up";

/**
 * Stores admin product photos in the repo under /public/products/up/ and
 * returns site-root paths usable in the catalog's images[] arrays.
 */
export async function POST(request: NextRequest) {
  if (!githubConfig()) {
    return NextResponse.json({ error: "GitHub inteqrasiyası konfiqurasiya edilməyib" }, { status: 503 });
  }
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return NextResponse.json({ error: "Cross-origin sorğu rədd edildi" }, { status: 403 });
  }
  /* Upload abuse brake: 12 files / 5 min per IP. */
  if (!rateLimit(`upload:${requestKey(request)}`, { limit: 12, windowMs: 5 * 60_000 }).ok) {
    return NextResponse.json({ error: "Yükləmə limiti dolub. Bir az sonra yenidən cəhd edin." }, { status: 429 });
  }

  let files: File[];
  try {
    const form = await request.formData();
    files = form.getAll("files").filter((entry): entry is File => entry instanceof File);
  } catch {
    return NextResponse.json({ error: "Fayllar oxunmadı" }, { status: 400 });
  }
  if (!files.length) return NextResponse.json({ error: "Fayl seçilmədi" }, { status: 400 });
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Birdən çox ${MAX_FILES} fayl yükləmək olmaz` }, { status: 413 });
  }

  const paths: string[] = [];
  const errors: string[] = [];
  for (const file of files) {
    const extension = ALLOWED[file.type];
    if (!extension) {
      errors.push(`${file.name}: yalnız JPG, PNG və ya WEBP`);
      continue;
    }
    if (file.size > MAX_BYTES) {
      errors.push(`${file.name}: maksimal ölçü 900 KB`);
      continue;
    }
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      /* Second opinion on the real bytes — extension/mime headers can lie. */
      const isImage =
        (buffer[0] === 0xff && buffer[1] === 0xd8) ||
        (buffer[0] === 0x89 && buffer[1] === 0x50) ||
        (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[8] === 0x57);
      if (!isImage) {
        errors.push(`${file.name}: məzmun şəkil deyil`);
        continue;
      }
      const path = `${UPLOAD_DIR}/${randomUUID()}.${extension}`;
      await putRemoteFile(path, buffer.toString("base64"), `admin: şəkil ${file.name.slice(0, 40)}`);
      paths.push(`/${path.replace(/^public\//, "")}`);
    } catch (error) {
      errors.push(`${file.name}: ${error instanceof Error ? error.message : "yüklənmədi"}`);
    }
  }

  if (!paths.length) {
    return NextResponse.json({ error: errors.join("; ") || "Heç bir fayl yüklənmədi" }, { status: 422 });
  }
  return NextResponse.json({ ok: true, paths, ...(errors.length ? { warnings: errors } : {}) });
}
