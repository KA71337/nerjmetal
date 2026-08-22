"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Plus } from "lucide-react";
import type { Product } from "@/types";
import { ProductVisual } from "./product-visual";
import { useStore } from "./app-providers";

/**
 * Catalog card. The primary action is SELECTION (not purchase): the button
 * morphs between "Seç" and "Seçildi ✓" with a scale/check transition.
 */
export function ProductCard({ product }: { product: Product }) {
  const { toggleSelect, isSelected, toggleFavorite, favorites } = useStore();
  const liked = favorites.includes(product.id);
  const selected = isSelected(product.id);
  const href = `/catalog/${product.slug}`;

  return (
    <article className={`pcard${selected ? " is-selected" : ""}`}>
      <Link href={href} className="pcard__media" aria-label={product.title}>
        <ProductVisual title={product.title} image={product.images[0]} />
        <span className="pcard__tag">{product.category || "Metal"}</span>
      </Link>
      {selected && (
        <motion.span
          className="pcard__picked"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 0.68, 0.16, 1] }}
        >
          <Check size={13} />
        </motion.span>
      )}
      <span className="pcard__sheen" aria-hidden="true" />
      <button
        type="button"
        className="pcard__fav"
        onClick={() => toggleFavorite(product.id)}
        aria-label={liked ? `${product.title} — favoritlərdən sil` : `${product.title} — favoritlərə əlavə et`}
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
            className={`pcard__cta${selected ? " is-selected" : ""}`}
            onClick={() => toggleSelect(product)}
            aria-label={`${product.title} — ${selected ? "seçimdən sil" : "siyahıya əlavə et"}`}
            aria-pressed={selected}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {selected ? (
                <motion.span
                  key="picked"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Check size={14} /> Seçildi
                </motion.span>
              ) : (
                <motion.span
                  key="pick"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Plus size={14} /> Seç
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </article>
  );
}
