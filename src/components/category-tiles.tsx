"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight, Boxes, Check, Factory, HardHat, LayoutGrid, Package, Sprout, Wrench,
  type LucideIcon,
} from "lucide-react";

export type CategoryTile = { key: string; label: string; count: number; image?: string };

/**
 * Keyword rules keep the icon set meaningful for any future category without a hard-coded list.
 * Patterns intentionally use ASCII-only fragments so Azerbaijani casing (ı/İ/ə) can never break them.
 */
const RULES: Array<[RegExp, LucideIcon]> = [
  [/ham/i, LayoutGrid],
  [/qura|monta/i, Wrench],
  [/tikinti|emir|insa/i, HardHat],
  [/bostan|bag|park/i, Sprout],
  [/biznes|avadanl|sena|senaye|business/i, Factory],
  [/dig|other/i, Boxes],
];

function pickIcon(label: string): LucideIcon {
  for (const [pattern, icon] of RULES) if (pattern.test(label)) return icon;
  return Package;
}

function trackPointer(event: React.PointerEvent<HTMLButtonElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
  event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
}

export function CategoryTiles({
  items,
  active,
  onSelect,
}: {
  items: CategoryTile[];
  active: string;
  onSelect: (key: string) => void;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="cat-grid"
      role="group"
      aria-label="Kateqoriyalar"
      initial={reduced ? undefined : "hidden"}
      animate={reduced ? undefined : "show"}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } } }}
    >
      {items.map((item, index) => {
        const Icon = pickIcon(item.label);
        const isActive = item.key === active;
        return (
          <motion.button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            onPointerMove={trackPointer}
            aria-pressed={isActive}
            className={`cat-tile${isActive ? " is-active" : ""}`}
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.55, ease: [0.22, 0.68, 0.16, 1] }}
          >
            {item.image && (
              <span className="cat-tile__photo">
                <Image src={item.image} alt="" fill sizes="(max-width: 767px) 50vw, 25vw" quality={55} />
              </span>
            )}
            <span className="cat-tile__plate" />
            <span className="cat-tile__glow" />
            <span className="cat-tile__sheen" />
            <span className="cat-tile__frame" />
            <span className="cat-tile__rail" />
            <span className="cat-tile__head">
              <span className="cat-tile__icon">{isActive ? <Check size={19} /> : <Icon size={19} />}</span>
              <span className="cat-tile__index">{String(index + 1).padStart(2, "0")}</span>
            </span>
            <span className="cat-tile__name">{item.label}</span>
            <span className="cat-tile__foot">
              <span className="cat-tile__count">{item.count} məhsul</span>
              <ArrowUpRight className="cat-tile__arrow" size={16} />
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
