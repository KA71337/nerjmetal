import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getSeedProducts } from "@/lib/products";
import { decodeOrder } from "@/lib/order-payload";
import { site } from "@/lib/site";

export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 };

/**
 * Composite Open Graph preview for shared order links: up to four product
 * photos on the industrial dark plate. Single-product links use the product's
 * own photo directly (see src/app/order/page.tsx), this route covers 2+.
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("items");
  const items = decodeOrder(raw);
  const seed = getSeedProducts();
  const products = items
    .map((item) => {
      const match =
        (item.id && seed.find((product) => product.id === item.id)) ||
        seed.find((product) => product.title.toLocaleLowerCase("az") === item.title.toLocaleLowerCase("az"));
      return match;
    })
    .filter((product): product is NonNullable<typeof product> => !!product)
    .slice(0, 4);

  const photos = await Promise.all(
    products.map(async (product) => {
      const source = product.images[0];
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

  /* Satori (the ImageResponse renderer) needs explicit font data; system fonts
     render Azerbaijani latin-ext fine through its default fallback. */
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
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: 4 }}>NERJ<span style={{ color: "#d9ff43" }}>/</span>METAL</div>
          <div style={{ fontSize: 22, color: "rgba(255,255,255,.55)", letterSpacing: 3 }}>
            {items.length} MƏHSUL · SİFARİŞ SORĞUSU
          </div>
        </div>
        <div
          style={{
            flex: 1, marginTop: 28, marginBottom: 24, display: "flex", gap: 16,
            border: "1px solid rgba(255,255,255,.14)", background: "#0d1113", padding: 20,
          }}
        >
          {(tiles.length ? tiles : [null, null, null]).slice(0, 4).map((photo, index) => (
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
          {site.address.city} · Paslanmayan polad həlləri · {site.phoneLabel}
        </div>
      </div>
    ),
    SIZE,
  );
}
