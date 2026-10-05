import registry from "../data/employers.json";
import type { GeographyScope, RoleCategory } from "./types";

export type BoardProvider = "greenhouse" | "lever" | "ashby" | "smartrecruiters";
export type EmployerSource = {
  name: string;
  provider: BoardProvider;
  slug: string;
  regions: Array<"india" | "international">;
  categories: RoleCategory[];
};

export const employerRegistry = registry as EmployerSource[];

export function employersForSearch(category: RoleCategory, scope: GeographyScope, limit = 12): EmployerSource[] {
  const role = category === "remote" ? "custom" : category;
  const regional = employerRegistry.filter((employer) => scope === "any" || employer.regions.includes(scope));
  const tagged = regional.filter((employer) => {
    const categoryMatch = role === "custom" || employer.categories.includes(role);
    return categoryMatch;
  });
  // New public role families must still search diverse live feeds while registry
  // tagging catches up. Title filtering remains strict after retrieval.
  const matching = tagged.length ? tagged : regional;

  // Keep every search diverse instead of letting one ATS dominate the request budget.
  const providers: BoardProvider[] = ["smartrecruiters", "greenhouse", "lever", "ashby"];
  const selected: EmployerSource[] = [];
  for (let round = 0; selected.length < limit; round += 1) {
    let added = false;
    for (const provider of providers) {
      const candidate = matching.filter((item) => item.provider === provider)[round];
      if (candidate) { selected.push(candidate); added = true; }
      if (selected.length === limit) break;
    }
    if (!added) break;
  }
  return selected;
}

export function publicBoardUrl(employer: EmployerSource): string {
  if (employer.provider === "greenhouse") return `https://boards.greenhouse.io/${employer.slug}`;
  if (employer.provider === "lever") return `https://jobs.lever.co/${employer.slug}`;
  if (employer.provider === "ashby") return `https://jobs.ashbyhq.com/${employer.slug}`;
  return `https://jobs.smartrecruiters.com/${employer.slug}`;
}
