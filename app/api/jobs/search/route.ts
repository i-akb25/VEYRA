import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { curatedJobs } from "@/lib/curated-jobs";
import { employersForSearch, type BoardProvider, type EmployerSource } from "@/lib/employers";
import { deduplicateJobs, extractSalary, getFreshness, inferExperience, isSeniorRole, tokens } from "@/lib/matching";
import type { GeographyScope, Job, JobSource, Qualification, RoleCategory, SearchResponse, SourceHealth, WorkplaceMode } from "@/lib/types";

export const runtime = "nodejs";
export const revalidate = 0;

const roleCategories = ["custom", "software", "electrical", "automation", "get", "sales", "marketing", "management", "finance", "hr", "design", "data", "operations", "support", "healthcare", "remote"] as const;
const searchSchema = z.object({
  q: z.string().trim().max(100).default(""), category: z.enum(roleCategories).default("custom"),
  location: z.string().trim().max(100).default("India"), scope: z.enum(["india", "international", "any"]).default("india"),
  workplace: z.enum(["any", "remote", "hybrid", "onsite"]).default("any"), remote: z.enum(["true", "false"]).optional(),
  experience: z.enum(["fresher", "entry", "experienced", "any"]).default("any"), qualification: z.enum(["any", "btech", "degree", "diploma", "iti"]).default("any"),
  negative: z.string().trim().max(300).default(""), boards: z.string().max(4000).default("")
});

const RATE_LIMIT = 30;
const WINDOW_MS = 60_000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const aliases: Record<RoleCategory, string[]> = {
  custom: [],
  software: ["software engineer", "software developer", "frontend", "backend", "full stack", "web developer", "sde", "mobile engineer", "devops"],
  electrical: ["electrical engineer", "electrical design", "power systems", "maintenance engineer", "electrical project", "electronics engineer"],
  automation: ["automation engineer", "control engineer", "plc", "scada", "instrumentation", "industrial automation", "mechatronics"],
  get: ["graduate engineer trainee", "graduate trainee", "engineer trainee", "get", "apprentice", "fresher engineer", "new graduate"],
  sales: ["sales", "account executive", "business development", "partnerships", "revenue", "customer success"],
  marketing: ["marketing", "growth", "brand", "content", "seo", "communications", "demand generation"],
  management: ["manager", "program manager", "project manager", "product manager", "strategy", "director"],
  finance: ["finance", "financial analyst", "accounting", "accountant", "audit", "tax", "treasury"],
  hr: ["human resources", "people operations", "recruiter", "talent acquisition", "hr business partner"],
  design: ["designer", "product design", "ux", "ui", "visual design", "creative"],
  data: ["data analyst", "data scientist", "data engineer", "analytics", "business intelligence", "machine learning"],
  operations: ["operations", "supply chain", "procurement", "logistics", "program coordinator", "business operations"],
  support: ["customer support", "technical support", "customer service", "support engineer", "success manager"],
  healthcare: ["healthcare", "clinical", "nurse", "medical", "pharmacist", "therapist"],
  remote: ["software engineer", "developer", "product", "sales", "marketing", "operations", "support"]
};
const categoryTitlePatterns: Partial<Record<RoleCategory, RegExp>> = {
  software: /\b(software|developer|frontend|backend|full[ -]?stack|sde|cloud|devops|mobile|web|platform|quality|test)\b/i,
  electrical: /\b(electrical|electronics|power|maintenance|substation|energy|embedded|hardware)\b/i,
  automation: /\b(automation|control|plc|scada|instrumentation?|robot(?:ics)?|mechatronics?)\b/i,
  get: /\b(graduate|trainee|apprentice|fresher|new grad|intern(?:ship)?)\b/i,
  sales: /\b(sales|account executive|business development|partnerships|revenue|customer success)\b/i,
  marketing: /\b(marketing|growth|brand|content|seo|communications?|demand generation)\b/i,
  management: /\b(manager|management|director|strategy|product lead|program lead|project lead)\b/i,
  finance: /\b(finance|financial|accounting|accountant|audit|tax|treasury|controller)\b/i,
  hr: /\b(human resources|people|recruiter|recruiting|talent|hrbp|hr business partner)\b/i,
  design: /\b(design|designer|ux|ui|creative|researcher)\b/i,
  data: /\b(data|analytics?|business intelligence|machine learning|ml engineer|ai engineer)\b/i,
  operations: /\b(operations?|supply chain|procurement|logistics|coordinator|program)\b/i,
  support: /\b(support|customer service|customer success|helpdesk|service desk)\b/i,
  healthcare: /\b(healthcare|clinical|nurse|medical|medicine|pharmacist|therapy|therapist|physician|doctor|surgeon|dentist|caregiver|patient care)\b/i
};
const qualificationTerms: Record<Qualification, string[]> = {
  any: [], btech: ["b.tech", "btech", "b.e", "bachelor of engineering"], degree: ["degree", "bachelor", "graduate"], diploma: ["diploma"], iti: ["iti", "industrial training institute"]
};
const indianPlaces = /\b(india|bengaluru|bangalore|delhi|gurugram|gurgaon|noida|lucknow|pune|mumbai|hyderabad|chennai|kolkata|ahmedabad|vadodara|jaipur|patna|bihar|uttar pradesh|haryana|karnataka|maharashtra|telangana|tamil nadu|kerala|andhra pradesh|ncr|remote india)\b/i;
const worldwidePlaces = /\b(worldwide|anywhere|global|all countries|multiple locations)\b/i;
const cityAliases: Record<string, string[]> = {
  delhi: ["delhi", "new delhi", "delhi ncr", "ncr", "gurugram", "gurgaon", "noida"], "new delhi": ["delhi", "new delhi", "delhi ncr", "ncr", "gurugram", "gurgaon", "noida"],
  gurugram: ["gurugram", "gurgaon", "delhi ncr", "ncr"], gurgaon: ["gurugram", "gurgaon", "delhi ncr", "ncr"], bangalore: ["bangalore", "bengaluru"], bengaluru: ["bangalore", "bengaluru"],
  usa: ["usa", "united states", "u.s."], "united states": ["usa", "united states", "u.s."], uk: ["uk", "united kingdom", "england"], "united kingdom": ["uk", "united kingdom", "england"]
};

type BoardTarget = Pick<EmployerSource, "provider" | "slug" | "name">;
const clean = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&amp;|&lt;|&gt;|&#39;|&quot;/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000);
const stringArray = (value: unknown) => Array.isArray(value) ? value.map((item) => typeof item === "object" && item ? String((item as Record<string, unknown>).label ?? (item as Record<string, unknown>).name ?? "") : String(item)).filter(Boolean).slice(0, 12) : [];
const safeUrl = (value: string) => { try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.toString() : ""; } catch { return ""; } };
function inferWorkplace(context: string, remote = false): Job["workplace"] { if (/\bhybrid\b/i.test(context)) return "hybrid"; if (remote || /\b(remote|work from home|work-from-home|distributed)\b/i.test(context)) return "remote"; if (/\b(on[ -]?site|in[ -]?office|office based)\b/i.test(context)) return "onsite"; return "unknown"; }
function finish(job: Omit<Job, "experienceLevel" | "freshness" | "salaryText" | "workplace"> & { workplace?: Job["workplace"] }): Job {
  const context = `${job.title} ${job.location} ${job.description} ${job.tags.join(" ")}`; const workplace = job.workplace ?? inferWorkplace(context, job.remote);
  return { ...job, remote: workplace === "remote", workplace, url: safeUrl(job.url), experienceLevel: inferExperience(context), freshness: getFreshness(job.publishedAt), salaryText: extractSalary(context) };
}
async function fetchJson(url: string): Promise<unknown> { const response = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-store", headers: { Accept: "application/json", "User-Agent": "VEYRA/1.0 public-job-search" } }); if (!response.ok) throw new Error(`Source returned ${response.status}`); return response.json(); }

async function remotive(): Promise<Job[]> {
  const data = await fetchJson("https://remotive.com/api/remote-jobs?limit=100") as { jobs?: Array<Record<string, unknown>> };
  return (data.jobs ?? []).map((item) => finish({ id: `remotive-${String(item.id)}`, title: String(item.title ?? "Untitled role"), company: String(item.company_name ?? "Unknown company"), location: String(item.candidate_required_location ?? "Remote"), remote: true, workplace: "remote", source: "Remotive", url: String(item.url ?? ""), publishedAt: String(item.publication_date ?? ""), description: clean(String(item.description ?? "")), tags: stringArray(item.tags), employmentType: String(item.job_type ?? "") }));
}
async function arbeitnow(): Promise<Job[]> {
  const data = await fetchJson("https://www.arbeitnow.com/api/job-board-api") as { data?: Array<Record<string, unknown>> };
  return (data.data ?? []).map((item) => finish({ id: `arbeitnow-${String(item.slug)}`, title: String(item.title ?? "Untitled role"), company: String(item.company_name ?? "Unknown company"), location: String(item.location ?? "Not specified"), remote: Boolean(item.remote), source: "Arbeitnow", url: String(item.url ?? ""), publishedAt: item.created_at ? new Date(Number(item.created_at) * 1000).toISOString() : "", description: clean(String(item.description ?? "")), tags: stringArray(item.tags), employmentType: stringArray(item.job_types).join(", ") }));
}
function parseBoard(rawUrl: string): BoardTarget | null {
  try {
    const url = new URL(rawUrl); const host = url.hostname.toLowerCase(); const parts = url.pathname.split("/").filter(Boolean); let provider: BoardProvider | null = null; let slug: string | undefined;
    if (["boards.greenhouse.io", "job-boards.greenhouse.io", "boards-api.greenhouse.io"].includes(host)) { provider = "greenhouse"; slug = host === "boards-api.greenhouse.io" ? parts.at(-2) : parts[0]; }
    else if (["jobs.lever.co", "api.lever.co"].includes(host)) { provider = "lever"; slug = host === "api.lever.co" && parts[0] === "v0" && parts[1] === "postings" ? parts[2] : parts[0]; }
    else if (["jobs.ashbyhq.com", "api.ashbyhq.com"].includes(host)) { provider = "ashby"; slug = host === "api.ashbyhq.com" ? parts.at(-1) : parts[0]; }
    else if (["jobs.smartrecruiters.com", "api.smartrecruiters.com"].includes(host)) { provider = "smartrecruiters"; slug = host === "api.smartrecruiters.com" ? parts[2] : parts[0]; }
    return provider && slug && /^[a-z0-9_-]+$/i.test(slug) ? { provider, slug, name: slug } : null;
  } catch { return null; }
}
async function greenhouse(target: BoardTarget): Promise<Job[]> {
  const data = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${target.slug}/jobs?content=true`) as { jobs?: Array<Record<string, unknown>> };
  return (data.jobs ?? []).map((item) => { const location = typeof item.location === "object" && item.location ? String((item.location as Record<string, unknown>).name ?? "") : ""; return finish({ id: `greenhouse-${target.slug}-${String(item.id)}`, title: String(item.title ?? "Untitled role"), company: target.name, location: location || "Not specified", remote: /remote/i.test(location), source: "Greenhouse", url: String(item.absolute_url ?? ""), publishedAt: String(item.updated_at ?? ""), description: clean(String(item.content ?? "")), tags: [], employmentType: "" }); });
}
async function lever(target: BoardTarget): Promise<Job[]> {
  const data = await fetchJson(`https://api.lever.co/v0/postings/${target.slug}?mode=json`) as Array<Record<string, unknown>>;
  return (Array.isArray(data) ? data : []).map((item) => { const categories = (item.categories ?? {}) as Record<string, unknown>; const location = String(categories.location ?? (Array.isArray(categories.allLocations) ? categories.allLocations.join(", ") : categories.allLocations) ?? "Not specified"); const workplaceText = String(item.workplaceType ?? ""); return finish({ id: `lever-${target.slug}-${String(item.id)}`, title: String(item.text ?? "Untitled role"), company: target.name, location, remote: /remote/i.test(`${location} ${workplaceText}`), workplace: inferWorkplace(workplaceText), source: "Lever", url: String(item.hostedUrl ?? item.applyUrl ?? ""), publishedAt: item.createdAt ? new Date(Number(item.createdAt)).toISOString() : "", description: clean(`${String(item.descriptionPlain ?? item.description ?? "")} ${String(item.additionalPlain ?? "")}`), tags: stringArray(categories.team), employmentType: String(categories.commitment ?? "") }); });
}
async function ashby(target: BoardTarget): Promise<Job[]> {
  const data = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${target.slug}?includeCompensation=true`) as { jobs?: Array<Record<string, unknown>> };
  return (data.jobs ?? []).map((item) => { const location = String(item.location ?? "Not specified"); const workplaceText = String(item.workplaceType ?? ""); return finish({ id: `ashby-${target.slug}-${String(item.id ?? item.jobUrl)}`, title: String(item.title ?? "Untitled role"), company: target.name, location, remote: Boolean(item.isRemote) || /remote/i.test(workplaceText), workplace: inferWorkplace(workplaceText, Boolean(item.isRemote)), source: "Ashby", url: String(item.jobUrl ?? item.applyUrl ?? ""), publishedAt: String(item.publishedAt ?? ""), description: clean(String(item.descriptionPlain ?? item.descriptionHtml ?? "")), tags: [...stringArray(item.department), ...stringArray(item.team)], employmentType: String(item.employmentType ?? "") }); });
}
async function smartRecruiters(target: BoardTarget): Promise<Job[]> {
  const data = await fetchJson(`https://api.smartrecruiters.com/v1/companies/${target.slug}/postings?limit=100`) as { content?: Array<Record<string, unknown>> };
  return (data.content ?? []).map((item) => { const locationData = (item.location ?? {}) as Record<string, unknown>; const parts = [locationData.city, locationData.region, locationData.country].map(String).filter((value) => value && value !== "undefined"); const location = parts.join(", ") || "Not specified"; const department = (item.department ?? {}) as Record<string, unknown>; const roleFunction = (item.function ?? {}) as Record<string, unknown>; const employment = (item.typeOfEmployment ?? {}) as Record<string, unknown>; const remote = Boolean(locationData.remote); return finish({ id: `smartrecruiters-${target.slug}-${String(item.id)}`, title: String(item.name ?? "Untitled role"), company: target.name, location: remote ? `${location} · Remote` : location, remote, workplace: inferWorkplace(`${String(item.workplaceType ?? "")} ${location}`, remote), source: "SmartRecruiters", url: String(item.postingUrl ?? item.ref ?? `https://jobs.smartrecruiters.com/${target.slug}`), publishedAt: String(item.releasedDate ?? item.createdOn ?? ""), description: [department.label, roleFunction.label].filter(Boolean).join(" · "), tags: [department.label, roleFunction.label].filter(Boolean).map(String), employmentType: String(employment.label ?? "") }); });
}
function boardJobs(target: BoardTarget) { if (target.provider === "greenhouse") return greenhouse(target); if (target.provider === "lever") return lever(target); if (target.provider === "ashby") return ashby(target); return smartRecruiters(target); }

function isIndia(job: Job) { return indianPlaces.test(job.location); }
function isWorldwideRemote(job: Job) { return job.workplace === "remote" && worldwidePlaces.test(job.location); }
function locationEligible(job: Job, scope: GeographyScope): boolean { if (scope === "any") return true; if (scope === "india") return isIndia(job) || isWorldwideRemote(job); return !isIndia(job); }
function locationScore(job: Job, requested: string, scope: GeographyScope): number {
  const wanted = requested.toLowerCase().trim(); const place = job.location.toLowerCase(); const terms = cityAliases[wanted] ?? [wanted];
  if (wanted && !["any", "worldwide", "international"].includes(wanted) && terms.some((term) => place.includes(term))) return 48;
  if (scope === "india" && isIndia(job)) return 35; if (scope === "international" && !isIndia(job)) return 30; if (isWorldwideRemote(job)) return 20; return scope === "any" ? 8 : 0;
}
function locationFit(job: Job, requested: string, scope: GeographyScope): Job["locationFit"] {
  const wanted = requested.toLowerCase().trim(); const place = job.location.toLowerCase(); const terms = cityAliases[wanted] ?? [wanted];
  if (wanted && !["any", "worldwide", "international"].includes(wanted) && terms.some((term) => place.includes(term))) return "exact";
  if (isWorldwideRemote(job)) return "global-remote"; if (scope === "india" && isIndia(job)) return "india-fallback"; if (scope === "international" && !isIndia(job)) return "international"; return "anywhere";
}
function relevance(job: Job, q: string, category: RoleCategory): number {
  const title = job.title.toLowerCase(); const body = `${job.description} ${job.tags.join(" ")}`.toLowerCase(); const queryTokens = tokens(q); const phrases = [...aliases[category], q.toLowerCase()].filter(Boolean);
  let score = phrases.some((phrase) => title.includes(phrase)) ? 100 : 0; score += queryTokens.filter((term) => title.includes(term)).length * 45; score += queryTokens.filter((term) => body.includes(term)).length * 4;
  if (category !== "custom" && aliases[category].some((phrase) => title.includes(phrase) || body.includes(phrase))) score += 35; return score;
}
function categoryMatches(job: Job, category: RoleCategory): boolean { if (category === "custom" || category === "remote" || job.source === "Company Careers") return true; return categoryTitlePatterns[category]?.test(job.title) ?? true; }
function allowRequest(request: NextRequest): boolean {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous"; const now = Date.now(); const bucket = rateBuckets.get(key);
  if (rateBuckets.size > 10_000) for (const [storedKey, stored] of rateBuckets) if (stored.resetAt <= now) rateBuckets.delete(storedKey);
  if (!bucket || bucket.resetAt <= now) { rateBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS }); return true; } if (bucket.count >= RATE_LIMIT) return false; bucket.count += 1; return true;
}

export async function GET(request: NextRequest) {
  if (!allowRequest(request)) return NextResponse.json({ error: "Too many searches. Wait one minute and try again." }, { status: 429, headers: { "Retry-After": "60" } });
  const parsed = searchSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams)); if (!parsed.success) return NextResponse.json({ error: "Invalid search parameters" }, { status: 400 });
  const { q, category, location, scope, experience, qualification, negative, boards } = parsed.data; const workplace: WorkplaceMode = parsed.data.remote === "true" ? "remote" : parsed.data.workplace;
  const userTargets = boards.split("\n").map((url) => parseBoard(url.trim())).filter((target): target is BoardTarget => Boolean(target));
  const targets = [...new Map([...userTargets, ...employersForSearch(category, scope)].map((target) => [`${target.provider}:${target.slug}`, target])).values()].slice(0, 16);
  const sourceTasks: Array<{ name: string; source: JobSource; promise: Promise<Job[]> }> = [
    { name: "Remotive", source: "Remotive", promise: remotive() }, { name: "Arbeitnow", source: "Arbeitnow", promise: arbeitnow() },
    ...targets.map((target) => ({ name: `${target.provider}:${target.name}`, source: ({ greenhouse: "Greenhouse", lever: "Lever", ashby: "Ashby", smartrecruiters: "SmartRecruiters" } as const)[target.provider], promise: boardJobs(target) }))
  ];
  const outcomes = await Promise.allSettled(sourceTasks.map((task) => task.promise));
  const health: SourceHealth[] = outcomes.map((result, index) => ({ name: sourceTasks[index].name, status: result.status === "fulfilled" ? "healthy" : "degraded", count: result.status === "fulfilled" ? result.value.length : 0, message: result.status === "rejected" ? "Provider could not be reached." : undefined }));
  const warnings = health.filter((item) => item.status === "degraded").map((item) => `${item.name} could not be reached; other sources were still searched.`);
  const negatives = negative.split(/[,;\n]/).map((term) => term.trim().toLowerCase()).filter(Boolean); const qualificationWords = qualificationTerms[qualification]; const curated = curatedJobs(category);
  if (curated.length) health.push({ name: "Curated official company careers", status: "healthy", count: curated.length });
  const gathered = [...outcomes.flatMap((result) => result.status === "fulfilled" ? result.value : []), ...curated];
  const jobs = deduplicateJobs(gathered).map((job) => {
    const context = `${job.title} ${job.description} ${job.tags.join(" ")}`.toLowerCase(); const roleScore = relevance(job, q, category); const roleMatchScore = job.source === "Company Careers" ? Math.max(80, roleScore) : roleScore;
    return { ...job, roleMatchScore, relevanceScore: roleMatchScore + locationScore(job, location, scope) + (job.freshness === "new" ? 8 : job.freshness === "recent" ? 4 : 0), qualification: qualificationWords.find((term) => context.includes(term)), locationFit: locationFit(job, location, scope) };
  }).filter((job) => {
    const context = `${job.title} ${job.description} ${job.tags.join(" ")}`.toLowerCase(); const title = job.title.toLowerCase();
    if (!job.url || !locationEligible(job, scope) || !categoryMatches(job, category) || (workplace !== "any" && job.workplace !== workplace) || negatives.some((term) => title.includes(term))) return false;
    if ((experience === "fresher" || experience === "entry") && (isSeniorRole(job.title) || /\b(?:[3-9]|1[0-9])\+?\s*years?\b/i.test(job.description.slice(0, 700)))) return false;
    if (experience !== "any" && experience !== "experienced" && job.experienceLevel === "experienced") return false; if (qualificationWords.length && !qualificationWords.some((term) => context.includes(term))) return false;
    return (job.roleMatchScore ?? 0) >= (q || category !== "custom" ? 45 : 0);
  }).sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0) || Date.parse(b.publishedAt || "0") - Date.parse(a.publishedAt || "0")).slice(0, 500);
  const body: SearchResponse = { jobs, fetchedAt: new Date().toISOString(), warnings, sources: [...new Set(sourceTasks.map((task) => task.source).concat(curated.length ? ["Company Careers"] : []))], health };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store, max-age=0", "X-RateLimit-Limit": String(RATE_LIMIT) } });
}
