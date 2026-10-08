import type { Job, RecruitmentType } from "./types";
export const RECRUITMENT_LABELS: Record<RecruitmentType, string> = {
  "off-campus": "Off-campus drive", campus: "Campus recruitment", fresher: "Fresher recruitment",
  graduate: "Graduate programme", internship: "Internship", apprenticeship: "Apprenticeship"
};
export function recruitmentTypes(job: Pick<Job, "title" | "description" | "employmentType">): RecruitmentType[] {
  const text = `${job.title} ${job.description} ${job.employmentType ?? ""}`;
  const checks: Array<[RecruitmentType, RegExp]> = [
    ["off-campus", /\boff[ -]campus\b/i], ["campus", /\b(?:on[ -]campus|(?<!off[ -])campus (?:recruitment|hiring|placement|drive)|university recruiting)\b/i],
    ["fresher", /\b(?:freshers?|no (?:prior )?experience required|zero experience)\b/i],
    ["graduate", /\b(?:new grad(?:uate)?|graduate (?:engineer|trainee|program(?:me)?|recruitment)|early careers?)\b/i],
    ["internship", /\bintern(?:ship)?\b/i], ["apprenticeship", /\bapprentice(?:ship)?\b/i]
  ];
  return checks.filter(([, pattern]) => pattern.test(text)).map(([kind]) => kind);
}
export function sourceFacts(item: Record<string, unknown>): Pick<Job, "closesAt" | "openings"> {
  const raw = item.validThrough ?? item.applicationDeadline ?? item.closingDate;
  const closesAt = typeof raw === "string" && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(raw) && Number.isFinite(Date.parse(raw)) ? raw : undefined;
  const count = item.totalJobOpenings ?? item.numberOfPositions;
  const openings = typeof count === "number" && Number.isSafeInteger(count) && count > 0 ? count : undefined;
  return { closesAt, openings };
}
