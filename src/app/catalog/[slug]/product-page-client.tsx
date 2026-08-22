"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Heart, Phone, Plus } from "lucide-react";
import type { Product } from "@/types";
import { ProductVisual } from "@/components/product-visual";
import { useStore } from "@/components/app-providers";
import { jsonLdScript } from "@/lib/json-ld";
import { site } from "@/lib/site";

export function ProductPageClient({ slug, seed }: { slug: string; seed?: Product }) {
  const store = useStore();
  const product = store.products.find((item) => item.slug === slug) || seed;
  const [active, setActive] = useState(0);

  if (!product)
    return (
      <main id="main" className="container-wide state-page">
        <h1>Məhsul tapılmadı</h1>
        <p>Bu məhsul artıq mövcud deyil və ya ünvan səhvdir.</p>
        <Link href="/catalog" className="btn btn-acid">
          Kataloqa qayıt
        </Link>
      </main>
    );

  const liked = store.favorites.includes(product.id);
  const selected = Boolean(store.selection[product.id]);
  const lines = (product.description || "").split("\n").filter(Boolean);
  const specs = lines.filter((line) => /^\s*[-•·]/.test(line)).slice(0, 10);
  const priceValue = Number((product.price || "").replace(/[^\d.]/g, "")) || 0;
  const image = product.images[Math.min(active, product.images.length - 1)];

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.title,
        description: product.description || product.title,
        image: product.images.map((src) => `${site.url}${src}`),
        sku: product.id,
        category: product.category,
        brand: { "@type": "Brand", name: site.name },
        ...(priceValue
          ? {
              offers: {
                "@type": "Offer",
                price: priceValue,
                priceCurrency: product.currency || "AZN",
                availability: "https://schema.org/InStock",
                url: `${site.url}/catalog/${product.slug}`,
                seller: { "@type": "Organization", name: site.name },
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Ana səhifə", item: site.url },
          { "@type": "ListItem", position: 2, name: "Kataloq", item: `${site.url}/catalog` },
          { "@type": "ListItem", position: 3, name: product.title },
        ],
      },
    ],
  };
  return (
    <main id="main" className="product-page container-wide">
      <nav aria-label="Naviqasiya" className="product-crumb">
        <Link href="/">Ana səhifə</Link> / <Link href="/catalog">Kataloq</Link> / {product.title}
      </nav>

      <div className="product-layout">
        <section className="product-gallery" aria-label="Məhsul şəkilləri">
          <div className="product-main-image group">
            <ProductVisual
              title={product.title}
              image={image}
              priority
              quality={82}
              sizes="(max-width: 1023px) 100vw, 55vw"
            />
          </div>
          {product.images.length > 1 && (
            <div className="product-thumbs" role="group" aria-label="Şəkil qalereyası">
              {product.images.map((source, index) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`${index + 1}-ci şəkli göstər`}
                  aria-pressed={active === index}
                  className="relative"
                >
                  <ProductVisual title={`${product.title} — şəkil ${index + 1}`} image={source} sizes="88px" quality={45} />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="product-info">
          <h1>{product.title}</h1>
          <p className="product-cat eyebrow">{product.category || "Metal"}</p>
          <p className="product-price">
            {product.price || "Sorğu ilə"}
            <small>{product.price ? "ƏDV daxil deyil" : "qiymət üçün əlaqə"}</small>
          </p>

          <div className="product-actions">
            <button
              type="button"
              className={`btn ${selected ? "" : "btn-acid"}`}
              onClick={() => store.toggleSelect(product)}
              aria-pressed={selected}
            >
              {selected ? <Check size={17} /> : <Plus size={17} />}
              {selected ? "Seçildi ✓" : "Seç"}
            </button>
            <button
              type="button"
              className="btn icon-target"
              aria-label={liked ? "Seçilmişlərdən sil" : "Seçilmişlərə əlavə et"}
              aria-pressed={liked}
              onClick={() => store.toggleFavorite(product.id)}
            >
              <Heart size={18} className={liked ? "fill-current" : ""} />
            </button>
            <a href={`tel:${site.phone}`} className="btn icon-target" aria-label={`Zəng et: ${site.phoneLabel}`}>
              <Phone size={18} />
            </a>
          </div>
          <div className="product-description">
            <h2>Təsvir</h2>
            <p>
              {product.description ||
                "Ətraflı məlumat üçün məhsulu seçin, Link yarat düyməsi ilə sorğu göndərin və ya birbaşa zəng edin."}
            </p>
          </div>

          {specs.length > 0 && (
            <div className="product-specs">
              <h2>Xüsusiyyətlər</h2>
              <ul>
                {specs.map((line) => (
                  <li key={line}>{line.replace(/^\s*[-•·]\s*/, "")}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="product-meta">
            <div>
              <span>Kateqoriya</span>
              <span>{product.category || "Metal"}</span>
            </div>
            <div>
              <span>Məhsul kodu</span>
              <span>{product.id}</span>
            </div>
            <div>
              <span>Şəkil sayı</span>
              <span>{product.images.length}</span>
            </div>
            <div>
              <span>Ünvan</span>
              <span>{site.address.full}</span>
            </div>
          </div>
        </section>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }} />
    </main>
  );
}
