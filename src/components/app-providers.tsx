"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/types";
import { SelectionBar } from "./selection-bar";

/**
 * Public store = catalog + favorites + the temporary product SELECTION.
 * There is deliberately no cart/checkout state: users pick products and share
 * a link. `selection` maps productId → quantity for the sender's working list
 * only — shared links never depend on it (see /order/[token]).
 */
const STORE_PRODUCTS = "nerj-products", STORE_SELECTION = "nerj-selection", STORE_FAV = "nerj-favorites";
type Store = {
  products: Product[];
  selection: Record<string, number>;
  selectedIds: string[];
  toggleSelect: (product: Product) => void;
  isSelected: (id: string) => boolean;
  setQty: (id: string, quantity: number) => void;
  removeSelected: (id: string) => void;
  clearSelection: () => void;
  selectCount: number;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  setProducts: (products: Product[]) => void;
  selectOpen: boolean;
  setSelectOpen: (open: boolean) => void;
};
const Ctx = createContext<Store | null>(null);
export function useStore() { const value = useContext(Ctx); if (!value) throw new Error("Store unavailable"); return value; }

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [products, setProductsState] = useState<Product[]>([]);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectOpen, setSelectOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const rawSelection = JSON.parse(localStorage.getItem(STORE_SELECTION) || "{}");
      /* Guard against corrupted storage: keep numeric entries only. */
      const clean: Record<string, number> = {};
      for (const [id, qty] of Object.entries(rawSelection)) {
        if (/^\d{1,20}$/.test(id) && typeof qty === "number" && qty >= 1 && qty <= 999) clean[id] = Math.floor(qty);
      }
      setSelection(clean);
      setFavorites(JSON.parse(localStorage.getItem(STORE_FAV) || "[]"));
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(STORE_SELECTION, JSON.stringify(selection)); }, [selection, ready]);
  useEffect(() => { if (ready) localStorage.setItem(STORE_FAV, JSON.stringify(favorites)); }, [favorites, ready]);
  /* Products stay in localStorage only as a cache of the last committed catalog
     for instant UI; the committed JSON remains the single source of truth. */
  useEffect(() => { try { setProductsState(JSON.parse(localStorage.getItem(STORE_PRODUCTS) || "[]")); } finally { setReady(true); } }, []);
  useEffect(() => { if (ready && products.length) localStorage.setItem(STORE_PRODUCTS, JSON.stringify(products)); }, [products, ready]);

  const selectedIds = useMemo(() => Object.keys(selection), [selection]);
  const selectCount = useMemo(() => selectedIds.reduce((total, id) => total + selection[id], 0), [selectedIds, selection]);

  const value = useMemo<Store>(() => ({
    products,
    selection,
    selectedIds,
    selectCount,
    favorites,
    toggleSelect: (product: Product) =>
      setSelection((current) => {
        const next = { ...current };
        if (next[product.id]) delete next[product.id];
        else next[product.id] = 1;
        return next;
      }),
    isSelected: (id: string) => Boolean(selection[id]),
    setQty: (id: string, quantity: number) =>
      setSelection((current) => ({ ...current, [id]: Math.min(999, Math.max(1, Math.floor(quantity) || 1)) })),
    removeSelected: (id: string) =>
      setSelection((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      }),
    clearSelection: () => setSelection({}),
    toggleFavorite: (id: string) => setFavorites((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])),
    setProducts: setProductsState,
    selectOpen,
    setSelectOpen,
  }), [products, selection, selectedIds, selectCount, favorites, selectOpen]);

  return <Ctx.Provider value={value}>{children}<SelectionBar /></Ctx.Provider>;
}
