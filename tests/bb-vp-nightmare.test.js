// The Nightmare Power as a stepped set (Phase 7): woken at three in the morning, Big Brother
// explains it, the engine's voided two come off and the engine's two new nominees go up, whose
// power it was is never on screen, and the classic screen is gone.
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

function nmWeeks() {
  const out = [];
  for (const seed of [4242, 77, 31337, 9001]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [2, 3, 4, 5, 6].map(e => ({ episode: e, type: 'bb-app-store' }));
    for (let w = 0; w < 8; w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'nightmare-power');
      if (act) out.push({ ep: JSON.parse(JSON.stringify(ep)), act });
    }
  }
  return out;
}
const WEEKS = nmWeeks();
const screenOf = ep => bbWeekSteps(ep).find(s => s.kind === 'nightmare');

describe('the Nightmare Power on the stepped stage', () => {
  it('plays in real seasons', () => {
    expect(WEEKS.length).toBeGreaterThan(1);
  });

  it('explains it, voids the engine’s two and seats the engine’s new two', () => {
    for (const { ep, act } of WEEKS) {
      const S = screenOf(ep);
      expect(S.steps.filter(st => st.rule != null).map(st => st.rule)).toEqual([1, 2, 3, 4]);
      expect(S.nightmare.voided).toEqual(act.voided);
      expect(S.nightmare.named).toEqual(act.nominees);
      expect(S.steps.findIndex(st => st.nmOff)).toBeLessThan(S.steps.findIndex(st => st.nmOn));
    }
  });

  it('never shows whose power it was', () => {
    for (const { ep, act } of WEEKS) {
      const S = screenOf(ep);
      for (const st of S.steps) if (st.by === act.holder) expect(st.t).not.toMatch(/my power|I used/i);
      expect(S.steps.some(st => st.k !== 'bb' && st.t.includes(`${act.holder} used`))).toBe(false);
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const { ep } of WEEKS) {
      const screens = bbWeekSteps(ep);
      const si = screens.findIndex(s => s.kind === 'nightmare');
      for (const st of screens[si].steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
      for (let i = -1; i < screens[si].steps.length; i++) {
        expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it('replaces the classic Nightmare screen', () => {
    expect(REPLACED.test('bb-nightmare')).toBe(true);
  });
});
