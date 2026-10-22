// The next elimination is not already decided (the user, 2026-10-21: "the last one safe in the previous episode is the
// one going home in the next episode thats make the simulation uselesss and predictable"). Measured on 40 seasons: the
// team that was last and survived went out next time 48% of the time (chance 16%), and a team's place one leg predicted
// its place the next (rank correlation 0.53). What carried it: the whole check-in gap carried into the next leg, flights
// 90 minutes apart that landed in order (the last team was always on the last one), and no luck on the day. Now half the
// gap carries (90 minutes at most), the flights level the field, and a team's form and its driver change leg to leg:
// 23% and 0.23 on 80 seasons.
import { it, expect } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

it('the team last and safe one leg is not the next one out, as a rule', () => {
  let elims = 0, lastSafe = 0;
  const rho = [];
  for (let seed = 1; seed <= 20; seed++) {
    const { cast, teams } = raceCast([8, 10, 12][seed % 3], seed);
    setPlayers(cast);
    const L = playRaceSeason({ teams, seed }).state.legs;
    for (let i = 1; i < L.length; i++) {
      const prev = L[i - 1], cur = L[i];
      if (cur.kind !== 'elim' || !cur.eliminated.length || !prev.order?.length) continue;
      const safe = prev.order.filter(id => !prev.eliminated.includes(id));
      elims++;
      if (cur.eliminated.includes(safe.at(-1))) lastSafe++;
      const both = cur.order.filter(id => safe.includes(id));
      const n = both.length, m = (n - 1) / 2;
      const ra = [...both].sort((x, y) => safe.indexOf(x) - safe.indexOf(y)), rb = [...both].sort((x, y) => cur.order.indexOf(x) - cur.order.indexOf(y));
      let num = 0, d = 0;
      for (const id of both) { num += (ra.indexOf(id) - m) * (rb.indexOf(id) - m); d += (ra.indexOf(id) - m) ** 2; }
      if (d) rho.push(num / d);
    }
  }
  expect(elims).toBeGreaterThan(80);
  expect(lastSafe / elims).toBeLessThan(0.32);
  expect(rho.reduce((a, b) => a + b, 0) / rho.length).toBeLessThan(0.35);
}, 600000);
