import seed from "@/data/products.json";
import type { Product } from "@/types";

export const seedProducts = seed as Product[];
export function getSeedProducts() { return seedProducts; }
export function getSeedProduct(slug: string) { return seedProducts.find((p) => p.slug === slug); }
