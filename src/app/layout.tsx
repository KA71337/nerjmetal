import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Archivo } from "next/font/google";
import "./globals.css";
import "./styles/premium.css";
import { AppProviders } from "@/components/app-providers";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { site } from "@/lib/site";
import { jsonLdScript } from "@/lib/json-ld";

/**
 * Archivo carries the full latin-ext range (ə Ə ğ Ğ ı İ ş Ş ç Ç ö ü) at every weight up to 900,
 * so Azerbaijani copy renders with real glyphs instead of fallback boxes.
 */
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s — ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "paslanmayan polad",
    "nerj metal",
    "metal Bakı",
    "polad boru",
    "316 polad",
    "metal konstruksiya",
    "hovuz şəlaləsi",
    "sənaye avadanlığı",
  ],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  category: "business",
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: true, address: false, email: false },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
    locale: site.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#080a0b",
};

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "LocalBusiness"],
      "@id": `${site.url}/#organization`,
      name: site.name,
      url: site.url,
      logo: `${site.url}${site.logo}`,
      image: `${site.url}${site.logo}`,
      description: site.description,
      telephone: site.phone,
      priceRange: "$$",
      areaServed: "AZ",
      geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
      address: {
        "@type": "PostalAddress",
        streetAddress: site.address.street,
        addressLocality: site.address.city,
        addressRegion: site.address.district,
        postalCode: site.address.postalCode,
        addressCountry: site.address.country,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      inLanguage: site.lang,
      publisher: { "@id": `${site.url}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${site.url}/catalog?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={site.lang} className={archivo.variable}>
      <body>
        <a href="#main" className="skip-link">
          Məzmuna keç
        </a>
        <AppProviders>
          <Header />
          {children}
          <Footer />
          <MobileBottomNav />
        </AppProviders>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }} />
        {/* Google AdSense loader — afterInteractive keeps it out of the critical path. */}
        <Script
          id="adsense-loader"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3346958542678383"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
