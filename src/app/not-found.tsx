import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="container-wide state-page">
      <p className="eyebrow">404</p>
      <h1>Səhifə tapılmadı</h1>
      <p>Axtardığınız səhifə silinmiş, adı dəyişdirilmiş və ya heç vaxt mövcud olmamış ola bilər.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-acid">
          Ana səhifə
        </Link>
        <Link href="/catalog" className="btn">
          Kataloqa bax
        </Link>
      </div>
    </main>
  );
}
