# Phase 10D and Phase 11 operations

## Delivered scope

Phase 10D makes employer expansion data-driven. The official career directory no longer lives in a TypeScript source list. Reviewed additions can be validated and merged through `scripts/import-employers.mjs`, with separate provenance records and duplicate, URL and feed-identifier checks. The crawler recognises SAP SuccessFactors, iCIMS, Oracle Taleo and Phenom vacancy links in addition to Workday, Oracle Recruiting and SmartRecruiters. It follows explicit same-host pagination while retaining the existing robots, DNS, response-size, redirect, timeout and page-count boundaries.

Phase 11 adds a release gate and operational health surface. Every pull request and main-branch push runs tests, TypeScript, ESLint, registry validation, career-snapshot quality checks and a production build. `/api/health` reports only public coverage freshness and counts. It contains no user, resume, search or application data.

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
2. Confirm `/api/health` returns HTTP 200 and `healthy` after the scheduled snapshot publishes.
3. Inspect the career-validation and source-health artifacts when coverage falls or an adapter contract fails.
4. Treat a stale or empty snapshot as degraded. Do not hide the state or replace missing facts with estimates.
5. Roll back the application commit if search or build checks fail. Restore a previous snapshot only when its timestamps and live-status language remain accurate.

## Honest limits

This release has 107 configured public ATS feeds and 160 named directory entries. It does not restore the unavailable 2,725-board checkpoint and does not claim 2,000 employers. SuccessFactors, iCIMS, Taleo and Phenom coverage depends on vacancy links or structured data being present in public employer-linked HTML. Client-only pages, access blocks, unsupported pagination and PDF-only notices can still require reviewed adapter work.
