// ── The guard against guards that nothing runs ──
//
// `vitest.config.js` excludes `tests/**/*-audit.test.js` from `npm test`. That
// exclusion is correct: the audits play whole seasons and print tables, and
// they cost about half the wall clock of the ordinary suite. They are tools you
// RUN AND READ, not regressions checked on the way past.
//
// The hazard is that the exclusion is invisible at the point where it hurts.
// A file called `<something>-audit.test.js` looks like a test, is written like
// a test, passes locally when you run it by hand — and is collected by no
// default job. Three separate times in this project a load-bearing band or
// invariant has been written into such a file and therefore guarded nothing:
//
//   * Plan 5 Task 4 caught one and renamed the file
//   * Tasks 5-6 reintroduced it
//   * fix round 1 re-derived a family-dominance band inside the excluded file
//
// This check makes the situation visible. It is deliberately NOT a fix by
// un-excluding: the audits stay excluded. What it forbids is an assertion
// sitting in a file that NO named runner will ever execute.
//
// ── HOW IT DECIDES ──
//
// 1. The excluded set is MEASURED, not read out of the config. We run
//    `vitest list --filesOnly` in a subprocess and diff what it actually
//    collects against what is on disk. Reading `exclude` and reasoning about
//    globs is the exact mistake this file exists to prevent.
// 2. A file is an OFFENDER if it is excluded, contains an assertion, and no
//    runner names it.
// 3. A runner "names" a file when its basename appears literally in a
//    package.json script, in a non-comment line of a GitHub workflow, or in
//    the SLOW_TESTS list that `vitest.sim.config.js` consumes and the nightly
//    workflow runs. A glob does not count: `npm run audit:all` sweeps the whole
//    `*-audit.test.js` pattern, so if globs counted, every file would be
//    "covered" and this check would assert nothing.
//
// ── WHAT IT DOES NOT CATCH ──
//
// It cannot tell you that a NAMED runner is never actually invoked by anyone.
// `npm run audit:tr-castle` exists and no CI job calls it; by the rule above
// that file is covered. The line drawn here is between "a human deliberately
// gave this file a way to be run" and "nothing anywhere will ever run this".
// Only the second is a defect this check reports.
import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SLOW_TESTS } from '../vitest.slow.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Every test file on disk, as `tests/<name>.test.js`. */
function filesOnDisk() {
  return readdirSync(path.join(ROOT, 'tests'))
    .filter(f => f.endsWith('.test.js'))
    .map(f => `tests/${f}`)
    .sort();
}

/**
 * Every test file the DEFAULT config actually collects, measured by running
 * the collector. Never inferred from the exclude array.
 */
function filesCollected() {
  // Invoke vitest's own JS entry with the running node binary rather than the
  // `npx` shim: on Windows the shim is a .cmd and execFileSync refuses it.
  const bin = path.join(ROOT, 'node_modules', 'vitest', 'vitest.mjs');
  const out = execFileSync(
    process.execPath,
    [bin, 'list', '--filesOnly'],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 120000 },
  );
  return out
    .split(/\r?\n/)
    .map(l => l.trim().replace(/\\/g, '/'))
    .filter(l => /^tests\/.*\.test\.js$/.test(l))
    .sort();
}

/** Source with comments removed, so a mention inside a comment is not an assertion. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

const ASSERTION = /\bexpect\s*\(|\bexpect\s*\.\s*(soft|fail)\b|\bassert\s*[.(]/;

function hasAssertion(rel) {
  return ASSERTION.test(stripComments(readFileSync(path.join(ROOT, rel), 'utf8')));
}

/** Text of every place a runner can name a file, comments excluded. */
function runnerText() {
  const parts = [];

  const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  parts.push(...Object.values(pkg.scripts || {}));

  const wfDir = path.join(ROOT, '.github', 'workflows');
  if (existsSync(wfDir)) {
    for (const f of readdirSync(wfDir).filter(f => /\.ya?ml$/.test(f))) {
      const body = readFileSync(path.join(wfDir, f), 'utf8')
        .split(/\r?\n/)
        .filter(l => !/^\s*#/.test(l))
        .join('\n');
      parts.push(body);
    }
  }

  return parts.join('\n');
}

let disk, collected, excluded, runners;

beforeAll(() => {
  disk = filesOnDisk();
  collected = filesCollected();
  const collectedSet = new Set(collected);
  excluded = disk.filter(f => !collectedSet.has(f));
  runners = runnerText();
}, 180000);

describe('assertions excluded from the default suite must have a named runner', () => {
  it('the collector agrees there IS an excluded set (else this check is vacuous)', () => {
    // If the exclusions were ever dropped, `excluded` goes empty and every
    // assertion below passes trivially. Fail loudly instead: this check has no
    // meaning without something to check.
    expect(collected.length).toBeGreaterThan(0);
    expect(excluded.length).toBeGreaterThan(0);
    // And the audit pattern specifically must still be among the excluded, or
    // the hazard this file names has moved somewhere it is not watching.
    expect(excluded.some(f => /-audit\.test\.js$/.test(f))).toBe(true);
  });

  it('every excluded file that asserts is named by a runner', () => {
    const offenders = [];

    for (const rel of excluded) {
      if (!hasAssertion(rel)) continue;

      const base = path.basename(rel);
      const namedByRunner = runners.includes(base);
      const namedBySlowList = SLOW_TESTS.includes(base) && runners.includes('test:sim');

      if (!namedByRunner && !namedBySlowList) offenders.push(rel);
    }

    expect(
      offenders,
      offenders.length
        ? `\n\nThese files are excluded from \`npm test\` and contain assertions, but no ` +
          `named runner executes them — the assertions guard nothing:\n\n` +
          offenders.map(f => `  ${f}`).join('\n') +
          `\n\nFix ONE of:\n` +
          `  * move the assertion into a file the default suite collects (usually right — ` +
          `a load-bearing band belongs in a guard, not in a tool);\n` +
          `  * give the file a dedicated npm script that names it, if it really is an ` +
          `audit you run deliberately;\n` +
          `  * delete the assertion if it was only ever a printout.\n\n` +
          `Do NOT un-exclude the audits wholesale. They are slow on purpose.\n`
        : undefined,
    ).toEqual([]);
  });
});
