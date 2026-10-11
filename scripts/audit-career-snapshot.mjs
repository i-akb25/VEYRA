import { readFile, writeFile } from 'node:fs/promises';
import { auditCareerSnapshot } from './lib/career-quality.mjs';

const input = process.argv[2] ?? new URL('../data/career-snapshot.json', import.meta.url);
const output = process.argv[3] ?? 'career-quality-report.json';
const snapshot = JSON.parse(await readFile(input, 'utf8'));
const report = auditCareerSnapshot(snapshot);
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Career snapshot quality: ${report.summary.jobs} jobs, ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.notices} notices.`);
if (report.errors.length) process.exitCode = 1;
