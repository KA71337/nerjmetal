import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Tap.Az → NERJ METAL incremental sync.
 * Lists current shop announcements, keeps every existing product untouched,
 * appends only genuinely new listings and writes an audit report.
 */
const SOURCE = "https://tap.az/shops/nerj_metal?user_id=16790475";
const GRAPHQL = "https://tap.az/graphql";
const EXPECTED_USER_ID = "16790475";
const EXPECTED_SHOP_URI = "/shops/nerj_metal";
const PRODUCTS_FILE = path.join(process.cwd(), "src", "data", "products.json");

type ExistingProduct = {
  id: string;
  slug: string;
  title: string;
  price?: string;
  currency?: string;
  description?: string;
  category?: string;
  images: string[];
  inStock?: boolean;
  sourceUrl?: string;
};

type ShopAd = { legacyResourceId: number; path: string; shop?: { uri?: string } };
type ApolloAd = {
  legacyResourceId?: number;
  title?: string;
  body?: string;
  price?: number;
  oldPrice?: number;
  path?: string;
  photos?: Array<{ url?: string }>;
  shop?: { __ref?: string };
  user?: { __ref?: string };
};

const SHOP_ADS_QUERY = `query GetShopAds($orderType: AdOrderEnum, $first: Int, $after: String, $keywords: String, $filters: AdFilterInput!) {
  ShopAds: ads(source: MOBILE, filters: $filters, orderType: $orderType, first: $first, after: $after, keywords: $keywords) {
    edges { node { legacyResourceId path shop { uri } } cursor }
    pageInfo { endCursor hasNextPage }
    totalCount
  }
}`;

async function requestText(url: string) {
  const response = await fetch(url, {
    headers: { accept: "text/html", "user-agent": "Mozilla/5.0 (compatible; NERJ-METAL-Catalog-Sync/1.0)" },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function listShopAds() {
  const ads: ShopAd[] = [];
  let after: string | null = null;
  do {
    const response = await fetch(GRAPHQL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        origin: "https://tap.az",
        referer: SOURCE,
        "user-agent": "Mozilla/5.0 (compatible; NERJ-METAL-Catalog-Sync/1.0)",
      },
      body: JSON.stringify({
        operationName: "GetShopAds",
        query: SHOP_ADS_QUERY,
        variables: {
          first: 50,
          after,
          keywords: null,
          orderType: "VIPPED_AT_DESC",
          filters: { userLegacyId: EXPECTED_USER_ID, isShop: true },
        },
      }),
    });
    if (!response.ok) throw new Error(`Shop API: ${response.status} ${response.statusText}`);
    const payload = await response.json() as {
      data?: { ShopAds?: { edges?: Array<{ node: ShopAd }>; pageInfo?: { endCursor?: string; hasNextPage?: boolean }; totalCount?: number } };
      errors?: Array<{ message: string }>;
    };
    if (payload.errors?.length) throw new Error(payload.errors.map((error) => error.message).join("; "));
    const page = payload.data?.ShopAds;
    if (!page) throw new Error("Shop API cavabında ShopAds yoxdur");
    for (const edge of page.edges ?? []) {
      if (edge.node.shop?.uri === EXPECTED_SHOP_URI) ads.push(edge.node);
    }
    console.log(`Səhifə: ${ads.length}/${page.totalCount ?? "?"} elan`);
    after = page.pageInfo?.hasNextPage ? page.pageInfo.endCursor ?? null : null;
  } while (after);
  return [...new Map(ads.map((ad) => [ad.legacyResourceId, ad])).values()];
}

function nextData(document: string) {
  const match = document.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("__NEXT_DATA__ tapılmadı");
  return JSON.parse(match[1]) as { props?: { pageProps?: { apolloState?: Record<string, unknown>; seoFullData?: { jsonLd?: unknown[] } } } };
}

function slugify(value: string) {
  const az = value.toLowerCase().replace(/ə/g, "e").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ç/g, "c");
  return az.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function sourcePathId(sourceUrl?: string) {
  if (!sourceUrl) return undefined;
  const match = sourceUrl.match(/\/(\d+)(?:\?|$)/);
  return match?.[1];
}

function slugSuffixId(slug?: string) {
  if (!slug) return undefined;
  const match = slug.match(/-(\d{6,})$/);
  return match?.[1];
}

function productLd(jsonLd: unknown[]) {
  return jsonLd.find((item) => item && typeof item === "object" && (item as { "@type"?: string })["@type"] === "Product") as
    | { offers?: { price?: string; priceCurrency?: string } }
    | undefined;
}

function categoryFromLd(jsonLd: unknown[]) {
  const crumbs = jsonLd.find((item) => item && typeof item === "object" && (item as { "@type"?: string })["@type"] === "BreadcrumbList") as
    | { itemListElement?: Array<{ name?: string }> }
    | undefined;
  return crumbs?.itemListElement?.at(-1)?.name;
}

async function downloadImages(id: string, urls: string[]) {
  const images: string[] = [];
  const directory = path.join(process.cwd(), "public", "products", id);
  await mkdir(directory, { recursive: true });
  let saved = 0;
  for (const url of urls.slice(0, 8)) {
    try {
      const response = await fetch(url, { headers: { referer: "https://tap.az/" } });
      if (!response.ok) throw new Error(String(response.status));
      const type = response.headers.get("content-type") ?? "";
      const extension = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
      saved += 1;
      const filename = `${saved}.${extension}`;
      await writeFile(path.join(directory, filename), Buffer.from(await response.arrayBuffer()));
      images.push(`/products/${id}/${filename}`);
    } catch (error) {
      console.warn(`  Şəkil yüklənmədi (${error instanceof Error ? error.message : String(error)}): ${url}`);
    }
  }
  return images;
}

/** True when any reliable identifier of a listing already exists in the catalog. */
function isKnown(existing: ExistingProduct[], ad: ShopAd, sourceUrl: string, slug: string, title: string) {
  return existing.some((product) => {
    if (product.id === String(ad.legacyResourceId)) return true;
    if (product.sourceUrl === sourceUrl) return true;
    if (sourcePathId(product.sourceUrl) === String(ad.legacyResourceId)) return true;
    if (slugSuffixId(product.slug) === String(ad.legacyResourceId)) return true;
    if (product.slug === slug) return true;
    return product.title.trim().toLocaleLowerCase("az") === title.trim().toLocaleLowerCase("az");
  });
}

async function main() {
  console.log(`Mənbə: ${SOURCE}`);
  const ads = await listShopAds();
  const raw = await readFile(PRODUCTS_FILE, "utf8");
  const existing: ExistingProduct[] = JSON.parse(raw);
  const merged = [...existing];
  const seenIds = new Set(existing.map((product) => product.id));
  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const [index, listedAd] of ads.entries()) {
    const label = `[${index + 1}/${ads.length}]`;
    const sourceUrl = new URL(listedAd.path, SOURCE).href;
    const known = existing.some(
      (product) =>
        product.id === String(listedAd.legacyResourceId) ||
        sourcePathId(product.sourceUrl) === String(listedAd.legacyResourceId),
    );
    if (known) {
      skipped++;
      console.log(`${label} KEÇİLDİ (mövcuddur): ${listedAd.legacyResourceId}`);
      continue;
    }
    try {
      const data = nextData(await requestText(sourceUrl));
      const state = data.props?.pageProps?.apolloState ?? {};
      const ad = Object.entries(state).find(([key, value]) => key.startsWith("Ad:") && (value as ApolloAd).legacyResourceId === listedAd.legacyResourceId)?.[1] as ApolloAd | undefined;
      if (!ad?.title || !ad.path) throw new Error("Elanın konkret Apollo bloku tapılmadı");
      const user = ad.user?.__ref ? state[ad.user.__ref] as { legacyId?: string } | undefined : undefined;
      const shopRef = ad.shop?.__ref ? state[ad.shop.__ref] as { uri?: string } | undefined : undefined;
      if (String(user?.legacyId) !== EXPECTED_USER_ID || shopRef?.uri !== EXPECTED_SHOP_URI) throw new Error("Elan NERJ METAL mağazasına aid deyil");

      const jsonLd = data.props?.pageProps?.seoFullData?.jsonLd ?? [];
      const offer = productLd(jsonLd)?.offers;
      const id = String(ad.legacyResourceId);
      const currency = offer?.priceCurrency;
      const numericPrice = offer?.price ?? (typeof ad.price === "number" ? String(ad.price) : undefined);
      const numericOldPrice = typeof ad.oldPrice === "number" ? String(ad.oldPrice) : undefined;
      const slug = `${slugify(ad.title) || "mehsul"}-${id}`;

      // Second dedup pass once full details are known (title/slug collisions).
      if (isKnown(existing.concat(merged.slice(existing.length)), { legacyResourceId: ad.legacyResourceId ?? listedAd.legacyResourceId, path: listedAd.path, shop: listedAd.shop }, sourceUrl, slug, ad.title)) {
        skipped++;
        console.log(`${label} KEÇİLDİ (oxşar mövcud məhsul): ${ad.title}`);
        continue;
      }
      if (seenIds.has(id)) {
        skipped++;
        continue;
      }

      const imageUrls = [...new Set((ad.photos ?? []).map((photo) => photo.url).filter((url): url is string => Boolean(url)))];
      const images = await downloadImages(id, imageUrls);
      merged.push({
        id,
        slug,
        title: ad.title,
        ...(numericPrice ? { price: `${Number(numericPrice)}${currency ? ` ${currency}` : ""}` } : {}),
        ...(numericOldPrice ? { oldPrice: `${Number(numericOldPrice)}${currency ? ` ${currency}` : ""}` } : {}),
        ...(currency ? { currency } : {}),
        ...(ad.body ? { description: ad.body } : {}),
        ...(categoryFromLd(jsonLd) ? { category: categoryFromLd(jsonLd) } : {}),
        images,
        inStock: true,
        sourceUrl,
      });
      seenIds.add(id);
      added++;
      console.log(`${label} ƏLAVƏ ${id} «${ad.title}» | şəkil: ${images.length}`);
    } catch (error) {
      failed++;
      console.warn(`${label} FAIL ${sourceUrl}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  await writeFile(PRODUCTS_FILE, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`\nHESABAT: Əlavə edildi: ${added}. Ötürülən (artıq mövcud): ${skipped}. Səhv: ${failed}. Cəmi kataloq: ${merged.length}.`);
  if (added > 0) process.exitCode = 10; /* signal: catalog changed */
}

main().catch((error) => {
  console.error("Sinxronizasiya dayandı:", error);
  process.exitCode = 1;
});
