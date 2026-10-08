import { test, expect } from 'vitest';
import { oracleJobs, oracleTarget, workdayJobs, workdayTarget } from './ats-adapters.mjs';

test('detects public Workday and Oracle candidate sites', () => {
  expect(workdayTarget('https://acme.wd5.myworkdayjobs.com/en-US/External')).toMatchObject({ tenant: 'acme', site: 'External', locale: 'en-US' });
  expect(oracleTarget('https://acme.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/jobs')).toMatchObject({ site: 'CX_1', locale: 'en' });
});

test('maps Workday public postings and paginates until total', async () => {
  const fetchJson = async (_url, init) => ({ total: 1, jobPostings: [{ title: 'Electrical Engineer', externalPath: '/job/Pune/Electrical-Engineer_R-1', locationsText: 'Pune, India', bulletFields: ['R-1'], timeType: 'Full time' }], request: init });
  const jobs = await workdayJobs(workdayTarget('https://acme.wd5.myworkdayjobs.com/en-US/External'), { name: 'Acme' }, fetchJson, '2026-10-08');
  expect(jobs).toHaveLength(1); expect(jobs[0]).toMatchObject({ title: 'Electrical Engineer', company: 'Acme', source: 'Company Careers' });
});

test('maps Oracle public candidate postings without inventing missing facts', async () => {
  let requestedUrl = '';
  const fetchJson = async (url) => {
    requestedUrl = url;
    return { items: [{ TotalJobsCount: 1, requisitionList: [{ Id: 42, Title: 'Automation Engineer', PrimaryLocation: 'Bengaluru, India' }] }] };
  };
  const jobs = await oracleJobs(oracleTarget('https://acme.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/jobs'), { name: 'Acme' }, fetchJson, '2026-10-08');
  expect(requestedUrl).toContain('/recruitingICEJobRequisitions?');
  expect(jobs).toHaveLength(1); expect(jobs[0].title).toBe('Automation Engineer'); expect(jobs[0].closesAt).toBeUndefined();
});
