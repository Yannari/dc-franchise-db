// The Halting Hex as a stepped set (Phase 7): the eviction screen stops at the verdict (no
// goodbye, no door, no black-and-white portrait for somebody who is staying), the Hex screen
// explains it and spares the engine's evictee, no line claims anybody's vote (votes are
// secret), and the classic screen is gone.
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

function hexWeeks() {
  const out = [];
  for (const seed of [1, 2, 3, 5]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [2, 3, 4, 5, 6].map(e => ({ episode: e, type: 'bb-app-store' }));
    for (let w = 0; w < 10 && !houseIsAtFinale(); w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'halting-hex');
      if (act) out.push({ ep: JSON.parse(JSON.stringify(ep)), act });
    }
  }
  return out;
}
const WEEKS = hexWeeks();

describe('the Halting Hex on the stepped stage', () => {
  it('plays in real seasons', () => {
    expect(WEEKS.length).toBeGreaterThan(1);
  });

  it('stops the eviction at the verdict for somebody who is staying', () => {
    for (const { ep, act } of WEEKS) {
      const ev = bbWeekSteps(ep).find(s => s.kind === 'evict');
      expect(ev.steps.some(st => st.exit === act.spared)).toBe(false);
      expect(ev.steps.some(st => st.out === act.spared)).toBe(false);
      expect(ev.steps.some(st => /front door closes/.test(st.t))).toBe(false);
    }
  });

  it('explains the Hex and spares the engine’s evictee', () => {
    for (const { ep, act } of WEEKS) {
      const S = bbWeekSteps(ep).find(s => s.kind === 'hex');
      expect(S.steps.filter(st => st.rule != null).map(st => st.rule)).toEqual([1, 2, 3]);
      expect(S.steps.find(st => st.rule === 3).t).toContain(act.spared);
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const { ep } of WEEKS) {
      const screens = bbWeekSteps(ep);
      const si = screens.findIndex(s => s.kind === 'hex');
      for (const st of screens[si].steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
      for (let i = -1; i < screens[si].steps.length; i++) {
        expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it('replaces the classic Halting Hex screen', () => {
    expect(REPLACED.test('bb-haltinghex')).toBe(true);
  });
});
