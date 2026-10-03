import type { CandidateProfile, ExperienceLevel, Freshness, Job } from "./types";

const COMMON_WORDS = new Set(["and", "the", "with", "for", "from", "that", "this", "your", "you", "are", "our", "years", "year", "work"]);

export const tokens = (value: string) =>
  [...new Set(value.toLowerCase().split(/[^a-z0-9+#.]+/).filter((token) => token.length > 1 && !COMMON_WORDS.has(token)))];

export function inferExperience(value: string): ExperienceLevel {
  const text = value.toLowerCase();
  if (/\b(intern(ship)?|fresher|graduate|campus|trainee|apprentice)\b/.test(text)) return "fresher";
  if (/\b(junior|entry[ -]level|associate|0\s*[-–]\s*2 years?|1\+? years?)\b/.test(text)) return "entry";
  if (/\b(senior|staff|lead|principal|manager|architect|[3-9]\+? years?|1[0-9]\+? years?)\b/.test(text)) return "experienced";
  return "any";
}

export function getFreshness(publishedAt: string): Freshness {
  if (!publishedAt) return "unknown";
  const timestamp = Date.parse(publishedAt);
  if (Number.isNaN(timestamp)) return "unknown";
  const days = (Date.now() - timestamp) / 86_400_000;
  if (days <= 2) return "new";
  if (days <= 30) return "recent";
  return "older";
}

export function extractSalary(text: string): string | undefined {
  const compact = text.replace(/\s+/g, " ");
  const patterns = [
    /(?:₹|INR)\s?[\d,.]+\s?(?:-|–|to)\s?(?:₹|INR)?\s?[\d,.]+\s?(?:LPA|lakhs?|per annum|\/year)?/i,
    /\b\d+(?:\.\d+)?\s?(?:-|–|to)\s?\d+(?:\.\d+)?\s?LPA\b/i,
    /(?:\$|USD)\s?[\d,.]+\s?(?:-|–|to)\s?(?:\$|USD)?\s?[\d,.]+\s?(?:\/year|yearly|per year)?/i
  ];
  return patterns.map((pattern) => compact.match(pattern)?.[0]).find(Boolean);
}

export function scoreJob(job: Job, profile: CandidateProfile): Job {
  const roleTokens = tokens(profile.role);
  const skillTokens = tokens(profile.skills);
  const locationTokens = tokens(profile.locations);
  const title = job.title.toLowerCase();
  const haystack = `${job.title} ${job.description} ${job.tags.join(" ")}`.toLowerCase();
  const location = job.location.toLowerCase();
  const matchedRoles = roleTokens.filter((token) => title.includes(token));
  const matchedSkills = skillTokens.filter((token) => haystack.includes(token));
  const missingSkills = skillTokens.filter((token) => !haystack.includes(token)).slice(0, 6);
  const matchedLocations = locationTokens.filter((token) => location.includes(token));

  let score = 28;
  score += Math.min(30, matchedRoles.length * 12);
  score += Math.min(26, matchedSkills.length * 5);
  score += matchedLocations.length ? 8 : 0;
  score += profile.remoteOnly && job.remote ? 7 : 0;
  score += job.freshness === "new" ? 4 : job.freshness === "recent" ? 2 : 0;
  if (profile.remoteOnly && !job.remote) score -= 25;
  if (profile.experienceLevel !== "any" && job.experienceLevel !== "any") score += profile.experienceLevel === job.experienceLevel ? 8 : -12;

  const reasons: string[] = [];
  if (matchedRoles.length) reasons.push(`Role: ${matchedRoles.slice(0, 3).join(", ")}`);
  if (matchedSkills.length) reasons.push(`Skills: ${matchedSkills.slice(0, 4).join(", ")}`);
  if (matchedLocations.length) reasons.push("Preferred location");
  if (job.remote) reasons.push("Remote-friendly");
  if (job.freshness === "new") reasons.push("Newly posted");
  if (profile.experienceLevel !== "any" && profile.experienceLevel === job.experienceLevel) reasons.push("Experience aligned");
  if (!reasons.length) reasons.push("Broad discovery match");

  return { ...job, matchScore: Math.max(5, Math.min(98, score)), matchReasons: reasons, missingSkills };
}

export function deduplicateJobs(jobs: Job[]): Job[] {
  const unique = new Map<string, Job>();
  for (const job of jobs) {
    const key = `${job.title}|${job.company}|${job.location}`.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const current = unique.get(key);
    if (!current || Date.parse(job.publishedAt || "0") > Date.parse(current.publishedAt || "0")) unique.set(key, job);
  }
  return [...unique.values()];
}
