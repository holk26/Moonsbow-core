const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number(process.env.ASSISTANT_RATE_LIMIT || "100");

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(keyId: string): {
  allowed: boolean;
  retryAfter: number;
} {
  const now = Date.now();
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
