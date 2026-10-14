// Stories across weeks (js/bb/story/arcs.js): the season's running gags and the payback and block
// arcs. Words only, and every ending is the game's: a payback lands only when the one nominated is
// Head of Household and nominated the rival; the block regular's win is a real win.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];

function season(seed, weeks) {
  seedGame(NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] })), { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
  const eps = [];
  for (let w = 0; w < weeks; w++) eps.push(JSON.parse(JSON.stringify(withSeededRandom(seed * 100 + w, () => simulateBBEpisode()))));
  return { eps, runners: JSON.parse(JSON.stringify(gs.bb.arcs?.runners || {})) };
}
const SEASONS = [season(4242, 9), season(777, 9)];
const arcScenes = ep => (ep.acts || []).flatMap(a => a.scenes || []).filter(sc => /^(run|arc)\./.test(String(sc.step || '')));

describe('stories across weeks', () => {
  it('picks two running gags a season, and airs at most one gag and one arc beat a week', () => {
    for (const { eps, runners } of SEASONS) {
      expect(Object.keys(runners).length).toBe(2);
      expect(new Set(Object.values(runners).map(r => r.kind)).size).toBe(2);
      for (const ep of eps) {
        const sc = arcScenes(ep);
        expect(sc.filter(s => s.step.startsWith('run.')).length, `week ${ep.num}`).toBeLessThanOrEqual(1);
        expect(sc.filter(s => s.step.startsWith('arc.')).length, `week ${ep.num}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it('sets a gag up before it calls it back, and pays it off once', () => {
    for (const { eps } of SEASONS) {
      const byPerson = {};
      for (const ep of eps) for (const sc of arcScenes(ep).filter(s => s.step.startsWith('run.'))) (byPerson[sc.cast[0]] ||= []).push(sc.step.split('.').at(-1));
      expect(Object.keys(byPerson).length).toBeGreaterThan(0);
      for (const stages of Object.values(byPerson)) {
        expect(stages[0]).toBe('setup');
        expect(stages.filter(s => s === 'setup').length).toBe(1);
        expect(stages.filter(s => s === 'payoff').length).toBeLessThanOrEqual(1);
        expect(stages.filter(s => s === 'call').length).toBeLessThanOrEqual(3);
      }
    }
  });

  it('ends an arc the way the game did', () => {
    let arcs = 0;
    for (const { eps } of SEASONS) for (const ep of eps) for (const sc of arcScenes(ep).filter(s => s.step.startsWith('arc.'))) {
      arcs++;
      const [a, b] = sc.cast;
      if (sc.step === 'arc.payback.end.payback') {
        expect(ep.hoh).toBe(a);
        expect([...(ep.initialNominees || []), ...(ep.finalNominees || [])]).toContain(b);
      }
      if (sc.step === 'arc.payback.end.mercy') expect(ep.hoh).toBe(a);
      if (sc.step === 'arc.block.end.win') expect([ep.hoh, ep.vetoWinner]).toContain(a);
      if (sc.step === 'arc.block.pro') expect(ep.finalNominees || []).toContain(a);
    }
    expect(arcs).toBeGreaterThan(0);
  });
});
