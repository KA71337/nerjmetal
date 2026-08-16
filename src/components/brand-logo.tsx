import Image from "next/image";

export function BrandLogo({ className = "" }: { className?: string }) {
  return <Image src="/brand/nerj-metal-official-logo.jpg" alt="NERJ METAL rəsmi loqosu" width={350} height={350} className={`object-contain ${className}`} priority />;
}
