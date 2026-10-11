import { readFile, writeFile } from 'node:fs/promises';
import { validateRegistry } from './lib/employer-registry.mjs';

const root = new URL('../', import.meta.url);
const [directory, feeds, provenance, snapshot] = await Promise.all([
  readFile(new URL('data/employer-directory.json', root), 'utf8').then(JSON.parse),
  readFile(new URL('data/employers.json', root), 'utf8').then(JSON.parse),
  readFile(new URL('data/employer-provenance.json', root), 'utf8').then(JSON.parse),
  readFile(new URL('data/career-snapshot.json', root), 'utf8').then(JSON.parse)
]);
const registry = validateRegistry({ directory, feeds, provenance });
if (registry.directory.length < 100 || registry.feeds.length < 100) throw new Error('Coverage unexpectedly fell below the established production baseline');
const sourceByUrl = new Map((snapshot.sources ?? []).map((source) => [source.url, source]));
const confirmed = registry.directory.filter((entry) => sourceByUrl.get(entry.careersUrl)?.status === 'vacancies confirmed').length;
const pagesChecked = (snapshot.sources ?? []).reduce((sum, source) => sum + Number(source.pagesChecked ?? 0), 0);
const providers = registry.feeds.reduce((counts, entry) => ({ ...counts, [entry.provider]: (counts[entry.provider] ?? 0) + 1 }), {});
const summary = {
  generatedAt: new Date().toISOString(), directoryEntries: registry.directory.length, configuredFeeds: registry.feeds.length,
  distinctDestinations: new Set([...registry.directory.map((item) => item.careersUrl), ...registry.feeds.map((item) => `${item.provider}:${item.slug}`)]).size,
  providers, snapshotCheckedAt: snapshot.checkedAt ?? null, snapshotJobs: snapshot.jobs?.length ?? 0, snapshotSources: snapshot.sources?.length ?? 0,
  sourcesWithConfirmedVacancies: confirmed, pagesChecked
};
await writeFile(new URL('data/coverage-summary.json', root), `${JSON.stringify(summary, null, 2)}\n`);
console.log(`OK employer registry: ${summary.directoryEntries} official destinations, ${summary.configuredFeeds} public feeds, ${summary.snapshotJobs} current snapshot jobs.`);
