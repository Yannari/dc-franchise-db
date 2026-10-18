// A team daily is fair when the teams are equally good (the user, 2026-10-18: "are these teams challenges adapted for
// teams with a different number of members, is it fair?"). Measured that day: the team listed first won 55% of races
// against an equal one (it finished first on every tie), and in Cliff Relay every member facing the fear made a team of
// seven lose to five more often (47%). A team's score is its members' average, so size alone must not matter.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { SIMS } from '../js/ch/dailies.js';
import { challengeCast } from './helpers/ch-cast.js';
import { stableRng } from '../js/script/rng.js';

const { cast, names, background } = challengeCast(24, 4);
setPlayers(cast);
const state = playChallengeSeason({ cast: names, background, seed: 4, options: { teams: { teaming: 'vets', count: 2, end: 'breakup' } } }).state;
state.active = [...names];

// how often the first-listed side wins, everybody the same strength, the sides drawn afresh each run
function firstWins(id, sa, sb, n = 2000) {
  let w = 0;
  for (let k = 0; k < n; k++) {
    const rng = stableRng(k, 'fair', id, sa, sb);
    const pool = [...names].sort(() => rng() - 0.5);
    const A = pool.slice(0, sa), B = pool.slice(sa, sa + sb);
    const res = SIMS[id](state, rng, { units: [A, B], power: Object.fromEntries(names.map(x => [x, 7])), mode: 'teams', id });
    const avg = u => u.reduce((s, x) => s + (res.score[x] || 0), 0) / u.length;
    if (res.winners ? res.winners.some(x => A.includes(x)) : avg(A) > avg(B)) w++;
  }
  return w / n;
}

describe('a team daily between equal teams', () => {
  it('does not favour the team listed first', () => {
    for (const id of ['cliff-relay', 'gauntlet-run']) {
      const p = firstWins(id, 6, 6);
      expect(p, id).toBeGreaterThan(0.46);
      expect(p, id).toBeLessThan(0.54);
    }
  });

  it('does not favour the bigger or the smaller team, whichever is listed first', () => {
    for (const [a, b] of [[7, 5], [5, 7]]) {
      const p = firstWins('cliff-relay', a, b);
      expect(p, `cliff-relay ${a} v ${b}`).toBeGreaterThan(0.46);
      expect(p, `cliff-relay ${a} v ${b}`).toBeLessThan(0.54);
    }
  });
}, 600000);
