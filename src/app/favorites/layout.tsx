import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seçilmişlər",
  description: "Bu brauzerdə saxlanılan seçilmiş NERJ METAL məhsulları.",
  alternates: { canonical: "/favorites" },
  robots: { index: false, follow: true },
};

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
