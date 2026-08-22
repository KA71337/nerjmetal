import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded social preview card, prerendered at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(150deg, #14191c 0%, #0a0d0e 55%, #080a0b 100%)",
          color: "#f4f5f0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 26, height: 26, background: "#d9ff43" }} />
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 6, color: "#d9ff43" }}>NERJ / METAL</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 128, fontWeight: 900, lineHeight: 0.86, letterSpacing: -6, textTransform: "uppercase" }}>
            Güc. Dəqiqlik.
          </div>
          <div
            style={{
              fontSize: 132,
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: -6,
              textTransform: "uppercase",
              color: "#d9ff43",
            }}
          >
            Metal.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 26 }}>
          <div style={{ color: "#9aa1a3", letterSpacing: 2 }}>Paslanmayan polad həlləri · Bakı, AZ</div>
          <div style={{ fontWeight: 800, color: "#d9ff43" }}>{site.phoneLabel}</div>
        </div>
      </div>
    ),
    size,
  );
}
