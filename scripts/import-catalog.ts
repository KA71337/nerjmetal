import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE = "https://tap.az/shops/nerj_metal?user_id=16790475";
const GRAPHQL = "https://tap.az/graphql";
const EXPECTED_USER_ID = "16790475";
const EXPECTED_SHOP_URI = "/shops/nerj_metal";

type Product = {
  id: string;
  slug: string;
  title: string;
  price?: string;
  currency?: string;
  description?: string;
  category?: string;
  images: string[];
  sourceUrl: string;
};

type ShopAd = { legacyResourceId: number; path: string; shop?: { uri?: string } };
type ApolloAd = {
  legacyResourceId?: number;
  title?: string;
  body?: string;
  price?: number;
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
    headers: { accept: "text/html", "user-agent": "Mozilla/5.0 (compatible; NERJ-METAL-Catalog-Importer/2.0)" },
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
        "user-agent": "Mozilla/5.0 (compatible; NERJ-METAL-Catalog-Importer/2.0)",
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
    const payload = await response.json() as { data?: { ShopAds?: { edges?: Array<{ node: ShopAd }>; pageInfo?: { endCursor?: string; hasNextPage?: boolean }; totalCount?: number } }; errors?: Array<{ message: string }> };
    if (payload.errors?.length) throw new Error(payload.errors.map((error) => error.message).join("; "));
    const page = payload.data?.ShopAds;
    if (!page) throw new Error("Shop API cavabında ShopAds yoxdur");
    for (const edge of page.edges ?? []) {
      if (edge.node.shop?.uri === EXPECTED_SHOP_URI) ads.push(edge.node);
    }
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
  for (const [index, url] of urls.entries()) {
    try {
      const response = await fetch(url, { headers: { referer: "https://tap.az/" } });
      if (!response.ok) throw new Error(String(response.status));
      const type = response.headers.get("content-type") ?? "";
      const extension = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
      const filename = `${index + 1}.${extension}`;
      await writeFile(path.join(directory, filename), Buffer.from(await response.arrayBuffer()));
      images.push(`/products/${id}/${filename}`);
    } catch (error) {
      console.warn(`  Şəkil yüklənmədi: ${url} (${error instanceof Error ? error.message : String(error)})`);
    }
  }
  return images;
}

async function main() {
  console.log(`Mənbə: ${SOURCE}`);
  const ads = await listShopAds();
  console.log(`Mağaza API-si: ${ads.length} unikal elan`);
  const products: Product[] = [];
  let failed = 0;

  for (const [index, listedAd] of ads.entries()) {
    const sourceUrl = new URL(listedAd.path, SOURCE).href;
    try {
      const data = nextData(await requestText(sourceUrl));
      const state = data.props?.pageProps?.apolloState ?? {};
      const ad = Object.entries(state).find(([key, value]) => key.startsWith("Ad:") && (value as ApolloAd).legacyResourceId === listedAd.legacyResourceId)?.[1] as ApolloAd | undefined;
      if (!ad?.title || !ad.path) throw new Error("Elanın konkret Apollo bloku tapılmadı");
      const user = ad.user?.__ref ? state[ad.user.__ref] as { legacyId?: string } | undefined : undefined;
      const shop = ad.shop?.__ref ? state[ad.shop.__ref] as { uri?: string } | undefined : undefined;
      if (String(user?.legacyId) !== EXPECTED_USER_ID || shop?.uri !== EXPECTED_SHOP_URI) throw new Error("Elan NERJ METAL mağazasına aid deyil");

      const jsonLd = data.props?.pageProps?.seoFullData?.jsonLd ?? [];
      const offer = productLd(jsonLd)?.offers;
      const id = String(ad.legacyResourceId);
      const currency = offer?.priceCurrency;
      const numericPrice = offer?.price ?? (typeof ad.price === "number" ? String(ad.price) : undefined);
      const imageUrls = [...new Set((ad.photos ?? []).map((photo) => photo.url).filter((url): url is string => Boolean(url)))];
      const images = await downloadImages(id, imageUrls);
      products.push({
        id,
        slug: `${slugify(ad.title) || "product"}-${id}`,
        title: ad.title,
        ...(numericPrice ? { price: `${Number(numericPrice)}${currency ? ` ${currency}` : ""}` } : {}),
        ...(currency ? { currency } : {}),
        ...(ad.body ? { description: ad.body } : {}),
        ...(categoryFromLd(jsonLd) ? { category: categoryFromLd(jsonLd) } : {}),
        images,
        sourceUrl,
      });
      console.log(`[${index + 1}/${ads.length}] OK ${id} ${ad.title} | şəkil: ${images.length}`);
    } catch (error) {
      failed++;
      console.warn(`[${index + 1}/${ads.length}] FAIL ${sourceUrl}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  await mkdir(path.join(process.cwd(), "src", "data"), { recursive: true });
  await writeFile(path.join(process.cwd(), "src", "data", "products.json"), `${JSON.stringify(products, null, 2)}\n`);
  console.log(`\nHESABAT: ${products.length}/${ads.length} idxal edildi, ${failed} uğursuz, ${products.reduce((sum, product) => sum + product.images.length, 0)} şəkil.`);
  const special = products.find((product) => product.id === "46883973");
  console.log(special ? `Xüsusi yoxlama: ${special.slug} mövcuddur.` : "Xüsusi yoxlama: 46883973 əlçatan siyahıda yoxdur.");
  if (!products.length) process.exitCode = 2;
}

main().catch((error) => {
  console.error("İdxal dayandı:", error);
  process.exitCode = 1;
});
