import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { normaliseDirectoryEntry, normaliseFeedEntry, normaliseProvenance, validateRegistry } from './lib/employer-registry.mjs';

const inputPath = process.argv.find((argument) => !argument.startsWith('--') && argument !== process.argv[0] && argument !== process.argv[1]);
const write = process.argv.includes('--write');
if (!inputPath) throw new Error('Usage: node scripts/import-employers.mjs <verified-input.json> [--write]');

const root = new URL('../', import.meta.url);
const [input, directory, feeds, provenance] = await Promise.all([
  readFile(resolve(inputPath), 'utf8').then(JSON.parse),
  readFile(new URL('data/employer-directory.json', root), 'utf8').then(JSON.parse),
  readFile(new URL('data/employers.json', root), 'utf8').then(JSON.parse),
  readFile(new URL('data/employer-provenance.json', root), 'utf8').then(JSON.parse)
]);

const additions = Array.isArray(input) ? { directory: input } : input;
const newDirectory = (additions.directory ?? []).map(normaliseDirectoryEntry);
const newFeeds = (additions.feeds ?? []).map(normaliseFeedEntry);
const newProvenance = (additions.provenance ?? []).map(normaliseProvenance);
const merge = (existing, incoming, key) => [...new Map([...existing, ...incoming].map((item) => [key(item).toLowerCase(), item])).values()];
const next = validateRegistry({
  directory: merge(directory, newDirectory, (item) => item.name),
  feeds: merge(feeds, newFeeds, (item) => `${item.provider}:${item.slug}`),
  provenance: merge(provenance, newProvenance, (item) => item.careersUrl)
});

const report = { mode: write ? 'write' : 'dry-run', addedDirectory: next.directory.length - directory.length, addedFeeds: next.feeds.length - feeds.length, directoryTotal: next.directory.length, feedTotal: next.feeds.length };
if (write) await Promise.all([
  writeFile(new URL('data/employer-directory.json', root), `${JSON.stringify(next.directory.sort((a, b) => a.name.localeCompare(b)), null, 2)}\n`),
  writeFile(new URL('data/employers.json', root), `${JSON.stringify(next.feeds.sort((a, b) => a.name.localeCompare(b)), null, 2)}\n`),
  writeFile(new URL('data/employer-provenance.json', root), `${JSON.stringify(next.provenance.sort((a, b) => a.name.localeCompare(b)), null, 2)}\n`)
]);
console.log(JSON.stringify(report, null, 2));
