# VEYRA

VEYRA is a privacy-first job-intelligence workspace. It searches current public job feeds, ranks roles against an optional local profile, explains matches, saves shortlists in the browser, and exports results without requiring an account or database.

## Current product

- Live job search through server-side source adapters
- Remotive, Arbeitnow, Jobicy, Himalayas and Remote OK integrations with source attribution and graceful partial failure
- Official public Greenhouse, Lever, Ashby and SmartRecruiters company-career adapters
- Safe launchers for major private job platforms and official Indian government recruitment portals
- Occupation taxonomy with Indian role synonyms, specific-role selection and exact/balanced/broad search modes
- Role, nearby-city cluster, remote, relocation, fresher/experience, graduation, company, salary, source, part-time/internship/contract and posting-date filters
- PDF, DOCX, TXT and Markdown resume parsing performed entirely inside the browser
- Editable extracted skills, education, graduation year, experience and target roles
- Explainable deterministic matching with missing-skill signals
- Duplicate detection and vacancy-freshness classification
- Local saved jobs and application stages: saved, applied, interview, rejected and offer
- Local notes, deadlines and follow-up dates
- CSV/JSON result exports plus complete JSON backup and restore
- Browser notifications for newly discovered roles after a user-run search
- Security headers, input validation, request timeouts, and no sensitive logging
- Responsive, accessible interface with reduced-motion support
- Role-specific search modes for software, data, electrical, automation, graduate, sales, marketing, management, finance, HR, design, operations, support and healthcare work
- Independent India/international/any-country and onsite/hybrid/remote workplace controls
- India and exact-city ranking with Delhi NCR/Gurugram and Bengaluru/Bangalore aliases
- Automatic curated public ATS coverage for selected Indian and remote-first employers
- Official-notice government desk for UPSC, SSC, BPSC, banking, railway, defence, teaching, PSU and apprenticeship opportunities
- Public job-link status checker with SSRF protection and honest live/closed/unknown outcomes
- Negative keywords, qualification filtering, source-health reporting, pagination and local-data deletion
- Best-effort in-memory API rate limiting for serverless deployments
- 107 configured employer feeds with India and international coverage across four public ATS providers; reachable empty feeds are distinguished from active vacancy coverage
- Local saved search presets and locally hidden-result controls
- Daily GitHub Actions source-health verification with downloadable reports
- Safe launchers for major India, US, UK, European, Australian, startup and global job portals
- Neutral public defaults: all roles, any country and every workplace/experience mode
- Multi-select role, workplace and experience controls with comma-separated location searches
- Shareable URL-based searches that never include resume or profile fields
- Relevance, newest, salary and company sorting plus compact/detailed result layouts
- Local recently viewed jobs, four-job comparison and listing reports
- Eligibility extraction for country, city, remote restrictions, sponsorship, work authorisation, language, experience, qualification, relocation and salary currency; missing facts remain “Not stated”
- Twenty-minute employer-feed cache, five-minute result cache, six-request concurrency, source retries, timeouts and automatic runtime circuit breakers
- 160 official employer career destinations across technology, manufacturing, healthcare, finance, education, retail, hospitality, construction and public-interest sectors
- Expanded official opportunity desk for IOCL and other PSUs, defence recruitment, major examinations, private assessments and higher-study routes
- Installable PWA shell with an explicit install prompt and offline fallback for returning to locally stored work
- Hindi guidance, profession/location/government landing pages and a GitHub-backed source-submission form
- Indexable About, Sources, Methodology, Privacy and Disclaimer pages, structured data, sitemap and robots policy

## Local development

```bash
corepack enable
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Phase 9 adds real filter diagnostics, explicit city filtering, user-controlled
empty-result recovery, local/public-preview search feedback, reviewed individual
government PDFs and local deadline reminders. Existing resume, application,
export, comparison, government, local and global features are retained.

Run `pnpm verify:sources` for current feed availability and actual posting counts.
Run `pnpm benchmark:search` against a running local app, or set
`VEYRA_BENCHMARK_URL=https://veyra-pro.vercel.app` to check production. Benchmarks
contain fixed public queries only. See [Phase 9 operations](docs/phase-9-operations.md)
for review rules, source bounds, freshness and reminder limitations.

`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is optional. Set it only when Google Search Console gives you an HTML-tag verification token. Search, resume parsing, local storage and every job source work without environment variables.

## Brand assets

The production identity is stored under `public/brand`, `public/icons` and `public/social`.

- `veyra-wordmark.svg` and `veyra-wordmark-light.svg` are the primary header/footer marks.
- `veyra-mark.svg`, its light version and monochrome version cover compact placements.
- `veyra-horizontal-lockup.svg` includes the product tagline for presentations and documentation.
- `favicon.ico`, PNG favicons, Apple touch icon, standard app icons and a maskable icon cover browser and installed-app surfaces.
- `og-default.png` is the 1200×630 Open Graph and Twitter sharing image; SVG and WebP versions are retained for reuse.

The route-shaped V and destination point are original VEYRA artwork. Do not replace them with job-portal logos or third-party marks.

## Data policy

Search terms and the public ATS career-page URLs selected by the user are sent only to VEYRA's `/api/jobs/search` route. The route uses them to retrieve and filter current listings and does not persist them. A job URL is sent to `/api/jobs/verify` only when the user explicitly asks to check it. Candidate profiles, extracted resume fields, saved roles, application records, notes, dates and notification history use browser `localStorage`; they are not included in search requests. Raw resume text is discarded after local extraction. VEYRA does not use a database, authentication, personal analytics or advertising.

External job applications happen on the original source website and are outside VEYRA's control. Always verify employer identity and vacancy status before sharing personal information.

Public feeds and official pages can fail or change format. VEYRA reports partial provider failures and does not fabricate vacancies to make the result list look full. Feed and result caches are short-lived server memory/CDN caches and contain public search results, never resumes or profiles. A globally shared rate limiter or continuous background notifications would require external infrastructure and environment variables; neither is silently simulated.

## Source health

Run `pnpm verify:sources` to validate the curated public employer feeds. GitHub Actions runs the same check daily and retains a JSON report for 30 days. A failing provider is isolated and shown as degraded; other sources continue to return results.

## Boundaries

VEYRA does not scrape LinkedIn, Indeed, Naukri, Foundit, Glassdoor, Wellfound or other restricted platforms. It provides safe search launchers to those services and aggregates only feeds that employers or ATS providers publish for public consumption.

Support and source corrections: akbsupportinfo@gmail.com. Do not send resumes, identity documents or application credentials.

## Recurring career discovery

The Sources page lists official career destinations and public ATS boards even when no jobs are open. Recruitment filters cover off-campus drives, campus recruitment, freshers, graduate programmes, internships and apprenticeships. Matching uses explicit listing text; these labels do not prove candidate eligibility.

Job cards and CSV/JSON exports include source-supplied headcount and application deadlines. Missing values remain “Not stated”. Employer feed posting totals are shown separately from the number of people a role will hire.

Daily GitHub Actions refreshes public ATS counts and checks directory pages for structured JobPosting data. New structured vacancies enter the next deployment automatically, without editing application code. Selected public ATS feeds are also refreshed on searches when their twenty-minute cache expires. Structured career-page snapshots expire after 26 hours. See [career discovery operations](docs/career-discovery-operations.md).

Current checked-in coverage remains 107 configured feeds and 160 directory entries. This change does not claim 2,000 employers or universal extraction from every career platform. The older Phase 10 recovery checkpoint is incomplete and must not be deployed.
