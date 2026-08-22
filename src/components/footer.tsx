import Link from "next/link";
import { Navigation, Phone } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { routeLink, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container-wide footer-grid">
        <div className="footer-brand">
          <div>
            <BrandLogo className="footer-logo rounded-full" />
            <b>
              NERJ<span className="text-[var(--acid)]">/</span>METAL
            </b>
          </div>
          <p>
            Tikinti, sənaye, qida və kimyəvi sektorlar üçün paslanmayan polad həlləri. Ölçüyə uyğun istehsal,
            quraşdırma və texniki məsləhət.
          </p>
        </div>

        <nav className="footer-col" aria-label="Alt naviqasiya">
          <h3>Naviqasiya</h3>
          <Link href="/catalog">Kataloq</Link>
          <Link href="/favorites">Seçilmişlər</Link>
          <Link href="/#story">Haqqımızda</Link>
          <Link href="/#sectors">Sektorlar</Link>
          <Link href="/admin">İdarəetmə</Link>
        </nav>

        <div className="footer-col">
          <h3>Əlaqə</h3>
          <a className="is-acid" href={`tel:${site.phone}`}>
            <Phone size={15} /> {site.phoneLabel}
          </a>
          <address>{site.address.full}</address>
          <a href={routeLink} target="_blank" rel="noreferrer">
            <Navigation size={15} /> Marşrut qur
          </a>
        </div>
      </div>
      <div className="container-wide footer-bottom">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <span>
          {site.address.city} · {site.address.district}
        </span>
      </div>
    </footer>
  );
}
