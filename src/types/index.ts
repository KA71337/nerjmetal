export type Product = {
  id: string;
  slug: string;
  title: string;
  price?: string;
  currency?: string;
  description?: string;
  category?: string;
  images: string[];
  sourceUrl?: string;
  featured?: boolean;
};

export type CartItem = { product: Product; quantity: number };
