"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Heart, Plus } from "lucide-react";
import type { Product } from "@/types";
import { ProductVisual } from "./product-visual";
import { useStore } from "./app-providers";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleFavorite, favorites } = useStore();
  const liked = favorites.includes(product.id);
  const [added, setAdded] = useState(false);
  const href = `/catalog/${product.slug}`;

  useEffect(() => {
    if (!added) return;
    const id = setTimeout(() => setAdded(false), 1400);
    return () => clearTimeout(id);
  }, [added]);

  return (
    <article className="pcard">
      <Link href={href} className="pcard__media" aria-label={product.title}>
        <ProductVisual title={product.title} image={product.images[0]} />
        <span className="pcard__tag">{product.category || "Metal"}</span>
      </Link>
      <span className="pcard__sheen" aria-hidden="true" />
      <button
        type="button"
        className="pcard__fav"
        onClick={() => toggleFavorite(product.id)}
        aria-label={liked ? `${product.title} — seçilmişlərdən sil` : `${product.title} — seçilmişlərə əlavə et`}
        aria-pressed={liked}
      >
        <Heart size={17} className={liked ? "fill-current" : ""} />
      </button>
      <div className="pcard__body">
        <Link href={href} className="min-w-0">
          <span className="pcard__cat">{product.category || "Metal"}</span>
          <h3 className="pcard__title">{product.title}</h3>
        </Link>
        <div className="pcard__foot">
          <p className="pcard__price">
            {product.price || "Sorğu ilə"}
            <small>{product.price ? "qiymət" : "əlaqə saxlayın"}</small>
          </p>
          <button
            type="button"
            className={`pcard__cta${added ? " is-added" : ""}`}
            onClick={() => {
              addToCart(product);
              setAdded(true);
            }}
            aria-label={`${product.title} — səbətə əlavə et`}
          >
            {added ? <Check size={14} /> : <Plus size={14} />}
            <span>{added ? "Əlavə edildi" : "Səbətə"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
