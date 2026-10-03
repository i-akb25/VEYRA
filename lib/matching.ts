import type { CandidateProfile, Job } from "./types";

const tokens = (value: string) =>
  [...new Set(value.toLowerCase().split(/[^a-z0-9+#.]+/).filter((token) => token.length > 1))];

export function scoreJob(job: Job, profile: CandidateProfile): Job {
  const roleTokens = tokens(profile.role);
  const skillTokens = tokens(profile.skills);
  const locationTokens = tokens(profile.locations);
  const title = job.title.toLowerCase();
  const haystack = `${job.title} ${job.description} ${job.tags.join(" ")}`.toLowerCase();
  const location = job.location.toLowerCase();

  const matchedRoles = roleTokens.filter((token) => title.includes(token));
  const matchedSkills = skillTokens.filter((token) => haystack.includes(token));
  const matchedLocations = locationTokens.filter((token) => location.includes(token));

  let score = 35;
  score += Math.min(30, matchedRoles.length * 12);
  score += Math.min(25, matchedSkills.length * 5);
  score += matchedLocations.length ? 8 : 0;
  score += profile.remoteOnly && job.remote ? 7 : 0;
  if (profile.remoteOnly && !job.remote) score -= 25;

  const reasons: string[] = [];
  if (matchedRoles.length) reasons.push(`Role alignment: ${matchedRoles.slice(0, 3).join(", ")}`);
  if (matchedSkills.length) reasons.push(`Skills found: ${matchedSkills.slice(0, 4).join(", ")}`);
  if (matchedLocations.length) reasons.push("Preferred location");
  if (job.remote) reasons.push("Remote-friendly");
  if (!reasons.length) reasons.push("Broad discovery match");

  return { ...job, matchScore: Math.max(5, Math.min(98, score)), matchReasons: reasons };
}
