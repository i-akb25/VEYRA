import { readFile, writeFile } from "node:fs/promises";

const cases = JSON.parse(await readFile(new URL("../data/search-benchmarks.json", import.meta.url), "utf8"));
const base = process.env.VEYRA_BENCHMARK_URL || "http://localhost:3000";
const results = [];
for (const item of cases) {
  const started = Date.now();
  try {
    const response = await fetch(`${base}/api/jobs/search?${new URLSearchParams(item.params)}`, { signal: AbortSignal.timeout(180_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const jobs = data.jobs;
    const titlePattern = item.titlePattern ? new RegExp(item.titlePattern, "i") : null;
    const seen = new Set(); let duplicateCount = 0;
    for (const job of jobs) { const url = new URL(job.url); url.hash = ""; for (const key of [...url.searchParams.keys()]) if (/^(utm_|gh_src$|lever-source$|referrer$|source$)/i.test(key)) url.searchParams.delete(key); url.searchParams.sort(); url.pathname = url.pathname.replace(/\/$/, "") || "/"; const key = url.toString(); if (seen.has(key)) duplicateCount += 1; seen.add(key); }
    const fresher = ["fresher", "entry"].includes(item.params.experience);
    const seniorLeakage = fresher ? jobs.filter((job) => /\b(senior|sr\.?|lead|principal|director|head|staff|vice president)\b/i.test(job.title)).length : 0;
    results.push({ name: item.name, count: jobs.length, empty: jobs.length === 0, titleRelevant: titlePattern ? jobs.filter((job) => titlePattern.test(job.title)).length : null, duplicateCount, seniorLeakage, unavailableSources: data.health.filter((source) => source.status !== "healthy").length, latencyMs: Date.now() - started, diagnostics: data.diagnostics });
  } catch (error) { results.push({ name: item.name, error: error.message, latencyMs: Date.now() - started }); }
  console.log(JSON.stringify(results.at(-1)));
}
await writeFile("search-quality-report.json", JSON.stringify({ checkedAt: new Date().toISOString(), note: "Fixed public benchmark queries only. No user search history or profiles. Relevance is a title-pattern proxy, not a human judgement.", results }, null, 2) + "\n");
// Empty coverage is reported, not hidden. Duplicates, senior leakage and transport
// failures fail the benchmark run; a vacancy-count target would fabricate coverage.
if (results.some((result) => result.error || result.duplicateCount || result.seniorLeakage)) process.exitCode = 1;
