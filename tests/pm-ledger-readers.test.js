// The rule this show owns (spec §8): the public vote, a bombshell's arrival
// and an islander's family read the public ledger; no islander decision may.
// Stated over the source, like tests/tr-audience.test.js, because a leak is
// invisible from outside: every season still plays.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'js', 'pm');
const ALLOWED = new Set(['ledger.js', 'public-vote.js', 'arrivals.js', 'season.js']);
const READERS = /\b(readApproval|coupleScore|followers|ledgerSnapshot)\b|\.approval\s*\[|\.fame\s*\[/;
const strip = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\r\n]*/g, '');

describe('only the public reads the public ledger', () => {
  const files = readdirSync(DIR).filter(f => f.endsWith('.js'));
  it('finds the engine', () => { expect(files.length).toBeGreaterThanOrEqual(12); });
  for (const f of files) {
    if (ALLOWED.has(f)) continue;
    it(`${f} makes no decision from approval or fame`, () => {
      expect(strip(readFileSync(join(DIR, f), 'utf8'))).not.toMatch(READERS);
    });
  }
  it('fails when a decision file reads approval (mutation check)', () => {
    expect(strip('const x = readApproval(state.ledger, n);')).toMatch(READERS);
    expect(strip('// readApproval is forbidden here')).not.toMatch(READERS);
  });
});
