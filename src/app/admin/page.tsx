import type { Metadata } from "next";
import { AdminClient } from "./admin-client";

export const metadata: Metadata = {
  title: "Kataloq idarəetməsi",
  robots: { index: false, follow: false, nocache: true },
};

/** Server shell: the edge middleware has already guaranteed a valid session here. */
export default function AdminPage() {
  return <AdminClient />;
}
