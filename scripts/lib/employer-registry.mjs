import { isIP } from 'node:net';

export const publicFeedProviders = new Set(['greenhouse', 'lever', 'ashby', 'smartrecruiters']);

function text(value, field, maximum = 160) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) throw new Error(`${field} must be a non-empty string under ${maximum + 1} characters`);
  return value.trim();
}

export function httpsUrl(value, field = 'URL') {
  const raw = text(value, field, 2_000);
  let url;
  try { url = new URL(raw); } catch { throw new Error(`${field} is not a valid URL`); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || isIP(url.hostname)) throw new Error(`${field} must be a credential-free HTTPS hostname`);
  url.hash = '';
  return url.href;
}

function stringList(value, field) {
  if (!Array.isArray(value) || !value.length) throw new Error(`${field} must contain at least one value`);
  return [...new Set(value.map((item) => text(item, field, 80)))];
}

function reviewDate(value) {
  const date = text(value, 'reviewedAt', 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`))) throw new Error('reviewedAt must use YYYY-MM-DD');
  if (Date.parse(`${date}T00:00:00Z`) > Date.now() + 86_400_000) throw new Error('reviewedAt cannot be in the future');
  return date;
}

export function normaliseDirectoryEntry(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Directory entry must be an object');
  const entry = {
    name: text(input.name, 'name'), careersUrl: httpsUrl(input.careersUrl, 'careersUrl'),
    regions: stringList(input.regions, 'regions'), industries: stringList(input.industries, 'industries'), reviewedAt: reviewDate(input.reviewedAt)
  };
  if (input.discoveryUrls !== undefined) entry.discoveryUrls = [...new Set(stringList(input.discoveryUrls, 'discoveryUrls').map((url) => httpsUrl(url, 'discoveryUrls')))];
  return entry;
}

export function normaliseFeedEntry(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Feed entry must be an object');
  const provider = text(input.provider, 'provider', 40).toLowerCase();
  if (!publicFeedProviders.has(provider)) throw new Error(`Unsupported public feed provider: ${provider}`);
  const slug = text(input.slug, 'slug', 160);
  if (!/^[a-z0-9_-]+$/i.test(slug)) throw new Error('slug may contain only letters, numbers, underscores and hyphens');
  const regions = stringList(input.regions, 'regions');
  if (regions.some((region) => !['india', 'international'].includes(region))) throw new Error('regions must use india or international');
  const entry = { name: text(input.name, 'name'), provider, slug, regions, categories: stringList(input.categories, 'categories') };
  if (input.verifiedAt !== undefined) {
    if (typeof input.verifiedAt !== 'string' || !Number.isFinite(Date.parse(input.verifiedAt))) throw new Error('verifiedAt must be a valid date');
    entry.verifiedAt = input.verifiedAt;
  }
  if (input.verifiedJobCount !== undefined) {
    if (!Number.isSafeInteger(input.verifiedJobCount) || input.verifiedJobCount < 0) throw new Error('verifiedJobCount must be a non-negative integer');
    entry.verifiedJobCount = input.verifiedJobCount;
  }
  if (input.sampleTitles !== undefined) {
    if (!Array.isArray(input.sampleTitles)) throw new Error('sampleTitles must be an array');
    entry.sampleTitles = [...new Set(input.sampleTitles.map((title) => text(title, 'sampleTitles', 300)))].slice(0, 30);
  }
  return entry;
}

export function normaliseProvenance(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Provenance entry must be an object');
  return { name: text(input.name, 'name'), careersUrl: httpsUrl(input.careersUrl, 'careersUrl'), evidenceUrl: httpsUrl(input.evidenceUrl, 'evidenceUrl'), reviewedAt: reviewDate(input.reviewedAt), note: input.note ? text(input.note, 'note', 500) : undefined };
}

export function assertUnique(items, key, label) {
  const seen = new Map();
  for (const item of items) {
    const value = key(item).toLowerCase();
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${key(item)} (${seen.get(value)} and ${item.name})`);
    seen.set(value, item.name);
  }
}

export function validateRegistry({ directory, feeds, provenance }) {
  const cleanDirectory = directory.map(normaliseDirectoryEntry);
  const cleanFeeds = feeds.map(normaliseFeedEntry);
  const cleanProvenance = provenance.map(normaliseProvenance);
  assertUnique(cleanDirectory, (item) => item.name, 'directory name');
  assertUnique(cleanFeeds, (item) => `${item.provider}:${item.slug}`, 'feed');
  assertUnique(cleanProvenance, (item) => item.careersUrl, 'provenance URL');
  const evidence = new Set(cleanProvenance.map((item) => item.careersUrl.toLowerCase()));
  const missingEvidence = cleanDirectory.filter((item) => !evidence.has(item.careersUrl.toLowerCase()));
  if (missingEvidence.length) throw new Error(`Missing provenance for ${missingEvidence.slice(0, 5).map((item) => item.name).join(', ')}`);
  return { directory: cleanDirectory, feeds: cleanFeeds, provenance: cleanProvenance };
}
