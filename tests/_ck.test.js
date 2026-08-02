import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { rpBuildBBColdOpen, _tvState, getTribeRelationshipHighlights } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';
import fs from 'node:fs';
const NAMES=['Bowie','Chase','Ripper','Scary','Nichelle','Axel','Zee','Brightly','Hicks','Emmah','Millie','Caleb','Wayne','Raj'];
const CAST=NAMES.map((name,i)=>({name,gender:i%2?'m':'f',sexuality:'straight',archetype:['mastermind','hero','floater','villain','schemer','goat','hothead'][i%7]}));
describe('ck',()=>{it('emits',()=>{
  seedGame(CAST,{episode:0,eliminated:[],namedAlliances:[]});
  Object.assign(globalThis,{gs,players,seasonConfig,relationships,pStats,pronouns,ordinal,getBond,getPerceivedBond,bKey,bondLabel,romanticCompat,getTribeRelationshipHighlights});
  Object.assign(seasonConfig,{format:'big-brother',finaleSize:3,jurySize:7,twistSchedule:[],bbSafetyMode:'off',bbHaveNots:'every-week',bbDepartures:'off',romance:'enabled',setting:'bb-house'});
  gs.bb={outgoingHoh:null,weeks:[],stats:{},house:null};
  gs.episodeHistory=[];gs.showmances=[];gs.romanticSparks=[];gs.sideDeals=[];gs.knowledge={};
  const ep=simulateBBEpisode(); gs.episodeHistory=[ep];
  _tvState[`bb_co_${ep.num}`]={idx:6, look:6};
  const html=rpBuildBBColdOpen(ep);
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/claude/C--Users-yanna-OneDrive-Documents-GitHub-dc-franchise-db/cdfaefa4-3ac8-4ecc-9d77-51feecc577d1/scratchpad/ck.html',`<!doctype html><meta charset="utf-8">
  <body><div class="rp-main"><div id="root">${html}</div></div>
  <script>
    window.calls=[];
    window._tvState={'bb_co_1':{idx:6,look:6}};
    window.gs={episodeHistory:[{num:1}]};
    window.buildVPScreens=function(e){window.calls.push(['build',e&&e.num])};
    window.renderVPScreen=function(){window.calls.push(['render'])};
    window.onerror=function(m){window.calls.push(['ERROR',String(m)])};
  </script></body>`);
  expect(html).toContain('is-in');
});});
