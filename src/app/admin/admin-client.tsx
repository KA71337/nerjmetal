"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle, Check, ChevronLeft, ChevronRight, Download, LogOut,
  Package, Pencil, Plus, RotateCcw, Search, Save, Trash2, Upload, X,
} from "lucide-react";
import type { Product } from "@/types";
import { priceToText, sanitiseCatalog, slugify } from "@/lib/product-schema";
import { encodeSelection, orderLink } from "@/lib/order-payload";

type Draft = {
  id: string; title: string; category: string; price: string; oldPrice: string;
  inStock: boolean; description: string; link: string; images: string[];
};
const EMPTY_DRAFT: Draft = {
  id: "", title: "", category: "", price: "", oldPrice: "",
  inStock: true, description: "", link: "", images: [],
};
const PAGE_SIZE = 18;
const numeric = (value?: string) => Number((value || "").replace(/[^\d]/g, "")) || 0;

/* ------------------------------------------------------------------ toasts */
type Toast = { id: number; kind: "ok" | "error"; text: string };

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-2), { id, kind, text }]);
    setTimeout(() => setToasts((list) => list.filter((item) => item.id !== id)), 3400);
  }, []);
  return { toasts, push };
}

/* --------------------------------------------------------- confirmation dialog */
function ConfirmDialog({ product, busy, onCancel, onConfirm }: {
  product: Product; busy: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <motion.div className="adm-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-label="Silmə təsdiqi"
        className="adm-modal adm-confirm"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.32, ease: [0.22, 0.68, 0.16, 1] }}
      >
        <span className="adm-confirm__icon"><AlertTriangle size={22} /></span>
        <h2>Silinsin?</h2>
        <p>«{product.title}» kataloqdan silinəcək.</p>
        <div className="adm-confirm__row">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>Ləğv et</button>
          <button type="button" className="btn adm-btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Silinir…" : <><Trash2 size={15} /> Sil</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------- product form */
function ProductForm({
  draft, categories, saving, uploading, error,
  onField, onCancel, onSave, onUpload, onImageRemove,
}: {
  draft: Draft; categories: string[]; saving: boolean; uploading: boolean; error: string;
  onField: (patch: Partial<Draft>) => void; onCancel: () => void; onSave: () => void;
  onUpload: (files: FileList) => void; onImageRemove: (index: number) => void;
}) {
  const reduced = useReducedMotion();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const validTitle = draft.title.trim().length >= 2;
  const priceOk = !draft.price || Number.isFinite(Number(draft.price));
  const oldPriceOk = !draft.oldPrice || numeric(draft.oldPrice) <= numeric(draft.price);
  const linkOk = !draft.link || /^https:\/\//.test(draft.link);
  const canSave = validTitle && priceOk && oldPriceOk && linkOk && !saving;

  return (
    <motion.div
      className="adm-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="adm-form-title"
        className="adm-modal adm-form"
        initial={{ opacity: 0, y: 42, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.99 }}
        transition={{ duration: 0.4, ease: [0.22, 0.68, 0.16, 1] }}
      >
        <header className="adm-form__head">
          <h2 id="adm-form-title">{draft.title ? "Məhsulu redaktə et" : "Yeni məhsul"}</h2>
          <button type="button" onClick={onCancel} aria-label="Bağla" className="adm-iconbtn" disabled={saving}>
            <X size={20} />
          </button>
        </header>

        <form
          id="adm-product-form"
          className="adm-form__scroll"
          onSubmit={(event) => { event.preventDefault(); if (canSave) onSave(); }}
        >
          <div className="adm-form__grid">
            <label className="adm-field">
              <span>ID</span>
              <input
                value={draft.id}
                onChange={(event) => onField({ id: event.target.value.replace(/\D/g, "").slice(0, 12) })}
                placeholder="Avtomatik"
                inputMode="numeric"
              />
            </label>
            <label className="adm-field">
              <span>Kateqoriya</span>
              <input
                list="adm-categories"
                value={draft.category}
                onChange={(event) => onField({ category: event.target.value.slice(0, 120) })}
                placeholder="Məsələn: Biznes üçün avadanlıq"
                maxLength={120}
              />
              <datalist id="adm-categories">
                {categories.map((name) => <option key={name} value={name} />)}
              </datalist>
            </label>
            <label className="adm-field adm-field--full">
              <span>Ad *</span>
              <input
                value={draft.title}
                onChange={(event) => onField({ title: event.target.value.slice(0, 300) })}
                required
                minLength={2}
                maxLength={300}
                placeholder="Məhsulun adı"
              />
            </label>
            <label className="adm-field">
              <span>Qiymət (AZN)</span>
              <input
                value={draft.price}
                onChange={(event) => onField({ price: event.target.value.replace(/[^\d]/g, "").slice(0, 7) })}
                inputMode="numeric"
                placeholder="530"
              />
            </label>
            <label className="adm-field">
              <span>Endirimli qiymət</span>
              <input
                value={draft.oldPrice}
                onChange={(event) => onField({ oldPrice: event.target.value.replace(/[^\d]/g, "").slice(0, 7) })}
                inputMode="numeric"
                placeholder="Boş — endirim yoxdur"
              />
              {!oldPriceOk && <em>Endirimli qiymət əsas qiymətdən böyük ola bilməz</em>}
            </label>

            <div className="adm-field adm-field--full adm-stockrow" role="group">
              <span>Məhsulun mövcudluğu</span>
              <button
                type="button"
                role="switch"
                aria-checked={draft.inStock}
                onClick={() => onField({ inStock: !draft.inStock })}
                className={`adm-switch${draft.inStock ? " is-on" : ""}`}
              >
                <i />
                <b>{draft.inStock ? "Stokda var" : "Stokda yoxdur"}</b>
              </button>
            </div>

            <label className="adm-field adm-field--full">
              <span>Təsvir</span>
              <textarea
                rows={4}
                value={draft.description}
                onChange={(event) => onField({ description: event.target.value.slice(0, 8000) })}
                placeholder="Material, ölçülər, xüsusiyyətlər…"
                maxLength={8000}
              />
            </label>
            <label className="adm-field adm-field--full">
              <span>Keçid</span>
              <input
                value={draft.link}
                onChange={(event) => onField({ link: event.target.value.trim().slice(0, 500) })}
                inputMode="url"
                type="url"
                placeholder="https://…"
              />
              {!linkOk && <em>Yalnız https:// keçidləri qəbul olunur</em>}
            </label>
          </div>

          {/* ---------------------------------------------------- images */}
          <fieldset
            className={`adm-drop${dragOver ? " is-over" : ""}`}
            onDragOver={(event) => { event.preventDefault(); if (!uploading) setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              if (!uploading && event.dataTransfer.files.length) onUpload(event.dataTransfer.files);
            }}
          >
            <legend>Şəkillər <small>maksimum 8 · JPG, PNG, WEBP · 900 KB</small></legend>
            {draft.images.length > 0 && (
              <ul className="adm-thumbs">
                <AnimatePresence initial={false}>
                  {draft.images.map((src, index) => (
                    <motion.li
                      key={`${src}-${index}`}
                      layout={!reduced}
                      initial={reduced ? undefined : { opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.28 }}
                    >
                      <Image src={src} alt={`Şəkil ${index + 1}`} width={72} height={72} sizes="72px" quality={50} />
                      <button type="button" aria-label="Şəkli sil" onClick={() => onImageRemove(index)} disabled={uploading}>
                        <X size={13} />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
            <div className="adm-drop__actions">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(event) => {
                  if (event.target.files?.length) onUpload(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
              <button type="button" className="btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <><RotateCcw size={14} /> Yüklənir…</> : <><Plus size={15} /> Fayl seç və ya bura at</>}
              </button>
              {!uploading && <small>JPG/PNG/WEBP · 900 KB-a qədər</small>}
              {uploading && <small><strong>GitHub-a göndərilir…</strong></small>}
            </div>
          </fieldset>
        </form>

        <footer className="adm-form__foot">
          {error && (
            <motion.p role="alert" className="adm-form-error" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
              {error}
            </motion.p>
          )}
          <div className="adm-form__row">
            <button type="button" className="btn" onClick={onCancel} disabled={saving}>Ləğv et</button>
            <button type="submit" form="adm-product-form" className="btn btn-acid" disabled={!canSave}>
              {saving ? <><RotateCcw size={15} /> Saxlanılır…</> : <><Save size={16} /> Yadda saxla</>}
            </button>
          </div>
          <small className="adm-save-note">Yadda saxlanılan kimi GitHub-a commit gedir, sayt avtomatik yenilənir.</small>
        </footer>
      </motion.section>
    </motion.div>
  );
}

/* ------------------------------------------------------- share-link dialog */
function ShareLinkDialog({ products, origin, onClose, onToast }: {
  products: Product[]; origin: string; onClose: () => void; onToast: (kind: "ok" | "error", text: string) => void;
}) {
  const items = products.map((product) => ({ id: product.id, quantity: 1 }));
  const link = orderLink(origin || "https://nerjmetal.com", items);
  const text = [
    "NERJ METAL — məhsul sorğusu",
    ...products.map((product, index) => `${index + 1}. ${product.title}`),
    "",
    link,
  ].join("\n");

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      onToast("ok", "Link kopyalandı");
    } catch {
      /* clipboard may be denied — the field below is selectable as fallback */
      onToast("error", "Kopyalanmadı — linki əl ilə seçin");
    }
  }

  return (
    <motion.div className="adm-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="adm-share-title"
        className="adm-modal adm-confirm adm-share"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.32, ease: [0.22, 0.68, 0.16, 1] }}
      >
        <h2 id="adm-share-title">Link yarat</h2>
        <p>{products.length} məhsul seçilib. Link yalnız bu məhsulları ehtiva edir — foto və qiymətlər canlı kataloqdan gəlir.</p>
        <output className="adm-share__link" aria-label="Yaradılan link">{link}</output>
        <div className="adm-confirm__row">
          <button type="button" className="btn" onClick={onClose}>Bağla</button>
          <a
            className="btn btn-acid"
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
          <button type="button" className="btn btn-acid" onClick={() => copy(link)}>Kopyala</button>
        </div>
      </motion.section>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ dashboard */
export function AdminClient() {
  const { toasts, push } = useToasts();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [sha, setSha] = useState("");
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("__all__");
  const [sort, setSort] = useState<"default" | "low" | "high" | "id">("default");
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  /* -------------------------------------------------------------- data layer */
  const load = useCallback(async function reload(notice?: string) {
    setLoadError("");
    try {
      const response = await fetch("/api/admin/products", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setProducts(sanitiseCatalog(payload.products ?? []));
      setSha(String(payload.sha ?? ""));
      if (notice) push("ok", notice);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Kataloq oxunmadı");
    }
  }, [push]);

  useEffect(() => { load(); }, [load]);

  /* instant search with debounce */
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim().toLocaleLowerCase("az")), 200);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => setPage(0), [search, category, sort]);

  const commit = useCallback(async function persist(next: Product[], message: string, notice: string) {
    try {
      const response = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: next, sha }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      await load(notice);
      return true;
    } catch (error) {
      push("error", error instanceof Error ? error.message : "Yadda saxlanmadı");
      await load(); /* resync with the authoritative remote copy */
      return false;
    }
  }, [sha, load, push]);

  async function toggleStock(product: Product) {
    if (!products || busyId) return;
    const next = products.map((item) =>
      item.id === product.id ? { ...item, inStock: !(item.inStock ?? true) } : item,
    );
    setProducts(next); /* optimistic flip while the commit travels */
    setBusyId(product.id);
    await commit(
      next,
      `admin: stok ${product.id}`,
      `${product.title} → ${(product.inStock ?? true) ? "Stokda yoxdur" : "Stokda var"}`,
    );
    setBusyId("");
  }

  async function removeProduct() {
    if (!products || !deleting) return;
    setRemoving(true);
    await commit(products.filter((item) => item.id !== deleting.id), `admin: silindi ${deleting.id}`, `«${deleting.title}» silindi`);
    setRemoving(false);
    setDeleting(null);
  }

  async function saveDraft() {
    if (!products || !draft) return;
    const id = draft.id.trim() || String(Date.now()).slice(-10);
    const product: Product = {
      id,
      slug: `${slugify(draft.title) || "mehsul"}-${id}`.slice(0, 160),
      title: draft.title.trim(),
      ...(draft.price ? { price: priceToText(numeric(draft.price)) } : {}),
      ...(draft.oldPrice && numeric(draft.oldPrice) ? { oldPrice: priceToText(numeric(draft.oldPrice)) } : {}),
      currency: "AZN",
      ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
      ...(draft.category.trim() ? { category: draft.category.trim() } : {}),
      images: [...draft.images],
      inStock: draft.inStock,
      ...(draft.link.trim() ? { sourceUrl: draft.link.trim() } : {}),
    };
    const next = products.some((item) => item.id === id)
      ? products.map((item) => (item.id === id ? product : item))
      : [...products, product];
    setSaving(true);
    const ok = await commit(next, `admin: ${products.some((i) => i.id === id) ? "yeniləndi" : "əlavə edildi"} ${id}`, `«${product.title}» yadda saxlanıldı`);
    setSaving(false);
    if (ok) setDraft(null);
  }

  async function uploadImages(files: FileList) {
    if (!draft) return;
    setUploading(true);
    try {
      const body = new FormData();
      Array.from(files).forEach((file) => body.append("files", file));
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setDraft((current) => current && ({ ...current, images: [...current.images, ...payload.paths].slice(0, 60) }));
      push("ok", `${payload.paths.length} şəkil GitHub-a yükləndi`);
    } catch (error) {
      push("error", error instanceof Error ? error.message : "Şəkil yüklənmədi");
    } finally {
      setUploading(false);
    }
  }

  async function importJson(file: File, input: HTMLInputElement) {
    try {
      const imported = sanitiseCatalog(JSON.parse(await file.text()));
      if (!window.confirm(`${imported.length} məhsullu kataloq mövcud kataloqun üzərinə yazılacaq. Davam edilsin?`)) return;
      setSaving(true);
      await commit(imported, "admin: JSON import", `${imported.length} məhsul idxal edildi`);
      setSaving(false);
    } catch {
      push("error", "Düzgün məhsul JSON faylı seçin.");
      setSaving(false);
    } finally {
      input.value = "";
    }
  }

  /* ---------------------------------------------------------- derived values */
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products ?? []) {
      const key = product.category?.trim() || "Digər";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "az"));
  }, [products]);

  const shown = useMemo(() => {
    const filtered = (products ?? []).filter((product) => {
      if (category !== "__all__" && (product.category?.trim() || "Digər") !== category) return false;
      if (!search) return true;
      return `${product.id} ${product.title} ${product.category ?? ""}`.toLocaleLowerCase("az").includes(search);
    });
    return filtered.sort((a, b) =>
      sort === "low" ? numeric(a.price) - numeric(b.price)
        : sort === "high" ? numeric(b.price) - numeric(a.price)
          : sort === "id" ? String(a.id).localeCompare(String(b.id), "en", { numeric: true })
            : a.title.localeCompare(b.title, "az"),
    );
  }, [products, search, category, sort]);

  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const pageItems = shown.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const revision = sha ? sha.slice(0, 7) : "—";

  /* ------------------------------------------------------------------ states */
  if (loadError && products === null) {
    return (
      <main id="main" className="container-wide admin-page min-h-screen">
        <div className="cat-empty adm-state">
          <AlertTriangle size={26} className="text-[var(--acid)]" />
          <h3>Kataloq oxunmadı</h3>
          <p>{loadError}</p>
          <button type="button" className="btn btn-acid" onClick={() => load()}><RotateCcw size={15} /> Yenidən cəhd et</button>
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="container-wide admin-page min-h-screen">
      {/* ------------------------------------------------------------ top bar */}
      <header className="adm-topbar">
        <div className="adm-title">
          <p className="eyebrow">NERJ/METAL · İdarəetmə paneli</p>
          <h1>Kataloq</h1>
          <p className="adm-meta">
            <b>{products?.length ?? "…"}</b> məhsul · reviziya <code>{revision}</code>
          </p>
        </div>
        <nav className="adm-actions" aria-label="Admin əməliyyatları">
          <Link href="/" target="_blank" className="btn">Sayta bax</Link>
          <a
            href="/api/admin/logout"
            className="btn"
            onClick={(event) => {
              event.preventDefault();
              fetch("/api/admin/logout", { method: "POST" })
                .catch(() => undefined)
                .finally(() => { window.location.assign("/admin/login"); });
            }}
          >
            <LogOut size={15} /> Çıxış
          </a>
        </nav>
      </header>

      {/* ----------------------------------------------------------- toolbar */}
      <section className="adm-toolbar" aria-label="Axtarış və filtrlər">
        <div className="adm-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ad, ID və ya kateqoriya axtar…"
            aria-label="Məhsul axtar"
            enterKeyHint="search"
            autoComplete="off"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Axtarışı təmizlə" className="adm-iconbtn">
              <X size={15} />
            </button>
          )}
        </div>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Kateqoriya filtri">
          <option value="__all__">Bütün kateqoriyalar ({products?.length ?? 0})</option>
          {categories.map(([name, count]) => <option key={name} value={name}>{name} ({count})</option>)}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} aria-label="Sıralama">
          <option value="default">Ad (A–Z)</option>
          <option value="low">Qiymət: aşağıdan</option>
          <option value="high">Qiymət: yuxarıdan</option>
          <option value="id">ID sırasıyla</option>
        </select>
        <button type="button" className="btn btn-acid" onClick={() => setDraft({ ...EMPTY_DRAFT })}>
          <Plus size={17} /> Məhsul əlavə et
        </button>
        <div className="adm-io">
          <button
            type="button"
            className="btn adm-btn-ghost"
            aria-label="JSON export"
            disabled={!products?.length}
            onClick={() => {
              const anchor = document.createElement("a");
              anchor.href = URL.createObjectURL(new Blob([JSON.stringify(products, null, 2)], { type: "application/json" }));
              anchor.download = "nerj-metal-products.json";
              anchor.click();
              URL.revokeObjectURL(anchor.href);
            }}
          >
            <Download size={15} />
          </button>
          <label className="btn adm-btn-ghost" aria-label="JSON import">
            <Upload size={15} />
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) importJson(file, event.currentTarget);
              }}
            />
          </label>
        </div>
      </section>

      {/* ----------------------------------------------------------- catalog */}
      {products === null ? (
        <div className="adm-grid" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="adm-skeleton" />)}
        </div>
      ) : pageItems.length === 0 ? (
        <div className="cat-empty mt-10">
          <Package size={26} className="text-[var(--acid)]" />
          <h3>{products.length ? "Heç nə tapılmadı" : "Kataloq boşdur"}</h3>
          <p>{products.length ? "Axtarışı dəyişin və ya filtrləri sıfırlayın." : "İlk məhsulu «Məhsul əlavə et» düyməsi ilə yaradın."}</p>
          {(search || category !== "__all__") && (
            <button type="button" className="btn btn-acid" onClick={() => { setQuery(""); setCategory("__all__"); }}>
              <RotateCcw size={14} /> Filtrləri sıfırla
            </button>
          )}
        </div>
      ) : (
        <div className="adm-grid">
          {pageItems.map((product) => {
            const stock = product.inStock ?? true;
            return (
              <article key={product.id} className={`adm-card${stock ? "" : " is-off"}`}>
                <Link href={`/catalog/${product.slug}`} target="_blank" rel="noopener" className="adm-card__media" aria-label={product.title}>
                  {product.images[0]
                    ? <Image src={product.images[0]} alt="" width={240} height={135} quality={55} loading="lazy" sizes="(max-width: 639px) 88vw, 300px" />
                    : <span className="adm-card__placeholder"><Package size={26} /></span>}
                </Link>
                <div className="adm-card__body">
                  <p className="adm-card__id">#{product.id}</p>
                  <h3 className="adm-card__title">{product.title}</h3>
                  <p className="adm-card__meta">
                    <span>{product.category || "Kateqoriyasız"}</span>
                    {product.price && (
                      <b>
                        {numeric(product.oldPrice) > numeric(product.price) && <s>{product.oldPrice}</s>}
                        {" "}{product.price}
                      </b>
                    )}
                  </p>
                </div>
                <footer className="adm-card__tools">
                  <label className="adm-check">
                    <input
                      type="checkbox"
                      checked={selected.includes(product.id)}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, product.id]
                            : current.filter((id) => id !== product.id),
                        )
                      }
                    />
                    <i>Seç</i>
                  </label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={stock}
                    disabled={!!busyId}
                    onClick={() => toggleStock(product)}
                    className={`adm-switch adm-switch--sm${stock ? " is-on" : ""}`}
                    aria-label={`${product.title}: stok statusu`}
                  >
                    <i />
                    <b>{busyId === product.id ? "…" : stock ? "Stokda var" : "Stokda yoxdur"}</b>
                  </button>
                  <div className="adm-card__buttons">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setDraft({
                        id: product.id,
                        title: product.title,
                        category: product.category ?? "",
                        price: product.price?.replace(/[^\d]/g, "") ?? "",
                        oldPrice: product.oldPrice?.replace(/[^\d]/g, "") ?? "",
                        inStock: product.inStock ?? true,
                        description: product.description ?? "",
                        link: product.sourceUrl ?? "",
                        images: [...product.images],
                      })}
                    >
                      <Pencil size={14} /> Dəyiş
                    </button>
                    <button type="button" className="btn adm-btn-danger" onClick={() => setDeleting(product)}>
                      <Trash2 size={14} /> Sil
                    </button>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {/* -------------------------------------------------------- pagination */}
      {pages > 1 && shown.length > 0 && (
        <nav className="adm-pager" aria-label="Səhifələr">
          <button type="button" className="btn" disabled={safePage === 0} onClick={() => setPage((current) => current - 1)} aria-label="Əvvəlki səhifə">
            <ChevronLeft size={16} />
          </button>
          <span>Səhifə <b>{safePage + 1}</b> / {pages} · {shown.length} məhsul</span>
          <button type="button" className="btn" disabled={safePage >= pages - 1} onClick={() => setPage((current) => current + 1)} aria-label="Növbəti səhifə">
            <ChevronRight size={16} />
          </button>
        </nav>
      )}

      {/* -------------------------------------------------------- overlays */}
      {/* ------------------------------------------------- selection bar */}
      <AnimatePresence>
        {selected.length > 0 && !draft && (
          <motion.div
            className="adm-selectbar"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.32, ease: [0.22, 0.68, 0.16, 1] }}
            role="toolbar"
            aria-label="Seçilmiş məhsullar"
          >
            <span>
              <b>{selected.length}</b> məhsul seçilib
            </span>
            <div className="adm-selectbar__buttons">
              <button type="button" className="btn" onClick={() => setSelected([])}>Təmizlə</button>
              <button type="button" className="btn btn-acid" onClick={() => setShareOpen(true)}>
                Link yarat
              </button>
            </div>
          </motion.div>
        )}
        {shareOpen && (
          <ShareLinkDialog
            products={(products ?? []).filter((product) => selected.includes(product.id))}
            origin={origin}
            onClose={() => setShareOpen(false)}
            onToast={push}
          />
        )}
        {deleting && (
          <ConfirmDialog product={deleting} busy={removing} onCancel={() => setDeleting(null)} onConfirm={removeProduct} />
        )}
        {draft && (
          <ProductForm
            draft={draft}
            categories={categories.map(([name]) => name)}
            saving={saving}
            uploading={uploading}
            error=""
            onField={(patch) => setDraft((current) => current && ({ ...current, ...patch }))}
            onCancel={() => { if (!saving && !uploading) setDraft(null); }}
            onSave={saveDraft}
            onUpload={uploadImages}
            onImageRemove={(index) => setDraft((current) => current && ({
              ...current,
              images: current.images.filter((_, position) => position !== index),
            }))}
          />
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------------- toasts */}
      <div className="adm-toasts" role="status" aria-live="polite">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.p
              key={toast.id}
              className={`adm-toast adm-toast--${toast.kind}`}
              initial={{ opacity: 0, y: -14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.22, 0.68, 0.16, 1] }}
            >
              {toast.kind === "ok" ? <Check size={15} /> : <AlertTriangle size={15} />}
              {toast.text}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    </main>
  );
}
