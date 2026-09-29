// ci-written-seasons.test.js — five played seasons, read by a machine:
// every aired scene has words, no pool is missing, and no unfilled slot
// reaches the screen.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';

function play(seed) {
  const cast = makePlayers(13, seed);
  setPlayers(cast);
  const names = cast.map(p => p.name);
  return playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }), pool: makePool(6, seed), options: {}, seed });
}

describe('five written seasons', () => {
  it('writes every aired scene, from pools that exist, with every slot filled', () => {
    const empty = [], unfilled = [], missing = {}, written = [];
    for (const seed of [2, 7, 19, 31, 44]) {
      const { state } = play(seed);
      written.push(state.scenes.filter(x => x.aired && x.script?.blocks?.length).length);
      for (const k of Object.keys(state.missingPools || {})) missing[k] = (missing[k] || 0) + state.missingPools[k];
      for (const s of state.scenes.filter(x => x.aired)) {
        if (!s.script?.blocks?.length) { empty.push(`${seed}:${s.kind}`); continue; }
        for (const b of s.script.blocks) for (const l of b.lines) {
          if (/[{}]/.test(l.text) || /[{}]/.test(l.spoken || '')) unfilled.push(`${seed}:${b.key}: ${l.text}`);
        }
        if (/[{}]/.test(s.script.blocks.map(b => b.beat || '').join(''))) unfilled.push(`${seed}:${s.kind}: beat`);
      }
    }
    // Not a pass on nothing: every season aired and wrote well over a hundred scenes.
    for (const n of written) expect(n).toBeGreaterThan(100);
    expect(missing).toEqual({});
    expect([...new Set(empty)]).toEqual([]);
    expect(unfilled.slice(0, 10)).toEqual([]);
  });
});
