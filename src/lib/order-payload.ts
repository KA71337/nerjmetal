/**
 * Shared-order token codec, dependency-free and isomorphic.
 *
 * A selection becomes `base64url(JSON [["<productId>", qty], …])` used directly
 * as the /order/<token> path segment. The URL therefore carries ONLY product
 * IDs and quantities — never titles, images or secrets. Product data is always
 * re-resolved server-side from the committed catalog, so photos/prices stay
 * current and each link shows exactly its own items (no shared state).
 */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export type SelectionEntry = { id: string; quantity: number };

const MAX_ITEMS = 60;
/** Catalog ids are numeric (tap.az legacy ids or admin Date.now ids). */
const ID_PATTERN = /^\d{1,20}$/;

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

/** Encodes a selection into a compact, URL-safe path token. Deduplicates ids. */
export function encodeSelection(entries: SelectionEntry[]): string {
  const map = new Map<string, number>();
  for (const entry of entries.slice(0, MAX_ITEMS)) {
    const id = String(entry?.id ?? "").trim();
    const quantity = Math.min(999, Math.max(1, Math.floor(Number(entry?.quantity) || 1)));
    if (!ID_PATTERN.test(id)) continue;
    map.set(id, quantity);
  }
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify([...map])));
}

/**
 * Strict decode — malformed tokens, oversized payloads, non-numeric ids,
 * quantities outside 1–999 and prototype-pollution keys are all rejected.
 * Returns [] when anything is off so callers can render a safe empty state.
 */
export function decodeSelection(token: string | null | undefined): SelectionEntry[] {
  if (!token || token.length > 2048) return [];
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(base64UrlToBytes(token)));
    if (!Array.isArray(parsed) || parsed.length > MAX_ITEMS) return [];
    const entries: SelectionEntry[] = [];
    const seen = new Set<string>();
    for (const pair of parsed) {
      if (!Array.isArray(pair) || pair.length !== 2) continue;
      const [id, quantity] = pair as unknown[];
      if (typeof id !== "string" || !ID_PATTERN.test(id)) continue;
      if (typeof quantity !== "number" || !Number.isFinite(quantity)) continue;
      const safeQuantity = Math.min(999, Math.max(1, Math.floor(quantity)));
      if (seen.has(id)) continue;
      seen.add(id);
      entries.push({ id, quantity: safeQuantity });
    }
    return entries;
  } catch {
    return [];
  }
}

/** Canonical shareable URL for a selection. */
export function orderLink(origin: string, entries: SelectionEntry[]): string {
  return `${origin.replace(/\/$/, "")}/order/${encodeSelection(entries)}`;
}
