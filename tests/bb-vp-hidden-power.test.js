// The Hidden Power as a stepped set (Phase 7): Big Brother explains it, the viewer is shown
// where it really is, every search lands on the map at the spot the engine chose, the find
// lights the true spot, an unfound power is revealed when it expires, and the classic boards
// are gone.
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

function huntWeeks() {
  const weeks = [];
  for (const seed of [4242, 77, 31337, 99, 2024, 5]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [{ episode: 1, type: 'bb-hidden-power' }];
    for (let w = 0; w < 6; w++) {
      const ep = withSeededRandom(seed + w, () => simulateBBEpisode());
      const acts = (ep.acts || []).filter(a => a.type === 'hidden-power');
      if (acts.length) weeks.push({ ep: JSON.parse(JSON.stringify(ep)), acts });
    }
  }
  return weeks;
}
const WEEKS = huntWeeks();

describe('the Hidden Power on the stepped stage', () => {
  it('hides it, and the search runs', () => {
    expect(WEEKS.some(w => w.acts.some(a => a.phase === 'hidden'))).toBe(true);
    expect(WEEKS.some(w => w.acts.some(a => a.phase === 'search' || a.phase === 'found'))).toBe(true);
  });

  it('explains the twist and never gives away where it is', () => {
    for (const { ep, acts } of WEEKS) {
      const hid = acts.find(a => a.phase === 'hidden');
      if (!hid) continue;
      const S = bbWeekSteps(ep).find(s => s.kind === 'hunt');
      expect(S.steps.filter(st => st.rule != null).map(st => st.rule)).toEqual([1, 2, 3, 4]);
      // nobody, the viewer included, learns the spot before it is found
      expect(hid.place).toBeUndefined();
      expect(JSON.stringify(S)).not.toMatch(/cistern|lint trap|cereal|hammock|pillowcase|memory wall itself|have-not bed|Diary Room chair/);
    }
  });

  it('puts every search on the map where the engine looked, and the find where it was', () => {
    for (const { ep, acts } of WEEKS) {
      const search = acts.find(a => a.phase === 'search' || a.phase === 'found');
      if (!search) continue;
      const S = bbWeekSteps(ep).filter(s => s.kind === 'hunt').at(-1);
      const looks = S.steps.filter(st => st.look).map(st => st.look);
      const engine = search.beats.filter(b => b.part === 'search').map(b => [b.players[0], b.place]);
      expect(looks).toEqual(engine);
      if (search.found) expect(S.steps.find(st => st.found)?.found).toEqual([search.finder, search.place]);
    }
  });

  it('speaks with no holes in a line, and paints every step', () => {
    for (const { ep } of WEEKS) {
      const screens = bbWeekSteps(ep);
      screens.forEach((S, si) => {
        if (S.kind !== 'hunt') return;
        for (const st of S.steps) expect(st.t).not.toMatch(/undefined|null|\{|\}/);
        for (let i = -1; i < S.steps.length; i++) {
          expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
        }
      });
    }
  });

  it('replaces the classic Hidden Power boards', () => {
    for (const id of ['bb-hidden-hidden', 'bb-hidden-search', 'bb-hidden-found', 'bb-hidden-expired']) expect(REPLACED.test(id)).toBe(true);
  });
});
