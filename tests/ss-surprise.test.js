// Surprise twists on/off (the user, 2026-10-29: "i got a house split ep2 when theres nothing scheduled", "yes add an
// on/off"). Off: only the timeline's cards happen.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, runBBFinale } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi', 'Gus', 'Hal', 'Ivy', 'Jo', 'Kai', 'Lu', 'Mo', 'Ned'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater'][i % 6] }));
function play(seed, extra) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined,
    ssHouseTheme: 'random', ssSignature: undefined, ssSecretRoom: undefined, ...extra });
  try { withSeededRandom(seed, () => { let n = 0; while ((gs.activePlayers || []).length > 3 && n < 20) { if (!simulateBBEpisode()) break; n++; } runBBFinale(); }); }
  finally { delete seasonConfig.ssSurprise; }
  return gs.episodeHistory.filter(e => e?.format === 'big-brother').flatMap(e => (e.acts || []).map(a => ({ ...a, wk: e.num })));
}

describe('surprise twists off', () => {
  it('plays no twist the timeline did not ask for', () => {
    for (const seed of [1, 2, 3, 4]) {
      const acts = play(seed, { ssSurprise: 'off' });
      expect(acts.filter(a => a.type === 'ss-split'), `seed ${seed}`).toEqual([]);
      expect(acts.filter(a => a.type === 'ss-deception'), `seed ${seed}`).toEqual([]);
      expect(acts.filter(a => a.type === 'ss-week-twist'), `seed ${seed}`).toEqual([]);
      expect(acts.filter(a => a.type === 'ss-house-event' && a.kind === 'clans'), `seed ${seed}`).toEqual([]);
      expect(acts.filter(a => a.type === 'ss-after' && a.fake), `seed ${seed}`).toEqual([]);
      expect(gs.bb.secretStory.houseTheme, `seed ${seed}`).not.toBe('arena');
    }
  });
  it('still plays what the timeline asks for', () => {
    const acts = play(2, { ssSurprise: 'off', twistSchedule: [{ episode: 3, type: 'ss-clans' }] });
    expect(acts.some(a => a.type === 'ss-split' && a.wk === 3)).toBe(true);
  });
  it('on (the default) still has the engine\'s own twists', () => {
    const all = [1, 2, 3, 4, 5, 6].flatMap(s => play(s, {}));
    expect(all.some(a => ['ss-split', 'ss-deception', 'ss-week-twist'].includes(a.type))).toBe(true);
  });
});
