import { NextResponse } from "next/server";
import snapshot from "@/data/career-snapshot.json";
import summary from "@/data/coverage-summary.json";
import { coverageHealth } from "@/lib/coverage";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  const health = coverageHealth({
    checkedAt: snapshot.checkedAt,
    jobs: snapshot.jobs.length,
    sources: snapshot.sources.length,
    directoryEntries: summary.directoryEntries,
    configuredFeeds: summary.configuredFeeds
  });
  return NextResponse.json({ service: "VEYRA", ...health }, {
    status: health.status === "healthy" ? 200 : 503,
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" }
  });
}
