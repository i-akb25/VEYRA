import { readFile, writeFile } from "node:fs/promises";

const employers = JSON.parse(await readFile(new URL("../data/employers.json", import.meta.url), "utf8"));
const endpoint = (item) => item.provider === "greenhouse"
  ? `https://boards-api.greenhouse.io/v1/boards/${item.slug}/jobs`
  : item.provider === "lever"
    ? `https://api.lever.co/v0/postings/${item.slug}?mode=json`
    : item.provider === "ashby"
      ? `https://api.ashbyhq.com/posting-api/job-board/${item.slug}`
      : `https://api.smartrecruiters.com/v1/companies/${item.slug}/postings?limit=1`;

async function inspect(item) {
  const started = Date.now();
  try {
    const response = await fetch(endpoint(item), { signal: AbortSignal.timeout(12_000), headers: { Accept: "application/json", "User-Agent": "VEYRA-source-health/1.0" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const count = Array.isArray(data) ? data.length : Array.isArray(data.jobs) ? data.jobs.length : Array.isArray(data.content) ? data.content.length : 0;
    return { name: item.name, provider: item.provider, slug: item.slug, status: "healthy", count, latencyMs: Date.now() - started };
  } catch (error) {
    return { name: item.name, provider: item.provider, slug: item.slug, status: "degraded", count: 0, latencyMs: Date.now() - started, error: error instanceof Error ? error.message : "Unknown failure" };
  }
}

const results = [];
for (let index = 0; index < employers.length; index += 6) results.push(...await Promise.all(employers.slice(index, index + 6).map(inspect)));
const healthy = results.filter((item) => item.status === "healthy").length;
const report = { checkedAt: new Date().toISOString(), healthy, total: results.length, results };
await writeFile("source-health-report.json", `${JSON.stringify(report, null, 2)}\n`);

console.log(`VEYRA source health: ${healthy}/${results.length} employer feeds available`);
for (const item of results) console.log(`${item.status === "healthy" ? "OK" : "FAIL"} ${item.provider}:${item.name} (${item.count} jobs, ${item.latencyMs}ms)${item.error ? ` — ${item.error}` : ""}`);
if (healthy / results.length < 0.7) process.exitCode = 1;
