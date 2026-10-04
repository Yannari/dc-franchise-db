// The Coin of Destiny as a stepped set (Phase 7): Big Brother explains it first, every buyer
// the engine took money from is seen buying in (a fifth buyer used to win unseen), the coin goes
// to the engine's winner, the call and the rewritten block are the engine's, and the classic
// screen is gone.
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

function coinWeeks() {
  const out = [];
  for (const seed of [4242, 77, 31337, 9001, 5]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [2, 3].map(e => ({ episode: e, type: 'bb-coin-of-destiny' }));
    for (let w = 0; w < 3; w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'coin-of-destiny');
      if (act) out.push({ ep: JSON.parse(JSON.stringify(ep)), act });
    }
  }
  return out;
}
const WEEKS = coinWeeks();
const screenOf = ep => bbWeekSteps(ep).find(s => s.kind === 'coin');

describe('the Coin of Destiny on the stepped stage', () => {
  it('plays in real seasons, called both ways', () => {
    expect(WEEKS.length).toBeGreaterThan(4);
    expect(WEEKS.some(w => w.act.calledRight)).toBe(true);
    expect(WEEKS.some(w => w.act.winner && !w.act.calledRight)).toBe(true);
  });

  it('explains it first and shows every buyer the engine took money from', () => {
    for (const { ep, act } of WEEKS) {
      const S = screenOf(ep);
      expect(S.steps.slice(0, 4).map(st => st.rule)).toEqual([1, 2, 3, 4]);
      expect(new Set(S.steps.filter(st => st.coinIn).map(st => st.coinIn))).toEqual(new Set(act.buyers));
    }
  });

  it('gives the coin to the engine’s winner and makes the engine’s call', () => {
    for (const { ep, act } of WEEKS) {
      const S = screenOf(ep);
      expect(S.steps.find(st => st.coinWin)?.coinWin || null).toBe(act.winner);
      const call = S.steps.find(st => st.coinCall)?.coinCall || null;
      expect(call).toBe(!act.winner ? null : act.calledRight ? (act.nominees.length ? 'right' : null) : 'wrong');
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const { ep } of WEEKS) {
      const screens = bbWeekSteps(ep);
      const si = screens.findIndex(s => s.kind === 'coin');
      for (const st of screens[si].steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
      for (let i = -1; i < screens[si].steps.length; i++) {
        expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it('replaces the classic Coin screen', () => {
    expect(REPLACED.test('bb-coin')).toBe(true);
  });
});
