// The second veto as a stepped set (Phase 7): Big Brother explains it first; a used medallion
// takes down the engine's nominee and seats the engine's replacement, named by whoever the rule
// says names it (the HOH unless the medallion carries the holder's authority; the old line said
// the HOH chose neither name); a holder who saves themselves owes nobody; an anonymous holder never
// speaks out loud; the classic screen is gone.
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

function v2Weeks() {
  const out = [];
  for (const type of ['bb-double-veto', 'bb-app-store']) {
    for (const seed of [4242, 77, 31337, 9001]) {
      seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
      Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
      Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
      seasonConfig.twistSchedule = [2, 3, 4].map(e => ({ episode: e, type }));
      for (let w = 0; w < 6; w++) {
        const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
        const act = (ep.acts || []).find(a => a.type === 'second-veto');
        if (act) out.push({ ep: JSON.parse(JSON.stringify(ep)), act });
      }
    }
  }
  return out;
}
const WEEKS = v2Weeks();
const screenOf = ep => bbWeekSteps(ep).find(s => s.kind === 'veto2');

describe('the second veto on the stepped stage', () => {
  it('plays in real seasons', () => {
    expect(WEEKS.length).toBeGreaterThan(4);
    expect(WEEKS.some(w => w.act.used)).toBe(true);
  });

  it('explains it first, then takes down and seats exactly who the engine did', () => {
    for (const { ep, act } of WEEKS) {
      const S = screenOf(ep);
      expect(S.steps.slice(0, 3).map(st => st.rule)).toEqual([1, 2, 3]);
      expect(S.steps.find(st => st.v2Save)?.v2Save || null).toBe(act.used ? act.saved : null);
      expect(S.steps.find(st => st.v2Rep)?.v2Rep || null).toBe(act.used ? act.replacement : null);
    }
  });

  it('names the replacement by whoever the rule gives the chair to', () => {
    for (const { ep, act } of WEEKS.filter(w => w.act.used)) {
      const chair = act.beats.find(b => b.part === 'chair');
      expect(chair.byHoh).toBe(act.authority !== act.holder);
      expect(screenOf(ep).steps.find(st => st.v2Rep).t).toContain(`${act.authority} names ${act.replacement}`);
    }
  });

  it('owes nobody a thank-you when the holder saved themselves, and keeps an anonymous holder quiet', () => {
    for (const { act } of WEEKS.filter(w => w.act.used)) {
      if (act.saved === act.holder) expect(act.beats.some(b => b.part === 'cost')).toBe(false);
      if (act.anonymous) for (const b of act.beats) for (const l of b.lines || []) if (l.by === act.holder) expect(l.kind).toBe('dr');
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const { ep } of WEEKS) {
      const screens = bbWeekSteps(ep);
      const si = screens.findIndex(s => s.kind === 'veto2');
      for (const st of screens[si].steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
      for (let i = -1; i < screens[si].steps.length; i++) {
        expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it('replaces the classic second-veto screens', () => {
    for (const k of ['double', 'secret', 'found', 'x']) expect(REPLACED.test(`bb-secondveto-${k}`)).toBe(true);
  });
});
