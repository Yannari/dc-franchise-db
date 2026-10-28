// Twist family 1 (docs/superpowers/specs/2026-10-28-secret-story-hidden-spaces-design.md): the hidden groups and
// every kind of fake elimination, played through real weeks. The bug class they guard: a player in the game and
// not in the house (off the house list, never on the eliminated list, back in by a prime), and a screen that
// prints what the engine never decided.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater'][i % 6] }));
const play = (over, weeks, after1 = null, seed = 3) => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined, ssSignature: undefined, ssSecretRoom: undefined, ...over });
  withSeededRandom(seed, () => { simulateBBEpisode(); if (after1) after1(); for (let n = 1; n < weeks; n++) simulateBBEpisode(); });
  return gs.episodeHistory;
};
const BAD = /\bundefined\b|\bNaN\b|\[object/;
const screensClean = rows => rows.flatMap(r => bbWeekSteps(r, { host: 'Josh' })).flatMap(s => (s.steps || []).map(st => String(st.t || ''))).filter(t => BAD.test(t));

describe('the hidden groups', () => {
  for (const sig of ['secret-box', 'intruders', 'crystal-house', 'hotel', 'yacht']) {
    it(`${sig}: out of the house until a prime brings them in, never eliminated while hidden, all in by the end`, () => {
      const rows = play({ ssSignature: sig, ssSecretRoom: 'off' }, 4);
      const g = gs.bb.secretStory.group;
      expect(g?.members?.length).toBeGreaterThanOrEqual(2);
      for (const r of rows) {
        const inAt = new Set(g.log.filter(l => l.week < r.num).flatMap(l => l.entering));
        for (const m of g.members) if (!inAt.has(m)) expect(r.houseAtStart, `${m} in the house in week ${r.num}`).not.toContain(m);
      }
      for (const m of g.members) expect(g.out).toContain(m);
      // the group's own business puts at most one up a week
      expect(Object.values(g.nominated || {}).length).toBeLessThanOrEqual(g.log.length + 1);
      expect(screensClean(rows)).toEqual([]);
    });
  }
});

describe('the fake eliminations', () => {
  for (const [kind, role] of [['verdict', 'watch'], ['double', 'master'], ['voluntary', 'remote'], ['power', 'remote']]) {
    it(`${kind} (${role}): up the stairs, off the house list, back in, and nobody hidden is eliminated`, () => {
      const rows = play({ ssSignature: 'none', ssSecretRoom: 'once' }, 5, () => { gs.bb.secretStory.plan.fakes = [{ week: 2, kind, weeks: 2, role }]; }, 7);
      const hid = gs.bb.secretStory.hidden || [];
      expect(hid.length).toBeGreaterThanOrEqual(1);
      expect(hid.every(h => h.kind === kind)).toBe(true);
      for (const h of hid) {
        expect(rows.filter(r => r.num <= h.back).map(r => r.eliminated), `${h.name} eliminated while hidden`).not.toContain(h.name);
        expect(h.back).toBe(4);
        expect(rows.find(r => r.num === 3).houseAtStart).not.toContain(h.name);
        expect(rows.find(r => r.num === 5).houseAtStart).toContain(h.name);
      }
      if (kind === 'double') expect(hid.length).toBe(2);
      if (role === 'remote') expect(hid[0].accomplice).toBeTruthy();
      expect(screensClean(rows)).toEqual([]);
    });
  }
});
