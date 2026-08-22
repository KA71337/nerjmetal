/**
 * Minimal sliding-window rate limiter (per isolated instance).
 * On Vercel each lambda holds its own map — good enough to blunt abuse and
 * brute force without external infrastructure. Platform-level L3/L4 flooding
 * is absorbed upstream by Vercel's network, not by application code.
 */
type Bucket = { hits: number[]; lockedUntil?: number };

const buckets = new Map<string, Bucket>();

/** Periodically drop stale buckets so the map cannot grow unbounded. */
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    const recent = bucket.hits.filter((time) => now - time < 600_000);
    if (recent.length === 0 && (bucket.lockedUntil ?? 0) < now) buckets.delete(key);
    else bucket.hits = recent;
  }
}

export type LimitOptions = {
  /** Max requests inside the window. */
  limit: number;
  /** Window length in ms. */
  windowMs: number;
  /** Optional lockout after the limit is exceeded. */
  lockoutMs?: number;
};

export type LimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export function rateLimit(key: string, options: LimitOptions): LimitResult {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key) ?? { hits: [] };
  buckets.set(key, bucket);

  if ((bucket.lockedUntil ?? 0) > now) {
    const lockedUntil = bucket.lockedUntil ?? now;
    return { ok: false, retryAfterSec: Math.ceil((lockedUntil - now) / 1000) };
  }

  bucket.hits = bucket.hits.filter((time) => now - time < options.windowMs);
  if (bucket.hits.length >= options.limit) {
    if (options.lockoutMs) bucket.lockedUntil = now + options.lockoutMs;
    const oldest = bucket.hits[0] ?? now;
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((Math.max(oldest, now - options.windowMs) + options.windowMs - now) / 1000)),
    };
  }

  bucket.hits.push(now);
  return { ok: true };
}

/** Clears a bucket — used after successful auth so honest users restart clean. */
export function rateLimitReset(key: string): void {
  buckets.delete(key);
}

/** Best-effort client identity for throttling (proxy-aware, never trusted alone). */
export function requestKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
