import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { describe, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie','Chase','Ripper','Scary','Nichelle','Axel','Zee','Brightly','Hicks',
  'Emmah','Millie','Caleb','Wayne','Raj','Julia','Priya','MK','Damien'];
const CAST = NAMES.map((n, i) => ({ name: n, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind','hero','floater','villain','schemer','goat','hothead'][i % 7] }));

describe('alliance formation timing', () => {
  it('measures', () => {
    let seasons = 0, formed = 0, weeks = 0, maxLive = 0;
    const byPhase = {};
    for (let s = 0; s < 6; s++) {
      seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
      Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, ordinal, getBond, getPerceivedBond, romanticCompat });
      Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 9, twistSchedule: [],
        bbSafetyMode: 'off', bbHaveNots: 'twist', bbDepartures: 'off', romance: 'enabled', setting: 'bb-house' });
      gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
      gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
      seasons++;
      let g = 0;
      while (!houseIsAtFinale() && g++ < 30) { if (!simulateBBEpisode()) break; }
      for (const w of gs.bb.weeks || []) {
        weeks++;
        for (const act of w.acts || []) {
          if (act.type !== 'house') continue;
          for (const b of act.socialBeats || []) {
            if (b.eventId === 'alliance-formed') {
              formed++;
              byPhase[act.phase] = (byPhase[act.phase] || 0) + 1;
            }
          }
        }
        maxLive = Math.max(maxLive, (gs.namedAlliances || []).filter(a => a.active !== false).length);
      }
    }
    require('node:fs').writeFileSync(process.cwd() + '/ally.txt', [
      `seasons=${seasons} weeks=${weeks}`,
      `alliances formed on screen: ${formed} (${(formed / weeks).toFixed(2)} per week)`,
      `which stretch they formed in: ${JSON.stringify(byPhase)}`,
      `most alliances live at once: ${maxLive}`,
    ].join('\n'));
  });
});
