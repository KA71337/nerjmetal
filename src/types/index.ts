export type Product = {
  id: string;
  slug: string;
  title: string;
  price?: string;
  oldPrice?: string;
  currency?: string;
  description?: string;
  category?: string;
  images: string[];
  sourceUrl?: string;
  featured?: boolean;
  /** Stock flag for the admin panel and storefront badges; absent = in stock. */
  inStock?: boolean;
};
