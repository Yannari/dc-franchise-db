import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, runBBFinale } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['A1','B2','C3','D4','E5','F6','G7','H8','I9','J10','K11','L12','M13','N14','O15','P16','Q17'];
const ARCH = ['mastermind','social-butterfly','hero','showmancer','schemer','floater','villain','loyal-soldier','underdog','goat','hothead','wildcard','floater','hero','schemer','villain','mastermind'];
const CAST = NAMES.map((name,i)=>({ name, gender:i%2?'m':'f', sexuality:'straight', archetype:ARCH[i] }));

describe('finale probe 2', () => {
  it('theme at the finale', () => {
    seedGame(CAST, { episode:0, eliminated:[], namedAlliances:[] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
      ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format:'big-brother', finaleSize:3, jurySize:9,
      bbHaveNots:'off', bbSafetyMode:'off', theme:'summer-of-temptation' });
    seasonConfig.twistSchedule = []; seasonConfig.themeArcStamped = '';
    withSeededRandom(99, () => {
      let n=0; while ((gs.activePlayers||[]).length>3 && n<20) { if(!simulateBBEpisode()) break; n++; }
      runBBFinale();
    });
    const eps = gs.episodeHistory;
    const fin = eps[eps.length-1];
    const beats = (fin.acts||[]).filter(a=>a.type==='theme-beat');
    fs.writeFileSync('finale2.txt', JSON.stringify({
      booked: gs.bb.theme?.booked,
      scheduleWeeks: (seasonConfig.twistSchedule||[]).map(t=>`W${t.episode} ${t.type.replace('bb-','')}`),
      totalWeeks: eps.length - 1,
      finaleThemeMood: fin.themeMood,
      finaleBeats: beats.map(b => `${b.hook} [${b.mood}] ${b.line}`),
    }, null, 2));
    expect(true).toBe(true);
  });
});
