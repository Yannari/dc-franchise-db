// The long cut (js/ch/script/lines/longer): every spec rebuilds a real entry, keeps every original turn once
// (its voice variants go with it), and every optional turn names only parts its kind can have.
import { describe, expect, it } from 'vitest';
import { POOLS, LONGER } from '../js/ch/script/lines/index.js';

const entries = Object.entries(POOLS).flatMap(([key, list]) => list.map(e => ({ key, e })));
const byId = Object.fromEntries(entries.map(x => [x.e.id, x]));

describe('The Challenge: the long cut', () => {
  it('every spec rebuilds an entry that exists, and keeps each original turn exactly once', () => {
    for (const [id, spec] of Object.entries(LONGER)) {
      expect(byId[id], `${id}: no such entry`).toBeTruthy();
      const nums = spec.filter(x => typeof x === 'number');
      const n = byId[id].e.origTurns;
      expect(n, `${id}: not rebuilt`).toBeGreaterThan(0);
      expect([...nums].sort((a, b) => a - b), `${id}: original turns`).toEqual(Array.from({ length: n }, (_, i) => i));
    }
  });
  it('a new turn is a say, a confessional or a beat, by a part, and an optional reply names who it needs', () => {
    for (const [id, spec] of Object.entries(LONGER)) for (const t of spec) {
      if (typeof t === 'number') continue;
      expect(!!(t.say || t.conf || t.beat), `${id}: empty turn`).toBe(true);
      if (!t.beat) expect(['a', 'b', 'c', 'd', 'x', 'y', 'z', 'tj'], `${id}: by ${t.by}`).toContain(t.by);
      if (['x', 'y', 'z'].includes(t.by)) expect(t.opt, `${id}: ${t.by} speaks only when there`).toBeTruthy();
    }
  });
});
