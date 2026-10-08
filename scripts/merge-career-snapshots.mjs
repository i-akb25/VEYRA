import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const directory = resolve(process.argv[2] ?? 'career-reports');
const files = (await readdir(directory)).filter((name) => /^career-snapshot-\d+\.json$/.test(name));
if (!files.length) throw new Error('No career snapshot shards found');
const reports = await Promise.all(files.map(async (name) => JSON.parse(await readFile(resolve(directory, name), 'utf8'))));
const shardCount = reports[0].shardCount;
if (reports.length !== shardCount || new Set(reports.map((report) => report.shard)).size !== shardCount) throw new Error(`Expected ${shardCount} distinct shards, received ${reports.length}`);
const checkedAt = reports.map((report) => report.checkedAt).sort().at(-1);
const jobs = [...new Map(reports.flatMap((report) => report.jobs).map((job) => [job.url, job])).values()];
const sources = reports.flatMap((report) => report.sources).sort((a, b) => a.name.localeCompare(b.name));
await writeFile(new URL('../data/career-snapshot.json', import.meta.url), `${JSON.stringify({ checkedAt, jobs, sources }, null, 2)}\n`);
console.log(`Merged ${reports.length} shards: ${sources.length} employers, ${sources.reduce((sum, source) => sum + source.pagesChecked, 0)} pages and ${jobs.length} current structured vacancies.`);
