import bundledSnapshot from "../data/career-snapshot.json";
import bundledSummary from "../data/coverage-summary.json";
import type { Job } from "./types";

const RELEASE_BASE = "https://github.com/i-akb25/VEYRA/releases/download/career-data-latest";
const MAX_DATA_BYTES = 12 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

export const careerDataUrls = {
  snapshot: `${RELEASE_BASE}/career-snapshot.json`,
  summary: `${RELEASE_BASE}/coverage-summary.json`
} as const;

export type CareerSnapshot = {
  checkedAt: string;
  jobs: Job[];
  sources: Array<{ name?: string; url?: string; status?: string; pagesChecked?: number }>;
};

export type CoverageSummary = {
  generatedAt: string;
  directoryEntries: number;
  configuredFeeds: number;
  distinctDestinations: number;
  providers: Record<string, number>;
  snapshotCheckedAt: string | null;
  snapshotJobs: number;
  snapshotSources: number;
  sourcesWithConfirmedVacancies: number;
  pagesChecked: number;
};

export type CareerDataResult<T> = {
  value: T;
  source: "release" | "bundled";
};

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validSnapshot(value: unknown): value is CareerSnapshot {
  if (!record(value) || typeof value.checkedAt !== "string" || !Number.isFinite(Date.parse(value.checkedAt)) || !Array.isArray(value.jobs) || !Array.isArray(value.sources)) return false;
  return value.jobs.every((job) => record(job)
    && ["id", "title", "company", "location", "source", "url", "publishedAt", "description"].every((key) => typeof job[key] === "string")
    && typeof job.remote === "boolean"
    && Array.isArray(job.tags));
}

function validSummary(value: unknown): value is CoverageSummary {
  if (!record(value) || typeof value.generatedAt !== "string" || !record(value.providers)) return false;
  return ["directoryEntries", "configuredFeeds", "distinctDestinations", "snapshotJobs", "snapshotSources", "sourcesWithConfirmedVacancies", "pagesChecked"]
    .every((key) => Number.isSafeInteger(value[key]) && Number(value[key]) >= 0);
}

async function releaseJson<T>(url: string, validate: (value: unknown) => value is T, fetcher: Fetcher): Promise<T> {
  const response = await fetcher(url, {
    headers: { Accept: "application/json", "User-Agent": "VEYRA-live-career-data/1.0" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    next: { revalidate: 900 }
  } as RequestInit);
  if (!response.ok) throw new Error(`Career data returned ${response.status}`);
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > MAX_DATA_BYTES) throw new Error("Career data exceeded the response limit");
  const body = await response.text();
  if (body.length > MAX_DATA_BYTES) throw new Error("Career data exceeded the response limit");
  const value: unknown = JSON.parse(body);
  if (!validate(value)) throw new Error("Career data failed schema validation");
  return value;
}

export async function loadCareerSnapshot(fetcher: Fetcher = globalThis.fetch): Promise<CareerDataResult<CareerSnapshot>> {
  try {
    return { value: await releaseJson(careerDataUrls.snapshot, validSnapshot, fetcher), source: "release" };
  } catch {
    return { value: bundledSnapshot as unknown as CareerSnapshot, source: "bundled" };
  }
}

export async function loadCoverageSummary(fetcher: Fetcher = globalThis.fetch): Promise<CareerDataResult<CoverageSummary>> {
  try {
    return { value: await releaseJson(careerDataUrls.summary, validSummary, fetcher), source: "release" };
  } catch {
    return { value: bundledSummary as CoverageSummary, source: "bundled" };
  }
}
