"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/types";
import { ProductCard } from "@/components/product-card";
import { CategoryTiles, type CategoryTile } from "@/components/category-tiles";
import { useStore } from "@/components/app-providers";
import { useDebounced } from "@/lib/use-debounced";

const ALL = "__all__";
const DEFAULT_SORT = "default";
const priceOf = (value?: string) => Number((value || "").replace(/[^\d.]/g, "")) || 0;
const fold = (value: string) => value.toLocaleLowerCase("az");

export function CatalogClient({ seed }: { seed: Product[] }) {
  const { products } = useStore();
  const params = useSearchParams();
  const reduced = useReducedMotion();
  const all = products.length ? products : seed;

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [maxPrice, setMaxPrice] = useState("");
  const [sheet, setSheet] = useState(false);
  const [mounted, setMounted] = useState(false);
  const search = useDebounced(query, 200);

  useEffect(() => setMounted(true), []);

  /* Honour /catalog?q=... coming from the header search. */
  useEffect(() => {
    const incoming = params.get("q");
    if (incoming) setQuery(incoming);
  }, [params]);

  useEffect(() => {
    document.body.classList.toggle("overlay-open", sheet);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setSheet(false);
    addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("overlay-open");
      removeEventListener("keydown", onKey);
    };
  }, [sheet]);

  const categories = useMemo<CategoryTile[]>(() => {
    const groups = new Map<string, { count: number; image?: string }>();
    for (const product of all) {
      const key = product.category?.trim() || "Digər";
      const entry = groups.get(key) || { count: 0, image: undefined };
      entry.count += 1;
      entry.image = entry.image || product.images[0];
      groups.set(key, entry);
    }
    const sorted = [...groups.entries()].sort(
      (a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0], "az"),
    );
    return [
      { key: ALL, label: "Hamısı", count: all.length, image: all[0]?.images[0] },
      ...sorted.map(([label, value]) => ({ key: label, label, count: value.count, image: value.image })),
    ];
  }, [all]);

  const shown = useMemo(() => {
    const needle = fold(search.trim());
    const ceiling = maxPrice ? Number(maxPrice) : 0;
    const list = all.filter((product) => {
      if (category !== ALL && (product.category?.trim() || "Digər") !== category) return false;
      if (ceiling && priceOf(product.price) > ceiling) return false;
      if (!needle) return true;
      return fold(`${product.title} ${product.category || ""} ${product.description || ""}`).includes(needle);
    });
    return list.sort((a, b) =>
      sort === "low"
        ? priceOf(a.price) - priceOf(b.price)
        : sort === "high"
          ? priceOf(b.price) - priceOf(a.price)
          : a.title.localeCompare(b.title, "az"),
    );
  }, [all, search, category, maxPrice, sort]);

  const activeFilters = (category !== ALL ? 1 : 0) + (maxPrice ? 1 : 0) + (sort !== DEFAULT_SORT ? 1 : 0);
  const dirty = activeFilters > 0 || query.length > 0;
  function reset() {
    setCategory(ALL);
    setSort(DEFAULT_SORT);
    setMaxPrice("");
    setQuery("");
  }
  const fields = (
    <>
      <label className="cat-field">
        <span>Kateqoriya</span>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label} ({item.count})
            </option>
          ))}
        </select>
      </label>
      <label className="cat-field">
        <span>Maksimum qiymət (AZN)</span>
        <input
          inputMode="numeric"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value.replace(/\D/g, "").slice(0, 7))}
          placeholder="Məsələn, 1000"
        />
      </label>
      <label className="cat-field">
        <span>Sıralama</span>
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="default">Ada görə (A–Z)</option>
          <option value="low">Qiymət: aşağıdan yuxarı</option>
          <option value="high">Qiymət: yuxarıdan aşağı</option>
        </select>
      </label>
    </>
  );

  return (
    <>
      <section className="mt-12" aria-labelledby="cat-heading">
        <p className="section-label" id="cat-heading">
          Kateqoriyalar <b>/ {categories.length - 1}</b>
        </p>
        <div className="mt-5">
          <CategoryTiles items={categories} active={category} onSelect={setCategory} />
        </div>
      </section>

      <div className="cat-tools mt-10">
        <div className="cat-search">
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Məhsul, kateqoriya və ya ölçü axtar…"
            aria-label="Məhsul axtar"
            enterKeyHint="search"
            autoComplete="off"
          />
          {query && (
            <button type="button" className="cat-search__clear" onClick={() => setQuery("")} aria-label="Axtarışı təmizlə">
              <X size={17} />
            </button>
          )}
        </div>
        <div className="cat-filters">
          {fields}
          <button type="button" className="cat-reset" onClick={reset} disabled={!dirty}>
            <RotateCcw size={14} /> Sıfırla
          </button>
        </div>
        <button type="button" className="cat-filter-btn" onClick={() => setSheet(true)} aria-expanded={sheet}>
          <SlidersHorizontal size={17} /> Filtrlər
          {activeFilters > 0 && <b>{activeFilters}</b>}
        </button>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="cat-count" aria-live="polite">
          <b>{shown.length}</b> məhsul tapıldı
        </p>
        {(category !== ALL || maxPrice) && (
          <div className="cat-chips">
            {category !== ALL && (
              <span className="cat-chip">
                {category}
                <button type="button" onClick={() => setCategory(ALL)} aria-label="Kateqoriya filtrini sil">
                  <X size={13} />
                </button>
              </span>
            )}
            {maxPrice && (
              <span className="cat-chip">
                ≤ {maxPrice} AZN
                <button type="button" onClick={() => setMaxPrice("")} aria-label="Qiymət filtrini sil">
                  <X size={13} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {shown.length > 0 ? (
        <div className="product-grid mt-5">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((product, index) => (
              <motion.div
                key={product.id}
                layout={!reduced}
                initial={reduced ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.45, delay: Math.min(index * 0.035, 0.35), ease: [0.22, 0.68, 0.16, 1] }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="cat-empty mt-5">
          <h3>Nəticə tapılmadı</h3>
          <p>Axtarış sözünü dəyişin, qiymət limitini artırın və ya bütün kateqoriyalara qayıdın.</p>
          <button type="button" className="btn btn-acid" onClick={reset}>
            <RotateCcw size={15} /> Filtrləri sıfırla
          </button>
        </div>
      )}
      {/* Portalled to <body>: the page-transition wrapper is a transformed ancestor, which would
          otherwise become the containing block for these fixed-position overlays. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {sheet && (
              <>
                <motion.button
                  type="button"
                  className="filters-backdrop"
                  aria-label="Filtrləri bağla"
                  onClick={() => setSheet(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                />
                <motion.section
                  role="dialog"
                  aria-modal="true"
                  aria-label="Kataloq filtrləri"
                  className="filters-sheet"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 32, stiffness: 300 }}
                >
                  <header>
                    <h2>Filtrlər</h2>
                    <button type="button" autoFocus onClick={() => setSheet(false)} aria-label="Filtrləri bağla">
                      <X size={20} />
                    </button>
                  </header>
                  {fields}
                  <div className="filters-sheet__actions">
                    <button type="button" className="btn" onClick={reset} disabled={!dirty}>
                      <RotateCcw size={15} /> Sıfırla
                    </button>
                    <button type="button" className="btn btn-acid" onClick={() => setSheet(false)}>
                      {shown.length} məhsulu göstər
                    </button>
                  </div>
                </motion.section>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
