/**
 * Shared-order payload codec, dependency-free and isomorphic (server metadata +
 * client components). Format: base64url(JSON [{id?, title, quantity}, …]).
 */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export type OrderItem = { id?: string; title: string; quantity: number };

function bytesToBase64Url(bytes: Uint8Array): string {
  let out = "";
  for (let position = 0; position < bytes.length; position += 3) {
    const a = bytes[position];
    const b = bytes[position + 1];
    const c = bytes[position + 2];
    out += ALPHABET[a >> 2];
    out += ALPHABET[((a & 3) << 4) | ((b ?? 0) >> 4)];
    if (b !== undefined) out += ALPHABET[((b & 15) << 2) | ((c ?? 0) >> 6)];
    if (c !== undefined) out += ALPHABET[c & 63];
  }
  return out;
}

function base64UrlToBytes(value: string): Uint8Array {
  const clean = value.replace(/=+$/, "");
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let byteIndex = 0;
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const code = ALPHABET.indexOf(char);
    if (code === -1) throw new Error("bad base64url");
    buffer = (buffer << 6) | code;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[byteIndex++] = (buffer >> bits) & 0xff;
    }
  }
  return bytes.subarray(0, byteIndex);
}

/** Encodes selected products into a compact, URL-safe order payload. */
export function encodeOrder(items: OrderItem[]): string {
  const safeItems = items
    .map((item) => ({
      id: typeof item.id === "string" ? item.id.slice(0, 80) : undefined,
      title: String(item.title ?? "").slice(0, 160),
      quantity: Math.min(999, Math.max(1, Math.floor(Number(item.quantity) || 1))),
    }))
    .filter((item) => item.title || item.id)
    .slice(0, 60);
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(safeItems)));
}

/** Defensive decode — legacy payloads (title-only) and junk input stay safe. */
export function decodeOrder(raw: string | null | undefined): OrderItem[] {
  if (!raw || raw.length > 4096) return [];
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(base64UrlToBytes(raw)));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map((item) => ({
        id: typeof item.id === "string" && item.id ? item.id.slice(0, 80) : undefined,
        title: String(item.title ?? "").slice(0, 160),
        quantity: Math.min(999, Math.max(1, Math.floor(Number(item.quantity) || 1))),
      }))
      .filter((item) => item.title.length > 0 || item.id)
      .slice(0, 60);
  } catch {
    return [];
  }
}

/** Builds the canonical shareable URL for a set of order items. */
export function orderLink(origin: string, items: OrderItem[]): string {
  return `${origin.replace(/\/$/, "")}/order?items=${encodeURIComponent(encodeOrder(items))}`;
}
