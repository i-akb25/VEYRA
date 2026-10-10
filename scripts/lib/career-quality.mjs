function normalise(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function auditCareerSnapshot(snapshot, now = new Date()) {
  const errors = [];
  const warnings = [];
  const notices = [];
  const jobs = Array.isArray(snapshot?.jobs) ? snapshot.jobs : [];
  if (!Array.isArray(snapshot?.jobs)) errors.push({ code: 'invalid-snapshot', message: 'Snapshot jobs must be an array.' });

  const urls = new Map();
  const semantic = new Map();
  const genericTitle = /^(?:job|jobs|careers?|apply|apply now|open positions?|opportunities|untitled role)$/i;
  for (const [index, job] of jobs.entries()) {
    const label = `${job?.company || 'Unknown company'} / ${job?.title || `job ${index + 1}`}`;
    let parsed;
    try { parsed = new URL(job?.url); } catch { /* reported below */ }
    if (!parsed || parsed.protocol !== 'https:' || parsed.username || parsed.password) errors.push({ code: 'invalid-url', message: `${label} has an invalid public HTTPS URL.`, url: job?.url });
    else if (urls.has(parsed.href)) errors.push({ code: 'duplicate-url', message: `${label} duplicates another vacancy URL.`, url: parsed.href });
    else urls.set(parsed.href, index);

    const title = String(job?.title ?? '').trim();
    if (title.length < 3 || title.length > 300 || genericTitle.test(title)) errors.push({ code: 'invalid-title', message: `${label} has an empty or generic vacancy title.` });
    if (!String(job?.company ?? '').trim()) errors.push({ code: 'missing-company', message: `${label} has no employer.` });

    if (job?.closesAt) {
      const closes = Date.parse(job.closesAt);
      if (!Number.isFinite(closes)) errors.push({ code: 'invalid-expiry', message: `${label} has an invalid closing date.` });
      else if (closes < now.getTime()) errors.push({ code: 'expired-job', message: `${label} expired before the audit time.`, url: job?.url });
    }

    const key = [job?.company, title, job?.location].map(normalise).join('|');
    if (key !== '||') {
      const matches = semantic.get(key) ?? [];
      matches.push(job?.url);
      semantic.set(key, matches);
    }
  }

  for (const [key, matches] of semantic) {
    const unique = [...new Set(matches.filter(Boolean))];
    if (unique.length > 1) warnings.push({ code: 'possible-duplicate', message: `Multiple vacancy URLs share the same employer, title, and location: ${key}.`, urls: unique.slice(0, 10) });
  }

  const checked = Date.parse(snapshot?.checkedAt);
  if (Number.isFinite(checked) && now.getTime() - checked > 36 * 60 * 60 * 1000) notices.push({ code: 'stale-snapshot', message: 'Snapshot is more than 36 hours old.' });
  return { summary: { jobs: jobs.length, errors: errors.length, warnings: warnings.length, notices: notices.length }, errors, warnings, notices };
}
