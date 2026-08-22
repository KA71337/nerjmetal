import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sifariş",
  description: "Seçilmiş NERJ METAL məhsullarının sifariş siyahısı.",
  alternates: { canonical: "/order" },
  robots: { index: false, follow: true },
};

/** Shared order links live under /order/<token>; they are view-only, never indexed. */
export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
