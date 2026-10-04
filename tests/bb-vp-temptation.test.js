// The Den of Temptation and its curse as stepped sets (Phase 7): Big Brother explains the Den
// first and never names the entrant out loud (the house is never told who went in); the taker
// speaks only in the Diary Room; the curse screen seats the engine's cursed houseguest (the curse
// used to have no screen at all); the classic Den screen is gone.
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

function denWeeks() {
  const out = [];
  for (const seed of [4242, 77, 31337, 9001, 5]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [2, 3].map(e => ({ episode: e, type: 'bb-den-of-temptation' }));
    for (let w = 0; w < 3; w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'temptation');
      if (act) out.push({ ep: JSON.parse(JSON.stringify(ep)), act, curse: (ep.acts || []).find(a => a.type === 'temptation-curse') });
    }
  }
  return out;
}
const WEEKS = denWeeks();
const screenOf = (ep, kind) => bbWeekSteps(ep).find(s => s.kind === kind);

describe('the Den of Temptation on the stepped stage', () => {
  it('plays in real seasons, taken and declined, with a curse', () => {
    expect(WEEKS.some(w => w.act.accepted)).toBe(true);
    expect(WEEKS.some(w => !w.act.accepted)).toBe(true);
    expect(WEEKS.some(w => w.curse?.cursed)).toBe(true);
  });

  it('explains the Den first and never has Big Brother say who went in', () => {
    for (const { ep, act } of WEEKS) {
      const S = screenOf(ep, 'den');
      expect(S.steps.slice(0, 4).map(st => st.rule)).toEqual([1, 2, 3, 4]);
      for (const st of S.steps.filter(x => x.k === 'bb')) expect(st.t).not.toContain(act.entrant);
    }
  });

  it('keeps the taker to the Diary Room and gives the engine’s answer', () => {
    for (const { ep, act } of WEEKS) {
      const S = screenOf(ep, 'den');
      expect(S.steps.some(st => st.pwMark === 'took')).toBe(act.accepted);
      for (const st of S.steps.filter(x => x.by === act.entrant)) expect(st.k).toBe('dr');
    }
  });

  it('seats the engine’s cursed houseguest on a screen of its own', () => {
    for (const { ep, curse } of WEEKS.filter(w => w.curse)) {
      const S = screenOf(ep, 'curse');
      expect(S.steps.find(st => st.curseOn)?.curseOn || null).toBe(curse.cursed || null);
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const { ep } of WEEKS) {
      const screens = bbWeekSteps(ep);
      screens.forEach((S, si) => {
        if (S.kind !== 'den' && S.kind !== 'curse') return;
        for (const st of S.steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
        for (let i = -1; i < S.steps.length; i++) {
          expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
        }
      });
    }
  });

  it('replaces the classic Den screen', () => {
    expect(REPLACED.test('bb-temptation')).toBe(true);
  });
});
