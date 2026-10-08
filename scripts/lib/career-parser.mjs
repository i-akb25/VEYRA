export function structuredJobs(html) {
  const jobs = [];
  function visit(value) {
    if (Array.isArray(value)) { value.forEach(visit); return; }
    if (!value || typeof value !== 'object') return;
    const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
    if (types.includes('JobPosting')) jobs.push(value);
    if (value['@graph']) visit(value['@graph']);
    if (value.itemListElement) visit(value.itemListElement);
    if (value.item) visit(value.item);
  }
  for (const match of html.matchAll(/<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { visit(JSON.parse(match[1])); } catch { /* invalid source markup is not evidence */ }
  }
  return jobs;
}
export function normalisePosting(item, page, checkedAt) {
  if (typeof item.title !== 'string' || !item.title.trim() || typeof item.url !== 'string') return null;
  let url;
  try { url = new URL(item.url, page.careersUrl); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  const closesAt = typeof item.validThrough === 'string' && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(item.validThrough) && Number.isFinite(Date.parse(item.validThrough)) ? item.validThrough : undefined;
  if (closesAt && Date.parse(closesAt) < Date.parse(checkedAt)) return null;
  const locations = (Array.isArray(item.jobLocation) ? item.jobLocation : [item.jobLocation]).filter(Boolean).map((place) => {
    const address = place.address ?? {};
    return [address.addressLocality, address.addressRegion, typeof address.addressCountry === 'object' ? address.addressCountry.name : address.addressCountry].filter(Boolean).join(', ');
  }).filter(Boolean);
  const remote = item.jobLocationType === 'TELECOMMUTE';
  const restrictions = (Array.isArray(item.applicantLocationRequirements) ? item.applicantLocationRequirements : [item.applicantLocationRequirements]).filter(Boolean).map((place) => place.name).filter(Boolean);
  const count = item.totalJobOpenings;
  return { id: `career-${url.href}`, title: item.title.slice(0, 300), company: item.hiringOrganization?.name || page.name, location: locations.join(' / ') || restrictions.join(', ') || 'Not specified', remote, workplace: remote ? 'remote' : locations.length ? 'onsite' : 'unknown', source: 'Company Careers', url: url.href, publishedAt: typeof item.datePosted === 'string' ? item.datePosted : '', description: String(item.description ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 4000), tags: [], employmentType: Array.isArray(item.employmentType) ? item.employmentType.join(', ') : String(item.employmentType ?? ''), experienceLevel: 'any', freshness: 'unknown', lastCheckedAt: checkedAt, verifiedAt: checkedAt, closesAt, openings: typeof count === 'number' && Number.isSafeInteger(count) && count > 0 ? count : undefined, liveStatus: 'live', liveStatusReason: 'Found in the official careers page structured job listings at the recorded check time.' };
}
