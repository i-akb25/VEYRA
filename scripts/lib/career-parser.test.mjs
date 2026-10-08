import { test } from 'vitest';
import assert from 'node:assert/strict';
import { looksLikeCareerPage, normalisePosting, pageLinks, robotsPolicy, sitemapLinks, structuredJobs } from './career-parser.mjs';
test('only structured actual postings become results', () => {
  assert.deepEqual(structuredJobs('<h1>We hire graduates every year</h1>'), []);
  const html = '<script type="application/ld+json">{"@graph":[{"@type":"JobPosting","title":"Graduate engineer","url":"/jobs/1"}]}</script>';
  assert.equal(structuredJobs(html).length, 1);
});

test('discovers career links, sitemap entries and path-specific robots rules', () => {
  const html = '<a href="/careers/search?team=power&amp;page=2">Jobs</a><a href="mailto:test@example.com">Email</a>';
  assert.deepEqual(pageLinks(html, 'https://example.com/careers'), ['https://example.com/careers/search?team=power&page=2']);
  assert.deepEqual(sitemapLinks('<urlset><url><loc>https://example.com/jobs/1</loc></url></urlset>'), ['https://example.com/jobs/1']);
  assert.equal(looksLikeCareerPage('https://example.com/about'), false);
  assert.equal(looksLikeCareerPage('https://jobs.example.com/search'), true);
  const policy = robotsPolicy('User-agent: *\nDisallow: /jobs/private\nAllow: /jobs/private/public\nSitemap: https://example.com/jobs.xml');
  assert.equal(policy.allows(new URL('https://example.com/jobs/private/1')), false);
  assert.equal(policy.allows(new URL('https://example.com/jobs/private/public/1')), true);
  assert.deepEqual(policy.sitemaps, ['https://example.com/jobs.xml']);
});
test('closed postings disappear, missing fields stay unknown, totals are not headcount', () => {
  const page = {name:'Employer',careersUrl:'https://example.com/careers'};
  assert.equal(normalisePosting({title:'Engineer',url:'/jobs/1',validThrough:'2020-01-01'},page,'2026-10-08'),null);
  const job = normalisePosting({title:'Engineer',url:'/jobs/1',totalFound:100,jobLocationType:'TELECOMMUTE'},page,'2026-10-08');
  assert.equal(job.openings,undefined); assert.equal(job.closesAt,undefined); assert.equal(job.location,'Not specified');
  assert.equal(normalisePosting({title:'Careers'},page,'2026-10-08'),null);
});
