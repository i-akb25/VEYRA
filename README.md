# VEYRA

VEYRA is a privacy-first job-intelligence workspace. It searches current public job feeds, ranks roles against an optional local profile, explains matches, saves shortlists in the browser, and exports results without requiring an account or database.

## Current MVP

- Live job search through server-side source adapters
- Remotive and Arbeitnow integrations with graceful partial failure
- Official public Greenhouse, Lever and Ashby company-career adapters
- Safe launchers for major private job platforms and official Indian government recruitment portals
- Role, location, remote, fresher/experience, graduation, company, salary, source, job type and posting-date filters
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

Search terms and the public ATS career-page URLs selected by the user are sent only to VEYRA's `/api/jobs/search` route. The route uses them to retrieve and filter current listings and does not persist them. Candidate profiles, extracted resume fields, saved roles, application records, notes, dates and notification history use browser `localStorage`; they are not included in search requests. Raw resume text is discarded after local extraction. VEYRA does not use a database, authentication, analytics or advertising.

External job applications happen on the original source website and are outside VEYRA's control. Always verify employer identity and vacancy status before sharing personal information.

## Planned next work

- More official sources where public APIs and platform terms permit
- Optional user-controlled cloud notification bridge storing only search rules and push-subscription metadata
- Stronger semantic matching without sending resume data to third-party AI services
