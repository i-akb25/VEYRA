import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deduplicateJobs, extractSalary, getFreshness, inferExperience } from "@/lib/matching";
import type { Job, JobSource, SearchResponse } from "@/lib/types";

export const runtime = "nodejs";
export const revalidate = 0;

const searchSchema = z.object({
  q: z.string().trim().max(100).default(""),
  location: z.string().trim().max(100).default(""),
  remote: z.enum(["true", "false"]).default("false"),
  boards: z.string().max(4000).default("")
});

const clean = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&amp;|&lt;|&gt;/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000);
const stringArray = (value: unknown) => Array.isArray(value) ? value.map(String).slice(0, 12) : [];
const safeUrl = (value: string) => { try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.toString() : ""; } catch { return ""; } };

function finish(job: Omit<Job, "experienceLevel" | "freshness" | "salaryText">): Job {
  const context = `${job.title} ${job.description} ${job.tags.join(" ")}`;
  return {
    ...job, url: safeUrl(job.url),
    experienceLevel: inferExperience(context),
    freshness: getFreshness(job.publishedAt),
    salaryText: extractSalary(context)
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Source returned ${response.status}`);
  return response.json();
}

async function remotive(): Promise<Job[]> {
  const data = await fetchJson("https://remotive.com/api/remote-jobs?limit=100") as { jobs?: Array<Record<string, unknown>> };
  return (data.jobs ?? []).map((item) => finish({
    id: `remotive-${String(item.id)}`, title: String(item.title ?? "Untitled role"), company: String(item.company_name ?? "Unknown company"),
    location: String(item.candidate_required_location ?? "Remote"), remote: true, source: "Remotive", url: String(item.url ?? ""),
    publishedAt: String(item.publication_date ?? ""), description: clean(String(item.description ?? "")), tags: stringArray(item.tags),
    employmentType: String(item.job_type ?? "")
  }));
}

async function arbeitnow(): Promise<Job[]> {
  const data = await fetchJson("https://www.arbeitnow.com/api/job-board-api") as { data?: Array<Record<string, unknown>> };
  return (data.data ?? []).map((item) => finish({
    id: `arbeitnow-${String(item.slug)}`, title: String(item.title ?? "Untitled role"), company: String(item.company_name ?? "Unknown company"),
    location: String(item.location ?? "Not specified"), remote: Boolean(item.remote), source: "Arbeitnow", url: String(item.url ?? ""),
    publishedAt: item.created_at ? new Date(Number(item.created_at) * 1000).toISOString() : "", description: clean(String(item.description ?? "")),
    tags: stringArray(item.tags), employmentType: String(item.job_types ?? "")
  }));
}

type BoardTarget = { provider: "greenhouse" | "lever" | "ashby"; slug: string; label: string };

function parseBoard(rawUrl: string): BoardTarget | null {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split("/").filter(Boolean);
    if (["boards.greenhouse.io", "job-boards.greenhouse.io", "boards-api.greenhouse.io"].includes(host)) {
      const slug = host === "boards-api.greenhouse.io" ? parts.at(-2) : parts[0];
      return slug && /^[a-z0-9_-]+$/i.test(slug) ? { provider: "greenhouse", slug, label: slug } : null;
    }
    if (["jobs.lever.co", "api.lever.co"].includes(host)) {
      const slug = host === "api.lever.co" && parts[0] === "v0" && parts[1] === "postings" ? parts[2] : parts[0];
      return slug && /^[a-z0-9_-]+$/i.test(slug) ? { provider: "lever", slug, label: slug } : null;
    }
    if (["jobs.ashbyhq.com", "api.ashbyhq.com"].includes(host)) {
      const slug = host === "api.ashbyhq.com" ? parts.at(-1) : parts[0];
      return slug && /^[a-z0-9_-]+$/i.test(slug) ? { provider: "ashby", slug, label: slug } : null;
    }
    return null;
  } catch { return null; }
}

async function greenhouse(target: BoardTarget): Promise<Job[]> {
  const data = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${target.slug}/jobs?content=true`) as { jobs?: Array<Record<string, unknown>> };
  return (data.jobs ?? []).map((item) => {
    const location = typeof item.location === "object" && item.location ? String((item.location as Record<string, unknown>).name ?? "") : "";
    const description = clean(String(item.content ?? ""));
    return finish({ id: `greenhouse-${target.slug}-${String(item.id)}`, title: String(item.title ?? "Untitled role"), company: target.label,
      location: location || "Not specified", remote: /remote/i.test(location), source: "Greenhouse", url: String(item.absolute_url ?? ""),
      publishedAt: String(item.updated_at ?? ""), description, tags: [], employmentType: "" });
  });
}

async function lever(target: BoardTarget): Promise<Job[]> {
  const data = await fetchJson(`https://api.lever.co/v0/postings/${target.slug}?mode=json`) as Array<Record<string, unknown>>;
  return (Array.isArray(data) ? data : []).map((item) => {
    const categories = (item.categories ?? {}) as Record<string, unknown>;
    const location = String(categories.location ?? categories.allLocations ?? "Not specified");
    const description = clean(`${String(item.descriptionPlain ?? item.description ?? "")} ${String(item.additionalPlain ?? "")}`);
    return finish({ id: `lever-${target.slug}-${String(item.id)}`, title: String(item.text ?? "Untitled role"), company: target.label,
      location, remote: /remote/i.test(`${location} ${String(item.workplaceType ?? "")}`), source: "Lever", url: String(item.hostedUrl ?? item.applyUrl ?? ""),
      publishedAt: item.createdAt ? new Date(Number(item.createdAt)).toISOString() : "", description, tags: stringArray(categories.team),
      employmentType: String(categories.commitment ?? "") });
  });
}

async function ashby(target: BoardTarget): Promise<Job[]> {
  const data = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${target.slug}?includeCompensation=true`) as { jobs?: Array<Record<string, unknown>> };
  return (data.jobs ?? []).map((item) => {
    const location = String(item.location ?? "Not specified");
    const description = clean(String(item.descriptionPlain ?? item.descriptionHtml ?? ""));
    return finish({ id: `ashby-${target.slug}-${String(item.id ?? item.jobUrl)}`, title: String(item.title ?? "Untitled role"), company: target.label,
      location, remote: Boolean(item.isRemote) || /remote/i.test(String(item.workplaceType ?? "")), source: "Ashby", url: String(item.jobUrl ?? item.applyUrl ?? ""),
      publishedAt: String(item.publishedAt ?? ""), description, tags: stringArray(item.department), employmentType: String(item.employmentType ?? "") });
  });
}

async function boardJobs(target: BoardTarget): Promise<Job[]> {
  if (target.provider === "greenhouse") return greenhouse(target);
  if (target.provider === "lever") return lever(target);
  return ashby(target);
}

export async function GET(request: NextRequest) {
  const parsed = searchSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid search parameters" }, { status: 400 });
  const { q, location, remote, boards } = parsed.data;
  const targets = [...new Map(boards.split("\n").map((url) => parseBoard(url.trim())).filter((target): target is BoardTarget => Boolean(target)).map((target) => [`${target.provider}:${target.slug}`, target])).values()].slice(0, 8);
  const sourceTasks: Array<{ name: string; source: JobSource; promise: Promise<Job[]> }> = [
    { name: "Remotive", source: "Remotive", promise: remotive() },
    { name: "Arbeitnow", source: "Arbeitnow", promise: arbeitnow() },
    ...targets.map((target) => ({ name: `${target.provider}:${target.label}`, source: ({ greenhouse: "Greenhouse", lever: "Lever", ashby: "Ashby" } as const)[target.provider], promise: boardJobs(target) }))
  ];
  const outcomes = await Promise.allSettled(sourceTasks.map((task) => task.promise));
  const warnings = outcomes.flatMap((result, index) => result.status === "rejected" ? [`${sourceTasks[index].name} could not be reached.`] : []);
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const locationTerm = location.toLowerCase();
  const matches = (job: Job) => {
    const searchable = `${job.title} ${job.company} ${job.description} ${job.tags.join(" ")}`.toLowerCase();
    return (terms.length === 0 || terms.every((term) => searchable.includes(term))) &&
      (!locationTerm || job.location.toLowerCase().includes(locationTerm) || (job.remote && locationTerm === "remote")) &&
      (remote !== "true" || job.remote);
  };
  const jobs = deduplicateJobs(outcomes.flatMap((result) => result.status === "fulfilled" ? result.value.filter(matches).slice(0, 80) : []))
    .filter((job) => Boolean(job.url)).sort((a, b) => Date.parse(b.publishedAt || "0") - Date.parse(a.publishedAt || "0")).slice(0, 400);
  const body: SearchResponse = { jobs, fetchedAt: new Date().toISOString(), warnings, sources: [...new Set(sourceTasks.map((task) => task.source))] };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
