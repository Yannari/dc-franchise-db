// Battle Back as a stepped set (Phase 7): Big Brother explains the shape (ladder or showdown)
// first, every duel and elimination is the engine's, the returnee is the engine's, a returnee
// never names who voted them out (votes are secret), and the classic screen is gone.
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

function bkWeeks() {
  const out = [];
  for (const style of ['gauntlet', 'showdown']) {
    for (const seed of [4242, 77, 31337]) {
      seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
      Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
      Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
      seasonConfig.twistSchedule = [{ episode: 4, type: 'bb-battle-back', bbStyle: style }];
      for (let w = 0; w < 4; w++) {
        const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
        const act = (ep.acts || []).find(a => a.type === 'battle-back');
        if (act) out.push({ ep: JSON.parse(JSON.stringify(ep)), act });
      }
    }
  }
  return out;
}
const WEEKS = bkWeeks();
const screenOf = ep => bbWeekSteps(ep).find(s => s.kind === 'battleback');

describe('Battle Back on the stepped stage', () => {
  it('plays in real seasons', () => {
    expect(WEEKS.some(w => w.act.style === 'gauntlet')).toBe(true);
    expect(WEEKS.some(w => w.act.style === 'showdown')).toBe(true);
  });

  it('explains the shape first, and plays the engine’s duels, exits and returnee', () => {
    for (const { ep, act } of WEEKS) {
      const S = screenOf(ep);
      expect(S.steps.slice(0, 4).map(st => st.rule)).toEqual([1, 2, 3, 4]);
      expect(S.battleback.field).toEqual(act.contenders);
      expect(S.steps.filter(st => st.bkOut).map(st => st.bkOut).sort()).toEqual([...act.eliminatedForGood].sort());
      expect(S.steps.find(st => st.bkBack)?.bkBack || null).toBe(act.returned || null);
    }
  });

  it('never has the returnee name a voter', () => {
    for (const { act } of WEEKS) {
      const back = act.beats.find(b => b.part === 'back');
      for (const l of back?.lines || []) for (const v of act.grudges || []) expect(l.text).not.toContain(v);
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const { ep } of WEEKS) {
      const screens = bbWeekSteps(ep);
      const si = screens.findIndex(s => s.kind === 'battleback');
      for (const st of screens[si].steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
      for (let i = -1; i < screens[si].steps.length; i++) {
        expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it('replaces the classic Battle Back screen', () => {
    expect(REPLACED.test('bb-battleback')).toBe(true);
  });
});
