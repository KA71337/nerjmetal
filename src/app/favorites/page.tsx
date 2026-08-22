"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useStore } from "@/components/app-providers";
import seed from "@/data/products.json";
import type { Product } from "@/types";

export default function Favorites() {
  const store = useStore();
  const all = store.products.length ? store.products : (seed as Product[]);
  const items = all.filter((product) => store.favorites.includes(product.id));

  return (
    <main id="main" className="container-wide min-h-screen pb-24 pt-32 md:pt-40">
      <header className="catalog-head">
        <p className="eyebrow">Sizin seçiminiz</p>        <h1>Favoritlər</h1>
        <p className="catalog-lede">
          Favorit kataloqda saxlanılır. Sifariş üçün «Seç» düyməsi ilə siyahıya əlavə edin və Link yarat düyməsini basın.
        </p>
      </header>

      {items.length > 0 ? (
        <div className="product-grid mt-12">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="cat-empty mt-12">
          <Heart size={26} className="text-[var(--acid)]" />
          <h3>Hələ seçilmiş məhsul yoxdur</h3>
          <p>Kataloqda ürək işarəsinə toxunaraq məhsulları buraya əlavə edin.</p>
          <Link href="/catalog" className="btn btn-acid">
            Kataloqa keç
          </Link>
        </div>
      )}
    </main>
  );
}
