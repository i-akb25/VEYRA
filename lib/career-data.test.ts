import { describe, expect, test, vi } from "vitest";
import { careerDataUrls, loadCareerSnapshot, loadCoverageSummary } from "./career-data";

const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { "content-type": "application/json" }
});

describe("release-backed career data", () => {
  test("loads a valid live snapshot from the stable release asset", async () => {
    const checkedAt = "2026-10-12T12:29:48.488Z";
    const fetcher = vi.fn(async () => response({ checkedAt, jobs: [{ id: "acme-1", title: "Engineer", company: "Acme", location: "Pune, India", remote: false, source: "Company Careers", url: "https://example.com/jobs/1", publishedAt: checkedAt, description: "Power systems", tags: [] }], sources: [] }));
    const result = await loadCareerSnapshot(fetcher);
    expect(result.source).toBe("release");
    expect(result.value.checkedAt).toBe(checkedAt);
    expect(fetcher).toHaveBeenCalledWith(careerDataUrls.snapshot, expect.objectContaining({ next: { revalidate: 900 } }));
  });

  test("uses the checked-in snapshot when the release asset is unavailable or malformed", async () => {
    const unavailable = await loadCareerSnapshot(vi.fn(async () => response({}, 503)));
    const malformed = await loadCareerSnapshot(vi.fn(async () => response({ checkedAt: "bad", jobs: [], sources: [] })));
    expect(unavailable.source).toBe("bundled");
    expect(malformed.source).toBe("bundled");
    expect(unavailable.value.jobs.length).toBeGreaterThan(0);
  });

  test("loads live coverage and falls back safely", async () => {
    const live = { generatedAt: "2026-10-12T12:32:39.572Z", directoryEntries: 160, configuredFeeds: 107, distinctDestinations: 265, providers: {}, snapshotCheckedAt: "2026-10-12T12:29:48.488Z", snapshotJobs: 5045, snapshotSources: 160, sourcesWithConfirmedVacancies: 62, pagesChecked: 2615 };
    expect((await loadCoverageSummary(vi.fn(async () => response(live)))).source).toBe("release");
    expect((await loadCoverageSummary(vi.fn(async () => response({})))).source).toBe("bundled");
  });
});
