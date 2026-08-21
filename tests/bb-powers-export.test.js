import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { extractBigBrotherSeasonTemplate } from '../js/stats-export.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';
const R=JSON.parse(readFileSync(resolve(process.cwd(),'franchise_roster.json'),'utf8'));
const POOL=(Array.isArray(R)?R:R.players||Object.values(R)[0]).filter(p=>p?.stats&&p.name);
const CAST=Array.from({length:12},(_,i)=>POOL[(i*11+3)%POOL.length]).map(p=>({name:p.name,
  archetype:p.archetype||'floater',gender:p.gender||'m',sexuality:p.sexuality||'straight',stats:{...p.stats}}));
// The rankings board has four columns for what a houseguest did with a power,
// and every one of them filled with zero on every Big Brother season: nothing
// in any export wrote the powers down, though gs.bb.powers had known who held
// what and who spent it all along.
describe('what a houseguest did with a power reaches the export', () => { it('is counted, and the four states are exhaustive', () => {
  seedGame(CAST,{episode:0,eliminated:[],namedAlliances:[]});
  Object.assign(globalThis,{gs,players,seasonConfig,relationships,pStats,pronouns,ordinal,
    getBond,getPerceivedBond,bKey,bondLabel,romanticCompat});
  Object.assign(seasonConfig,{format:'big-brother',finaleSize:3,jurySize:5,popularityEnabled:true});
  seasonConfig.twistSchedule=[{episode:2,type:'bb-hidden-power'},{episode:4,type:'bb-den-of-temptation'},
    {episode:6,type:'bb-secret-power-comp'}];
  gs.riPlayers=gs.riPlayers||[]; gs.tribes=gs.tribes||[];
  withSeededRandom(777,()=>{ for(let w=0;w<8&&gs.phase!=='complete';w++) simulateBBEpisode(); });
  expect((gs.bb?.powers||[]).length, 'no powers were handed out to check').toBeGreaterThan(0);
  const weeks=gs.bb?.weeks||[];
  const tmpl=extractBigBrotherSeasonTemplate(weeks,[...gs.activePlayers].slice(0,3),{seasonNumber:1,jurySize:5});
  const withPow=tmpl.placements.filter(p=>(p.bb?.powersWon||0)>0);
  expect(withPow.length, 'the export dropped every power').toBeGreaterThan(0);
  // won = played + wasted + held, on everybody. A fifth state would mean a
  // power that is somehow none of those, and a column that never adds up.
  tmpl.placements.forEach(p=>{
    const b=p.bb;
    expect(b.powersWon, `${p.name}: power states do not add up`)
      .toBe(b.powersPlayed+b.powersWasted+b.powersHeld);
  });
}, 900000); });
