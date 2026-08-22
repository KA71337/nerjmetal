import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Məhsul idarəetməsi",
  description: "NERJ METAL lokal kataloq idarəetməsi.",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
