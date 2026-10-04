// The Chain of Safety as a stepped set (Phase 7): Big Brother explains it, the chain airs
// one link at a time in the order the engine chose, the leftovers and nominees match the
// act, both endings (Canada: the last three play for safety; Québec: the chain runs twice),
// every word comes from the act's script, and the classic board is gone.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps, REPLACED } from '../js/vp-bb-ep/steps.js';
import { stageHtml } from '../js/vp-bb-ep/stage.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] }));

function chainWeeks() {
  const weeks = [];
  for (const [style, start] of [['canada', 'safety-comp'], ['canada', 'hoh'], ['quebec', 'hoh'], ['quebec', 'safety-comp']]) {
    for (const seed of [4242, 77]) {
      seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
      Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
      Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
      seasonConfig.twistSchedule = [{ episode: 2, type: 'bb-chain-of-safety', chainStyle: style, chainStart: start }];
      for (let w = 0; w < 2; w++) {
        const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
        const act = (ep.acts || []).find(a => a.type === 'chain-of-safety');
        if (act) weeks.push({ ep: JSON.parse(JSON.stringify(ep)), act, style });
      }
    }
  }
  return weeks;
}
const WEEKS = chainWeeks();

describe('the Chain of Safety on the stepped stage', () => {
  it('plays both endings in real seasons', () => {
    expect(WEEKS.some(w => w.style === 'canada')).toBe(true);
    expect(WEEKS.some(w => w.style === 'quebec' && w.act.secondChain)).toBe(true);
  });

  it('opens by explaining the twist, one rule per line', () => {
    for (const { ep } of WEEKS) {
      const open = bbWeekSteps(ep).find(s => s.kind === 'chain');
      expect(open.steps.filter(st => st.rule != null).map(st => st.rule)).toEqual([1, 2, 3, 4]);
      expect(open.rules).toHaveLength(4);
    }
  });

  it('airs every link in the order the engine chose, and the right leftovers and nominees', () => {
    for (const { ep, act } of WEEKS) {
      const screens = bbWeekSteps(ep).filter(s => s.kind === 'chain');
      const run0 = screens.find(s => s.title === 'The chain');
      expect(run0.steps.filter(st => st.link).map(st => st.link[1])).toEqual(act.order.slice(1));
      if (act.secondChain) {
        const run1 = screens.find(s => s.title === 'The chain, again');
        expect(run1.steps.filter(st => st.link).map(st => st.link[1])).toEqual(act.secondChain.order.slice(1));
      }
      const noms = screens.flatMap(s => s.steps).filter(st => st.nom).at(-1)?.nom || [];
      expect([...noms].sort()).toEqual([...act.nominees].sort());
    }
  });

  it('speaks only the act\'s own script, with no holes in a line', () => {
    for (const { ep } of WEEKS) {
      for (const S of bbWeekSteps(ep).filter(s => s.kind === 'chain')) {
        for (const st of S.steps) {
          expect(st.t).toBeTruthy();
          expect(st.t).not.toMatch(/undefined|null|\{|\}/);
        }
      }
    }
  });

  it('writes the aftermath as scenes', () => {
    for (const { ep } of WEEKS) {
      const fall = (ep.acts || []).flatMap(a => a.socialBeats || []).filter(b => b.chainFallout);
      expect(fall.length).toBeGreaterThan(0);
      for (const b of fall) {
        expect(b.eventId).toMatch(/^chain-/);
        expect(Array.isArray(b.lines) && b.lines.length).toBeTruthy();
      }
    }
  });

  it('replaces the classic chain board', () => {
    expect(REPLACED.test('bb-chain')).toBe(true);
  });

  it('paints every step, and the bar ends with everybody safe in order', () => {
    for (const { ep, act } of WEEKS) {
      const screens = bbWeekSteps(ep);
      screens.forEach((S, si) => {
        if (S.kind !== 'chain') return;
        for (let i = -1; i < S.steps.length; i++) {
          const out = stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' });
          expect(out.html).not.toMatch(/undefined|NaN/);
        }
      });
      const si = screens.findIndex(s => s.kind === 'chain' && s.title === 'The chain');
      const end = stageHtml(screens, si, screens[si].steps.length - 1, false, { season: 'default', host: 'Valeria' }).ledger;
      expect(end.chain).toEqual(act.order);
    }
  });
});
