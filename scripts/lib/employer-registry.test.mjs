import { expect, test } from 'vitest';
import { normaliseDirectoryEntry, normaliseFeedEntry, validateRegistry } from './employer-registry.mjs';

const directory = { name: 'Acme', careersUrl: 'https://careers.example.com/#jobs', regions: ['India'], industries: ['Manufacturing'], reviewedAt: '2026-10-11' };

test('normalises auditable employer entries and public feed identifiers', () => {
  expect(normaliseDirectoryEntry(directory)).toMatchObject({ careersUrl: 'https://careers.example.com/' });
  expect(normaliseFeedEntry({ name: 'Acme', provider: 'Lever', slug: 'acme-jobs', regions: ['india'], categories: ['software'] })).toMatchObject({ provider: 'lever', slug: 'acme-jobs' });
});

test('rejects unsafe URLs, guessed slugs and missing provenance', () => {
  expect(() => normaliseDirectoryEntry({ ...directory, careersUrl: 'http://careers.example.com/' })).toThrow(/HTTPS/);
  expect(() => normaliseFeedEntry({ name: 'Acme', provider: 'lever', slug: '../acme', regions: ['india'], categories: ['software'] })).toThrow(/slug/);
  expect(() => validateRegistry({ directory: [directory], feeds: [], provenance: [] })).toThrow(/Missing provenance/);
});

test('accepts a complete registry and rejects duplicate employer names', () => {
  const provenance = [{ name: 'Acme', careersUrl: 'https://careers.example.com/', evidenceUrl: 'https://careers.example.com/', reviewedAt: '2026-10-11' }];
  expect(validateRegistry({ directory: [directory], feeds: [], provenance }).directory).toHaveLength(1);
  expect(() => validateRegistry({ directory: [directory, { ...directory, careersUrl: 'https://jobs.example.com/' }], feeds: [], provenance })).toThrow(/Duplicate directory name/);
});
