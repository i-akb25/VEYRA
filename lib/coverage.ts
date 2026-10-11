export type CoverageHealth = {
  status: "healthy" | "degraded";
  checkedAt: string | null;
  ageHours: number | null;
  jobs: number;
  sources: number;
  directoryEntries: number;
  configuredFeeds: number;
  reasons: string[];
};

export function coverageHealth(input: { checkedAt?: string | null; jobs: number; sources: number; directoryEntries: number; configuredFeeds: number }, now = Date.now()): CoverageHealth {
  const checked = input.checkedAt ? Date.parse(input.checkedAt) : Number.NaN;
  const ageHours = Number.isFinite(checked) ? Math.max(0, (now - checked) / 3_600_000) : null;
  const reasons = [
    ageHours === null ? "Snapshot timestamp is missing or invalid." : ageHours > 30 ? "Career snapshot is older than 30 hours." : "",
    input.jobs < 1 ? "Career snapshot contains no vacancies." : "",
    input.sources < 100 ? "Fewer than 100 official career destinations were checked." : "",
    input.directoryEntries < 100 ? "Employer directory fell below its release baseline." : "",
    input.configuredFeeds < 100 ? "Public ATS feeds fell below their release baseline." : ""
  ].filter(Boolean);
  return { status: reasons.length ? "degraded" : "healthy", checkedAt: input.checkedAt ?? null, ageHours, jobs: input.jobs, sources: input.sources, directoryEntries: input.directoryEntries, configuredFeeds: input.configuredFeeds, reasons };
}
