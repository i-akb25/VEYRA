function clean(value) { return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 4000); }

export function workdayTarget(raw) {
  try {
    const url = new URL(raw);
    if (!/\.myworkdayjobs\.com$/i.test(url.hostname)) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    const localeIndex = parts.findIndex((part) => /^[a-z]{2}-[A-Z]{2}$/.test(part));
    const locale = localeIndex >= 0 ? parts[localeIndex] : 'en-US';
    const site = parts[localeIndex + 1] || parts[0];
    const tenant = url.hostname.split('.')[0];
    return site && tenant ? { origin: url.origin, locale, site, tenant, key: `workday:${url.origin}:${site}` } : null;
  } catch { return null; }
}

export function oracleTarget(raw) {
  try {
    const url = new URL(raw);
    if (!/\.oraclecloud\.com$/i.test(url.hostname)) return null;
    const match = url.pathname.match(/\/CandidateExperience\/([^/]+)\/sites\/([^/]+)/i);
    return match ? { origin: url.origin, locale: match[1], site: match[2], key: `oracle:${url.origin}:${match[2]}` } : null;
  } catch { return null; }
}

function baseJob({ id, title, company, location, url, publishedAt, description, tags, employmentType, checkedAt }) {
  return { id, title, company, location: location || 'Not specified', remote: /\bremote\b/i.test(location), workplace: /\bremote\b/i.test(location) ? 'remote' : location ? 'onsite' : 'unknown', source: 'Company Careers', url, publishedAt: publishedAt || '', description: clean(description), tags: tags.filter(Boolean).map(String).slice(0, 12), employmentType: employmentType || '', experienceLevel: 'any', freshness: 'unknown', lastCheckedAt: checkedAt, verifiedAt: checkedAt, liveStatus: 'live', liveStatusReason: 'Present in the ATS public career feed at the recorded check time.' };
}

export async function workdayJobs(target, employer, fetchJson, checkedAt, maximum = 200) {
  const output = [];
  for (let offset = 0; offset < maximum; offset += 20) {
    const data = await fetchJson(`${target.origin}/wday/cxs/${encodeURIComponent(target.tenant)}/${encodeURIComponent(target.site)}/jobs`, { method: 'POST', body: JSON.stringify({ appliedFacets: {}, limit: 20, offset, searchText: '' }), headers: { 'Content-Type': 'application/json' } });
    const postings = Array.isArray(data.jobPostings) ? data.jobPostings : [];
    for (const item of postings) {
      const externalPath = String(item.externalPath ?? '');
      if (!externalPath) continue;
      output.push(baseJob({ id: `workday-${target.tenant}-${item.bulletFields?.[0] ?? externalPath}`, title: String(item.title ?? 'Untitled role'), company: employer.name, location: String(item.locationsText ?? ''), url: `${target.origin}/${target.locale}/${target.site}${externalPath}`, publishedAt: '', description: [item.postedOn, ...(item.bulletFields ?? [])].join(' · '), tags: item.bulletFields ?? [], employmentType: String(item.timeType ?? ''), checkedAt }));
    }
    if (!postings.length || output.length >= Number(data.total ?? 0)) break;
  }
  return output;
}

export async function oracleJobs(target, employer, fetchJson, checkedAt, maximum = 200) {
  const output = [];
  for (let offset = 0; offset < maximum; offset += 25) {
    const finder = `findReqs;siteNumber=${target.site},limit=25,offset=${offset},sortBy=POSTING_DATES_DESC`;
    const endpoint = `${target.origin}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&finder=${encodeURIComponent(finder)}`;
    const data = await fetchJson(endpoint);
    const container = Array.isArray(data.items) ? data.items[0] : null;
    const postings = Array.isArray(container?.requisitionList) ? container.requisitionList : [];
    for (const item of postings) {
      const id = String(item.Id ?? item.RequisitionId ?? item.JobId ?? '');
      if (!id || !item.Title) continue;
      output.push(baseJob({ id: `oracle-${target.site}-${id}`, title: String(item.Title), company: employer.name, location: String(item.PrimaryLocation ?? item.Location ?? ''), url: `${target.origin}/hcmUI/CandidateExperience/${target.locale}/sites/${target.site}/job/${encodeURIComponent(id)}`, publishedAt: String(item.PostedDate ?? item.PostingDate ?? ''), description: item.ExternalJobDescriptionStr ?? item.ExternalResponsibilitiesStr ?? '', tags: [item.JobFunction, item.WorkerType], employmentType: String(item.WorkerType ?? ''), checkedAt }));
    }
    if (!postings.length || output.length >= Number(container?.TotalJobsCount ?? 0)) break;
  }
  return output;
}

export async function platformJobs(raw, employer, fetchJson, checkedAt, checked = new Set()) {
  const workday = workdayTarget(raw);
  if (workday && !checked.has(workday.key)) { checked.add(workday.key); return { key: workday.key, jobs: await workdayJobs(workday, employer, fetchJson, checkedAt), provider: 'Workday' }; }
  const oracle = oracleTarget(raw);
  if (oracle && !checked.has(oracle.key)) { checked.add(oracle.key); return { key: oracle.key, jobs: await oracleJobs(oracle, employer, fetchJson, checkedAt), provider: 'Oracle Recruiting' }; }
  return null;
}
