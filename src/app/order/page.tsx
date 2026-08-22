"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy, MessageCircle } from "lucide-react";
import { useStore } from "@/components/app-providers";

type Shared = { title: string; quantity: number };

const encode = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
};

/** Decodes a shared request payload defensively — anything unexpected is discarded. */
function decode(raw: string | null): Shared[] {
  if (!raw) return [];
  try {
    const binary = atob(raw);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map((item) => ({
        title: String(item.title ?? "").slice(0, 160),
        quantity: Math.min(999, Math.max(1, Math.floor(Number(item.quantity) || 1))),
      }))
      .filter((item) => item.title.length > 0)
      .slice(0, 60);
  } catch {
    return [];
  }
}

function OrderView() {
  const { cart } = useStore();
  const params = useSearchParams();
  const [copied, setCopied] = useState<"link" | "text" | null>(null);
  const [origin, setOrigin] = useState("");
  const shared = useMemo(() => decode(params.get("items")), [params]);

  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(null), 1600);
    return () => clearTimeout(id);
  }, [copied]);

  const rows: Shared[] = cart.length
    ? cart.map((item) => ({ title: item.product.title, quantity: item.quantity }))
    : shared;
  const text = useMemo(
    () =>
      [
        "NERJ METAL — məhsul sorğusu",
        ...rows.map((row, index) => `${index + 1}. ${row.title} × ${row.quantity}`),
        "",
        "Zəhmət olmasa mövcudluq və şərtlər barədə məlumat verin.",
      ].join("\n"),
    [rows],
  );
  const link = origin && rows.length ? `${origin}/order?items=${encodeURIComponent(encode(JSON.stringify(rows)))}` : "";

  async function copy(value: string, kind: "link" | "text") {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
    } catch {
      setCopied(null);
    }
  }
  return (
    <main id="main" className="container-wide min-h-screen pb-24 pt-32 md:pt-40">
      <header className="catalog-head">
        <p className="eyebrow">Sifariş sorğusu</p>
        <h1>Link yarat</h1>
        <p className="catalog-lede">
          Səbətinizi mətn və ya link kimi paylaşın. Link açıldıqda sorğudaki məhsullar göstərilir.
        </p>
      </header>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="text-xl font-bold">Məhsullar</h2>
          <pre className="mt-5 whitespace-pre-wrap font-sans leading-relaxed text-white/65">
            {rows.length ? text : "Səbət boşdur."}
          </pre>
        </section>
        <section className="panel p-6">
          <h2 className="text-xl font-bold">Paylaş</h2>
          <p className="mt-3 text-sm text-white/50">
            WhatsApp düyməsi telefon nömrəsi tələb etmədən paylaşma pəncərəsini açır.
          </p>
          <button type="button" disabled={!link} onClick={() => copy(link, "link")} className="btn mt-6 w-full">
            {copied === "link" ? <Check size={17} /> : <Copy size={17} />}
            {copied === "link" ? "Kopyalandı" : "Linki kopyala"}
          </button>
          <button type="button" disabled={!rows.length} onClick={() => copy(text, "text")} className="btn mt-3 w-full">
            {copied === "text" ? <Check size={17} /> : <Copy size={17} />}
            {copied === "text" ? "Kopyalandı" : "Mətni kopyala"}
          </button>
          {rows.length > 0 && (
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

export default function Order() {
  return (
    <Suspense fallback={<main id="main" className="container-wide state-page">Yüklənir…</main>}>
      <OrderView />
    </Suspense>
  );
}
