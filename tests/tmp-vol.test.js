import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { describe, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns, ordinal } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
const CAST = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N']
  .map((n,i)=>({name:n,gender:i%2?'m':'f',sexuality:'straight',archetype:['mastermind','hero','floater','villain','schemer','goat','hothead'][i%7]}));
describe('volume', () => { it('measures', () => {
  seedGame(CAST,{episode:0,eliminated:[],namedAlliances:[]});
  Object.assign(globalThis,{gs,players,seasonConfig,pStats,pronouns,ordinal,getBond,getPerceivedBond});
  Object.assign(seasonConfig,{format:'big-brother',finaleSize:3,jurySize:7,twistSchedule:[],
    bbSafetyMode:'off',bbHaveNots:'every-week',bbDepartures:'off',romance:'enabled',setting:'bb-house'});
  gs.bb={outgoingHoh:null,weeks:[],stats:{},house:null}; gs.episodeHistory=[]; gs.showmances=[]; gs.romanticSparks=[];
  const out=[]; let total=0, dupText=0; const seenText=new Set(); const per={};
  for(let w=0;w<3;w++){
    const ep=simulateBBEpisode(); if(!ep) break;
    let wk=0;
    for(const act of ep.acts||[]){
      if(act.type!=='house') continue;
      const bs=act.socialBeats||[]; wk+=bs.length; total+=bs.length;
      const cats={}; bs.forEach(b=>{cats[b.category||'?']=(cats[b.category||'?']||0)+1;});
      bs.forEach(b=>{ if(seenText.has(b.text)) dupText++; seenText.add(b.text);
        (b.players||[]).forEach(n=>per[n]=(per[n]||0)+1); });
      out.push(`wk${w+1} ${act.phase.padEnd(10)} beats=${String(bs.length).padStart(2)} ${JSON.stringify(cats)}`);
    }
    out.push(`   -> week ${w+1} total: ${wk}`);
  }
  const spread=Object.entries(per).sort((a,b)=>b[1]-a[1]);
  out.push('');
  out.push(`TOTAL beats=${total}  repeated-text=${dupText} (${(dupText/total*100).toFixed(1)}%)`);
  out.push('appearances: '+spread.map(([n,c])=>`${n}:${c}`).join(' '));
  require('node:fs').writeFileSync(process.cwd()+'/vol.txt', out.join('\n'));
});});
