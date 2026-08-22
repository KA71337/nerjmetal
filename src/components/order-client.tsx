"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, MessageCircle, PackageSearch } from "lucide-react";
import type { Product } from "@/types";
import { ProductCard } from "@/components/product-card";
import { useStore } from "@/components/app-providers";
import seed from "@/data/products.json";
import { decodeOrder, encodeOrder, type OrderItem } from "@/lib/order-payload";

/**
 * Shared-order view: resolves the ?items= payload into real catalog products so
 * the recipient sees photos, prices and categories — not a bare text list.
 */
export function OrderClient({ raw }: { raw?: string }) {
  const { cart, products: storeProducts } = useStore();
  const [copied, setCopied] = useState<"link" | "text" | null>(null);
  const [origin, setOrigin] = useState("");
  const shared: OrderItem[] = useMemo(() => decodeOrder(raw), [raw]);

  const all = useMemo<Product[]>(
    () => (storeProducts.length ? storeProducts : (seed as Product[])),
    [storeProducts],
  );

  /* Live cart wins; otherwise show whatever the link carries. */
  const items: OrderItem[] = cart.length
    ? cart.map((entry) => ({ id: entry.product.id, title: entry.product.title, quantity: entry.quantity }))
    : shared;

  const products = useMemo(() => {
    const seen = new Set<string>();
    return items
      .map((item) => {
        const match =
          (item.id && all.find((product) => product.id === item.id)) ||
          all.find((product) => product.title.toLocaleLowerCase("az") === item.title.toLocaleLowerCase("az"));
        return match;
      })
      .filter((product): product is Product => !!product)
      .filter((product) => {
        if (seen.has(product.id)) return false;
        seen.add(product.id);
        return true;
      });
  }, [items, all]);

  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  const shareItems = items.length
    ? items
    : [];
  const text = useMemo(
    () =>
      [
        "NERJ METAL — məhsul sorğusu",
        ...shareItems.map((item, index) => `${index + 1}. ${item.title} × ${item.quantity}`),
        "",
        "Zəhmət olmasa mövcudluq və şərtlər barədə məlumat verin.",
      ].join("\n"),
    [shareItems],
  );
  const link = origin && shareItems.length
    ? `${origin}/order?items=${encodeURIComponent(encodeOrder(shareItems))}`
    : "";

  async function copy(value: string, kind: "link" | "text") {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
    } catch {
      setCopied(null);
    }
  }

  const unmatched = items.length - products.length;

  return (
    <main id="main" className="container-wide min-h-screen pb-24 pt-32 md:pt-40">
      <header className="catalog-head">
        <p className="eyebrow">Sifariş sorğusu</p>
        <h1>Link yarat</h1>
        <p className="catalog-lede">
          Səbətinizi məhsullarla birlikdə paylaşın. Link açan istifadəçi şəkilləri, qiymətləri və kateqoriyaları görür.
        </p>
      </header>

      {/* ------------------------------------------------ resolved products */}
      {products.length > 0 && (
        <section className="mt-12" aria-label="Seçilmiş məhsullar">
          <p className="section-label">
            Seçilmiş məhsullar <b>/ {products.length}</b>
          </p>
          <div className="product-grid mt-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
      {unmatched > 0 && (
        <p className="panel mt-6 p-4 text-sm text-white/55">
          <PackageSearch size={16} className="mr-2 inline text-[var(--acid)]" />
          {unmatched} mövqe kataloqda tapılmadı və yalnız siyahıda göstərilir.
        </p>
      )}

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="text-xl font-bold">Sorğu mətni</h2>
          <pre className="mt-5 whitespace-pre-wrap font-sans leading-relaxed text-white/65">
            {items.length ? text : "Səbət boşdur. Məhsul əlavə edin və ya paylaşılan linki açın."}
          </pre>
        </section>
        <section className="panel p-6">
          <h2 className="text-xl font-bold">Paylaş</h2>
          <p className="mt-3 text-sm text-white/50">
            Link WhatsApp, Telegram və ya e-poçt ilə göndərilə bilər — önizləmədə məhsul şəkli görünür.
          </p>
          <button type="button" disabled={!link} onClick={() => copy(link, "link")} className="btn mt-6 w-full">
            {copied === "link" ? <Check size={17} /> : <Copy size={17} />}
            {copied === "link" ? "Kopyalandı" : "Linki kopyala"}
          </button>
          <button type="button" disabled={!items.length} onClick={() => copy(text, "text")} className="btn mt-3 w-full">
            {copied === "text" ? <Check size={17} /> : <Copy size={17} />}
            {copied === "text" ? "Kopyalandı" : "Mətni kopyala"}
          </button>
          {items.length > 0 && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(link ? `${text}\n\n${link}` : text)}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-acid mt-3 w-full"
            >
              <MessageCircle size={17} /> WhatsApp ilə paylaş
            </a>
          )}
        </section>
      </div>
    </main>
  );
}
