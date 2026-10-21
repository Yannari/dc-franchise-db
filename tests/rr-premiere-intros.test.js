// The premiere meets every team once, and no two teams get the same introduction. The user's Home City premiere
// (2026-10-21): twelve teams of reality-show vets shared five intros, so three pairs "signed up as a joke" and three
// "never gave up on anything, except the gym".
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

const premieres = [];
beforeAll(() => {
  for (const seed of [8, 21, 55]) for (const vets of [false, true]) {
    const { cast, teams } = raceCast(12, seed);
    if (vets) for (const t of teams) { t.rel = 'reality-vets'; t.identity = null; t.name = `${t.a} & ${t.b}`; }
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    premieres.push({ seed, vets, ep: airSeason(res)[0] });
  }
}, 600000);

describe('rr premiere: every team its own introduction', () => {
  it('never gives two teams the same intro in one premiere', () => {
    for (const { seed, vets, ep } of premieres) {
      const ids = ep.segments.filter(s => s.kind === 'team-intro').map(s => s.lineId);
      expect(ids.length, `seed ${seed}`).toBe(12);
      expect(ids.length - new Set(ids).size, `seed ${seed}${vets ? ' (all vets)' : ''}: ${ids.join(' ')}`).toBe(0);
    }
  });
  it('lets Don say "reality-show vets" a few times at most, not to every team', () => {
    for (const { seed, vets, ep } of premieres) {
      if (!vets) continue;
      const n = ep.segments.filter(s => s.kind === 'team-intro').filter(s => s.lines.some(l => l.by === 'Don' && /reality-show vets/.test(l.text))).length;
      expect(n, `seed ${seed}`).toBeLessThanOrEqual(4);
    }
  });
});
