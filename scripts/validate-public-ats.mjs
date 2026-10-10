import { writeFile } from 'node:fs/promises';
import { oracleJobs, oracleTarget, workdayJobs, workdayTarget } from './lib/ats-adapters.mjs';

async function fetchJson(url, init = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(15_000), headers: { Accept: 'application/json', 'User-Agent': 'VEYRA-ATS-contract-check/1.0', ...(init.headers ?? {}) } });
      if (!response.ok) {
        const error = new Error(`${new URL(url).hostname} returned HTTP ${response.status}`);
        if (response.status < 500 && response.status !== 408 && response.status !== 429) throw error;
        lastError = error;
      } else {
        const length = Number(response.headers.get('content-length') ?? 0);
        if (length > 6_000_000) throw new Error('ATS response exceeded size limit');
        return await response.json();
      }
    } catch (error) {
      lastError = error;
    }
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }
  throw lastError instanceof Error ? lastError : new Error('ATS request failed');
}

const checkedAt = new Date().toISOString();
const checks = [
  {
    name: 'Workday public candidate feed',
    run: () => workdayJobs(workdayTarget('https://tamus.wd1.myworkdayjobs.com/TEEX_External'), { name: 'TEEX' }, fetchJson, checkedAt, 20)
  },
  {
    name: 'Oracle Recruiting public candidate feed',
    run: () => oracleJobs(oracleTarget('https://eeho.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/jobsearch/jobs'), { name: 'Oracle' }, fetchJson, checkedAt, 25)
  }
];

const results = [];
for (const check of checks) {
  try {
    const jobs = await check.run();
    if (!jobs.length) throw new Error('Public feed returned no mappable vacancies');
    results.push({ name: check.name, status: 'healthy', count: jobs.length, sample: jobs.slice(0, 3).map((job) => ({ title: job.title, url: job.url })) });
  } catch (error) {
    results.push({ name: check.name, status: 'failed', count: 0, error: error instanceof Error ? error.message : 'Unknown adapter failure' });
  }
}

await writeFile('ats-contract-report.json', `${JSON.stringify({ checkedAt, results }, null, 2)}\n`);
for (const result of results) console.log(`${result.status === 'healthy' ? 'OK' : 'FAIL'} ${result.name}: ${result.count} jobs${result.error ? ` — ${result.error}` : ''}`);
if (results.some((result) => result.status === 'failed')) process.exitCode = 1;
