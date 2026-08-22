import Image from "next/image";

const DEFAULT_SIZES = "(max-width: 359px) 100vw, (max-width: 899px) 50vw, (max-width: 1399px) 33vw, 25vw";

/**
 * Renders a product photo that always fills its container (object-fit: cover), or a branded
 * industrial placeholder composition when a product has no image yet.
 */
export function ProductVisual({
  title,
  image,
  priority = false,
  sizes = DEFAULT_SIZES,
  quality = 76,
}: {
  title: string;
  image?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}) {
  if (image)
    return (
      <Image
        src={image}
        alt={title}
        fill
        priority={priority}
        sizes={sizes}
        quality={quality}
        className="object-cover"
      />
    );
  return (
    <div
      role="img"
      aria-label={`${title} üçün dekorativ metal kompozisiya`}
      className="absolute inset-0 overflow-hidden bg-[#12171a]"
    >
      <div className="absolute inset-[15%] rotate-12 border-[16px] border-white/10" />
      <div className="absolute left-[15%] top-0 h-full w-[18%] -skew-x-12 bg-gradient-to-r from-white/5 via-white/25 to-white/5" />
      <div className="absolute bottom-3 right-4 text-5xl font-black text-white/5">NM</div>
    </div>
  );
}
