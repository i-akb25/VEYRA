import { writeFile } from 'node:fs/promises';
import { oracleJobs, oracleTarget, workdayJobs, workdayTarget } from './lib/ats-adapters.mjs';

async function fetchJson(url, init = {}) {
  const response = await fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(15_000), headers: { Accept: 'application/json', 'User-Agent': 'VEYRA-ATS-contract-check/1.0', ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error(`${new URL(url).hostname} returned HTTP ${response.status}`);
  const length = Number(response.headers.get('content-length') ?? 0);
  if (length > 6_000_000) throw new Error('ATS response exceeded size limit');
  return response.json();
}

const checkedAt = new Date().toISOString();
const checks = [
  {
    name: 'Workday public candidate feed',
    run: () => workdayJobs(workdayTarget('https://tamus.wd1.myworkdayjobs.com/TEEX_External'), { name: 'TEEX' }, fetchJson, checkedAt, 20)
  },
  {
    name: 'Oracle Recruiting public candidate feed',
    run: () => oracleJobs(oracleTarget('https://fa-evlj-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/jobs'), { name: 'IOM' }, fetchJson, checkedAt, 25)
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
