import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getSeedProductById } from "@/lib/products";
import { decodeSelection } from "@/lib/order-payload";
import { site } from "@/lib/site";

export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 };

/**
 * Composite Open Graph preview for shared order links (2+ products): up to
 * four product photos on the industrial dark plate. Single-product links use
 * the product's own photo directly — see /order/[token] generateMetadata.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const entries = decodeSelection(token);
  const rows = entries
    .map((entry) => ({ entry, product: getSeedProductById(entry.id) }))
    .filter((row) => Boolean(row.product))
    .slice(0, 4);
  const count = Math.max(entries.length, rows.length);

  const photos = await Promise.all(
    rows.map(async ({ product }) => {
      const source = product?.images[0];
      if (!source || !source.startsWith("/")) return null;
      try {
        const file = await readFile(path.join(process.cwd(), "public", source));
        const extension = source.endsWith(".png") ? "png" : source.endsWith(".webp") ? "webp" : "jpeg";
        return `data:image/${extension};base64,${file.toString("base64")}`;
      } catch {
        return null;
      }
    }),
  );
  const tiles = photos.filter((photo): photo is string => !!photo);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          background: "#08090a", color: "#f4f5f0",
          fontFamily: "sans-serif", padding: 48,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 900, letterSpacing: 4 }}>
            <span>NERJ</span>
            <span style={{ color: "#d9ff43" }}>/</span>
            <span>METAL</span>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,.55)", letterSpacing: 3 }}>
            {`${count} MƏHSUL · SİFARİŞ`}
          </div>
        </div>
        <div
          style={{
            flex: 1, marginTop: 28, marginBottom: 24, display: "flex", gap: 16,
            border: "1px solid rgba(255,255,255,.14)", background: "#0d1113", padding: 20,
          }}
        >
          {(tiles.length ? tiles : [null]).slice(0, 4).map((photo, index) => (
            <div
              key={index}
              style={{
                flex: 1, position: "relative", overflow: "hidden",
                border: "1px solid rgba(255,255,255,.12)", background: "#10151a",
                display: "flex",
              }}
            >
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} width={260} height={380} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
              )}
              {!photo && (
                <div style={{ margin: "auto", color: "rgba(255,255,255,.2)", fontSize: 30, fontWeight: 900 }}>
                  NM
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ height: 6, background: "linear-gradient(90deg,#d9ff43,rgba(217,255,67,.15))" }} />
        <div style={{ marginTop: 18, fontSize: 26, color: "rgba(255,255,255,.65)", letterSpacing: 1 }}>
          {`${site.address.city} · Paslanmayan polad həlləri · ${site.phoneLabel}`}
        </div>
      </div>
    ),
    SIZE,
  );
}

