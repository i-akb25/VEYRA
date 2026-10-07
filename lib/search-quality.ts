import type { Job } from "./types";

export type SearchDiagnostics = {
  gathered: number;
  duplicatesRemoved: number;
  returned: number;
  removedBy: Record<string, number>;
  employersSearched: number;
  employersAvailable: number;
};

// First-failing counts are exclusive and add up to the unique candidate pool.
export function filterWithDiagnostics<T>(items: T[], checks: Array<[string, (item: T) => boolean]>) {
  const removedBy: Record<string, number> = {};
  const accepted = items.filter((item) => {
    for (const [reason, passes] of checks) {
      if (!passes(item)) { removedBy[reason] = (removedBy[reason] ?? 0) + 1; return false; }
    }
    return true;
  });
  return { accepted, removedBy };
}

export function matchesRequestedLocation(job: Pick<Job, "location" | "workplace" | "remoteScope">, terms: string[]) {
  if (!terms.length) return true;
  if (job.workplace === "remote" && job.remoteScope === "worldwide") return true;
  return terms.some((term) => job.location.toLowerCase().includes(term));
}

export function publicListingUrl(raw: string): string {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return "";
    url.search = ""; url.hash = "";
    return url.toString();
  } catch { return ""; }
}
