// No Eviction and Dead Last as stepped sets (Phase 7): Big Brother explains each rule first,
// Dead Last nominates the engine's last place, and the classic screens are gone.
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

function weeksOf(type) {
  const out = [];
  for (const seed of [4242, 77, 31337]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [{ episode: 2, type }];
    for (let w = 0; w < 2; w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      if ((ep.acts || []).some(a => a.type === 'no-eviction' || a.type === 'dead-last')) out.push(JSON.parse(JSON.stringify(ep)));
    }
  }
  return out;
}
const NOEV = weeksOf('bb-no-eviction');
const LAST = weeksOf('bb-dead-last-nominee');

describe('No Eviction and Dead Last on the stepped stage', () => {
  it('plays both in real seasons', () => {
    expect(NOEV.length).toBeGreaterThan(1);
    expect(LAST.length).toBeGreaterThan(1);
  });

  it('explains each rule first', () => {
    for (const ep of [...NOEV, ...LAST]) {
      const S = bbWeekSteps(ep).find(s => s.kind === 'quiet');
      expect(S.steps.slice(0, 2).map(st => st.rule)).toEqual([1, 2]);
    }
  });

  it('nominates the engine’s last place', () => {
    for (const ep of LAST) {
      const act = ep.acts.find(a => a.type === 'dead-last');
      const S = bbWeekSteps(ep).find(s => s.kind === 'quiet');
      expect(S.steps[2].t).toContain(`${act.nominee}, you finished last`);
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const ep of [...NOEV, ...LAST]) {
      const screens = bbWeekSteps(ep);
      const si = screens.findIndex(s => s.kind === 'quiet');
      for (const st of screens[si].steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
      for (let i = -1; i < screens[si].steps.length; i++) {
        expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it('replaces the classic screens', () => {
    expect(REPLACED.test('bb-no-eviction')).toBe(true);
    expect(REPLACED.test('bb-deadlast')).toBe(true);
  });
});
