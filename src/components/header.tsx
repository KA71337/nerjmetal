"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Heart, ListChecks, Menu, Phone, Search, X } from "lucide-react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import seed from "@/data/products.json";
import type { Product } from "@/types";
import { useDebounced } from "@/lib/use-debounced";
import { site } from "@/lib/site";
import { useStore } from "./app-providers";
import { BrandLogo } from "./brand-logo";

const NAV = [
  { href: "/catalog", label: "Kataloq" },
  { href: "/#story", label: "Haqqımızda" },
  { href: "/#sectors", label: "Sektorlar" },
  { href: "/#contact", label: "Əlaqə" },
];

export function Header() {
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const { selectCount, favorites, products, setSelectOpen } = useStore();
  const all = products.length ? products : (seed as Product[]);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 160, damping: 28 });
  const open = menu || searchOpen;
  const term = useDebounced(query, 180);
  const cartCount = selectCount;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("overlay-open", open);
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 60);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        setSearchOpen(false);
      }
    };
    addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("overlay-open");
      removeEventListener("keydown", onKey);
    };
  }, [open, searchOpen]);

  /* Close overlays when the route changes. */
  useEffect(() => {
    setMenu(false);
    setSearchOpen(false);
  }, [pathname]);

  const needle = term.trim().toLocaleLowerCase("az");
  const results = needle
    ? all
        .filter((product) => `${product.title} ${product.category || ""}`.toLocaleLowerCase("az").includes(needle))
        .slice(0, 6)
    : [];
  const close = () => {
    setMenu(false);
    setSearchOpen(false);
  };
  const isActive = (href: string) => !href.startsWith("/#") && pathname.startsWith(href);
  return (
    <>
      <motion.div
        style={{ scaleX, transformOrigin: "left" }}
        className="fixed inset-x-0 top-0 z-[100] h-[3px] bg-[var(--acid)]"
        aria-hidden="true"
      />
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="container-wide header-inner">
          <Link href="/" className="header-brand" aria-label={`${site.name} — ana səhifə`}>
            <BrandLogo className="header-logo rounded-full" sizes="96px" priority />
            <span>
              NERJ<span className="text-[var(--acid)]">/</span>METAL
            </span>
          </Link>

          <nav className="desktop-nav" aria-label="Əsas naviqasiya">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header-tools">
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Məhsul axtar" className="nav-icon">
              <Search size={19} />
            </button>
            <Link href="/favorites" aria-label={`Seçilmişlər (${favorites.length})`} className="nav-icon">
              <Heart size={19} />
              {favorites.length > 0 && <b>{favorites.length}</b>}
            </Link>
            <button type="button" onClick={() => setSelectOpen(true)} aria-label={`Seçilmiş məhsullar (${cartCount})`} className={"nav-icon"}>
              <ListChecks size={19} />
              {cartCount > 0 && <b>{cartCount}</b>}
            </button>
            <a href={`tel:${site.phone}`} className="header-cta">
              <Phone size={15} /> {site.phoneLabel}
            </a>
          </div>

          <div className="mobile-header-actions">
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Məhsul axtar">
              <Search size={21} />
            </button>
            <button type="button" onClick={() => setSelectOpen(true)} aria-label={`Seçilmiş məhsullar (${cartCount})`} className={"nav-icon"}>
              <ListChecks size={21} />
              {cartCount > 0 && <b>{cartCount}</b>}
            </button>
            <button type="button" onClick={() => setMenu(true)} aria-expanded={menu} aria-label="Menyunu aç">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>
      <AnimatePresence>
        {menu && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Əsas menyu"
            className="mobile-menu"
            initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.45, ease: [0.22, 0.68, 0.16, 1] }}
          >
            <div className="mobile-overlay-head">
              <BrandLogo className="h-11 w-11 rounded-full" />
              <button type="button" autoFocus onClick={() => setMenu(false)} aria-label="Menyunu bağla">
                <X size={22} />
              </button>
            </div>
            <nav aria-label="Mobil naviqasiya">
              {[{ href: "/", label: "Ana səhifə" }, ...NAV, { href: "/favorites", label: "Seçilmişlər" }].map(
                (item, index) => (
                  <motion.span
                    key={item.href}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + index * 0.05, duration: 0.4, ease: [0.22, 0.68, 0.16, 1] }}
                  >
                    <Link onClick={close} href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
                      {item.label}
                    </Link>
                  </motion.span>
                ),
              )}
            </nav>
            <a href={`tel:${site.phone}`} className="menu-phone">
              <Phone />
              <span>
                <small>Bizə zəng edin</small>
                {site.phoneLabel}
              </span>
            </a>
          </motion.div>
        )}
        {searchOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Məhsul axtarışı"
            className="search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <motion.div
              className="search-box"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 0.68, 0.16, 1] }}
            >
              <div className="search-field">
                <Search size={20} aria-hidden="true" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Məhsul axtar…"
                  aria-label="Məhsul axtar"
                  enterKeyHint="search"
                  autoComplete="off"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} aria-label="Axtarışı təmizlə">
                    <X size={18} />
                  </button>
                )}
                <button type="button" onClick={() => setSearchOpen(false)} aria-label="Axtarışı bağla">
                  <X size={20} />
                </button>
              </div>
              <div className="search-results" aria-live="polite">
                {needle && !results.length && <p>Nəticə tapılmadı.</p>}
                {results.map((product, index) => (
                  <motion.span
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.3 }}
                  >
                    <Link onClick={close} href={`/catalog/${product.slug}`}>
                      <span>
                        <small>{product.category || "Metal"}</small>
                        <i>{product.title}</i>
                      </span>
                      <b>{product.price || "Sorğu ilə"}</b>
                    </Link>
                  </motion.span>
                ))}
                {results.length > 0 && (
                  <Link onClick={close} href={`/catalog?q=${encodeURIComponent(query)}`} className="all-results">
                    Bütün nəticələrə bax
                  </Link>
                )}
                {!needle && <p className="search-hint">Məhsul adı və ya kateqoriya yazın</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
