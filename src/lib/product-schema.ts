import type { Product } from "@/types";

/** Combining marks (U+0300–U+036F) left over after NFD normalisation. */
const DIACRITICS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, "g");

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function priceToText(value: number | ""): string | undefined {
  if (value === "" || !Number.isFinite(value)) return undefined;
  return `${value} AZN`;
}

/**
 * Imported/edited catalog data is untrusted input: every field is coerced,
 * length-capped and image paths are restricted to local files or https URLs so
 * nothing unexpected reaches next/image or the DOM. Shared by the admin UI and
 * the API route — the server always re-validates before committing to GitHub.
 */
export function sanitiseCatalog(input: unknown): Product[] {
  if (!Array.isArray(input)) throw new Error("Expected an array");
  const products = input.slice(0, 2000).map((raw) => {
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
      oldPrice: text("oldPrice", 60),
      currency: text("currency", 8),
      description: text("description", 8000),
      category: text("category", 120),
      images: Array.isArray(item.images)
        ? item.images
            .filter((src): src is string => typeof src === "string" && (src.startsWith("/") || src.startsWith("https://")))
            .slice(0, 60)
        : [],
      inStock: typeof item.inStock === "boolean" ? item.inStock : true,
      sourceUrl: text("sourceUrl", 500),
    } satisfies Product;
  });

  /* Guarantee unique slugs and ids — duplicates would break routing and React keys. */
  const slugs = new Map<string, number>();
  const ids = new Set<string>();
  for (const product of products) {
    while (ids.has(product.id)) product.id = `${product.id}-x`;
    ids.add(product.id);
    const count = slugs.get(product.slug) ?? 0;
    slugs.set(product.slug, count + 1);
    if (count > 0) product.slug = `${product.slug}-${count + 1}`;
  }
  return products;
}

export function serializeCatalog(products: Product[]): string {
  return `${JSON.stringify(products, null, 2)}\n`;
}
