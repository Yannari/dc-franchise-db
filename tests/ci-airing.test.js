import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { ALWAYS_AIRS, CHATS_PER_DAY } from '../js/ci/airing.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';

function play(script = true, seed = 21) {
  const cast = makePlayers(13, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  return playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }), pool: makePool(6, seed), seed, options: { script } });
}

describe('airing and scripts', () => {
  it('airs every big moment and at most nine chats a day', () => {
    const { state } = play();
    for (const s of state.scenes) if (ALWAYS_AIRS.has(s.kind)) expect(s.aired, s.kind).toBe(true);
    for (let d = 1; d <= 13; d++) {
      expect(state.scenes.filter(s => s.day === d && s.kind === 'chat' && s.aired).length).toBeLessThanOrEqual(CHATS_PER_DAY);
    }
  });

  it('writes a script on aired scenes only, as plain strings', () => {
    const { state, rows } = play();
    for (const s of state.scenes) expect(!!s.script, `${s.kind} ${s.id}`).toBe(s.aired);
    expect(JSON.parse(JSON.stringify(rows))).toEqual(rows);
    expect(rows[0].ci.aired.length).toBeGreaterThan(0);
  });

  it('cannot change a result', () => {
    const a = play(true), b = play(false);
    expect(a.result.placements).toEqual(b.result.placements);
    expect(a.state.blocked).toEqual(b.state.blocked);
    expect(a.state.ratings.map(r => r.results)).toEqual(b.state.ratings.map(r => r.results));
  });
});
