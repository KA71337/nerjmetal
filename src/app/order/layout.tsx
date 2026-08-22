import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sifariş sorğusu",
  description: "Səbətinizi link və ya mətn kimi paylaşın və NERJ METAL ilə əlaqə saxlayın.",
  alternates: { canonical: "/order" },
  robots: { index: false, follow: true },
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
