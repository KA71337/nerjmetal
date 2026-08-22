import type { MetadataRoute } from "next";
import { getSeedProducts } from "@/lib/products";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: site.url, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/catalog`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...getSeedProducts().map((product) => ({
      url: `${site.url}/catalog/${product.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
