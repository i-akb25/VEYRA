import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { curatedJobs } from "@/lib/curated-jobs";
import { deduplicateJobs, extractSalary, getFreshness, inferExperience, isSeniorRole, tokens } from "@/lib/matching";
import type { Job, JobSource, Qualification, RoleCategory, SearchResponse, SourceHealth } from "@/lib/types";

export const runtime = "nodejs";
export const revalidate = 0;

const searchSchema = z.object({
  q: z.string().trim().max(100).default(""), category: z.enum(["custom", "software", "electrical", "automation", "get", "remote"]).default("custom"),
  location: z.string().trim().max(100).default("India"), remote: z.enum(["true", "false"]).default("false"),
  experience: z.enum(["fresher", "entry", "experienced", "any"]).default("any"), qualification: z.enum(["any", "btech", "degree", "diploma", "iti"]).default("any"),
  negative: z.string().trim().max(300).default(""), boards: z.string().max(4000).default("")
});

const RATE_LIMIT = 30;
const WINDOW_MS = 60_000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const aliases: Record<RoleCategory, string[]> = {
  custom: [], software: ["software engineer", "software developer", "frontend", "backend", "full stack", "web developer", "sde"],
  electrical: ["electrical engineer", "electrical design", "power systems", "maintenance engineer", "electrical project"],
  automation: ["automation engineer", "control engineer", "plc", "scada", "instrumentation", "industrial automation"],
  get: ["graduate engineer trainee", "graduate trainee", "engineer trainee", "get", "apprentice", "fresher engineer"],
  remote: ["software engineer", "developer", "product engineer", "support engineer"]
};
const qualificationTerms: Record<Qualification, string[]> = {
  any: [], btech: ["b.tech", "btech", "b.e", "bachelor of engineering"], degree: ["degree", "bachelor", "graduate"], diploma: ["diploma"], iti: ["iti", "industrial training institute"]
};
const indianPlaces = /\b(india|bengaluru|bangalore|delhi|gurugram|gurgaon|noida|lucknow|pune|mumbai|hyderabad|chennai|kolkata|ahmedabad|vadodara|jaipur|patna|bihar|uttar pradesh|haryana|karnataka|maharashtra|telangana|tamil nadu|kerala|andhra pradesh|ncr)\b/i;
const cityAliases: Record<string, string[]> = {
  delhi: ["delhi", "new delhi", "delhi ncr", "ncr", "gurugram", "gurgaon", "noida"], "new delhi": ["delhi", "new delhi", "delhi ncr", "ncr", "gurugram", "gurgaon", "noida"],
  gurugram: ["gurugram", "gurgaon", "delhi ncr", "ncr"], gurgaon: ["gurugram", "gurgaon", "delhi ncr", "ncr"], bangalore: ["bangalore", "bengaluru"], bengaluru: ["bangalore", "bengaluru"]
};

const clean = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&amp;|&lt;|&gt;/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000);
const stringArray = (value: unknown) => Array.isArray(value) ? value.map(String).slice(0, 12) : [];
const safeUrl = (value: string) => { try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.toString() : ""; } catch { return ""; } };
function finish(job: Omit<Job, "experienceLevel" | "freshness" | "salaryText">): Job { const context = `${job.title} ${job.description} ${job.tags.join(" ")}`; return { ...job, url: safeUrl(job.url), experienceLevel: inferExperience(context), freshness: getFreshness(job.publishedAt), salaryText: extractSalary(context) }; }
async function fetchJson(url: string): Promise<unknown> { const response = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-store", headers: { Accept: "application/json", "User-Agent": "VEYRA/1.0 job-search" } }); if (!response.ok) throw new Error(`Source returned ${response.status}`); return response.json(); }

async function remotive(): Promise<Job[]> {
  const data = await fetchJson("https://remotive.com/api/remote-jobs?limit=100") as { jobs?: Array<Record<string, unknown>> };
  return (data.jobs ?? []).map((item) => finish({ id: `remotive-${String(item.id)}`, title: String(item.title ?? "Untitled role"), company: String(item.company_name ?? "Unknown company"), location: String(item.candidate_required_location ?? "Remote"), remote: true, source: "Remotive", url: String(item.url ?? ""), publishedAt: String(item.publication_date ?? ""), description: clean(String(item.description ?? "")), tags: stringArray(item.tags), employmentType: String(item.job_type ?? "") }));
}
async function arbeitnow(): Promise<Job[]> {
  const data = await fetchJson("https://www.arbeitnow.com/api/job-board-api") as { data?: Array<Record<string, unknown>> };
  return (data.data ?? []).map((item) => finish({ id: `arbeitnow-${String(item.slug)}`, title: String(item.title ?? "Untitled role"), company: String(item.company_name ?? "Unknown company"), location: String(item.location ?? "Not specified"), remote: Boolean(item.remote), source: "Arbeitnow", url: String(item.url ?? ""), publishedAt: item.created_at ? new Date(Number(item.created_at) * 1000).toISOString() : "", description: clean(String(item.description ?? "")), tags: stringArray(item.tags), employmentType: String(item.job_types ?? "") }));
}

type BoardTarget = { provider: "greenhouse" | "lever" | "ashby"; slug: string; label: string };
const CURATED_BOARDS: Partial<Record<RoleCategory, BoardTarget[]>> = {
  software: [{ provider: "lever", slug: "acceldata", label: "Acceldata" }, { provider: "lever", slug: "100ms", label: "100ms" }, { provider: "lever", slug: "brillio-2", label: "Brillio" }, { provider: "greenhouse", slug: "mixpanel", label: "Mixpanel" }],
  electrical: [{ provider: "lever", slug: "alifsemi", label: "Alif Semiconductor" }], automation: [{ provider: "lever", slug: "alifsemi", label: "Alif Semiconductor" }],
  get: [],
  remote: [{ provider: "lever", slug: "smart-working-solutions", label: "Smart Working" }, { provider: "ashby", slug: "elevenlabs", label: "ElevenLabs" }, { provider: "ashby", slug: "emergence", label: "Emergence" }, { provider: "ashby", slug: "weave", label: "Weave" }]
};
function parseBoard(rawUrl: string): BoardTarget | null {
  try {
    const url = new URL(rawUrl); const host = url.hostname.toLowerCase(); const parts = url.pathname.split("/").filter(Boolean);
    if (["boards.greenhouse.io", "job-boards.greenhouse.io", "boards-api.greenhouse.io"].includes(host)) { const slug = host === "boards-api.greenhouse.io" ? parts.at(-2) : parts[0]; return slug && /^[a-z0-9_-]+$/i.test(slug) ? { provider: "greenhouse", slug, label: slug } : null; }
    if (["jobs.lever.co", "api.lever.co"].includes(host)) { const slug = host === "api.lever.co" && parts[0] === "v0" && parts[1] === "postings" ? parts[2] : parts[0]; return slug && /^[a-z0-9_-]+$/i.test(slug) ? { provider: "lever", slug, label: slug } : null; }
    if (["jobs.ashbyhq.com", "api.ashbyhq.com"].includes(host)) { const slug = host === "api.ashbyhq.com" ? parts.at(-1) : parts[0]; return slug && /^[a-z0-9_-]+$/i.test(slug) ? { provider: "ashby", slug, label: slug } : null; }
    return null;
  } catch { return null; }
}
async function greenhouse(target: BoardTarget): Promise<Job[]> {
  const data = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${target.slug}/jobs?content=true`) as { jobs?: Array<Record<string, unknown>> };
  return (data.jobs ?? []).map((item) => { const location = typeof item.location === "object" && item.location ? String((item.location as Record<string, unknown>).name ?? "") : ""; return finish({ id: `greenhouse-${target.slug}-${String(item.id)}`, title: String(item.title ?? "Untitled role"), company: target.label, location: location || "Not specified", remote: /remote/i.test(location), source: "Greenhouse", url: String(item.absolute_url ?? ""), publishedAt: String(item.updated_at ?? ""), description: clean(String(item.content ?? "")), tags: [], employmentType: "" }); });
}
async function lever(target: BoardTarget): Promise<Job[]> {
  const data = await fetchJson(`https://api.lever.co/v0/postings/${target.slug}?mode=json`) as Array<Record<string, unknown>>;
  return (Array.isArray(data) ? data : []).map((item) => { const categories = (item.categories ?? {}) as Record<string, unknown>; const location = String(categories.location ?? categories.allLocations ?? "Not specified"); return finish({ id: `lever-${target.slug}-${String(item.id)}`, title: String(item.text ?? "Untitled role"), company: target.label, location, remote: /remote/i.test(`${location} ${String(item.workplaceType ?? "")}`), source: "Lever", url: String(item.hostedUrl ?? item.applyUrl ?? ""), publishedAt: item.createdAt ? new Date(Number(item.createdAt)).toISOString() : "", description: clean(`${String(item.descriptionPlain ?? item.description ?? "")} ${String(item.additionalPlain ?? "")}`), tags: stringArray(categories.team), employmentType: String(categories.commitment ?? "") }); });
}
async function ashby(target: BoardTarget): Promise<Job[]> {
  const data = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${target.slug}?includeCompensation=true`) as { jobs?: Array<Record<string, unknown>> };
  return (data.jobs ?? []).map((item) => { const location = String(item.location ?? "Not specified"); return finish({ id: `ashby-${target.slug}-${String(item.id ?? item.jobUrl)}`, title: String(item.title ?? "Untitled role"), company: target.label, location, remote: Boolean(item.isRemote) || /remote/i.test(String(item.workplaceType ?? "")), source: "Ashby", url: String(item.jobUrl ?? item.applyUrl ?? ""), publishedAt: String(item.publishedAt ?? ""), description: clean(String(item.descriptionPlain ?? item.descriptionHtml ?? "")), tags: stringArray(item.department), employmentType: String(item.employmentType ?? "") }); });
}
function boardJobs(target: BoardTarget) { return target.provider === "greenhouse" ? greenhouse(target) : target.provider === "lever" ? lever(target) : ashby(target); }
function locationScore(job: Job, requested: string): number {
  const wanted = requested.toLowerCase().trim(); const place = job.location.toLowerCase(); if (!wanted) return 0;
  const wantedTerms = cityAliases[wanted] ?? [wanted]; if (wantedTerms.some((term) => place.includes(term))) return 45;
  if (wanted === "india" && indianPlaces.test(place)) return 38; if (job.remote && /worldwide|anywhere|global|all countries|india/i.test(place)) return 20;
  if (indianPlaces.test(place)) return 12; return -35;
}
function locationFit(job: Job, requested: string): Job["locationFit"] {
  const wanted = requested.toLowerCase().trim(); const place = job.location.toLowerCase(); const wantedTerms = cityAliases[wanted] ?? [wanted];
  if (!wanted || wantedTerms.some((term) => place.includes(term))) return "exact";
  if (job.remote && /worldwide|anywhere|global|all countries|india/i.test(place)) return "global-remote";
  if (indianPlaces.test(place)) return "india-fallback";
  return undefined;
}
function relevance(job: Job, q: string, category: RoleCategory): number {
  const title = job.title.toLowerCase(); const body = `${job.description} ${job.tags.join(" ")}`.toLowerCase(); const queryTokens = tokens(q); const phrases = [...aliases[category], q.toLowerCase()].filter(Boolean);
  let score = phrases.some((phrase) => title.includes(phrase)) ? 100 : 0; score += queryTokens.filter((term) => title.includes(term)).length * 45; score += queryTokens.filter((term) => body.includes(term)).length * 4;
  if (category !== "custom" && aliases[category].some((phrase) => title.includes(phrase) || body.includes(phrase))) score += 35; return score;
}
function categoryMatches(job: Job, category: RoleCategory): boolean {
  if (job.source === "Company Careers" || category === "custom" || category === "remote") return true;
  const title = job.title.toLowerCase();
  if (category === "get") return /\b(graduate|trainee|apprentice|fresher|intern(?:ship)?)\b/.test(title);
  if (category === "electrical") return /\b(electrical|power|maintenance|substation|energy)\b/.test(title);
  if (category === "automation") return /\b(automation|control|plc|scada|instrumentation?|robot(?:ics)?|mechatronics?)\b/.test(title);
  return /\b(software|developer|frontend|backend|full[ -]?stack|sde|cloud|data|platform|quality|test)\b/.test(title);
}
function allowRequest(request: NextRequest): boolean {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous"; const now = Date.now(); const bucket = rateBuckets.get(key);
  if (rateBuckets.size > 10_000) for (const [storedKey, stored] of rateBuckets) if (stored.resetAt <= now) rateBuckets.delete(storedKey);
  if (!bucket || bucket.resetAt <= now) { rateBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS }); return true; }
  if (bucket.count >= RATE_LIMIT) return false; bucket.count += 1; return true;
}

export async function GET(request: NextRequest) {
  if (!allowRequest(request)) return NextResponse.json({ error: "Too many searches. Wait one minute and try again." }, { status: 429, headers: { "Retry-After": "60" } });
  const parsed = searchSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams)); if (!parsed.success) return NextResponse.json({ error: "Invalid search parameters" }, { status: 400 });
  const { q, category, location, remote, experience, qualification, negative, boards } = parsed.data;
  const userTargets = boards.split("\n").map((url) => parseBoard(url.trim())).filter((target): target is BoardTarget => Boolean(target));
  const targets = [...new Map([...(CURATED_BOARDS[category] ?? []), ...userTargets].map((target) => [`${target.provider}:${target.slug}`, target])).values()].slice(0, 10);
  const sourceTasks: Array<{ name: string; source: JobSource; promise: Promise<Job[]> }> = [
    { name: "Remotive", source: "Remotive", promise: remotive() }, { name: "Arbeitnow", source: "Arbeitnow", promise: arbeitnow() },
    ...targets.map((target) => ({ name: `${target.provider}:${target.label}`, source: ({ greenhouse: "Greenhouse", lever: "Lever", ashby: "Ashby" } as const)[target.provider], promise: boardJobs(target) }))
  ];
  const outcomes = await Promise.allSettled(sourceTasks.map((task) => task.promise));
  const health: SourceHealth[] = outcomes.map((result, index) => ({ name: sourceTasks[index].name, status: result.status === "fulfilled" ? "healthy" : "degraded", count: result.status === "fulfilled" ? result.value.length : 0, message: result.status === "rejected" ? "Provider could not be reached." : undefined }));
  const warnings = health.filter((item) => item.status === "degraded").map((item) => `${item.name} could not be reached; other sources were still searched.`);
  const negatives = negative.split(/[,;\n]/).map((term) => term.trim().toLowerCase()).filter(Boolean); const qualificationWords = qualificationTerms[qualification]; const curated = curatedJobs(category);
  if (curated.length) health.push({ name: "Curated official company careers", status: "healthy", count: curated.length });
  const gathered = [...outcomes.flatMap((result) => result.status === "fulfilled" ? result.value : []), ...curated];
  const jobs = deduplicateJobs(gathered).map((job) => {
    const context = `${job.title} ${job.description} ${job.tags.join(" ")}`.toLowerCase(); const roleScore = relevance(job, q, category); const geoScore = locationScore(job, location);
    const roleMatchScore = job.source === "Company Careers" ? Math.max(80, roleScore) : roleScore;
    return { ...job, roleMatchScore, relevanceScore: roleMatchScore + geoScore + (indianPlaces.test(job.location) ? 35 : 0) + (job.freshness === "new" ? 8 : job.freshness === "recent" ? 4 : 0), qualification: qualificationWords.find((term) => context.includes(term)), locationFit: locationFit(job, location) };
  }).filter((job) => {
    const context = `${job.title} ${job.description} ${job.tags.join(" ")}`.toLowerCase(); const title = job.title.toLowerCase(); if (!job.url || !job.locationFit || !categoryMatches(job, category) || (remote === "true" && !job.remote) || negatives.some((term) => title.includes(term))) return false;
    if ((experience === "fresher" || experience === "entry") && (isSeniorRole(job.title) || /\b(?:[3-9]|1[0-9])\+?\s*years?\b/i.test(job.description.slice(0, 700)))) return false;
    if (experience !== "any" && experience !== "experienced" && job.experienceLevel === "experienced") return false;
    if (qualificationWords.length && !qualificationWords.some((term) => context.includes(term))) return false; return (job.roleMatchScore ?? 0) >= 45;
  }).sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0) || Date.parse(b.publishedAt || "0") - Date.parse(a.publishedAt || "0")).slice(0, 500);
  const body: SearchResponse = { jobs, fetchedAt: new Date().toISOString(), warnings, sources: [...new Set(sourceTasks.map((task) => task.source).concat(curated.length ? ["Company Careers"] : []))], health };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store, max-age=0", "X-RateLimit-Limit": String(RATE_LIMIT) } });
}
