import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeedProductById } from "@/lib/products";
import { decodeSelection } from "@/lib/order-payload";
import { site } from "@/lib/site";
import { OrderShare } from "./order-share";

type Params = Promise<{ token: string }>;

const numeric = (value?: string) => Number((value || "").replace(/[^\d]/g, "")) || 0;
const formatAz = (amount: number) => `${amount.toLocaleString("az-AZ").replace(/,/g, " ")} AZN`;

/** Resolves the token against the committed catalog — only public product data. */
function resolve(token: string) {
  const entries = decodeSelection(token);
  if (!entries.length) return null;
  const rows = entries
    .map((entry) => ({ entry, product: getSeedProductById(entry.id) }))
    .filter((row): row is { entry: { id: string; quantity: number }; product: NonNullable<ReturnType<typeof getSeedProductById>> } => Boolean(row.product));
  return { entries, rows, total: rows.reduce((sum, row) => sum + numeric(row.product.price) * row.entry.quantity, 0) };
}

/**
 * Open Graph for the shared link: one product → its own photo; several →
 * the dynamic composite preview. Titles/prices always come from live data.
 */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { token } = await params;
  const data = resolve(token);
  if (!data) {
    return { title: "Sifariş", robots: { index: false, follow: false } };
  }
  const titles = data.rows.slice(0, 3).map((row) => row.product.title).join(", ");
  const description = data.rows.length
    ? `Sifariş siyahısı: ${titles}${data.rows.length > 3 ? " və s." : ""} · Ümumi: ${formatAz(data.total)}. NERJ METAL — paslanmayan polad həlləri.`
    : "Seçilmiş məhsullar artıq mövcud deyil.";
  const singleImage = data.rows.length === 1 ? data.rows[0].product.images[0] : undefined;
  return {
    title: `Sifariş · ${data.rows.length} məhsul`,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      url: `${site.url}/order/${token}`,
      title: `NERJ METAL — Sifariş (${data.rows.length} məhsul)`,
      description,
      siteName: site.name,
      locale: site.locale,
      images: [{ url: singleImage ?? `${site.url}/order/og?token=${encodeURIComponent(token)}` }],
    },
    twitter: { card: "summary_large_image", title: `NERJ METAL — Sifariş`, description },
  };
}

export default async function SharedOrder({ params }: { params: Params }) {
  const { token } = await params;
  const data = resolve(token);

  if (!data || !data.rows.length) {
    /* A dead or malformed link must never break the page. */
    return (
      <main id="main" className="container-wide state-page">
        <p className="eyebrow">Sifariş</p>
        <h1>Keçid etibarsızdır</h1>
        <p>Bu sifariş keçidi yanlışdır və ya məhsullar artıq kataloqda yoxdur.</p>
        <Link href="/catalog" className="btn btn-acid">Kataloqa bax</Link>
      </main>
    );
  }

  const missing = data.entries.length - data.rows.length;

  return (
    <main id="main" className="container-wide order-page">
      <header className="order-head">
        <p className="eyebrow">NERJ METAL</p>
        <h1>Sifariş</h1>
        <p className="order-lede">
          Seçilmiş məhsullar · <b>{data.rows.length}</b> mövqe · yalnız bu siyahı göstərilir.
        </p>
      </header>

      <div className="order-layout">
        {/* --------------------------------------------- selected products */}
        <section aria-label="Seçilmiş məhsullar" className="order-rows">
          {data.rows.map(({ entry, product }, index) => (
            <article key={entry.id} className="order-row">
              <div className="order-row__media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.images[0]} alt={product.title} width={132} height={132} loading={index === 0 ? "eager" : "lazy"} />
              </div>
              <div className="order-row__info">
                <span className="order-row__cat">{product.category || "Metal"}</span>
                <h2>{product.title}</h2>
                <div className="order-row__meta">
                  {(product.price || product.oldPrice) && (
                    <span className="order-row__price">
                      {numeric(product.oldPrice ?? "") > numeric(product.price) && <s>{product.oldPrice}</s>}
                      {product.price}
                    </span>
                  )}
                  {!product.price && <span className="order-row__price">Qiymət sorğu ilə</span>}
                  <span className="order-row__qty">× {entry.quantity}</span>
                </div>
              </div>
              <div className="order-row__sum">
                {product.price ? <b>{formatAz(numeric(product.price) * entry.quantity)}</b> : <b>—</b>}
                <small>cəmi</small>
              </div>
            </article>
          ))}
          {missing > 0 && (
            <p className="panel p-4 text-sm text-white/50">
              {missing} mövqe kataloqda tapılmadı və göstərilmir.
            </p>
          )}
        </section>

        {/* ------------------------------------------------------ summary */}
        <aside className="order-summary" aria-label="Sifarişin xülasəsi">
          <h2>Xülasə</h2>
          <dl>
            <div><dt>Mövqe</dt><dd>{data.rows.length}</dd></div>
            <div><dt>Miqdar</dt><dd>{data.rows.reduce((sum, row) => sum + row.entry.quantity, 0)}</dd></div>
            <div className="order-summary__total"><dt>Ümumi</dt><dd>{formatAz(data.total)}</dd></div>
          </dl>
          <OrderShare
            shareText={[
              "NERJ METAL — sifariş",
              ...data.rows.map((row, index) => `${index + 1}. ${row.product.title} × ${row.entry.quantity}`),
              `Ümumi: ${formatAz(data.total)}`,
            ].join("\n")}
          />
          <p className="order-summary__note">
            Qiymətlər son yenilənməyə uyğundur. Dəqiqləşdirmə üçün bizə zəng edin: {site.phoneLabel}
          </p>
        </aside>
      </div>
    </main>
  );
}
