// SCRATCH (delete by exact name): which pools a themed season airs most (for writing theme lines into them).
import { it } from 'vitest';
import { writeFileSync } from 'fs';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { STORY_POOLS } from '../js/bb/story/lines/index.js';
import { POOLS } from '../js/bb/script/lines/index.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = seed => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'perceptive-player', 'chaos-agent'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i], stats: spread(i + 1) }));

it('counts', () => {
  const keyOf = {};
  for (const [k, pool] of Object.entries(STORY_POOLS)) for (const e of pool) keyOf[e.id] = k;
  for (const [k, pool] of Object.entries(POOLS)) for (const e of pool) keyOf[e.id] ||= k;
  const count = {};
  for (const seed of [11, 23]) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'enabled', theme: process.env.THEME || 'machine-summer', twistSchedule: [] });
    for (let w = 0; w < 8; w++) {
      const ep = withSeededRandom(seed * 13 + w * 3, () => simulateBBEpisode());
      if (!ep) break;
      for (const a of ep.acts || []) {
        for (const sc of a.scenes || []) { const id = String(sc.lineId || '').replace(/^st:st:/, 'st:'); const k = keyOf[id] || keyOf[`st:${id}`] || `?${String(sc.step)}`; count[k] = (count[k] || 0) + 1; }
        for (const b of a.socialBeats || []) if (b.lineId) { const k = keyOf[b.lineId] || '?beat'; count[k] = (count[k] || 0) + 1; }
      }
    }
  }
  writeFileSync(process.env.OUT, Object.entries(count).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n}\t${k}`).join('\n'));
});
