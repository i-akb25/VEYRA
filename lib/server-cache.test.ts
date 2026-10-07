import { expect, it, vi } from "vitest";
import { cached } from "./server-cache";

it("shares in-flight provider loads and expires cached data", async () => {
  vi.useFakeTimers();
  try {
    const load = vi.fn(async () => ["public listing"]);
    await Promise.all([cached("test:inflight", 1000, load), cached("test:inflight", 1000, load)]);
    expect(load).toHaveBeenCalledTimes(1);
    expect((await cached("test:inflight", 1000, load)).cached).toBe(true);
    vi.advanceTimersByTime(1001);
    expect((await cached("test:inflight", 1000, load)).cached).toBe(false);
    expect(load).toHaveBeenCalledTimes(2);
  } finally { vi.useRealTimers(); }
});

it("evicts old entries instead of accumulating every search indefinitely", async () => {
  const first = vi.fn(async () => "first");
  await cached("test:oldest", 60_000, first);
  for (let index = 0; index < 160; index += 1) await cached(`test:bounded:${index}`, 60_000, async () => index);
  expect((await cached("test:oldest", 60_000, first)).cached).toBe(false);
  expect(first).toHaveBeenCalledTimes(2);
});
