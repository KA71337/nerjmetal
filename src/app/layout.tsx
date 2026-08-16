import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";

const siteUrl = "https://nerjmetal.az";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "NERJ METAL — Paslanmayan polad həlləri", template: "%s — NERJ METAL" },
  description: "Tikinti, sənaye, qida və kimyəvi sektorlar üçün paslanmayan polad həlləri.",
  alternates: { canonical: "/" },
  openGraph: { title: "NERJ METAL", description: "15+ illik metal təcrübəsi.", url: siteUrl, siteName: "NERJ METAL", locale: "az_AZ", type: "website" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organization = { "@context":"https://schema.org", "@type":"Organization", name:"NERJ METAL", url:siteUrl, logo:`${siteUrl}/brand/nerj-metal-official-logo.jpg`, telephone:"+994708440664", geo:{"@type":"GeoCoordinates",latitude:40.4265337,longitude:49.8868771}, address:{ "@type":"PostalAddress", streetAddress:"Ziya Bünyadov prospekti, 112", addressLocality:"Bakı", addressRegion:"Nərimanov rayonu", postalCode:"1033", addressCountry:"AZ" } };
  return <html lang="az"><body><a href="#main" className="fixed left-3 top-3 z-[100] -translate-y-20 bg-[var(--acid)] p-3 text-black focus:translate-y-0">Məzmuna keç</a><AppProviders>{children}</AppProviders><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organization)}} /></body></html>;
}
