import { writeFile } from 'node:fs/promises';
import { employerDirectory } from '../lib/employer-directory.ts';
import { resolve4, resolve6 } from 'node:dns/promises';
import { isIP } from 'node:net';
import { structuredJobs, normalisePosting } from './lib/career-parser.mjs';
const pages = employerDirectory;
const checkedAt = new Date().toISOString();
// Only the maintained official directory is fetched. No user-provided URLs enter this worker.
function publicAddress(ip) {
  if (ip.includes(':')) return /^2[0-9a-f]{3}:/i.test(ip); // global unicast; excludes mapped/local addresses
  const [a,b] = ip.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 || a === 100 && b >= 64 && b <= 127 || a === 198 && (b === 18 || b === 19));
}
async function safe(raw) {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.port || url.username || url.password || isIP(url.hostname)) throw new Error('Unsupported URL');
  const ips = [...await resolve4(url.hostname).catch(() => []), ...await resolve6(url.hostname).catch(() => [])];
  if (!ips.length || !ips.every(publicAddress)) throw new Error('Non-public destination');
  return url;
}
async function fetchPage(raw, bytes = 2_000_000) {
  const url = await safe(raw);
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'VEYRA-career-check/1.0', Accept: 'text/html,text/plain' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const reader = response.body?.getReader(); if (!reader) throw new Error('Empty response');
  const parts = []; let received = 0;
  try { for (;;) { const {done, value} = await reader.read(); if (done) break; received += value.byteLength; if (received > bytes) throw new Error('Page exceeded size limit'); parts.push(Buffer.from(value)); } }
  finally { await reader.cancel().catch(() => {}); }
  return Buffer.concat(parts).toString('utf8');
}
async function check(page) {
  try {
    const url = await safe(page.careersUrl);
    // Conservative policy: any disallow rule causes this generic adapter to skip the host.
    const robots = await fetchPage(`${url.origin}/robots.txt`, 100000);
    if (/^\s*Disallow:\s*\S+/im.test(robots)) throw new Error('Robots policy requires a reviewed adapter');
    const html = await fetchPage(url.href);
    const items = structuredJobs(html);
    const jobs = items.map((item) => normalisePosting(item, page, checkedAt)).filter(Boolean);
    return { source: { name: page.name, url: page.careersUrl, checkedAt, status: items.length ? 'structured listings checked' : 'not confirmed', count: items.length ? jobs.length : null }, jobs };
  } catch (error) { return { source: {name: page.name, url: page.careersUrl, checkedAt, status: 'not confirmed', count: null, reason: error.message}, jobs: [] }; }
}
const results = [];
for (let i = 0; i < pages.length; i += 4) results.push(...await Promise.all(pages.slice(i, i+4).map(check)));
const jobs = [...new Map(results.flatMap((result) => result.jobs).map((job) => [job.url, job])).values()];
await writeFile(new URL('../data/career-snapshot.json', import.meta.url), `${JSON.stringify({checkedAt, jobs, sources: results.map((result) => result.source)}, null, 2)}\n`);
console.log(`Checked ${pages.length} directory pages; ${jobs.length} current structured listings. Unconfirmed pages remain in the directory.`);
