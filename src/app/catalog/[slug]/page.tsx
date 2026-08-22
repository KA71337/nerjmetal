import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSeedProduct, getSeedProducts } from "@/lib/products";
import { site } from "@/lib/site";
import { ProductPageClient } from "./product-page-client";

export async function generateStaticParams() {
  return getSeedProducts().map((product) => ({ slug: product.slug }));
}

/** Trims a product description down to a clean, unique meta description. */
function summarise(product: { title: string; description?: string; category?: string; price?: string }) {
  const raw = (product.description || "")
    .replace(/\s+/g, " ")
    .replace(/[••]/g, "·")
    .trim();
  const base = raw || `${product.title} — ${product.category || "paslanmayan polad məhsul"}.`;
  const tail = product.price ? ` Qiymət: ${product.price}.` : "";
  const budget = 158 - tail.length;
  const text = base.length > budget ? `${base.slice(0, budget - 1).trimEnd()}…` : base;
  return `${text}${tail}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getSeedProduct(slug);
  if (!product) return { title: "Məhsul tapılmadı", robots: { index: false, follow: true } };
  const title = product.title;
  const description = summarise(product);
  const images = product.images.slice(0, 3).map((url) => ({ url }));
  return {
    title,
    description,
    alternates: { canonical: `/catalog/${slug}` },
    openGraph: {
      type: "website",
      title: `${title} — ${site.name}`,
      description,
      url: `${site.url}/catalog/${slug}`,
      images,
    },
    twitter: { card: "summary_large_image", title: `${title} — ${site.name}`, description, images },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getSeedProduct(slug);
  if (!product) notFound();
  return <ProductPageClient slug={slug} seed={product} />;
}
