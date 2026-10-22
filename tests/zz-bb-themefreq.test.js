// SCRATCH (delete by exact name): how often the theme-life events fire and air in each theme.
import { it } from 'vitest';
import { writeFileSync } from 'fs';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';
const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'hero', 'floater', 'villain'][i % 4] }));
it('counts', () => {
  const out = [];
  for (const theme of ['machine-summer', 'summer-of-temptation', 'summer-of-mystery', 'high-rollers', 'summer-camp', 'summer-school']) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off', theme, twistSchedule: [] });
    let fired = 0, aired = 0, weeks = 0;
    for (let w = 0; w < 8; w++) {
      const ep = withSeededRandom(5 + w * 7, () => simulateBBEpisode());
      if (!ep) break;
      weeks++;
      for (const a of ep.acts || []) {
        for (const b of a.socialBeats || []) if (/^theme-/.test(String(b.eventId || ''))) { fired++; if (b.aired) aired++; }
      }
    }
    out.push(`${theme}: fired ${fired}, aired ${aired}, in ${weeks} weeks`);
  }
  writeFileSync(process.env.OUT, out.join('\n'));
});
