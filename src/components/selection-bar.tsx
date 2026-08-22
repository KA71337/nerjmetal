"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, ListChecks, MessageCircle, Minus, Plus, Trash2, X } from "lucide-react";
import seed from "@/data/products.json";
import type { Product } from "@/types";
import { useStore } from "./app-providers";
import { encodeSelection, orderLink } from "@/lib/order-payload";

const numeric = (value?: string) => Number((value || "").replace(/[^\d]/g, "")) || 0;

/**
 * Floating selection panel: appears only when products are picked.
 * "Link yarat" builds a self-contained /order/<token> URL that carries just
 * the chosen ids + quantities — the recipient's view never depends on this
 * device or its localStorage.
 */
export function SelectionBar() {
  const store = useStore();
  const [expanded, setExpanded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);

  const all = useMemo<Product[]>(() => (store.products.length ? store.products : (seed as Product[])), [store.products]);
  const entries = useMemo(
    () =>
      store.selectedIds
        .map((id) => ({ id, product: all.find((item) => item.id === id) }))
        .filter((entry): entry is { id: string; product: Product } => Boolean(entry.product)),
    [store.selectedIds, all],
  );
  const total = useMemo(
    () => entries.reduce((sum, entry) => sum + numeric(entry.product.price) * store.selection[entry.id], 0),
    [entries, store.selection],
  );

  const open = expanded && entries.length > 0;
  useEffect(() => {
    if (!expanded) return;
    document.body.classList.add("overlay-open");
    setTimeout(() => closeRef.current?.focus(), 60);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setExpanded(false);
    addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("overlay-open");
      removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => { if (!entries.length) setExpanded(false); }, [entries.length]);

  const link = entries.length ? orderLink(origin || "https://nerjmetal.com", entries.map(({ id }) => ({ id, quantity: store.selection[id] }))) : "";

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* the link field is selectable as a fallback */
    }
  }

  return (
    <>
      {/* ------------------------------------------------ floating pill bar */}
      <AnimatePresence>
        {!open && entries.length > 0 && (
          <motion.div
            className="sel-bar"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.32, ease: [0.22, 0.68, 0.16, 1] }}
            role="toolbar"
            aria-label="Seçilmiş məhsullar"
          >
            <button type="button" className="sel-bar__count" onClick={() => setExpanded(true)}>
              <ListChecks size={17} />
              <b>{store.selectCount}</b> məhsul seçildi
            </button>
            <button type="button" className="btn btn-acid" onClick={() => setShareOpen(true)}>
              Link yarat
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --------------------------------------------- expanded selection list */}
      <AnimatePresence>
        {open && (
          <motion.div className="sel-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Seçilmiş məhsullar"
              className="sel-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
            >
              <header className="sel-head">
                <h2><ListChecks size={20} /> Seçilmişlər</h2>
                <div className="sel-head__tools">
                  <button type="button" onClick={() => { store.clearSelection(); }} disabled={!entries.length} className="btn adm-btn-ghost">
                    Təmizlə
                  </button>
                  <button ref={closeRef} type="button" onClick={() => setExpanded(false)} aria-label="Bağla" className="adm-iconbtn">
                    <X size={20} />
                  </button>
                </div>
              </header>

              <div className="sel-items">
                {entries.map(({ id, product }) => (
                  <article key={id} className="sel-item">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.images[0]} alt={product.title} loading="lazy" width={64} height={64} />
                    ) : (
                      <span className="sel-item__ph">NM</span>
                    )}
                    <div className="sel-item__info">
                      <p>{product.title}</p>
                      <span>{product.price}</span>
                    </div>
                    <div className="sel-item__controls">
                      <button type="button" onClick={() => store.setQty(id, store.selection[id] - 1)} aria-label={`${product.title}: azalt`}><Minus size={15} /></button>
                      <b>{store.selection[id]}</b>
                      <button type="button" onClick={() => store.setQty(id, store.selection[id] + 1)} aria-label={`${product.title}: artır`}><Plus size={15} /></button>
                      <button type="button" className="remove" onClick={() => store.removeSelected(id)} aria-label={`${product.title}: siyahıdan sil`}><Trash2 size={16} /></button>
                    </div>
                  </article>
                ))}
              </div>

              <footer className="sel-foot">
                <p className="eyebrow">Link yalnız seçilmiş {entries.length} məhsulu ehtiva edir</p>
                <button type="button" className="btn btn-acid sel-foot__cta" onClick={() => setShareOpen(true)}>
                  <Check size={17} /> Link yarat
                </button>
              </footer>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------- ready-link modal */}
      <AnimatePresence>
        {shareOpen && (
          <ShareDialog link={link} text={
            [
              "NERJ METAL — məhsul sorğusu",
              ...entries.map((entry, index) => `${index + 1}. ${entry.product.title} × ${store.selection[entry.id]}`),
              "",
              link,
            ].join("\n")
          } count={entries.length} onClose={() => setShareOpen(false)} onCopy={copy} />
        )}
      </AnimatePresence>
    </>
  );
}

function ShareDialog({ link, text, count, onClose, onCopy }: {
  link: string; text: string; count: number; onClose: () => void; onCopy: (value: string) => void;
}) {
  return (
    <motion.div className="adm-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="sel-share-title"
        className="adm-modal adm-confirm sel-share"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.22, 0.68, 0.16, 1] }}
      >
        <span className="adm-confirm__icon sel-share__icon"><Check size={22} /></span>
        <h2 id="sel-share-title">Sifariş linki hazırdır</h2>
        <p>{count} seçilmiş məhsul. Linki göndərdiyiniz şəxs yalnız bu məhsulları görəcək.</p>
        <output className="adm-share__link" aria-label="Yaradılan sifariş linki">{link}</output>
        <div className="adm-confirm__row">
          <button type="button" className="btn" onClick={onClose}>Bağla</button>
          <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
            <MessageCircle size={15} /> WhatsApp
          </a>
          <button type="button" className="btn btn-acid" onClick={() => onCopy(link)}>Linki kopyala</button>
        </div>
      </motion.section>
    </motion.div>
  );
}
