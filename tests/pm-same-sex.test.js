// A same-sex couple at a recoupling (user, 2026-09-24: "hope you don't block
// possible queer relations between bi people"). The show has done it: UK 2,
// day 37, girls' choice, and Katie chose Sophie; two boys were left single
// and a bombshell came in to choose between them. The first coupling stays
// girls-and-boys, as the show plays it.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

function season(seed, queer) {
  const cast = makeIslanders(22, seed);
  if (queer) {
    const f = cast.filter(p => p.gender === 'f'), m = cast.filter(p => p.gender === 'm');
    [f[1], f[4]].forEach(p => { p.sexuality = 'bi'; }); f[7].sexuality = 'lesbian';
    [m[2], m[5]].forEach(p => { p.sexuality = 'bi'; }); m[8].sexuality = 'gay';
  }
  setPlayers(cast);
  const names = cast.map(p => p.name);
  const g = Object.fromEntries(cast.map(p => [p.name, p.gender]));
  return { rows: playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed }).rows, g };
}
const sameSex = ({ rows, g }) => rows.flatMap(r => r.pm.couples.filter(([a, b]) => g[a] === g[b]));

describe('same-sex couples', () => {
  it('form at recouplings when two islanders can fancy each other, and the final still has four couples', () => {
    let seasons = 0, four = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const s = season(seed, true);
      if (sameSex(s).length) seasons++;
      if (s.rows.find(r => r.moment === 'final').pm.couples.length === 4) four++;
      // Night one is girls and boys.
      expect(s.rows[0].pm.couples.every(([a, b]) => s.g[a] !== s.g[b]), `seed ${seed}`).toBe(true);
    }
    // Measured 2026-09-24: 32 seasons of 40 (six islanders who could), 40 of 40 four-couple finals.
    expect(seasons).toBeGreaterThanOrEqual(6);
    expect(four).toBe(12);
  });
  it('never form in a cast where nobody could', () => {
    for (let seed = 1; seed <= 4; seed++) expect(sameSex(season(seed, false))).toEqual([]);
  });
});
