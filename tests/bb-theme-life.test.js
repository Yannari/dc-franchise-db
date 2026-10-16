// A themed season reads like its theme (the user, 2026-10-15: "the pools dont change with the theme"): the house's
// own scenes now and then carry a line of the season (bb/story/theme-texture.js), each theme has its own scenes
// that move something (bb-events/theme-life.js), they air, and an unthemed season has none of it.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { THEME_TEXTURE } from '../js/bb/story/theme-texture.js';
import { THEME_LIFE_EVENTS } from '../js/bb-events/theme-life.js';
import { POOLS } from '../js/bb/script/lines/index.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'hero', 'floater', 'villain'][i % 4] }));

function season(theme, weeks = 8) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off', theme, twistSchedule: [] });
  const eps = [];
  for (let w = 0; w < weeks; w++) {
    const ep = withSeededRandom(5 + w * 7, () => simulateBBEpisode());
    if (!ep) break;
    eps.push(JSON.parse(JSON.stringify(ep)));
  }
  return eps;
}
const THEMES = ['machine-summer', 'summer-of-temptation', 'summer-of-mystery', 'high-rollers', 'summer-camp', 'summer-school'];
const PLAYED = Object.fromEntries([...THEMES, 'none'].map(t => [t, season(t)]));
const scenes = eps => eps.flatMap(ep => (ep.acts || []).flatMap(a => a.scenes || []));
const lines = eps => scenes(eps).flatMap(sc => sc.lines || []);

describe('a themed season, in the house', () => {
  it('airs each theme’s own scenes, about once a week, with every hole filled', () => {
    for (const t of THEMES) {
      const aired = scenes(PLAYED[t]).filter(sc => /^theme-/.test(String(sc.step || '')));
      expect(aired.length, t).toBeGreaterThanOrEqual(2);
      for (const sc of aired) for (const l of sc.lines || []) expect(String(l.text), `${t} ${sc.step}`).not.toMatch(/\{|\}|undefined/);
    }
  });

  it('puts a line of the season into the house’s own scenes, never the same line twice', () => {
    for (const t of THEMES) {
      const themed = lines(PLAYED[t]).filter(l => l.theme === t).map(l => l.text);
      expect(themed.length, t).toBeGreaterThanOrEqual(4);
      expect(new Set(themed).size, `${t} said a theme line twice`).toBe(themed.length);
    }
  });

  it('keeps the season before the turn and after it apart', () => {
    const T = THEME_TEXTURE['machine-summer'];
    const hostile = new Set([...T.room.hostile, ...Object.values(T.dr).flatMap(x => x.hostile)]);
    for (const ep of PLAYED['machine-summer']) {
      const turned = ep.themeMood === 'hostile' || (ep.acts || []).some(a => a.type === 'theme-turn');
      const said = (ep.acts || []).flatMap(a => a.scenes || []).flatMap(sc => sc.lines || []).filter(l => l.theme).map(l => l.text);
      if (!turned) for (const x of said) expect(hostile.has(x), `before the turn: ${x}`).toBe(false);
    }
  });

  it('leaves an unthemed season alone', () => {
    expect(lines(PLAYED.none).some(l => l.theme)).toBe(false);
    expect(scenes(PLAYED.none).some(sc => /^theme-/.test(String(sc.step || '')))).toBe(false);
  });

  it('has the words for every ending a theme scene can ask for', () => {
    for (const k of ['theme.cora.praise.neutral', 'theme.cora.praise.hostile', 'theme.cora.replay.scene', 'theme.den.seen.caught', 'theme.den.seen.shrug',
      'theme.hotel.door.neutral', 'theme.hotel.door.hostile', 'theme.floor.chips.neutral', 'theme.floor.chips.hostile',
      'theme.camp.activity.bonded', 'theme.camp.activity.bickered', 'theme.camp.silence.followed', 'theme.camp.silence.refused', 'theme.yearbook.caption.stung', 'theme.yearbook.caption.laughs']) {
      expect(POOLS[k]?.length, k).toBeGreaterThan(0);
    }
    expect(new Set(THEME_LIFE_EVENTS.map(e => e.id)).size).toBe(THEME_LIFE_EVENTS.length);
  });
});
