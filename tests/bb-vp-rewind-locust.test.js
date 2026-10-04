// The Rewind and the White Locust as stepped sets (Phase 7). The Rewind: the eviction screen
// stops at the verdict, Big Brother explains the erased week and spares the engine's evictee.
// The White Locust: Big Brother explains the chain, every call-out is the engine's round with
// the engine's clock and result, and the engine's fastest survivor is crowned. Classic screens gone.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { bbWeekSteps, REPLACED } from '../js/vp-bb-ep/steps.js';
import { stageHtml } from '../js/vp-bb-ep/stage.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Ezekiel', 'Priya'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'floater', 'hero'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] }));

function seasonsOf(type, eps, weeks, seeds) {
  const out = [];
  for (const seed of seeds) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = eps.map(e => ({ episode: e, type }));
    for (let w = 0; w < weeks && !houseIsAtFinale(); w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      if ((ep.acts || []).some(a => a.type === 'rewind' || a.type === 'white-locust')) out.push(JSON.parse(JSON.stringify(ep)));
    }
  }
  return out;
}
const REWIND = seasonsOf('bb-app-store', [2, 3, 4, 5, 6], 10, [1, 2, 3]).filter(ep => ep.acts.some(a => a.type === 'rewind'));
const LOCUST = seasonsOf('bb-white-locust', [2], 2, [4242, 77, 31337]);

describe('the Rewind and the White Locust on the stepped stage', () => {
  it('plays both in real seasons', () => {
    expect(REWIND.length).toBeGreaterThan(0);
    expect(LOCUST.length).toBeGreaterThan(1);
  });

  it('stops the eviction at the verdict before a Rewind, and spares the engine’s evictee', () => {
    for (const ep of REWIND) {
      const act = ep.acts.find(a => a.type === 'rewind');
      const screens = bbWeekSteps(ep);
      const ev = screens.find(s => s.kind === 'evict');
      expect(ev.steps.some(st => st.exit === act.spared)).toBe(false);
      const S = screens.find(s => s.kind === 'rewind');
      expect(S.steps.filter(st => st.rule != null).map(st => st.rule)).toEqual([1, 2, 3]);
      expect(S.steps.find(st => st.rule === 2).t).toContain(act.spared);
    }
  });

  it('plays every call-out the engine ran, and crowns the engine’s fastest', () => {
    for (const ep of LOCUST) {
      const act = ep.acts.find(a => a.type === 'white-locust');
      const S = bbWeekSteps(ep).find(s => s.kind === 'locust');
      expect(S.steps.slice(0, 4).map(st => st.rule)).toEqual([1, 2, 3, 4]);
      const ends = S.steps.filter(st => st.wlRound && st.wlRound[1] !== 'up').map(st => [st.wlRound[0], st.wlRound[1]]);
      expect(ends).toEqual(act.rounds.map(r => [r.target, r.made ? 'made' : 'out']));
      expect(S.steps.at(-1).t).toContain(`${act.hoh}, you were the fastest`);
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const ep of [...REWIND, ...LOCUST]) {
      const screens = bbWeekSteps(ep);
      screens.forEach((S, si) => {
        if (S.kind !== 'rewind' && S.kind !== 'locust') return;
        for (const st of S.steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
        for (let i = -1; i < S.steps.length; i++) {
          expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
        }
      });
    }
  });

  it('replaces the classic screens', () => {
    expect(REPLACED.test('bb-rewind')).toBe(true);
    expect(REPLACED.test('bb-whitelocust')).toBe(true);
  });
});
