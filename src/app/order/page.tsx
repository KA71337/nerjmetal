import type { Metadata } from "next";
import { getSeedProducts } from "@/lib/products";
import { decodeOrder } from "@/lib/order-payload";
import { site } from "@/lib/site";
import { OrderClient } from "@/components/order-client";

type SearchParams = Promise<{ items?: string | string[] }>;

/** Resolves a decoded payload against the committed catalog. */
function resolveItems(raw?: string) {
  const items = decodeOrder(raw);
  if (!items.length) return { items, products: [] };
  const seed = getSeedProducts();
  const seen = new Set<string>();
  const products = items
    .map((item) => {
      const match =
        (item.id && seed.find((product) => product.id === item.id)) ||
        seed.find((product) => product.title.toLocaleLowerCase("az") === item.title.toLocaleLowerCase("az"));
      return match;
    })
    .filter((product): product is NonNullable<typeof product> => !!product)
    .filter((product) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    });
  return { items, products };
}

/**
 * Open Graph for shared order links: one product → its own photo; several
 * products → the dynamic composite preview at /order/og?items=….
 */
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { items: raw } = await searchParams;
  const { items, products } = resolveItems(typeof raw === "string" ? raw : undefined);
  const names = (items.length ? items : []).slice(0, 4).map((item) => item.title).join(", ");
  const description = items.length
    ? `${items.length} məhsul üçün sifariş sorğusu: ${names}${items.length > 4 ? "…" : ""}. NERJ METAL — paslanmayan polad həlləri.`
    : "Səbətinizi məhsullarla paylaşın — NERJ METAL paslanmayan polad həlləri.";
  const single = items.length === 1 ? products[0]?.images[0] : undefined;
  const previewUrl = items.length
    ? `${site.url}/order/og?items=${encodeURIComponent(typeof raw === "string" ? raw : "")}`
    : `${site.url}/opengraph-image`;
  return {
    title: "Sifariş sorğusu",
    description,
    alternates: { canonical: "/order" },
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      url: `${site.url}/order`,
      title: "NERJ METAL — Sifariş sorğusu",
      description,
      siteName: site.name,
      locale: site.locale,
      images: [{ url: single ?? previewUrl }],
    },
    twitter: { card: "summary_large_image", title: "NERJ METAL — Sifariş sorğusu", description },
  };
}

export default async function Order({ searchParams }: { searchParams: SearchParams }) {
  const { items } = await searchParams;
  return <OrderClient raw={typeof items === "string" ? items : undefined} />;
}
