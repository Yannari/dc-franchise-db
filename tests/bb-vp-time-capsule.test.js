// The Time Capsule as a stepped set (Phase 7): Big Brother explains it first, America's
// favourite is the engine's recipient, every stage the engine scored is shown in order with
// its grade, the meter ends on the engine's result, a won power is never named, and the
// classic screen is gone.
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

function capWeeks() {
  const out = [];
  for (const seed of [4242, 77, 31337, 9001, 5]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [2, 3].map(e => ({ episode: e, type: 'bb-care-package' }));
    for (let w = 0; w < 3; w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'time-capsule');
      if (act) out.push({ ep: JSON.parse(JSON.stringify(ep)), act });
    }
  }
  return out;
}
const WEEKS = capWeeks();
const screenOf = ep => bbWeekSteps(ep).find(s => s.kind === 'capsule');

describe('the Time Capsule on the stepped stage', () => {
  it('plays in real seasons', () => {
    expect(WEEKS.length).toBeGreaterThan(4);
  });

  it('explains the capsule first and sends in the engine’s favourite', () => {
    for (const { ep, act } of WEEKS) {
      const S = screenOf(ep);
      expect(S.steps.slice(0, 4).map(st => st.rule)).toEqual([1, 2, 3, 4]);
      expect(S.steps[4].t).toContain(`${act.recipient}, America has chosen you`);
    }
  });

  it('shows every stage the engine scored, and ends on the engine’s result', () => {
    for (const { ep, act } of WEEKS) {
      const S = screenOf(ep);
      expect(S.steps.filter(st => st.capStage).map(st => [st.capStage[0], st.capStage[1]]))
        .toEqual(act.stages.map(s => [s.index, s.grade]));
      expect(S.steps.filter(st => st.capEnd).map(st => st.capEnd)).toEqual([act.won ? 'won' : 'lost']);
    }
  });

  it('never names the power that came out', () => {
    for (const { ep, act } of WEEKS) {
      if (!act.won) continue;
      for (const st of screenOf(ep).steps) expect(st.t).not.toContain(act.power);
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const { ep } of WEEKS) {
      const screens = bbWeekSteps(ep);
      const si = screens.findIndex(s => s.kind === 'capsule');
      for (const st of screens[si].steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
      for (let i = -1; i < screens[si].steps.length; i++) {
        expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it('replaces the classic Time Capsule screen', () => {
    expect(REPLACED.test('bb-timecapsule')).toBe(true);
  });
});
