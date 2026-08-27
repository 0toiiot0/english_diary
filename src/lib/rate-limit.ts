import 'server-only';

/**
 * IP 기준 인메모리 rate limit (PRD 5.5, 6.7).
 * v1은 단일 인스턴스를 가정한다. Vercel 서버리스 다중 인스턴스에서는
 * 인스턴스별로 따로 세므로 완전한 방어는 아니다 — 남용이 관측되면
 * Upstash Redis 등으로 전환한다 (PRD 6.8, 11.2-③).
 */

const MINUTE_LIMIT = 3;
const HOUR_LIMIT = 20;
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * 60_000;

interface Bucket {
  minuteTimestamps: number[];
  hourTimestamps: number[];
}

const buckets = new Map<string, Bucket>();

// 메모리 누수를 막기 위해 오래된 IP 항목을 주기적으로 청소한다.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < HOUR_MS) return;
  lastSweep = now;
  for (const [ip, bucket] of buckets) {
    bucket.hourTimestamps = bucket.hourTimestamps.filter((t) => now - t < HOUR_MS);
    if (bucket.hourTimestamps.length === 0) buckets.delete(ip);
  }
}

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  sweep(now);

  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = { minuteTimestamps: [], hourTimestamps: [] };
    buckets.set(ip, bucket);
  }

  bucket.minuteTimestamps = bucket.minuteTimestamps.filter((t) => now - t < MINUTE_MS);
  bucket.hourTimestamps = bucket.hourTimestamps.filter((t) => now - t < HOUR_MS);

  if (bucket.minuteTimestamps.length >= MINUTE_LIMIT) {
    const oldest = Math.min(...bucket.minuteTimestamps);
    return { allowed: false, retryAfterSeconds: Math.ceil((MINUTE_MS - (now - oldest)) / 1000) };
  }
  if (bucket.hourTimestamps.length >= HOUR_LIMIT) {
    const oldest = Math.min(...bucket.hourTimestamps);
    return { allowed: false, retryAfterSeconds: Math.ceil((HOUR_MS - (now - oldest)) / 1000) };
  }

  bucket.minuteTimestamps.push(now);
  bucket.hourTimestamps.push(now);
  return { allowed: true };
}
