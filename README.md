# NERJ METAL

Next.js 15 / React 19 əsaslı kataloq və sifariş sorğusu saytı.

## Başlama

```bash
npm install
npm run dev
```

## Kataloq importu

```bash
npm run import:catalog
```

Skript mağaza səhifəsindəki elanları tapmağa, hər elanı açmağa və mövcud title, price, description, category, images, sourceUrl məlumatını çıxarmağa çalışır. Şəkillər `public/products/`, məlumat `src/data/products.json` daxilində saxlanır. Saytın ictimai UI hissəsi `sourceUrl` göstərmir. Sayt strukturu dəyişərsə skript mövcud olmayan sahələri uydurmadan boş saxlayır və hesabat verir.

## Admin

`/admin` səhifəsi məhsullar üçün localStorage əsaslı CRUD və JSON import/export təqdim edir. Server autentifikasiyası və verilənlər bazası qoşulmazdan əvvəl yalnız lokal idarəetmə üçündür.
