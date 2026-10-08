# Recurring career discovery

## What this branch implements

- Searchable official career directory, including employers with no current vacancies.
- Explicit recruitment classification and filters for off-campus, campus, fresher, graduate, internship and apprenticeship opportunities.
- Source-supplied per-role hiring counts and closing dates in cards and exports. Feed listing totals are never substituted for hiring counts.
- Daily ATS count/sample-title refresh, retaining empty feeds and preserving prior evidence during failures.
- Daily scans of every registered employer career destination. Eight bounded workers inspect official sitemaps, career indexes and linked vacancy pages, then merge structured JobPosting records into a versioned public-only snapshot.
- Verified vacancy-link extraction for career sites that omit JobPosting metadata, plus public Workday and Oracle Recruiting adapters with bounded pagination.
- Search ingestion of snapshots under 26 hours old, closed-date exclusion and original source check timestamps.
- Curated links labelled status unknown until current evidence is available.

## Activation

Merge the reviewed branch into main. Scheduled GitHub workflows run only from the default branch. Enable GitHub Actions and permit the workflow token to write repository contents. The existing Vercel Git integration must deploy main commits for published snapshots to reach production. No resume, candidate profile or search history enters these jobs. Actions usage and hosting limits still apply.

Run `node --experimental-strip-types scripts/refresh-career-pages.mjs` or dispatch Refresh official career pages. Run `VEYRA_PUBLISH_SOURCE_FACTS=true node scripts/verify-sources.mjs` to update public ATS counts. Both only process registered official sources.

## Honest coverage limits

There are 107 configured ATS feeds and 160 directory entries in the available main branch. The earlier checkpoint reports a 2,725-board local audit, but its registry and many supporting modules were never uploaded. That report cannot establish current deployable coverage. Expanding to 2,000 verified distinct employers requires recovering or sourcing and validating the missing registry; duplicating names or generating guessed board slugs is not coverage.

The generic directory adapter follows safe redirects, reads declared and conventional sitemaps, and follows career-related links on the employer domain or a known ATS. Each employer has a 24-page daily bound so one site cannot exhaust the whole refresh. The report records checked and discovered page counts and whether that bound was reached. Robots rules are applied per URL. Access blocks, client-rendered listings, oversized responses and unsupported platforms remain unconfirmed. An empty HTML page is never counted as zero vacancies. A page may expose only part of an employer's inventory; its count is labelled confirmed structured vacancies, never company-wide hiring capacity.

When a listing page links to a specific job-shaped URL and supplies a meaningful title, VEYRA can retain that official link even if the detail page omits structured metadata. Generic navigation labels are excluded. Workday and Oracle adapters read their public candidate feeds only after the official career crawl discovers the platform URL; they do not guess tenant or site identifiers.

ATS feeds are fetched on relevant searches with a twenty-minute cache; structured directory pages are refreshed daily. This is not an every-search crawl of all employers. Platform redesigns and new unsupported platforms can still require adapter maintenance. Government notice parsing, seat reservations, campus eligibility restrictions and deadlines embedded only in PDFs are not expanded by this branch; the existing government desk remains separate.

## Validation

49 tests, TypeScript, ESLint and production build passed in the implementation workspace. A live directory run returned 160 unconfirmed destinations because network safety checks could not establish public destinations in that workspace. No newly discovered live vacancies are claimed. The empty bootstrap snapshot is intentional; validate the workflow in GitHub Actions before relying on directory ingestion.
