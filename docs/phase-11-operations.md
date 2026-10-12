# Phase 10D and Phase 11 operations

## Delivered scope

Phase 10D makes employer expansion data-driven. The official career directory no longer lives in a TypeScript source list. Reviewed additions can be validated and merged through `scripts/import-employers.mjs`, with separate provenance records and duplicate, URL and feed-identifier checks. The crawler recognises SAP SuccessFactors, iCIMS, Oracle Taleo and Phenom vacancy links in addition to Workday, Oracle Recruiting and SmartRecruiters. It follows explicit same-host pagination while retaining the existing robots, DNS, response-size, redirect, timeout and page-count boundaries.

Phase 11 adds a release gate and operational health surface. Every pull request and main-branch push runs tests, TypeScript, ESLint, registry validation, career-snapshot quality checks and a production build. `/api/health` reports only public coverage freshness, counts and whether the runtime is using live release data or its bundled fallback. It contains no user, resume, search or application data.

Daily career data is published to the fixed `career-data-latest` GitHub Release instead of being committed to `main`. Search and coverage surfaces fetch those public assets with a fifteen-minute cache and a ten-second timeout. The checked-in verified snapshot remains the failure fallback. Source-health checks write reports and workflow artifacts only. As a result, scheduled data maintenance cannot trigger or rate-limit Vercel Git deployments.

## Adding employers

Prepare a JSON file with `directory`, `feeds` and `provenance` arrays. A directory item needs `name`, `careersUrl`, `regions`, `industries` and `reviewedAt`. Every new directory URL needs a provenance item containing the same `careersUrl`, an official `evidenceUrl` and the review date. Public feed items support only Greenhouse, Lever, Ashby and SmartRecruiters identifiers that have been checked directly; do not submit guessed slugs.

```bash
node scripts/import-employers.mjs reviewed-additions.json
node scripts/import-employers.mjs reviewed-additions.json --write
pnpm audit:registry
pnpm verify:release
```

The first command is mandatory and does not modify the registry. The second writes validated data. A successful import does not prove that an employer currently has openings. Scheduled verification supplies current counts and the career crawler supplies observed vacancy links.

## Release and incident checks

1. Confirm the Release gate, Refresh official career pages and Source health workflows pass on `main`.
2. Confirm the `career-data-latest` release contains `career-snapshot.json`, `coverage-summary.json` and `career-data-sha256.txt`.
3. Confirm `/api/health` returns HTTP 200, `healthy` and `dataSource: release` after the scheduled snapshot publishes.
4. Inspect the career-validation and source-health artifacts when coverage falls or an adapter contract fails.
5. Treat a stale, empty or bundled-fallback snapshot as degraded. Do not hide the state or replace missing facts with estimates.
6. Roll back the application commit if search or build checks fail. Restore a previous release asset only when its timestamps and live-status language remain accurate.

## Honest limits

This release has 107 configured public ATS feeds and 160 named directory entries. It does not restore the unavailable 2,725-board checkpoint and does not claim 2,000 employers. SuccessFactors, iCIMS, Taleo and Phenom coverage depends on vacancy links or structured data being present in public employer-linked HTML. Client-only pages, access blocks, unsupported pagination and PDF-only notices can still require reviewed adapter work.
