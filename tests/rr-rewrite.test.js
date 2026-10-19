// The Ridonculous Race: the rewrite (docs/rr-writers-brief.md "The rewrite standard"; the user, 2026-10-18). A
// rewritten moment lives in lines/rewrite/ and retires the old lines it replaces; quick hits are 2 to 5 lines,
// story moments are scenes of 6 to 12; a line that names where it is (an airport, a task) only plays there.
import { describe, it, expect } from 'vitest';
import { POOLS, REWRITES } from '../js/rr/script/lines/index.js';

const QUICK = new Set(['celebrate', 'judge-yes', 'tip-read', 'ride', 'arrival-awe', 'task-start', 'task-done', 'attempt-fail', 'gross-out', 'don-place']);
const WHERE = [
  ['airport', /\b(airport|boarding pass|departure board|the gate|row (one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)|seatbelt|overhead bin)\b/i],
  ['task', /\b(task|judge)\b/i],
];

describe('rr rewrite', () => {
  it('there is a rewrite, and every pool it retires holds only the new lines', () => {
    expect(REWRITES.length).toBeGreaterThan(0);
    for (const rw of REWRITES) {
      const mine = new Set(Object.values(rw.pools).flat().map(e => e.id));
      for (const r of rw.retire) {
        const key = typeof r === 'string' ? r : r.key;
        const left = (POOLS[key] || []).filter(e => !mine.has(e.id) && (typeof r === 'string' || [].concat(e.when?.cause).includes(r.cause)));
        expect(left.map(e => e.id), `${key}${r.cause ? ' after ' + r.cause : ''}`).toEqual([]);
      }
    }
  });

  it('quick hits are 2 to 5 lines, story moments are scenes of 6 to 12', () => {
    for (const rw of REWRITES) for (const [k, list] of Object.entries(rw.pools)) {
      if (k.startsWith('int-')) continue;
      const quick = QUICK.has(k.split('.')[0]);
      for (const e of list) {
        expect(e.turns.length, e.id).toBeGreaterThanOrEqual(quick ? 2 : 6);
        expect(e.turns.length, e.id).toBeLessThanOrEqual(quick ? 5 : 12);
      }
    }
  });

  it('a rewritten line that names where it is plays only there', () => {
    for (const rw of REWRITES) for (const [k, list] of Object.entries(rw.pools)) {
      if (k.startsWith('int-')) continue;
      for (const e of list) {
        const text = e.turns.map(t => [t.say, t.beat, t.conf].join(' ')).join(' ');
        for (const [at, re] of WHERE) if (re.test(text)) expect(e.when?.at, `${e.id} names the ${at}`).toBe(at);
      }
    }
  });

  it('a rewritten interview is about the moment it follows', () => {
    for (const rw of REWRITES) for (const [k, list] of Object.entries(rw.pools)) {
      if (!['int-feeling', 'int-strategy', 'int-about-team', 'int-contradict'].some(x => k.startsWith(x))) continue;
      for (const e of list) expect(e.when?.cause, e.id).toBeTruthy();
    }
  });
});
