// The Safety Suite as a stepped set (Phase 7, mockup/mockup-bb-twist-safety-suite.html):
// the act airs as four screens that explain the twist, spend the passes, run the clock and
// hand over the Plus One, every word comes from the act's own script, and the classic board
// it replaces is gone from the week.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps, REPLACED, bbStepTranscript } from '../js/vp-bb-ep/steps.js';
import { stageHtml } from '../js/vp-bb-ep/stage.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] }));

function suiteWeeks() {
  const weeks = [];
  for (let seed = 1; seed <= 4; seed++) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [1, 2, 3].map(e => ({ episode: e, type: 'bb-safety-suite' }));
    for (let w = 0; w < 3; w++) {
      const ep = withSeededRandom(seed * 29 + w * 7 + 5, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'safety-suite');
      if (act) weeks.push({ ep: JSON.parse(JSON.stringify(ep)), act });
    }
  }
  return weeks;
}
const WEEKS = suiteWeeks();

describe('the Safety Suite on the stepped stage', () => {
  it('plays in real seasons, with a winner and a Plus One at least once', () => {
    expect(WEEKS.length).toBeGreaterThan(3);
    expect(WEEKS.some(w => w.act.winner && w.act.plusOne)).toBe(true);
  });

  it('opens by explaining the twist, one rule per line', () => {
    for (const { ep } of WEEKS) {
      const open = bbWeekSteps(ep).find(s => s.kind === 'suite');
      const rules = open.steps.filter(st => st.rule != null);
      expect(rules.map(st => st.rule)).toEqual([0, 1, 2, 3, 4]);
      expect(rules.every(st => st.k === 'bb')).toBe(true);
    }
  });

  it('airs the swipe, the clock and the Plus One the act decided', () => {
    for (const { ep, act } of WEEKS) {
      const screens = bbWeekSteps(ep).filter(s => s.kind === 'suite');
      const steps = screens.flatMap(s => s.steps);
      const swiped = steps.flatMap(st => st.swipe || []);
      expect(swiped.sort()).toEqual([...act.entrants].sort());
      if (!act.entrants.length) { expect(screens).toHaveLength(2); continue; }
      const runs = steps.filter(st => st.run);
      expect(runs.filter(st => st.run[2] === 'ok').map(st => st.run[0])).toEqual(act.winner ? [act.winner] : []);
      // a run that beat the clock but lost is not drawn as one that missed it
      for (const st of runs) {
        const r = act.runs.find(x => x.name === st.run[0]);
        if (st.run[2] === 'short') expect(r.score).toBeLessThan(act.clock);
        if (st.run[2] === 'slow') expect(r.score).toBeGreaterThanOrEqual(act.clock);
        expect(st.run[1] >= 80).toBe(st.run[2] !== 'short');
      }
      if (act.plusOne) {
        expect(steps.find(st => st.plus)?.plus).toBe(act.plusOne);
        expect(steps.find(st => st.bill)?.bill).toBeTruthy();
      }
    }
  });

  it('speaks only the act\'s own script, with no holes in a line', () => {
    for (const { ep } of WEEKS) {
      for (const S of bbWeekSteps(ep).filter(s => s.kind === 'suite')) {
        for (const st of S.steps) {
          expect(st.t).toBeTruthy();
          expect(st.t).not.toMatch(/undefined|null|\{|\}/);
        }
      }
      expect(bbStepTranscript(ep)).toMatch(/SAFETY SUITE/);
    }
  });

  it('replaces the classic Safety Suite board', () => {
    expect(REPLACED.test('bb-safetysuite')).toBe(true);
    expect(REPLACED.test('bb-safetysuite-2')).toBe(true);
  });

  it('paints every step without throwing, and the rail spends the right passes', () => {
    for (const { ep, act } of WEEKS) {
      const screens = bbWeekSteps(ep);
      screens.forEach((S, si) => {
        if (S.kind !== 'suite') return;
        for (let i = -1; i < S.steps.length; i++) {
          const out = stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' });
          expect(out.html).not.toMatch(/undefined|NaN/);
        }
      });
      const last = screens.findLastIndex(s => s.kind === 'suite');
      const end = stageHtml(screens, last, screens[last].steps.length - 1, false, { season: 'default', host: 'Valeria' }).ledger;
      for (const n of act.entrants) expect(end.spent).toContain(n);
    }
  });
});
