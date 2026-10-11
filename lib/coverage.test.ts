import { describe, expect, it } from "vitest";
import { coverageHealth } from "./coverage";

describe("coverage health", () => {
  it("reports a fresh populated snapshot as healthy", () => {
    expect(coverageHealth({ checkedAt: "2026-10-11T10:00:00Z", jobs: 100, sources: 160, directoryEntries: 160, configuredFeeds: 107 }, Date.parse("2026-10-11T12:00:00Z")).status).toBe("healthy");
  });

  it("reports stale or empty coverage honestly", () => {
    const result = coverageHealth({ checkedAt: "2026-10-09T00:00:00Z", jobs: 0, sources: 2, directoryEntries: 3, configuredFeeds: 4 }, Date.parse("2026-10-11T12:00:00Z"));
    expect(result.status).toBe("degraded");
    expect(result.reasons.length).toBe(5);
  });
});
