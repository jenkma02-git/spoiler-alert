#!/usr/bin/env node
// Precision / recall / F1 for spoiler detection, from a promptfoo -o results
// file. Adapted from the course's compute-fscore.js (Day 4), but here the
// prediction comes from the checks, not the bot's output: echo just repeats
// the canned response.
//
// Positive = spoiler. A run "flags" a case when it says FAIL.
// The answer key is metadata.human_label in tests/judge-calibration.yaml.
//
// Scores two verdicts:
//   Judge:   the llm-rubric check alone (metric: Judge)
//   Final:   the case's PASS/FAIL after weights + threshold
//
// Usage, from the repo root:
//   npx promptfoo@latest eval -c promptfooconfig.yaml --no-cache -o results.json
//   node scripts/fscore.js results.json

const fs = require('fs');

const path = process.argv[2];
if (!path) {
  console.error('Usage: node scripts/fscore.js <promptfoo-output.json>');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(path, 'utf8'));
} catch (err) {
  console.error(`Could not read/parse "${path}" as JSON: ${err.message}`);
  console.error('Generate it first with: npx promptfoo@latest eval -c promptfooconfig.yaml -o results.json');
  process.exit(1);
}
if (!data || !data.results || !Array.isArray(data.results.results)) {
  console.error(`"${path}" is not a promptfoo -o results file (expected data.results.results[]).`);
  process.exit(1);
}
const rows = data.results.results;

// Each verdict returns true (PASS), false (FAIL), or null (no real verdict).
const verdicts = {
  Judge: (row) => {
    const checks = (row.gradingResult && row.gradingResult.componentResults) || [];
    const judge = checks.find((c) => c.assertion && c.assertion.metric === 'Judge');
    return judge ? judge.pass : null;
  },
  Final: (row) => row.success,
};

const pct = (n, d) => (d > 0 ? `${((100 * n) / d).toFixed(0)}%` : 'N/A');

// One line per case, with a count when --repeat ran it more than once.
const byCase = (names) => {
  const counts = {};
  for (const n of names) counts[n] = (counts[n] || 0) + 1;
  return Object.entries(counts)
    .map(([n, c]) => `  ${n}${c > 1 ? ` (x${c})` : ''}`)
    .join('\n');
};

console.log(`${path}: ${rows.length} results\n`);

for (const [name, getVerdict] of Object.entries(verdicts)) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  const falseAlarms = [];
  const misses = [];
  const skipped = [];

  for (const row of rows) {
    const label = row.testCase && row.testCase.metadata && row.testCase.metadata.human_label;
    const caseName = (row.testCase && row.testCase.description) || '(no description)';
    // A promptfoo error (failureReason 2) is not a verdict, even though the
    // report counts it as a failure. Same for a missing label or Judge check.
    const verdict = row.failureReason === 2 ? null : getVerdict(row);
    if (verdict === null || (label !== 'PASS' && label !== 'FAIL')) {
      skipped.push(caseName);
      continue;
    }

    const flagged = verdict === false; // FAIL = called it a spoiler
    const spoiler = label === 'FAIL';
    if (flagged && spoiler) tp += 1;
    else if (flagged && !spoiler) { fp += 1; falseAlarms.push(caseName); }
    else if (!flagged && spoiler) { fn += 1; misses.push(caseName); }
    else tn += 1;
  }

  const total = tp + fp + fn + tn;
  console.log(`== ${name} ==`);
  console.log(`TP=${tp} (spoilers flagged)  FP=${fp} (false alarms)  FN=${fn} (misses)  TN=${tn} (safe, left alone)`);
  console.log(`Precision: ${tp}/${tp + fp} = ${pct(tp, tp + fp)}   (lowered by false alarms)`);
  console.log(`Recall:    ${tp}/${tp + fn} = ${pct(tp, tp + fn)}   (lowered by misses)`);
  console.log(`F1:        ${pct(2 * tp, 2 * tp + fp + fn)}`);
  console.log(`Accuracy:  ${tp + tn}/${total} = ${pct(tp + tn, total)}`);
  if (falseAlarms.length) console.log(`False alarms:\n${byCase(falseAlarms)}`);
  if (misses.length) console.log(`Misses:\n${byCase(misses)}`);
  if (skipped.length) console.log(`Skipped (no real verdict):\n${byCase(skipped)}`);
  console.log('');
}
