import { NextResponse } from "next/server";
import { loadCareerSnapshot, loadCoverageSummary } from "@/lib/career-data";
import { coverageHealth } from "@/lib/coverage";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  const [snapshotResult, summaryResult] = await Promise.all([loadCareerSnapshot(), loadCoverageSummary()]);
  const snapshot = snapshotResult.value;
  const summary = summaryResult.value;
  const health = coverageHealth({
    checkedAt: snapshot.checkedAt,
    jobs: snapshot.jobs.length,
    sources: snapshot.sources.length,
    directoryEntries: summary.directoryEntries,
    configuredFeeds: summary.configuredFeeds
  });
  const liveData = snapshotResult.source === "release" && summaryResult.source === "release";
  return NextResponse.json({ service: "VEYRA", ...health, dataSource: liveData ? "release" : "bundled-fallback" }, {
    status: health.status === "healthy" && liveData ? 200 : 503,
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" }
  });
}
