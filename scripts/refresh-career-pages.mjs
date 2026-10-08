import { writeFile } from 'node:fs/promises';
import { resolve4, resolve6 } from 'node:dns/promises';
import { isIP } from 'node:net';
import { employerDirectory } from '../lib/employer-directory.ts';
import { linkedJobs, looksLikeCareerPage, normaliseLinkedPosting, normalisePosting, pageLinks, robotsPolicy, sitemapLinks, structuredJobs } from './lib/career-parser.mjs';
import { platformJobs } from './lib/ats-adapters.mjs';

const checkedAt = new Date().toISOString();
const shardCount = Math.max(1, Number.parseInt(process.env.VEYRA_CAREER_SHARDS ?? '1', 10));
const shard = Math.max(0, Number.parseInt(process.env.VEYRA_CAREER_SHARD ?? '0', 10));
const sample = Math.max(0, Number.parseInt(process.env.VEYRA_CAREER_SAMPLE ?? '0', 10));
const maxPages = Math.max(1, Number.parseInt(process.env.VEYRA_CAREER_MAX_PAGES ?? '24', 10));
const selected = employerDirectory.filter((_, index) => index % shardCount === shard).slice(0, sample || undefined);
const robotsCache = new Map();
const knownAtsHosts = /(?:greenhouse\.io|lever\.co|ashbyhq\.com|smartrecruiters\.com|myworkdayjobs\.com|successfactors\.(?:com|eu)|oraclecloud\.com|icims\.com|jobvite\.com|workable\.com|bamboohr\.com)$/i;

function publicAddress(ip) {
  if (ip.includes(':')) return /^2[0-9a-f]{3}:/i.test(ip);
  const [a, b] = ip.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 || a === 100 && b >= 64 && b <= 127 || a === 198 && (b === 18 || b === 19));
}

async function safe(raw) {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.port || url.username || url.password || isIP(url.hostname)) throw new Error('Unsupported URL');
  const ips = [...await resolve4(url.hostname).catch(() => []), ...await resolve6(url.hostname).catch(() => [])];
  if (!ips.length || !ips.every(publicAddress)) throw new Error('Non-public destination');
  return url;
}

async function request(raw, { bytes = 2_000_000, robots = true } = {}) {
  let url = await safe(raw);
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    if (robots && !(await policy(url)).allows(url)) throw new Error('Robots policy disallows this page');
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(12_000), headers: { 'User-Agent': 'VEYRA-career-check/1.0', Accept: 'text/html,application/xml,text/xml,text/plain' } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location || redirects === 4) throw new Error('Redirect could not be followed');
      url = await safe(new URL(location, url).href);
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Empty response');
    const parts = []; let received = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > bytes) throw new Error('Page exceeded size limit');
        parts.push(Buffer.from(value));
      }
    } finally { await reader.cancel().catch(() => {}); }
    return { body: Buffer.concat(parts).toString('utf8'), url };
  }
  throw new Error('Redirect limit reached');
}

async function requestJson(raw, init = {}, bytes = 6_000_000) {
  const url = await safe(raw);
  if (!(await policy(url)).allows(url)) throw new Error('Robots policy disallows this ATS endpoint');
  const response = await fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(15_000), headers: { Accept: 'application/json', 'User-Agent': 'VEYRA-career-check/1.0', ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error(`ATS API returned HTTP ${response.status}`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty ATS response');
  const parts = []; let received = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > bytes) throw new Error('ATS response exceeded size limit');
      parts.push(Buffer.from(value));
    }
  } finally { await reader.cancel().catch(() => {}); }
  return JSON.parse(Buffer.concat(parts).toString('utf8'));
}

async function policy(url) {
  if (robotsCache.has(url.origin)) return robotsCache.get(url.origin);
  const pending = (async () => {
    try {
      const result = await request(`${url.origin}/robots.txt`, { bytes: 100_000, robots: false });
      return robotsPolicy(result.body);
    } catch { return robotsPolicy(''); }
  })();
  robotsCache.set(url.origin, pending);
  return pending;
}

function permittedLink(raw, roots) {
  try {
    const url = new URL(raw);
    const rootHosts = roots.map((root) => root.hostname.replace(/^www\./, ''));
    const host = url.hostname.replace(/^www\./, '');
    return rootHosts.some((root) => host === root || host.endsWith(`.${root}`)) || knownAtsHosts.test(host);
  } catch { return false; }
}

async function sitemapSeeds(root) {
  const robots = await policy(root);
  const candidates = [...robots.sitemaps, `${root.origin}/sitemap.xml`];
  const output = [];
  for (const candidate of [...new Set(candidates)].slice(0, 4)) {
    try {
      const result = await request(candidate, { bytes: 4_000_000 });
      const first = sitemapLinks(result.body).slice(0, 2_000);
      const nested = first.filter((url) => /\.xml(?:\?|$)/i.test(url)).slice(0, 6);
      output.push(...first.filter(looksLikeCareerPage));
      for (const child of nested) {
        try {
          const childResult = await request(child, { bytes: 4_000_000 });
          output.push(...sitemapLinks(childResult.body).filter(looksLikeCareerPage).slice(0, 2_000));
        } catch { /* another sitemap can still supply coverage */ }
      }
    } catch { /* sitemaps are optional */ }
  }
  return [...new Set(output)];
}

async function check(employer) {
  const roots = [];
  const queued = [];
  const seen = new Set();
  const failures = [];
  const jobs = [];
  const adaptersChecked = new Set();
  const providers = new Set();
  try {
    const landing = await safe(employer.careersUrl);
    roots.push(landing);
    queued.push(landing.href, ...await sitemapSeeds(landing));
  } catch (error) {
    return { source: { name: employer.name, url: employer.careersUrl, checkedAt, status: 'not confirmed', count: null, pagesChecked: 0, pagesDiscovered: 0, reason: error instanceof Error ? error.message : 'Source failed' }, jobs: [] };
  }

  while (queued.length && seen.size < maxPages) {
    const raw = queued.shift();
    if (!raw || seen.has(raw) || !permittedLink(raw, roots)) continue;
    seen.add(raw);
    try {
      const result = await request(raw);
      if (!roots.some((root) => root.hostname === result.url.hostname) && knownAtsHosts.test(result.url.hostname)) roots.push(result.url);
      const items = structuredJobs(result.body);
      jobs.push(...items.map((item) => normalisePosting(item, employer, checkedAt)).filter(Boolean));
      jobs.push(...linkedJobs(result.body, result.url).map((item) => normaliseLinkedPosting(item, employer, checkedAt)));
      try {
        const adapter = await platformJobs(result.url, employer, requestJson, checkedAt, adaptersChecked);
        if (adapter) { providers.add(adapter.provider); jobs.push(...adapter.jobs); }
      } catch (error) {
        failures.push(`${result.url.pathname}: ${error instanceof Error ? error.message : 'ATS adapter failed'}`);
      }
      const links = pageLinks(result.body, result.url).filter((url) => permittedLink(url, roots) && looksLikeCareerPage(url));
      for (const link of links) if (!seen.has(link) && !queued.includes(link)) queued.push(link);
    } catch (error) {
      failures.push(`${new URL(raw).pathname}: ${error instanceof Error ? error.message : 'failed'}`);
    }
  }

  const uniqueJobs = [...new Map(jobs.map((job) => [job.url, job])).values()];
  const status = uniqueJobs.length ? 'vacancies confirmed' : seen.size ? 'pages checked; vacancies not confirmed' : 'not confirmed';
  return {
    source: {
      name: employer.name, url: employer.careersUrl, checkedAt, status, count: uniqueJobs.length || null,
      pagesChecked: Math.max(0, seen.size - failures.length), pagesDiscovered: seen.size + queued.length,
      scanLimitReached: Boolean(queued.length && seen.size >= maxPages), providers: [...providers], failures: failures.slice(0, 5)
    },
    jobs: uniqueJobs
  };
}

const results = [];
for (let index = 0; index < selected.length; index += 3) results.push(...await Promise.all(selected.slice(index, index + 3).map(check)));
const jobs = [...new Map(results.flatMap((result) => result.jobs).map((job) => [job.url, job])).values()];
const output = process.env.VEYRA_CAREER_OUTPUT || (shardCount > 1 ? `career-snapshot-${shard}.json` : new URL('../data/career-snapshot.json', import.meta.url));
await writeFile(output, `${JSON.stringify({ checkedAt, shard, shardCount, jobs, sources: results.map((result) => result.source) }, null, 2)}\n`);
console.log(`Shard ${shard + 1}/${shardCount}: checked ${selected.length} employers and ${results.reduce((sum, result) => sum + result.source.pagesChecked, 0)} career pages; confirmed ${jobs.length} current structured vacancies.`);
