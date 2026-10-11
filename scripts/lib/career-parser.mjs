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

export function pageLinks(html, baseUrl) {
  const links = [];
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    try {
      const raw = match[1].replaceAll('&amp;', '&').trim();
      if (!raw || raw.startsWith('#') || /^(?:mailto|tel|javascript|data):/i.test(raw)) continue;
      const url = new URL(raw, baseUrl);
      url.hash = '';
      if (url.protocol === 'https:' && !url.username && !url.password) links.push(url.href);
    } catch { /* malformed links are ignored */ }
  }
  return [...new Set(links)];
}

export function paginationLinks(html, baseUrl) {
  const links = [];
  for (const match of html.matchAll(/<a\b([^>]*)\bhref\s*=\s*["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi)) {
    try {
      const attributes = `${match[1]} ${match[3]}`;
      const label = plainText(match[4]);
      const raw = match[2].replaceAll('&amp;', '&').trim();
      const candidate = new URL(raw, baseUrl);
      const base = new URL(baseUrl);
      const looksNext = /\b(?:next|more|older)\b/i.test(`${attributes} ${label}`) || /(?:^|[?&])(?:page|start|offset)=\d+/i.test(`${candidate.pathname}${candidate.search}`);
      if (looksNext && candidate.protocol === 'https:' && candidate.hostname === base.hostname && !candidate.username && !candidate.password) {
        candidate.hash = '';
        links.push(candidate.href);
      }
    } catch { /* malformed pagination links are ignored */ }
  }
  return [...new Set(links)];
}

const publicAtsHost = /(?:greenhouse\.io|lever\.co|ashbyhq\.com|smartrecruiters\.com|myworkdayjobs\.com|successfactors\.(?:com|eu)|oraclecloud\.com|icims\.com|taleo\.net|phenompeople\.com|jobvite\.com|workable\.com|bamboohr\.com)$/i;

export function platformLinks(html) {
  const links = [];
  const decoded = html.replaceAll('\\/', '/').replaceAll('\\u002F', '/').replaceAll('\\u002f', '/').replaceAll('&amp;', '&');
  for (const match of decoded.matchAll(/https:\/\/[^\s"'<>\\]+/gi)) {
    try {
      const url = new URL(match[0]);
      url.hash = '';
      if (url.protocol === 'https:' && !url.username && !url.password && publicAtsHost.test(url.hostname)) links.push(url.href);
    } catch { /* malformed embedded URLs are ignored */ }
  }
  return [...new Set(links)];
}

function decodeEntities(value) {
  const named = { amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"' };
  const point = (match, digits, radix) => { const value = Number.parseInt(digits, radix); return value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : match; };
  return value.replace(/&#x([0-9a-f]+);/gi, (match, digits) => point(match, digits, 16)).replace(/&#(\d+);/g, (match, digits) => point(match, digits, 10)).replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function plainText(html) {
  return decodeEntities(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function linkedJobs(html, baseUrl) {
  const jobs = [];
  const generic = /^(?:apply|apply now|careers?|jobs?|job search|search jobs?|view jobs?|open positions?|opportunities|read more|learn more|join us|details?)$/i;
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      let title = plainText(match[2]).replace(/^(?:view|see)\s+(?:this\s+)?job\s*[-:–—]?\s*/i, '').slice(0, 300);
      const raw = match[1].replaceAll('&amp;', '&').trim();
      const url = new URL(raw, baseUrl);
      url.hash = '';
      const path = `${url.pathname}${url.search}`;
      const standardDetailShape = /\/(?:job|jobs|position|positions|vacancy|requisition)(?:\/|\?|$)/i.test(path) && (/\d{3,}/.test(path) || /\/[a-z0-9][a-z0-9-]{8,}(?:\/|\?|$)/i.test(path));
      const smartRecruitersDetailShape = /(?:^|\.)jobs\.smartrecruiters\.com$/i.test(url.hostname) && /^\/[^/]+\/\d{6,}(?:-|\/|$)/.test(url.pathname);
      const successFactorsDetailShape = /(?:^|\.)successfactors\.(?:com|eu)$/i.test(url.hostname) && (url.searchParams.has('career_job_req_id') || /job_listing/i.test(url.searchParams.get('career_ns') ?? ''));
      const icimsDetailShape = /(?:^|\.)icims\.com$/i.test(url.hostname) && /\/jobs\/\d+\//i.test(url.pathname);
      const taleoDetailShape = /(?:^|\.)taleo\.net$/i.test(url.hostname) && /\/jobdetail\.ftl$/i.test(url.pathname) && (url.searchParams.has('job') || url.searchParams.has('jobId'));
      const phenomDetailShape = (/\/(?:[a-z]{2}\/)?(?:[a-z]{2}\/)?job\//i.test(url.pathname) && /(?:phenompeople|phApp|phenom-tracking)/i.test(html)) || /(?:^|\.)phenompeople\.com$/i.test(url.hostname);
      const detailShape = standardDetailShape || smartRecruitersDetailShape || successFactorsDetailShape || icimsDetailShape || taleoDetailShape || phenomDetailShape;
      let location = '';
      if (/\b(?:cookie|consent|privacy|preferences?)\b/i.test(title)) {
        const parts = url.pathname.split('/').filter(Boolean);
        const idIndex = parts.findIndex((part, index) => index > 0 && /^\d{3,}(?:-[a-z_]+)?$/i.test(part));
        const slug = decodeURIComponent(parts[idIndex > 0 ? idIndex - 1 : parts.length - 1] ?? '');
        const words = slug.split('-').filter(Boolean);
        const countryIndex = words.findLastIndex((word, index) => index > 0 && /^[A-Z]{3}$/.test(word));
        const end = countryIndex > 1 ? countryIndex : words.length;
        if (words.length > 2) { location = words[0]; title = words.slice(1, end).join(' ').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim(); }
      }
      if (url.protocol !== 'https:' || url.username || url.password || !detailShape || title.length < 4 || generic.test(title)) continue;
      jobs.push({ title, location, url: url.href });
    } catch { /* malformed job links are ignored */ }
  }
  return [...new Map(jobs.map((job) => [job.url, job])).values()];
}

export function normaliseLinkedPosting(item, employer, checkedAt) {
  return {
    id: `career-link-${item.url}`, title: item.title, company: employer.name, location: item.location || 'Not specified', remote: false,
    workplace: item.location ? 'onsite' : 'unknown', source: 'Company Careers', url: item.url, publishedAt: '', description: 'Current vacancy linked from the employer’s official career site.',
    tags: [], employmentType: '', experienceLevel: 'any', freshness: 'unknown', lastCheckedAt: checkedAt, verifiedAt: checkedAt,
    liveStatus: 'live', liveStatusReason: 'Linked from the employer’s official career pages at the recorded check time.'
  };
}

export function sitemapLinks(xml) {
  return [...xml.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)].map((match) => match[1].replaceAll('&amp;', '&').trim()).filter(Boolean);
}

export function looksLikeCareerPage(raw) {
  try {
    const url = new URL(raw);
    return /(?:career|job|opening|opportunit|vacanc|position|requisition|search-jobs|jobsearch|join-us|work-with-us)/i.test(`${url.hostname}${url.pathname}${url.search}`);
  } catch { return false; }
}

export function robotsPolicy(text, userAgent = 'VEYRA-career-check') {
  const groups = [];
  let agents = [];
  let rules = [];
  const commit = () => { if (agents.length) groups.push({ agents, rules }); agents = []; rules = []; };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s*#.*$/, '').trim();
    if (!line) continue;
    const match = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!match) continue;
    const key = match[1].toLowerCase(); const value = match[2].trim();
    if (key === 'user-agent') { if (rules.length) commit(); agents.push(value.toLowerCase()); }
    else if (key === 'allow' || key === 'disallow') rules.push({ allow: key === 'allow', path: value });
  }
  commit();
  const name = userAgent.toLowerCase();
  const matching = groups.filter((group) => group.agents.some((agent) => agent === '*' || name.includes(agent)));
  const specific = matching.filter((group) => group.agents.some((agent) => agent !== '*' && name.includes(agent)));
  const selected = specific.length ? specific : matching.filter((group) => group.agents.includes('*'));
  return {
    allows(url) {
      const path = `${url.pathname}${url.search}`;
      const rules = selected.flatMap((group) => group.rules).filter((rule) => rule.path && path.startsWith(rule.path));
      if (!rules.length) return true;
      rules.sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
      return rules[0].allow;
    },
    sitemaps: [...text.matchAll(/^\s*Sitemap\s*:\s*(\S+)/gim)].map((match) => match[1])
  };
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
  return { id: `career-${url.href}`, title: plainText(item.title).slice(0, 300), company: item.hiringOrganization?.name || page.name, location: locations.join(' / ') || restrictions.join(', ') || 'Not specified', remote, workplace: remote ? 'remote' : locations.length ? 'onsite' : 'unknown', source: 'Company Careers', url: url.href, publishedAt: typeof item.datePosted === 'string' ? item.datePosted : '', description: plainText(String(item.description ?? '')).slice(0, 4000), tags: [], employmentType: Array.isArray(item.employmentType) ? item.employmentType.join(', ') : String(item.employmentType ?? ''), experienceLevel: 'any', freshness: 'unknown', lastCheckedAt: checkedAt, verifiedAt: checkedAt, closesAt, openings: typeof count === 'number' && Number.isSafeInteger(count) && count > 0 ? count : undefined, liveStatus: 'live', liveStatusReason: 'Found in the official careers page structured job listings at the recorded check time.' };
}
