const WINDOW_MS = 60_000;

function parseLimit(): number {
  const raw = process.env.ASSISTANT_RATE_LIMIT;
  if (!raw) return 100;
  const value = Number(raw);
  if (Number.isNaN(value) || value <= 0) {
    console.warn(
      `ASSISTANT_RATE_LIMIT "${raw}" is invalid; falling back to 100`
    );
    return 100;
  }
  return value;
}

const MAX_REQUESTS = parseLimit();

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function cleanupExpired(now: number) {
  for (const [key, bucket] of buckets.entries()) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(keyId: string): {
  allowed: boolean;
  retryAfter: number;
} {
  const now = Date.now();
  cleanupExpired(now);

  const bucket = buckets.get(keyId);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(keyId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (bucket.count < MAX_REQUESTS) {
    bucket.count += 1;
    return { allowed: true, retryAfter: 0 };
  }

  return {
    allowed: false,
    retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
  };
}
