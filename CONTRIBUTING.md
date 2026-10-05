# Contributing employer and public sources

VEYRA accepts source additions that improve trustworthy public coverage without scraping restricted platforms.

## Employer sources

Open a pull request that changes only the relevant registry:

- data/employers.json for a documented public Greenhouse, Lever, Ashby or SmartRecruiters feed.
- lib/employer-directory.ts for an employer's official careers page when no suitable public feed exists.

Include the employer name, official domain, careers URL, public ATS endpoint when available, covered regions and proof that the endpoint works without authentication.

Do not submit scraped portal URLs, tracking redirects, referral links, staffing spam, unofficial aggregators or sources that require bypassing access controls.

## Government, PSU, exam and higher-study sources

Changes to lib/government.ts must link to the issuing authority. Include the notification date, closing date when explicitly stated, qualification summary and official notice URL. Do not infer a deadline or merge several notices under one invented date.

## Verification

Run pnpm typecheck, pnpm lint, pnpm test, pnpm verify:sources and pnpm build before opening a pull request.

For corrections that do not require code, email akbsupportinfo@gmail.com. Do not send resumes, identity documents or account credentials.
