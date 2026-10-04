// Camp Comeback as stepped sets (Phase 7): Big Brother explains camp on the first eviction,
// every evictee takes a bunk, the door screen sends the losers out last place first and
// brings back the winner the engine chose, nobody talks about a vote they did not cast,
// and the classic camp and door screens are gone.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps, REPLACED } from '../js/vp-bb-ep/steps.js';
import { stageHtml } from '../js/vp-bb-ep/stage.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Ezekiel', 'Priya'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'floater', 'hero'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] }));

function campSeasons() {
  const eps = [];
  for (const seed of [4242, 77, 31337]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [{ episode: 1, type: 'bb-camp-comeback' }];
    for (let w = 0; w < 6; w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      if ((ep.acts || []).some(a => /^camp-/.test(a.type))) eps.push(JSON.parse(JSON.stringify(ep)));
    }
  }
  return eps;
}
const EPS = campSeasons();
const actOf = (ep, type) => ep.acts.find(a => a.type === type);

describe('Camp Comeback on the stepped stage', () => {
  it('fills camp and opens the door in real seasons', () => {
    expect(EPS.filter(ep => actOf(ep, 'camp-comeback')).length).toBeGreaterThan(6);
    expect(EPS.filter(ep => actOf(ep, 'camp-return')).length).toBeGreaterThan(1);
  });

  it('explains camp on the first eviction only, and seats every evictee in a bunk', () => {
    for (const ep of EPS) {
      const act = actOf(ep, 'camp-comeback');
      if (!act) continue;
      const S = bbWeekSteps(ep).find(s => /^bb-camp-w/.test(s.id));
      const rules = S.steps.filter(st => st.rule != null).map(st => st.rule);
      expect(rules).toEqual(act.nth === 1 ? [1, 2, 3, 4] : []);
      expect(S.steps.filter(st => st.campIn).map(st => st.campIn)).toEqual([act.arrival]);
    }
  });

  it('sends the losers out last place first and brings back the engine’s winner', () => {
    for (const ep of EPS) {
      const act = actOf(ep, 'camp-return');
      if (!act) continue;
      const S = bbWeekSteps(ep).find(s => /^bb-campdoor/.test(s.id));
      expect(S.steps.slice(0, 3).map(st => st.rule)).toEqual([1, 2, 3]);
      expect(S.steps.filter(st => st.campOut).map(st => st.campOut)).toEqual(act.order.slice(1).reverse());
      expect(S.steps.filter(st => st.campBack).map(st => st.campBack)).toEqual([act.winner]);
      expect(act.winner).toBe(act.order[0]);
    }
  });

  it('lets only a real voter talk about the vote, and never on the last camper', () => {
    for (const ep of EPS) {
      const act = actOf(ep, 'camp-comeback');
      const v = act?.beats.find(b => b.part === 'voters');
      if (!v) continue;
      if (act.full) { expect(v.lines).toBeUndefined(); continue; }
      const speakers = new Set(v.lines.filter(l => l.dr).map(l => l.by));
      for (const s of speakers) expect(v.players.slice(1)).toContain(s);
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const ep of EPS) {
      const screens = bbWeekSteps(ep);
      screens.forEach((S, si) => {
        if (S.kind !== 'camp') return;
        for (const st of S.steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
        for (let i = -1; i < S.steps.length; i++) {
          expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
        }
      });
    }
  });

  it('replaces the classic camp and door screens', () => {
    expect(REPLACED.test('bb-camp')).toBe(true);
    expect(REPLACED.test('bb-campdoor')).toBe(true);
    expect(REPLACED.test('bb-camp-w2')).toBe(false);
  });
});
