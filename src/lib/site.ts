/** Central brand + site configuration. Single source of truth for SEO and contact data. */
export const site = {
  /** Set NEXT_PUBLIC_SITE_URL in Vercel once the nerjmetal.az domain is live. */
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://nerjmetal.vercel.app").replace(/\/$/, ""),
  name: "NERJ METAL",
  legalName: "NERJ METAL",
  tagline: "Paslanmayan polad həlləri",
  description:
    "Tikinti, sənaye, qida və kimyəvi sektorlar üçün paslanmayan polad həlləri. Bakıda 15+ illik metal təcrübəsi, ölçüyə uyğun istehsal və quraşdırma.",
  locale: "az_AZ",
  lang: "az",
  phone: "+994708440664",
  phoneLabel: "(070) 844-06-64",
  logo: "/brand/nerj-metal-official-logo.jpg",
  /**
   * Two orientations of the same brand footage, both re-encoded with no audio track:
   * `wide` (1280x720, from video16na9.mp4) serves tablet/desktop, `tall` (478x850, from video.mp4)
   * serves phones — so neither breakpoint has to upscale or crop away the subject.
   */
  video: {
    tall: { mp4: "/media/hero.mp4", poster: "/media/hero-poster.jpg" },
    wide: { mp4: "/media/hero-wide.mp4", poster: "/media/hero-wide-poster.jpg" },
    /** Matches the CSS breakpoint that switches the hero between the two sources. */
    wideQuery: "(min-width: 768px)",
  },
  geo: { lat: 40.4265337, lng: 49.8868771 },
  address: {
    street: "Ziya Bünyadov prospekti, 112",
    district: "Nərimanov rayonu",
    city: "Bakı",
    postalCode: "1033",
    country: "AZ",
    full: "Bakı şəhəri, Nərimanov rayonu, Ziya Bünyadov prospekti, 112",
  },
} as const;

export const routeLink = `https://www.google.com/maps/dir/?api=1&destination=${site.geo.lat}%2C${site.geo.lng}`;
