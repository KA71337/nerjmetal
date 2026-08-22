import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Factory, FlaskConical, HardHat, Phone, UtensilsCrossed } from "lucide-react";
import { HeroVideo } from "@/components/hero-video";
import { Reveal } from "@/components/reveal";
import { LocationMap } from "@/components/location-map";
import { site } from "@/lib/site";

const sectors = [
  { name: "Tikinti", Icon: HardHat },
  { name: "Sənaye", Icon: Factory },
  { name: "Qida", Icon: UtensilsCrossed },
  { name: "Kimyəvi", Icon: FlaskConical },
];

export default function Home() {
  return (
    <main id="main">
      {/* ---------------------------------------------------------------- HERO */}
      <section className="hero">
        <HeroVideo />
        <div className="container-wide hero-inner">
          <p className="eyebrow mb-6">Paslanmayan polad · Bakı</p>
          <h1 className="hero-title">
            <span className="hero-line">Güc.</span>
            <span className="hero-line text-stroke">Dəqiqlik.</span>
            <span className="hero-line">Metal.</span>
          </h1>
          <div className="hero-meta mt-10 flex flex-col justify-between gap-7 pt-6 md:mt-12 md:flex-row md:items-end">
            <p className="max-w-md text-base text-white/65 md:text-lg">
              Tikinti, sənaye, qida və kimyəvi sektorlar üçün metal həlləri. 15+ illik təcrübə, ölçüyə uyğun istehsal.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/catalog" className="btn btn-acid">
                Kataloqa bax <ArrowDownRight size={18} />
              </Link>
              <a href={`tel:${site.phone}`} className="btn">
                <Phone size={16} /> {site.phoneLabel}
              </a>
            </div>
          </div>
        </div>
        <span className="hero-scroll" aria-hidden="true">
          <i />
          Aşağı
        </span>
      </section>

      {/* --------------------------------------------------------------- STORY */}
      <section id="story" className="story-section py-28">
        <div className="container-wide grid gap-16 md:grid-cols-2">
          <Reveal>
            <p className="eyebrow">Haqqımızda / 01</p>
            <h2 className="mt-5 text-5xl font-black uppercase leading-none md:text-7xl">
              15+ il
              <br />
              materialı
              <br />
              anlamaq.
            </h2>
          </Reveal>
          <Reveal className="md:pt-24">
            <p className="max-w-xl text-lg leading-relaxed text-white/60 md:text-xl">
              NERJ METAL metalın davamlılığını dəqiq seçim və peşəkar yanaşma ilə birləşdirir. Məqsədimiz hər sektorun
              texniki ehtiyacına uyğun, aydın və etibarlı həll təqdim etməkdir.
            </p>
            <div className="mt-16 grid grid-cols-2 gap-4">
              <div className="panel p-6">
                <b className="text-5xl text-[var(--acid)]">15+</b>
                <p className="mt-2 text-xs uppercase tracking-widest text-white/50">illik təcrübə</p>
              </div>
              <div className="panel p-6">
                <b className="text-5xl">04</b>
                <p className="mt-2 text-xs uppercase tracking-widest text-white/50">əsas sektor</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      {/* ------------------------------------------------------------- SECTORS */}
      <section id="sectors" className="sectors-section border-y border-white/10 bg-[#101314] py-28">
        <div className="container-wide">
          <p className="eyebrow">Sektorlar / 02</p>
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4">
            {sectors.map(({ name, Icon }, index) => (
              <Reveal
                key={name}
                className="group min-h-60 border border-white/10 p-7 hover:bg-[var(--acid)] hover:text-black"
              >
                <span className="text-xs opacity-50">0{index + 1}</span>
                <Icon className="mt-10" size={35} />
                <h3 className="mt-12 text-2xl font-black uppercase">{name}</h3>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- CATALOG TEASER */}
      <section className="py-28">
        <div className="container-wide grid items-center gap-16 lg:grid-cols-2">
          <Reveal>
            <div className="panel grid-noise relative aspect-square overflow-hidden">
              <div className="absolute inset-[18%] rounded-full border-[5vw] border-white/10" />
              <div className="absolute inset-[30%] rotate-45 bg-[var(--acid)]/80" />
              <span className="absolute bottom-8 left-8 text-xs uppercase tracking-[.3em]">
                Industrial composition — 316
              </span>
            </div>
          </Reveal>
          <Reveal>
            <p className="eyebrow">Kataloq / 03</p>
            <h2 className="mt-6 text-5xl font-black uppercase md:text-7xl">
              Materialdan
              <br />
              nəticəyə.
            </h2>
            <p className="mt-8 max-w-lg text-lg text-white/60">
              Mövcud məhsulları kateqoriya üzrə araşdırın, seçilmişlərə və səbətə əlavə edin.
            </p>
            <Link href="/catalog" className="btn mt-10">
              Kataloqu aç <ArrowUpRight size={17} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- CONTACT */}
      <section id="contact" className="contact-section bg-[var(--acid)] py-24 text-black">
        <div className="container-wide flex flex-col justify-between gap-12 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest">Əlaqə / {site.address.city}</p>
            <h2 className="mt-5 max-w-4xl text-5xl font-black uppercase leading-none md:text-8xl">
              Layihənizi müzakirə edək.
            </h2>
          </div>
          <a
            href={`tel:${site.phone}`}
            className="flex w-fit items-center gap-3 border-b-2 border-black pb-2 text-xl font-black"
          >
            <Phone size={22} />
            {site.phoneLabel}
          </a>
        </div>
      </section>

      {/* ----------------------------------------------------------------- MAP */}
      <section aria-label={`${site.name} yerləşməsi`} className="bg-[#0d1011] py-6 md:py-10">
        <div className="container-wide">
          <LocationMap />
        </div>
      </section>
    </main>
  );
}
