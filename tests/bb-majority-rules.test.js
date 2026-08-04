// Majority Rules: the question, and the pacing of the questions.
//
// Two defects a played week found, both worth a permanent guard.
//
// 1. The screen drew "Wayne or Wayne", with both sides flagged as the majority.
//    The pair was being derived from the ANSWERS, and a unanimous round holds
//    exactly one distinct answer. The pair now travels with the answer record.
//
// 2. Three consecutive rounds eliminated nobody. With four houseguests left
//    only a 3-1 split sends anybody home — 4-0 and 2-2 both stall — so the
//    competition sat there. The host now asks the most contested pair it can
//    find, and two dead rounds in a row ends the questions and goes to the
//    tiebreaker, which is an ending the real rules already have.
import { beforeEach, describe, it, expect } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';
import { rpBuildBBComp, _tvState } from '../js/vp-screens.js';
const K=['physical','endurance','mental','social','strategic','loyalty','boldness','intuition','temperament'];
const sp=s=>Object.fromEntries(K.map((k,i)=>[k,1+((s*7+i*3)%10)]));
const N=['Bowie','Wayne','Emmah','Chase','Scary','Nichelle','Axel','Zee','Brightly','Hicks','Millie','Caleb'];
const CAST=N.map((name,i)=>({name,archetype:'floater',gender:i%2?'f':'m',sexuality:'straight',stats:sp(i+1)}));
const rng=s=>()=>((s=(s*1664525+1013904223)>>>0)/4294967296);
describe('majority rules pair + pacing',()=>{
  beforeEach(()=>{seedGame(CAST,{episode:0,eliminated:[],namedAlliances:[]});gs.bb={outgoingHoh:null,weeks:[],stats:{},house:null};gs.popularity={};seasonConfig.romance='off';
    N.forEach(n=>{gs.bb.stats[n]={hohWins:0,vetoWins:0,blockBusterWins:0,timesNominated:0,timesSaved:0,timesOnTheBlock:0};});
    Object.keys(_tvState).forEach(k=>delete _tvState[k]);});
  it('never asks A vs A, and rarely stalls',()=>{
    let dead=0, rounds=0, sameName=0, maxRunDead=0;
    for(let s=0;s<80;s++){
      const c=runBBCompetition({type:'hoh',participants:N.slice(0,8),house:N,library:BB_COMPETITIONS,forcedId:'bb-mental-quiz',rng:rng(s*53+7),week:{num:6,houseAtStart:N}});
      // engine: every recorded pair must be two different people
      for(const v of Object.values(c.debug.scoreBreakdown))
        for(const p of (v.picks||[])) if(p.pair && p.pair[0]===p.pair[1]) sameName++;
      // question text must name two different people
      let run=0;
      for(const b of c.beats){
        const m=/—\s*(.+?)\s+or\s+(.+?)\s*\?/.exec(b.text||'');
        if(m){rounds++; if(m[1].trim()===m[2].trim()) sameName++;}
        if(b.badgeText==='ALL SAFE'||b.badgeText==='DEAD EVEN'){dead++;run++;maxRunDead=Math.max(maxRunDead,run);} 
        else if(/^ROUND/.test(b.badgeText||'')) {/* new round */}
        else if(b.badgeText==='MINORITY') run=0;
      }
    }
    console.log(`rounds ${rounds} | dead rounds ${dead} (${(100*dead/rounds).toFixed(1)}%) | longest dead streak ${maxRunDead} | A-vs-A ${sameName}`);
    expect(sameName).toBe(0);
    expect(dead/rounds).toBeLessThan(0.35);
  });
  it('the screen draws two different people',()=>{
    for(const seed of [3,9,21]){
      const c=runBBCompetition({type:'hoh',participants:N.slice(0,8),house:N,library:BB_COMPETITIONS,forcedId:'bb-mental-quiz',rng:rng(seed),week:{num:6,houseAtStart:N}});
      const act={type:'hoh',winner:c.winner,results:c.placements.map(n=>({name:n,score:c.scores[n]})),competition:c};
      const ep={num:6,acts:[act]};
      rpBuildBBComp(ep,'hoh');
      Object.keys(_tvState).filter(k=>k.startsWith('bb_sig_')).forEach(k=>{_tvState[k].idx=999;});
      const html=rpBuildBBComp(ep,'hoh')||'';
      // Per round card: two different names, and at most one majority flag.
      const cards=html.split('<article class="mjr-card mjr-round').slice(1);
      expect(cards.length,`seed ${seed}: no question cards drawn`).toBeGreaterThan(0);
      for(const card of cards){
        const names=[...card.matchAll(/<figcaption>([^<]*)<\/figcaption>/g)].map(m=>m[1].trim());
        expect(names.length,`seed ${seed}: card had ${names.length} names`).toBe(2);
        expect(names[0],`seed ${seed}: drew the same person twice`).not.toBe(names[1]);
        expect((card.match(/mjr-nom-flag/g)||[]).length,`seed ${seed}: both sides flagged`).toBeLessThanOrEqual(1);
      }
    }
  });
});
