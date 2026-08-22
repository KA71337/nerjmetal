"use client";

import { useRef, useState } from "react";
import { Download, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { useStore } from "@/components/app-providers";
import type { Product } from "@/types";

const blank = { title: "", slug: "", price: "", description: "", category: "", images: "" };
const FIELDS = [
  ["title", "Ad *"],
  ["slug", "Slug"],
  ["price", "Qiymət"],
  ["category", "Kateqoriya"],
] as const;

/** Combining marks (U+0300–U+036F) left over after NFD normalisation. */
const DIACRITICS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, "g");

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Imported JSON is untrusted input: every field is coerced, length-capped and image paths are
 * restricted to local files or https URLs so nothing unexpected reaches next/image or the DOM.
 */
function sanitiseCatalog(input: unknown): Product[] {
  if (!Array.isArray(input)) throw new Error("Expected an array");
  return input.slice(0, 2000).map((raw) => {
    const item = (raw || {}) as Record<string, unknown>;
    const title = String(item.title ?? "").trim().slice(0, 300);
    if (!title) throw new Error("Missing title");
    const text = (key: string, max: number) => {
      const value = item[key];
      const out = value == null ? "" : String(value).slice(0, max);
      return out || undefined;
    };
    return {
      id: String(item.id ?? crypto.randomUUID()).slice(0, 80),
      slug: slugify(String(item.slug ?? "").slice(0, 160)) || slugify(title),
      title,
      price: text("price", 60),
      currency: text("currency", 8),
      description: text("description", 8000),
      category: text("category", 120),
      images: Array.isArray(item.images)
        ? item.images
            .filter((src): src is string => typeof src === "string" && (src.startsWith("/") || src.startsWith("https://")))
            .slice(0, 60)
        : [],
    } satisfies Product;
  });
}

export default function Admin() {
  const store = useStore();
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function save() {
    if (!form.title.trim()) return;
    const product: Product = {
      id: editing || crypto.randomUUID(),
      slug: slugify(form.slug || form.title),
      title: form.title.trim(),
      price: form.price || undefined,
      description: form.description || undefined,
      category: form.category || undefined,
      images: form.images.split("\n").map((line) => line.trim()).filter(Boolean),
    };
    store.setProducts(editing ? store.products.map((item) => (item.id === editing ? product : item)) : [...store.products, product]);
    setForm(blank);
    setEditing(null);
  }

  function edit(product: Product) {
    setEditing(product.id);
    setForm({
      title: product.title,
      slug: product.slug,
      price: product.price || "",
      description: product.description || "",
      category: product.category || "",
      images: product.images.join("\n"),
    });
  }

  function download() {
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(new Blob([JSON.stringify(store.products, null, 2)], { type: "application/json" }));
    anchor.download = "nerj-metal-products.json";
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  async function upload(file?: File) {
    if (!file) return;
    try {
      const products = sanitiseCatalog(JSON.parse(await file.text()));
      store.setProducts(products);
      setNotice(`${products.length} məhsul yükləndi.`);
    } catch {
      setNotice("Düzgün məhsul JSON faylı seçin.");
    }
  }
  return (
    <main id="main" className="container-wide admin-page min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Local admin</p>
          <h1 className="mt-2 text-4xl font-black uppercase">Məhsul idarəetməsi</h1>
        </div>
        <a href="/" className="btn">
          Sayta qayıt
        </a>
      </div>
      <p className="mt-4 max-w-2xl text-sm text-white/50">
        Məlumat bu brauzerin localStorage yaddaşında saxlanılır. Saytda daimi görünmək üçün JSON export edin və
        <code className="mx-1 text-white/70">src/data/products.json</code> faylına əlavə edin.
      </p>
      {notice && (
        <p className="panel mt-4 flex items-center justify-between gap-4 p-3 text-sm text-white/70">
          {notice}
          <button type="button" onClick={() => setNotice("")} aria-label="Bildirişi bağla">
            <X size={16} />
          </button>
        </p>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        <section className="panel p-6">
          <h2 className="text-xl font-bold">{editing ? "Məhsulu redaktə et" : "Yeni məhsul"}</h2>
          <div className="mt-5 space-y-3">
            {FIELDS.map(([key, label]) => (
              <label key={key} className="block text-xs uppercase tracking-wider text-white/60">
                {label}
                <input
                  value={form[key]}
                  onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  className="mt-1 w-full border border-white/15 bg-black p-3 text-white"
                />
              </label>
            ))}
            <label className="block text-xs uppercase tracking-wider text-white/60">
              Təsvir
              <textarea
                rows={5}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="mt-1 w-full border border-white/15 bg-black p-3 text-white"
              />
            </label>
            <label className="block text-xs uppercase tracking-wider text-white/60">
              Şəkil URL-ləri (hər sətirdə biri)
              <textarea
                rows={4}
                value={form.images}
                onChange={(event) => setForm({ ...form, images: event.target.value })}
                className="mt-1 w-full border border-white/15 bg-black p-3 text-white"
              />
            </label>
            <button type="button" onClick={save} className="btn btn-acid w-full">
              {editing ? <Save size={16} /> : <Plus size={16} />}
              {editing ? "Yadda saxla" : "Əlavə et"}
            </button>
          </div>
        </section>
        <section>
          <div className="mb-4 flex flex-wrap gap-3">
            <button type="button" className="btn" onClick={download}>
              <Download size={16} /> Export JSON
            </button>
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Import JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(event) => upload(event.target.files?.[0])}
            />
          </div>
          <div className="space-y-3">
            {store.products.map((product) => (
              <article key={product.id} className="panel flex items-center gap-4 p-4">
                <button type="button" onClick={() => edit(product)} className="min-w-0 flex-1 text-left">
                  <b className="break-words">{product.title}</b>
                  <p className="text-xs text-white/40">
                    /{product.slug} · {product.category || "Kateqoriyasız"}
                  </p>
                </button>
                <button
                  type="button"
                  aria-label={`${product.title} — sil`}
                  className="icon-target"
                  onClick={() => store.setProducts(store.products.filter((item) => item.id !== product.id))}
                >
                  <Trash2 size={18} />
                </button>
              </article>
            ))}
            {!store.products.length && <p className="panel p-8 text-white/50">Local kataloq boşdur.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
