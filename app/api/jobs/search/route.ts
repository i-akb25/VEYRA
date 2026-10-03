import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Job, SearchResponse } from "@/lib/types";

export const runtime = "nodejs";
export const revalidate = 0;

const searchSchema = z.object({
  q: z.string().trim().max(100).default(""),
  location: z.string().trim().max(100).default(""),
  remote: z.enum(["true", "false"]).default("false")
});

const clean = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1800);

async function remotive(): Promise<Job[]> {
  const response = await fetch("https://remotive.com/api/remote-jobs?limit=100", { signal: AbortSignal.timeout(7000), cache: "no-store" });
  if (!response.ok) throw new Error("Remotive unavailable");
  const data = await response.json() as { jobs?: Array<Record<string, unknown>> };
  return (data.jobs ?? []).map((item) => ({
    id: `remotive-${String(item.id)}`,
    title: String(item.title ?? "Untitled role"),
    company: String(item.company_name ?? "Unknown company"),
    location: String(item.candidate_required_location ?? "Remote"),
    remote: true,
    source: "Remotive" as const,
    url: String(item.url ?? ""),
    publishedAt: String(item.publication_date ?? ""),
    description: clean(String(item.description ?? "")),
    tags: Array.isArray(item.tags) ? item.tags.map(String).slice(0, 8) : []
  }));
}

async function arbeitnow(): Promise<Job[]> {
  const response = await fetch("https://www.arbeitnow.com/api/job-board-api", { signal: AbortSignal.timeout(7000), cache: "no-store" });
  if (!response.ok) throw new Error("Arbeitnow unavailable");
  const data = await response.json() as { data?: Array<Record<string, unknown>> };
  return (data.data ?? []).map((item) => ({
    id: `arbeitnow-${String(item.slug)}`,
    title: String(item.title ?? "Untitled role"),
    company: String(item.company_name ?? "Unknown company"),
    location: String(item.location ?? "Not specified"),
    remote: Boolean(item.remote),
    source: "Arbeitnow" as const,
    url: String(item.url ?? ""),
    publishedAt: item.created_at ? new Date(Number(item.created_at) * 1000).toISOString() : "",
    description: clean(String(item.description ?? "")),
    tags: Array.isArray(item.tags) ? item.tags.map(String).slice(0, 8) : []
  }));
}

export async function GET(request: NextRequest) {
  const parsed = searchSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid search parameters" }, { status: 400 });

  const outcomes = await Promise.allSettled([remotive(), arbeitnow()]);
  const warnings = outcomes.flatMap((result, index) => result.status === "rejected" ? [`${index === 0 ? "Remotive" : "Arbeitnow"} could not be reached.`] : []);
  const allJobs = outcomes.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const { q, location, remote } = parsed.data;
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const locationTerm = location.toLowerCase();

  const jobs = allJobs.filter((job) => {
    const searchable = `${job.title} ${job.company} ${job.description} ${job.tags.join(" ")}`.toLowerCase();
    const matchesQuery = terms.length === 0 || terms.every((term) => searchable.includes(term));
    const matchesLocation = !locationTerm || job.location.toLowerCase().includes(locationTerm) || (job.remote && locationTerm === "remote");
    return matchesQuery && matchesLocation && (remote !== "true" || job.remote);
  }).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 80);

  const body: SearchResponse = { jobs, fetchedAt: new Date().toISOString(), warnings };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
