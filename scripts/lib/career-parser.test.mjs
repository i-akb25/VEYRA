import { test } from 'vitest';
import assert from 'node:assert/strict';
import { structuredJobs, normalisePosting } from './career-parser.mjs';
test('only structured actual postings become results', () => {
  assert.deepEqual(structuredJobs('<h1>We hire graduates every year</h1>'), []);
  const html = '<script type="application/ld+json">{"@graph":[{"@type":"JobPosting","title":"Graduate engineer","url":"/jobs/1"}]}</script>';
  assert.equal(structuredJobs(html).length, 1);
});
test('closed postings disappear, missing fields stay unknown, totals are not headcount', () => {
  const page = {name:'Employer',careersUrl:'https://example.com/careers'};
  assert.equal(normalisePosting({title:'Engineer',url:'/jobs/1',validThrough:'2020-01-01'},page,'2026-10-08'),null);
  const job = normalisePosting({title:'Engineer',url:'/jobs/1',totalFound:100,jobLocationType:'TELECOMMUTE'},page,'2026-10-08');
  assert.equal(job.openings,undefined); assert.equal(job.closesAt,undefined); assert.equal(job.location,'Not specified');
  assert.equal(normalisePosting({title:'Careers'},page,'2026-10-08'),null);
});
