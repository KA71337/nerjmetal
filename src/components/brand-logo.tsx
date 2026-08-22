import Image from "next/image";

/**
 * Official brand emblem. `sizes` is passed explicitly so Next.js emits small 64/128px candidates
 * instead of the 384/750px variants it would pick for a fixed-width image.
 */
export function BrandLogo({
  className = "",
  sizes = "64px",
  priority = false,
}: {
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/nerj-metal-official-logo.jpg"
      alt="NERJ METAL rəsmi loqosu"
      width={350}
      height={350}
      sizes={sizes}
      priority={priority}
      className={`object-contain ${className}`}
    />
  );
}
