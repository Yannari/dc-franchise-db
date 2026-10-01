// ci-visit-fresh.test.js — two visits on back-to-back nights never play the
// same exchange (user, 2026-10-01: "the visit of 2 person back to back had
// the exact same conversation"). script.js RECENT_DAYS holds a line back for
// a few days while anything else fits; before it, 7 adjacent pairs in 60
// seasons shared four lines or more.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

describe('visits on back-to-back nights', () => {
  it('do not repeat each other', () => {
    let worst = 0;
    for (let seed = 1; seed <= 25; seed++) {
      const cast = rosterCast(13, seed); setPlayers(cast);
      const names = cast.map(p => p.name);
      const { rows } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed });
      const visits = rows.flatMap(row => (row.ci.aired || []).filter(s => s.kind === 'visit')
        .map(s => s.script.blocks.flatMap(b => b.lines.filter(l => l.kind !== 'stage').map(l => l.text))));
      for (let i = 1; i < visits.length; i++) worst = Math.max(worst, visits[i].filter(t => visits[i - 1].includes(t)).length);
    }
    expect(worst).toBeLessThanOrEqual(1);
  });
});
