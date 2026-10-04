// Duo Week ("You Go, They Go") as stepped sets (Phase 7): Big Brother explains the pairs
// first, every pair the engine made is announced on the board, the week's scenes light the
// pairs they are about, the partner leaves on the votes the engine counted, a veto never
// leaves five on the block, and the classic screens are gone.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps, REPLACED } from '../js/vp-bb-ep/steps.js';
import { stageHtml } from '../js/vp-bb-ep/stage.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Ezekiel'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'floater'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] }));

function duoWeeks() {
  const weeks = [];
  for (const seed of [4242, 77, 31337, 9001]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [{ episode: 2, type: 'bb-duo-week' }];
    for (let w = 0; w < 2; w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      if ((ep.acts || []).some(a => a.type === 'duo-week-open')) weeks.push(JSON.parse(JSON.stringify(ep)));
    }
  }
  return weeks;
}
const WEEKS = duoWeeks();
const act = (ep, type) => ep.acts.find(a => a.type === type);

describe('Duo Week on the stepped stage', () => {
  it('plays in real seasons', () => {
    expect(WEEKS.length).toBeGreaterThan(2);
  });

  it('explains the rules first, then announces every pair the engine made', () => {
    for (const ep of WEEKS) {
      const S = bbWeekSteps(ep).find(s => /^bb-duo-open/.test(s.id));
      expect(S.steps.slice(0, 4).map(st => st.rule)).toEqual([1, 2, 3, 4]);
      expect(S.steps.filter(st => st.pair).map(st => st.pair)).toEqual(act(ep, 'duo-week-open').pairs);
      const solo = act(ep, 'duo-week-open').solo;
      if (solo) expect(S.steps.some(st => st.solo === solo)).toBe(true);
    }
  });

  it('never leaves more than two pairs on the block', () => {
    for (const ep of WEEKS) expect((ep.finalNominees || []).length).toBeLessThanOrEqual(4);
  });

  it('sends the partner out on the votes the engine counted', () => {
    for (const ep of WEEKS) {
      const ev = act(ep, 'duo-week-eviction');
      if (!ev) continue;
      const S = bbWeekSteps(ep).find(s => /^bb-duo-taken/.test(s.id));
      expect(S.steps[0].out).toBe(ev.taken);
      expect(S.steps.at(-1).exit).toBe(ev.taken);
      expect(S.steps[1].t).toMatch(ev.gotNothing ? /Not one/ : /voted to evict/);
    }
  });

  it('gives a pair off the block no plea to be kept', () => {
    for (const ep of WEEKS) {
      const ev = act(ep, 'duo-week-events');
      for (const b of ev?.beats || []) {
        if (b.kind === 'package' && b.free) expect(b.lines.map(l => l.say || l.dr || '').join(' ')).not.toMatch(/Keep both|Vote for one of us/);
      }
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const ep of WEEKS) {
      const screens = bbWeekSteps(ep);
      screens.forEach((S, si) => {
        if (S.kind !== 'duo') return;
        for (const st of S.steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
        for (let i = -1; i < S.steps.length; i++) {
          expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
        }
      });
    }
  });

  it('replaces the classic duo week screens', () => {
    for (const id of ['bb-duo-week-open', 'bb-duo-week-events', 'bb-duo-week-out']) expect(REPLACED.test(id)).toBe(true);
  });
});
