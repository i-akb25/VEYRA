# Phase 9 coverage and search reliability

## Employer registry

`data/employers.json` contains ATS feeds, separately from the official portal-link
directory. Add a feed only after an official public API returns real titled
postings and public posting URLs. Keep `verifiedAt`, observed `verifiedJobCount`,
regions and role categories. Counts are observed samples and can change. A
reachable empty feed is healthy but is not active vacancy coverage.

`data/employer-verification.json` records evidence for this expansion. Do not
copy these historical counts into current vacancy totals. Run `pnpm verify:sources`
for a fresh audit. Runtime circuit breakers continue to disable repeatedly failing
sources temporarily. No prohibited portals or CAPTCHA challenges are scraped.

Searches select up to 36 relevant employer boards, not every employer on every
request. Provider concurrency remains six. SmartRecruiters searches use its
documented country filter and at most three 100-posting pages. This is bounded
coverage, not an exhaustive index. Reports disclose how many boards were searched.

The normalized runtime cache is bounded to 160 entries and approximately 64 MiB
of serialized public data. Expired entries are pruned and older entries evicted.
Raw multi-megabyte provider responses are not duplicated in Next's data cache.

## Government review

Edit `lib/government.ts` through a reviewed commit. An individual vacancy needs
an official notification link, date, exact deadline/timezone where provided,
qualification, age and count. Only add a direct PDF URL after inspecting the
authority's linked PDF. Unknown fields remain unstated. Preserve the prior
record and append a `corrections` entry when changing published details; never
invent a corrigendum. An indexed-data correction is labelled as such.

Directory links are retained but labelled as directories, not vacancy records.
Passed deadlines automatically leave the open view while remaining accessible
in the archive. Notices not reviewed for 14 days require verification rather
than claiming to be open. The UI checks date transitions every minute.

## Benchmarks

Start the app, then run `pnpm benchmark:search`. To check production, use
`VEYRA_BENCHMARK_URL=https://veyra-pro.vercel.app pnpm benchmark:search`.
The resulting ignored JSON report measures fixed public queries, result counts,
empty searches, title relevance, duplicate URLs, senior leakage, source failures
and latency. Title patterns are proxies, not human relevance judgements.
Empty results are reported honestly and are not filled with unrelated jobs.

## Feedback and reminders

Feedback shows its complete payload before any transfer. Local save sends
nothing. The explicit GitHub link prepares an issue for the user to review and
submit; GitHub issues are public. Reports exclude resumes, profiles, notes and
search history. Posting URLs lose all query parameters and fragments.

Deadline alerts require explicit browser permission and an enabled local toggle.
They run when the workspace is visible, with date-keyed notification deduplication
and a visible overdue list. They do not schedule closed-browser background alerts.
Disable/purge controls remove reminder settings and history. Existing application
JSON backups preserve deadline and follow-up fields.

## Deployment

No new environment variables or accounts are required for core features. Existing
optional Google verification remains supported. Rate limits are per runtime
instance; they are not a distributed traffic-control service.
