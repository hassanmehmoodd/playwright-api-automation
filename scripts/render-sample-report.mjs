import fs from 'node:fs';
import path from 'node:path';

const reportPath = path.resolve(process.cwd(), 'reports', 'results.json');
if (!fs.existsSync(reportPath)) {
  console.error('Missing reports/results.json. Run npm test first.');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const stats = report.stats ?? {};
const cases = [];
walk(report.suites ?? [], cases);

const passed = cases.filter(
  (entry) => entry.status === 'passed' || entry.status === 'expected',
).length;
const failed = cases.filter(
  (entry) =>
    entry.status === 'failed' || entry.status === 'timedOut' || entry.status === 'interrupted',
).length;
const skipped = cases.filter((entry) => entry.status === 'skipped').length;
const flaky = typeof stats.flaky === 'number' ? stats.flaky : 0;
const durationMs =
  typeof stats.duration === 'number'
    ? stats.duration
    : cases.reduce((sum, entry) => sum + entry.duration, 0);
const started = typeof stats.startTime === 'string' ? stats.startTime : 'unknown';

const byFile = new Map();
for (const entry of cases) {
  const current = byFile.get(entry.file) ?? { passed: 0, failed: 0, other: 0 };
  if (entry.status === 'passed' || entry.status === 'expected') current.passed += 1;
  else if (
    entry.status === 'failed' ||
    entry.status === 'timedOut' ||
    entry.status === 'interrupted'
  )
    current.failed += 1;
  else current.other += 1;
  byFile.set(entry.file, current);
}

const lines = [
  '# Sample test report',
  '',
  'Generated from a local `npm test` run via `npm run report:sample`.',
  'The HTML report is `playwright-report/index.html` and the JUnit report is `reports/junit.xml`.',
  'Those directories are gitignored; this page records the counts from the verification run.',
  '',
  '| Metric | Value |',
  '| --- | --- |',
  `| Started | ${started} |`,
  `| Duration | ${(durationMs / 1000).toFixed(1)}s |`,
  `| Tests | ${cases.length} |`,
  `| Passed | ${passed} |`,
  `| Failed | ${failed} |`,
  `| Skipped | ${skipped} |`,
  `| Flaky | ${flaky} |`,
  `| Unexpected (reporter stats) | ${stats.unexpected ?? 0} |`,
  `| Expected (reporter stats) | ${stats.expected ?? 0} |`,
  '',
  '## Suites',
  '',
  '| File | Passed | Failed | Other |',
  '| --- | ---: | ---: | ---: |',
];

for (const [file, counts] of [...byFile.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  lines.push(`| \`${file}\` | ${counts.passed} | ${counts.failed} | ${counts.other} |`);
}

if (failed > 0) {
  lines.push('', '## Failures', '');
  for (const entry of cases.filter(
    (item) => item.status === 'failed' || item.status === 'timedOut',
  )) {
    lines.push(`- \`${entry.file}\` — ${entry.title} (${entry.status})`);
  }
}

lines.push('');
fs.mkdirSync(path.resolve(process.cwd(), 'docs'), { recursive: true });
const destination = path.resolve(process.cwd(), 'docs', 'sample-report.md');
fs.writeFileSync(destination, lines.join('\n'));
console.log(`Wrote ${destination}`);

function walk(suites, acc) {
  for (const suite of suites) {
    const file = suite.file || suite.title || 'suite';
    for (const spec of suite.specs ?? []) {
      for (const testCase of spec.tests ?? []) {
        const result = Array.isArray(testCase.results) ? testCase.results.at(-1) : undefined;
        acc.push({
          file,
          title: spec.title,
          status: result?.status ?? testCase.status ?? 'unknown',
          duration: typeof result?.duration === 'number' ? result.duration : 0,
        });
      }
    }
    if (Array.isArray(suite.suites)) walk(suite.suites, acc);
  }
}
