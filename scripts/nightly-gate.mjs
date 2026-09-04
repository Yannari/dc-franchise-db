// ══════════════════════════════════════════════════════════════════════
// scripts/nightly-gate.mjs — make the nightly's red mean something
// ══════════════════════════════════════════════════════════════════════
//
// THE PROBLEM THIS SOLVES, AND IT IS NOT "the slow tests do not run".
//
// They run. .github/workflows/nightly.yml has been executing the whole
// simulation suite every night without complaint. It had also FAILED every
// night for at least eight consecutive runs (2026-08-28 to 2026-09-04), 9 of
// 77 files red. A workflow that is red every morning carries exactly as much
// information as one that is switched off: when a real regression landed in it
// on 2026-09-03, there was no way to see it against a week of existing red.
//
// So this does not add another place to run them. It makes tomorrow's red
// mean something:
//
//   * a failing file that is NOT in tests/nightly-known-failures.json fails
//     the run — that is a regression, and it is the whole point;
//   * a file that IS listed and now PASSES also fails the run, because a
//     baseline nobody prunes becomes a permanent amnesty, and the cheapest
//     moment to delete an entry is the morning it stops being true;
//   * anything else exits 0, with the known list printed so it is read as a
//     to-do rather than forgotten.
//
// Run it exactly as the workflow does:
//
//   node scripts/nightly-gate.mjs
//
// It shells out to vitest itself rather than being wrapped around `npm run
// test:sim`, because it needs the machine-readable per-file result and the
// human log in the same run.
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const BASELINE = path.join(ROOT, 'tests', 'nightly-known-failures.json');
const OUT_DIR = path.join(ROOT, '.nightly');
const OUT = path.join(OUT_DIR, 'results.json');

const rel = p => path.relative(ROOT, p).split(path.sep).join('/');

function loadBaseline() {
  if (!existsSync(BASELINE)) return {};
  try {
    return JSON.parse(readFileSync(BASELINE, 'utf8')).files || {};
  } catch (e) {
    console.error(`nightly-gate: ${rel(BASELINE)} is not readable JSON — ${e.message}`);
    process.exit(2);
  }
}

// ── run the suite ─────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
if (existsSync(OUT)) rmSync(OUT);

// Extra arguments are passed straight through, so the gate can be smoke-tested
// on two files instead of on a fifty-minute suite:
//
//   node scripts/nightly-gate.mjs tests/tr-armoury.test.js
//
// A filtered run cannot report a baselined file as fixed, because `nowFixed`
// only considers files that actually ran.
const passthrough = process.argv.slice(2);
const args = ['vitest', 'run', '--config', 'vitest.sim.config.js',
  '--reporter=verbose', '--reporter=json', `--outputFile=${OUT}`, ...passthrough];
console.log(`nightly-gate: npx ${args.join(' ')}\n`);
const run = spawnSync('npx', args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });

if (!existsSync(OUT)) {
  // No machine-readable result at all: the suite did not get far enough to
  // produce one (a crash, an OOM, a collection error). That is never a pass,
  // and it must not be swallowed by a baseline.
  console.error('\nnightly-gate: FAILED — vitest produced no results file. '
    + 'The suite did not finish; the exit code was ' + run.status + '.');
  process.exit(1);
}

// ── which files failed ────────────────────────────────────────────────
const report = JSON.parse(readFileSync(OUT, 'utf8'));
const failed = new Set();
const ran = new Set();
for (const f of (report.testResults || [])) {
  const name = rel(f.name || f.testFilePath || '');
  if (!name) continue;
  ran.add(name);
  // vitest's json reporter reports a file as failed either on the file's own
  // status or through its assertions; both are checked, because a file that
  // throws during collection has no assertions to fail.
  const bad = f.status === 'failed'
    || (f.assertionResults || []).some(a => a.status === 'failed');
  if (bad) failed.add(name);
}

if (!ran.size) {
  console.error('\nnightly-gate: FAILED — the results file names no test files. '
    + 'A glob in vitest.slow.js probably matches nothing; a suite that silently '
    + 'collects zero tests has been shipped in this repo before.');
  process.exit(1);
}

const known = loadBaseline();
const knownNames = Object.keys(known);
const newlyBroken = [...failed].filter(f => !knownNames.includes(f)).sort();
const nowFixed = knownNames.filter(f => ran.has(f) && !failed.has(f)).sort();
const stillKnown = knownNames.filter(f => failed.has(f)).sort();

// ── the verdict ───────────────────────────────────────────────────────
const line = '─'.repeat(72);
console.log(`\n${line}\nnightly-gate\n${line}`);
console.log(`files run: ${ran.size}   failing: ${failed.size}   `
  + `known: ${stillKnown.length}   new: ${newlyBroken.length}   fixed: ${nowFixed.length}`);

if (stillKnown.length) {
  console.log('\nStill failing, and known (tests/nightly-known-failures.json):');
  for (const f of stillKnown) console.log(`  · ${f}\n      ${known[f].note} (since ${known[f].since})`);
}

let bad = false;

if (newlyBroken.length) {
  bad = true;
  console.error('\nREGRESSION — these files are failing and are not in the baseline:');
  for (const f of newlyBroken) console.error(`  ✗ ${f}`);
  console.error('\nFix them, or — if the failure is understood and being left for now —\n'
    + 'add an entry to tests/nightly-known-failures.json saying what it is and why.');
}

if (nowFixed.length) {
  bad = true;
  console.error('\nSTALE BASELINE — these are listed as known failures and now PASS:');
  for (const f of nowFixed) console.error(`  ✓ ${f}`);
  console.error('\nDelete them from tests/nightly-known-failures.json. The list is only\n'
    + 'worth having while every line of it is still true.');
}

if (!bad) {
  console.log('\nNo new failures. The known list is the work outstanding.');
}
process.exit(bad ? 1 : 0);
