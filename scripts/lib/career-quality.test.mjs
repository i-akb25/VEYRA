import { test, expect } from 'vitest';
import { auditCareerSnapshot } from './career-quality.mjs';

test('rejects duplicate, expired, invalid-link, and generic-title vacancies', () => {
  const snapshot = { checkedAt: '2026-10-10T00:00:00Z', jobs: [
    { company: 'Acme', title: 'Engineer', location: 'Pune', url: 'https://example.com/jobs/1', closesAt: '2026-10-09' },
    { company: 'Acme', title: 'Engineer', location: 'Pune', url: 'https://example.com/jobs/1' },
    { company: 'Acme', title: 'Apply now', location: '', url: 'javascript:alert(1)' },
    { company: 'Acme', title: 'Engineer &#x2013; Power', location: 'Delhi', url: 'https://example.com/jobs/3' }
  ] };
  const report = auditCareerSnapshot(snapshot, new Date('2026-10-10T12:00:00Z'));
  expect(report.errors.map((issue) => issue.code)).toEqual(expect.arrayContaining(['expired-job', 'duplicate-url', 'invalid-title', 'invalid-url', 'encoded-title']));
});

test('reports semantic duplicates as warnings without blocking valid vacancies', () => {
  const snapshot = { checkedAt: '2026-10-10T00:00:00Z', jobs: [
    { company: 'Acme', title: 'Controls Engineer', location: 'Pune', url: 'https://example.com/jobs/1' },
    { company: 'Acme', title: 'Controls Engineer', location: 'Pune', url: 'https://example.com/jobs/2' }
  ] };
  const report = auditCareerSnapshot(snapshot, new Date('2026-10-10T12:00:00Z'));
  expect(report.errors).toHaveLength(0);
  expect(report.warnings).toHaveLength(1);
});
