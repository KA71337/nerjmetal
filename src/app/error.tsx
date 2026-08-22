"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surfaced in the browser console / Vercel logs without leaking details into the UI.
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="container-wide state-page">
      <p className="eyebrow">Xəta</p>
      <h1>Nəsə alınmadı</h1>
      <p>Səhifəni yeniləyin. Problem davam edərsə, bizə zəng edin və biz kömək edək.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className="btn btn-acid" onClick={reset}>
          Yenidən cəhd et
        </button>
        <Link href="/" className="btn">
          Ana səhifə
        </Link>
      </div>
    </main>
  );
}
