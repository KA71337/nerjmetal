import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogClient } from "./catalog-client";
import { getSeedProducts } from "@/lib/products";
import { site } from "@/lib/site";

const title = "Paslanmayan polad kataloqu";
const description =
  "NERJ METAL kataloqu: paslanmayan polad avadanlıq, hovuz şəlaləsi, məhəccər, qida və sənaye üçün metal həllər. Kateqoriya, qiymət və sıralama üzrə filtrləyin.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/catalog" },
  openGraph: { title: `${title} — ${site.name}`, description, url: `${site.url}/catalog`, type: "website" },
  twitter: { card: "summary_large_image", title: `${title} — ${site.name}`, description },
};

export default function Catalog() {
  const seed = getSeedProducts();
  return (
    <main id="main" className="container-wide min-h-screen pb-24 pt-32 md:pt-40">
      <header className="catalog-head">
        <p className="eyebrow">Məhsullar / Kataloq</p>
        <h1>Kataloq</h1>
        <p className="catalog-lede">
          {seed.length} mövqe: paslanmayan polad avadanlıq, ölçüyə uyğun istehsal və quraşdırma. Kateqoriyanı seçin,
          axtarışdan istifadə edin və ya qiymətə görə filtrləyin.
        </p>
      </header>
      <Suspense fallback={<div className="cat-empty mt-12">Kataloq yüklənir…</div>}>
        <CatalogClient seed={seed} />
      </Suspense>
    </main>
  );
}
