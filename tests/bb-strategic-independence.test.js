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

function corr(a,b){const n=a.length,ma=a.reduce((x,y)=>x+y,0)/n,mb=b.reduce((x,y)=>x+y,0)/n;
  const c=a.map((v,i)=>(v-ma)*(b[i]-mb)).reduce((x,y)=>x+y,0);
  const d=Math.sqrt(a.map(v=>(v-ma)**2).reduce((x,y)=>x+y,0)*b.map(v=>(v-mb)**2).reduce((x,y)=>x+y,0));
  return d?c/d:0;}

function runSeason(seed,size){
  const CAST=Array.from({length:size},(_,i)=>POOL[(i*7+seed)%POOL.length]).map(p=>({name:p.name,
    archetype:p.archetype||'floater',gender:p.gender||'m',sexuality:p.sexuality||'straight',stats:{...p.stats}}));
  seedGame(CAST,{episode:0,eliminated:[],namedAlliances:[]});
  Object.assign(globalThis,{gs,players,seasonConfig,relationships,pStats,pronouns,ordinal,
    getBond,getPerceivedBond,bKey,bondLabel,romanticCompat});
  Object.assign(seasonConfig,{format:'big-brother',finaleSize:3,jurySize:5,popularityEnabled:true});
  gs.riPlayers=gs.riPlayers||[]; gs.tribes=gs.tribes||[];
  withSeededRandom(seed,()=>{ for(let w=0;w<14&&gs.phase!=='complete';w++) simulateBBEpisode(); });
  const tmpl=extractBigBrotherSeasonTemplate(gs.bb?.weeks||[],[...gs.activePlayers].slice(0,3),
    {seasonNumber:1,jurySize:5});
  return tmpl.placements;
}

// A ranking term is only worth weight if it is INDEPENDENT OF FINISH POSITION.
// The AI's `strategicRank` failed this at -0.927 -- asked to judge strategy it
// re-derived the order people went out in, which is placement measured a third
// time. Every cumulative measure fails it the same way, because totals grow
// with weeks survived: correct-vote COUNT sits at -0.827, the same thing as a
// RATE at -0.186. This is the test that keeps the rebuilt figure honest.
describe('the strategic score describes play, not survival', () => {
  it('does not simply restate finish position', () => {
    const rs=[];
    for (const [seed,size] of [[101,12],[202,12],[303,14],[404,13],[505,12],[606,14]]) {
      const ps=runSeason(seed,size);
      const scored=ps.filter(p=>typeof p.strategicScore==='number');
      expect(scored.length,'no strategic scores to test').toBeGreaterThan(6);
      const r=corr(scored.map(p=>p.strategicScore),scored.map(p=>p.placement));
      rs.push(r);
      // Not zero -- strategy and lasting are genuinely related, and a term with
      // NO relationship to finishing well would be measuring noise. The bar is
      // that it must not be a restatement.
      expect(Math.abs(r),`season ${seed}: strategic score tracks placement at ${r.toFixed(3)}`)
        .toBeLessThan(0.75);
    }
    const mean=rs.reduce((a,b)=>a+b,0)/rs.length;
    expect(Math.abs(mean),`mean correlation across seasons ${mean.toFixed(3)}`).toBeLessThan(0.6);
    console.log('  strategic score vs placement:',rs.map(r=>r.toFixed(3)).join(', '),
      '| mean',mean.toFixed(3));
  },900000);
});
