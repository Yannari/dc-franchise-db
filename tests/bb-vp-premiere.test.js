// Premiere night as a stepped set (Phase 7): Big Brother explains the two hunts first, the
// screen says how the groups formed, each hunt shows the engine's team and ends on the
// engine's finder, a searcher is heard on their first warm lead only (three a hunt at most),
// and the classic screen is gone.
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

function pmNights() {
  const out = [];
  for (const seed of [4242, 77, 31337, 9001]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [{ episode: 1, type: 'bb-premiere-mystery' }];
    const ep = withSeededRandom(seed, () => simulateBBEpisode());
    const act = (ep.acts || []).find(a => a.type === 'premiere-mystery');
    if (act) out.push({ ep: JSON.parse(JSON.stringify(ep)), act });
  }
  return out;
}
const NIGHTS = pmNights();
const screenOf = ep => bbWeekSteps(ep).find(s => s.kind === 'premiere');

describe('premiere night on the stepped stage', () => {
  it('plays on night one', () => {
    expect(NIGHTS.length).toBeGreaterThan(2);
  });

  it('explains it first, says how the groups formed, and ends each hunt on the engine’s finder', () => {
    for (const { ep, act } of NIGHTS) {
      const S = screenOf(ep);
      expect(S.steps.slice(0, 4).map(st => st.rule)).toEqual([1, 2, 3, 4]);
      expect(S.steps[4].t).toBe(act.splitRule);
      expect(S.steps.filter(st => st.pmFound).map(st => st.pmFound)).toEqual(act.hunts.map(h => [h.target, h.found]));
    }
  });

  it('hears a searcher on their first warm lead only, three a hunt at most', () => {
    for (const { act } of NIGHTS) {
      for (const h of act.hunts) {
        const voiced = h.rounds.filter(r => r.outcome === 'warm' && r.lines);
        expect(voiced.length).toBeLessThanOrEqual(3);
        expect(new Set(voiced.map(r => r.who)).size).toBe(voiced.length);
      }
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const { ep } of NIGHTS) {
      const screens = bbWeekSteps(ep);
      const si = screens.findIndex(s => s.kind === 'premiere');
      for (const st of screens[si].steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
      for (let i = -1; i < screens[si].steps.length; i++) {
        expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it('replaces the classic Premiere Night screen', () => {
    expect(REPLACED.test('bb-premiere')).toBe(true);
  });
});
