// ci-repetition.test.js — a season should not keep saying the same things
// (user, 2026-09-30: "are u sure we're avoiding all possible repetitions of
// message, do we have enough variants?"). Measured on real roster seasons:
// before the rewrite 20% of a season's lines repeated one already heard and
// 1.9% were a person repeating themselves; after it, under 10% and ~1%.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

function measure(seeds) {
  let total = 0, again = 0, self = 0;
  for (const seed of seeds) {
    const cast = rosterCast(13, seed); setPlayers(cast); const names = cast.map(p => p.name);
    const { rows } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed });
    const seen = new Map(), bySpeaker = new Map();
    for (const r of rows) for (const a of r.ci.aired) for (const b of a.script?.blocks || []) for (const l of b.lines) {
      if (!l.text || l.kind === 'host' || l.kind === 'stage') continue;
      let t = l.text;
      for (const p of Object.values(r.ci.profiles)) if (p.name) t = t.split(p.name).join('#');
      total++;
      const k = `${b.key}|${t}`;
      if (seen.has(k)) again++; seen.set(k, true);
      const ks = `${l.who}|${t}`;
      if (bySpeaker.has(ks)) self++; bySpeaker.set(ks, true);
    }
  }
  return { again: again / total, self: self / total };
}

describe('a season does not keep repeating itself', () => {
  it('under 12% of lines repeat one already heard that season, and under 1.5% are a person repeating themselves', () => {
    const m = measure([2, 5, 8]);
    expect(m.again).toBeLessThan(0.12);
    expect(m.self).toBeLessThan(0.015);
  });
});
