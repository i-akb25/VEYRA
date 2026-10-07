type CacheEntry<T> = { value: T; expiresAt: number; storedAt: number; bytes: number };
type Circuit = { failures: number; openUntil: number };

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
const circuits = new Map<string, Circuit>();
const MAX_CACHE_ENTRIES = 160;
const MAX_CACHE_BYTES = 64 * 1024 * 1024;
let cacheBytes = 0;

function removeEntry(key: string) { const entry = cache.get(key); if (entry) cacheBytes -= entry.bytes; cache.delete(key); }
function pruneCache(now: number) { for (const [key, entry] of cache) if (entry.expiresAt <= now) removeEntry(key); }

export const FEED_TTL_MS = 20 * 60 * 1000;
export const SEARCH_TTL_MS = 5 * 60 * 1000;

export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<{ value: T; cached: boolean; checkedAt: string }> {
  const now = Date.now();
  pruneCache(now);
  const existing = cache.get(key) as CacheEntry<T> | undefined;
  if (existing && existing.expiresAt > now) { cache.delete(key); cache.set(key, existing); return { value: existing.value, cached: true, checkedAt: new Date(existing.storedAt).toISOString() }; }
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return { value: await pending, cached: true, checkedAt: new Date().toISOString() };
  const task = loader().then((value) => {
    const bytes = Buffer.byteLength(JSON.stringify(value) ?? "");
    pruneCache(Date.now());
    if (bytes <= MAX_CACHE_BYTES) {
      removeEntry(key);
      while (cache.size && (cache.size >= MAX_CACHE_ENTRIES || cacheBytes + bytes > MAX_CACHE_BYTES)) removeEntry(cache.keys().next().value!);
      cache.set(key, { value, bytes, storedAt: Date.now(), expiresAt: Date.now() + ttlMs }); cacheBytes += bytes;
    }
    return value;
  }).finally(() => inflight.delete(key));
  inflight.set(key, task);
  return { value: await task, cached: false, checkedAt: new Date().toISOString() };
}

export function circuitOpen(key: string): boolean {
  const circuit = circuits.get(key);
  return Boolean(circuit && circuit.failures >= 3 && circuit.openUntil > Date.now());
}

export function recordSuccess(key: string) { circuits.delete(key); }

export function recordFailure(key: string) {
  const current = circuits.get(key) ?? { failures: 0, openUntil: 0 };
  const failures = current.failures + 1;
  circuits.set(key, { failures, openUntil: failures >= 3 ? Date.now() + 30 * 60 * 1000 : 0 });
}

export async function mapConcurrent<T, R>(items: T[], limit: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const output = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await worker(items[index], index);
    }
  }));
  return output;
}
