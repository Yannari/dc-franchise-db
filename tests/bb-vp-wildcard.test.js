// The Wildcard as a stepped set (Phase 7): Big Brother explains the hat first, every name
// drawn reaches the board, the scores come in lowest first and the engine's winner is the
// last to light, the offer names the price the engine drew (and who pays it), the answer is
// the engine's answer, and the classic screen is gone.
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

function wildWeeks() {
  const acts = [];
  for (const seed of [4242, 77, 31337, 9001, 5]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [1, 2, 3].map(e => ({ episode: e, type: 'bb-wildcard' }));
    for (let w = 0; w < 3; w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'wildcard');
      if (act) acts.push({ ep: JSON.parse(JSON.stringify(ep)), act });
    }
  }
  return acts;
}
const WEEKS = wildWeeks();
const screenOf = ep => bbWeekSteps(ep).find(s => s.kind === 'wild');

describe('the Wildcard on the stepped stage', () => {
  it('plays in real seasons, both taken and turned down', () => {
    expect(WEEKS.length).toBeGreaterThan(8);
    expect(WEEKS.some(w => w.act.accepted)).toBe(true);
    expect(WEEKS.some(w => !w.act.accepted)).toBe(true);
  });

  it('explains the hat first, then draws every name the engine drew', () => {
    for (const { ep, act } of WEEKS) {
      const S = screenOf(ep);
      expect(S.steps.slice(0, 4).map(st => st.rule)).toEqual([1, 2, 3, 4]);
      expect(S.steps.filter(st => st.wcDraw).map(st => st.wcDraw)).toEqual(act.players);
    }
  });

  it('reads the scores lowest first and crowns the engine’s winner last', () => {
    for (const { ep, act } of WEEKS) {
      const S = screenOf(ep);
      const read = S.steps.filter(st => st.wcScore).map(st => st.wcScore);
      expect(read.map(r => r[0])).toEqual(act.scores.map(s => s.name).reverse());
      expect(read.map(r => r[1])).toEqual(act.scores.map(s => s.score).reverse());
      expect(S.steps.filter(st => st.wcWin).map(st => st.wcWin)).toEqual([act.winner]);
    }
  });

  it('names the price the engine drew, says who pays, and gives the engine’s answer', () => {
    for (const { ep, act } of WEEKS) {
      const S = screenOf(ep);
      const offer = S.steps.filter(st => st.wcOffer).map(st => st.t).join(' ');
      expect(offer).toContain(act.punishmentLabel);
      expect(/Everyone else in the house will/.test(offer)).toBe(!!act.houseWide);
      expect(S.steps.some(st => st.wcTook)).toBe(act.accepted);
      expect(S.steps.some(st => st.wcRefused)).toBe(!act.accepted);
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const { ep } of WEEKS) {
      const screens = bbWeekSteps(ep);
      const si = screens.findIndex(s => s.kind === 'wild');
      for (const st of screens[si].steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
      for (let i = -1; i < screens[si].steps.length; i++) {
        expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it('replaces the classic Wildcard screen', () => {
    expect(REPLACED.test('bb-wildcard')).toBe(true);
  });
});
