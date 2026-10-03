# VEYRA

VEYRA is a privacy-first job-intelligence workspace. It searches current public job feeds, ranks roles against an optional local profile, explains matches, saves shortlists in the browser, and exports results without requiring an account or database.

## Current MVP

- Live job search through server-side source adapters
- Remotive and Arbeitnow integrations with graceful partial failure
- Role, location, and remote filters
- Optional candidate profile stored only in browser storage
- Explainable deterministic job-fit scoring
- Local saved jobs
- CSV and JSON exports
- Security headers, input validation, request timeouts, and no sensitive logging
- Responsive, accessible interface with reduced-motion support

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

## Data policy

Search terms are sent only to VEYRA's `/api/jobs/search` route. The route uses them to filter fetched listings and does not persist them. Candidate profiles and saved roles use browser `localStorage`; they are not included in search requests. VEYRA does not currently use a database, authentication, analytics, or advertising.

External job applications happen on the original source website and are outside VEYRA's control. Always verify employer identity and vacancy status before sharing personal information.

## Planned next work

- More official and ATS source adapters where terms and access permit
- Local resume parsing, explicitly processed on-device
- Vacancy freshness and duplicate detection
- Application tracker and notes stored locally
- User-controlled notification bridge with minimal cloud state
- Import/export backup for all local VEYRA data
