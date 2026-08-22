"use client";

import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle, Phone } from "lucide-react";
import { site } from "@/lib/site";

/** Share actions for the shared order page: copy text + WhatsApp deep link. */
export function OrderShare({ shareText }: { shareText: string }) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const fullText = origin ? `${shareText}\n\n${origin}${window.location.pathname}` : shareText;

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
    } catch {
      /* clipboard denied — user can still select the summary manually */
    }
  }

  return (
    <div className="order-share">
      <a
        className="btn btn-acid"
        href={`https://wa.me/${site.phone.replace("+", "")}?text=${encodeURIComponent(fullText)}`}
        target="_blank"
        rel="noreferrer"
      >
        <MessageCircle size={16} /> WhatsApp ilə sifariş et
      </a>
      <div className="order-share__row">
        <button type="button" className="btn" onClick={copy}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Kopyalandı" : "Sifarişi kopyala"}
        </button>
        <a className="btn" href={`tel:${site.phone}`}>
          <Phone size={15} /> Zəng et
        </a>
      </div>
    </div>
  );
}
