import { NextRequest, NextResponse } from "next/server";
import { currentEmployerRegistry } from "@/lib/employer-store";
import { publicBoardUrl } from "@/lib/board-url";
import candidates from "@/data/employer-candidates.json";

export async function GET(request: NextRequest) {
  const employerRegistry = await currentEmployerRegistry();
  const query = (request.nextUrl.searchParams.get("q") || "").slice(0, 100).toLowerCase();
  const page = Math.max(0, Math.min(1000, Number(request.nextUrl.searchParams.get("page")) || 0));
  const matches = employerRegistry.filter((e) => !query || `${e.name} ${e.slug} ${e.categories.join(" ")} ${e.locations?.join(" ") || ""}`.toLowerCase().includes(query));
  const employers = matches.slice(page * 40, (page + 1) * 40).map((e) => ({ name: e.name, provider: e.provider, slug: e.slug, url: publicBoardUrl(e), regions: e.regions, verifiedAt: e.verifiedAt, vacancySample: e.verifiedJobCount ?? 0, disabled: Boolean(e.disabled) }));
  return NextResponse.json({ employers, total: matches.length, page, pageSize: 40, stats: {
    configured: employerRegistry.length, activeAtLastCheck: employerRegistry.filter((e) => !e.disabled && (e.verifiedJobCount ?? 0) > 0).length,
    disabled: employerRegistry.filter((e) => e.disabled).length, candidates: candidates.length
  } }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } });
}
