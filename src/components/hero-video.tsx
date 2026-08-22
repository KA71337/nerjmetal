"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

const { tall, wide, wideQuery } = site.video;

/**
 * Full-bleed hero background video.
 *
 * The poster paints first (art-directed per breakpoint, so it is a cheap LCP), and the muted
 * looping clip is mounted only once the page is idle — and only when the visitor has not asked for
 * reduced motion or data saving. Phones get the 9:16 cut, tablet and desktop get the 16:9 cut.
 */
export function HeroVideo() {
  const [mount, setMount] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isWide, setIsWide] = useState(true);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const query = window.matchMedia(wideQuery);
    setIsWide(query.matches);
    const onChange = (event: MediaQueryListEvent) => setIsWide(event.matches);
    query.addEventListener("change", onChange);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => query.removeEventListener("change", onChange);
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData || /^(slow-2g|2g)$/.test(conn?.effectiveType || "")) {
      return () => query.removeEventListener("change", onChange);
    }
    const idle = window.requestIdleCallback?.bind(window) ?? ((cb: () => void) => window.setTimeout(cb, 400));
    const id = idle(() => setMount(true));
    return () => {
      query.removeEventListener("change", onChange);
      window.cancelIdleCallback?.(id as number);
    };
  }, []);

  const source = isWide ? wide : tall;

  useEffect(() => {
    if (!mount) return;
    // Some mobile browsers ignore the autoplay attribute until play() is called explicitly.
    ref.current?.play().catch(() => undefined);
  }, [mount, source.mp4]);

  return (
    <div className="hero-media" aria-hidden="true">
      <picture>
        <source media={wideQuery} srcSet={wide.poster} />
        <img src={tall.poster} alt="" className="hero-poster" fetchPriority="high" decoding="async" />
      </picture>
      {mount && (
        <video
          key={source.mp4}
          ref={ref}
          src={source.mp4}
          poster={source.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          tabIndex={-1}
          disablePictureInPicture
          onPlaying={() => setVisible(true)}
          style={{ opacity: visible ? 1 : 0, transition: "opacity .9s cubic-bezier(.22,.68,.16,1)" }}
        />
      )}
      <div className="hero-scrim" />
      <div className="hero-grain" />
    </div>
  );
}
