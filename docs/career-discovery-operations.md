# Recurring career discovery

## What this branch implements

- Searchable official career directory, including employers with no current vacancies.
- Explicit recruitment classification and filters for off-campus, campus, fresher, graduate, internship and apprenticeship opportunities.
- Source-supplied per-role hiring counts and closing dates in cards and exports. Feed listing totals are never substituted for hiring counts.
- Daily ATS count/sample-title refresh, retaining empty feeds and preserving prior evidence during failures.
- Daily scans of every registered employer career destination. Eight bounded workers inspect official sitemaps, career indexes and linked vacancy pages, then merge structured JobPosting records into a versioned public-only snapshot.
- Verified vacancy-link extraction for career sites that omit JobPosting metadata, public Workday and Oracle Recruiting candidate adapters with bounded pagination, and employer-linked HTML recognition for SAP SuccessFactors, iCIMS, Oracle Taleo and Phenom.
- Search ingestion of snapshots under 26 hours old, closed-date exclusion and original source check timestamps.
- Curated links labelled status unknown until current evidence is available.

## Activation

Merge the reviewed branch into main. Scheduled GitHub workflows run only from the default branch. Enable GitHub Actions and permit the workflow token to write repository contents. The existing Vercel Git integration must deploy main commits for published snapshots to reach production. No resume, candidate profile or search history enters these jobs. Actions usage and hosting limits still apply.

Run `node --experimental-strip-types scripts/refresh-career-pages.mjs` or dispatch Refresh official career pages. Run `VEYRA_PUBLISH_SOURCE_FACTS=true node scripts/verify-sources.mjs` to update public ATS counts. Both only process registered official sources.

## Honest coverage limits

There are 107 configured ATS feeds and 160 named directory entries in the available main branch. Shared URLs and region-specific entries mean this represents 265 distinct configured feed or career destinations, not 267 employers. The earlier checkpoint reports a 2,725-board local audit, but its registry and many supporting modules were never uploaded. That report cannot establish current deployable coverage. Expanding to 2,000 verified distinct employers requires recovering or sourcing and validating the missing registry; duplicating names or generating guessed board slugs is not coverage.

The generic directory adapter follows safe redirects, reads declared and conventional sitemaps, and follows career-related links on the employer domain or a known ATS. Each employer has a 24-page daily bound so one site cannot exhaust the whole refresh. The report records checked and discovered page counts and whether that bound was reached. Robots rules are applied per URL. Access blocks, client-rendered listings, oversized responses and unsupported platforms remain unconfirmed. An empty HTML page is never counted as zero vacancies. A page may expose only part of an employer's inventory; its count is labelled confirmed structured vacancies, never company-wide hiring capacity.

When a listing page links to a specific job-shaped URL and supplies a meaningful title, VEYRA can retain that official link even if the detail page omits structured metadata. Generic navigation labels are excluded. Workday and Oracle adapters read their public candidate feeds only after the official career crawl discovers the platform URL; they do not guess tenant or site identifiers.

The directory is stored in `data/employer-directory.json`; audit evidence is stored in `data/employer-provenance.json`. Run `node scripts/import-employers.mjs reviewed-additions.json` for a dry run, then repeat with `--write` only after the entries and evidence are reviewed. Run `pnpm audit:registry` after any source change. The importer rejects insecure URLs, credentials in URLs, IP literals, invalid feed slugs, duplicate employer names, duplicate feed identities and directory entries without provenance.

ATS feeds are fetched on relevant searches with a twenty-minute cache; structured directory pages are refreshed daily. This is not an every-search crawl of all employers. Platform redesigns and new unsupported platforms can still require adapter maintenance. Government notice parsing, seat reservations, campus eligibility restrictions and deadlines embedded only in PDFs are not expanded by this branch; the existing government desk remains separate.

## Validation

The Phase 10D/11 release gate passes 67 tests, TypeScript, ESLint, registry and vacancy audits, and the production build. The checked-in production snapshot contains 4,988 vacancy links from 160 scanned directory entries; 59 sources had confirmed vacancies in that run and the workers checked 2,546 pages. Counts will change on scheduled refreshes and do not represent company-wide hiring totals. Local smoke searches returned results for graduate engineer trainee, electrical engineer and worldwide-remote software engineer queries.
