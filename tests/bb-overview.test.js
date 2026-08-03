// @vitest-environment jsdom
import { it, expect } from 'vitest';
import { gs, seasonConfig, players } from '../js/core.js';
import { pStats, pronouns, threatScore } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { ordinal } from '../js/finale.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { buildSeasonOverviewModel } from '../js/run-ui.js';
import { seedGame } from './helpers/setup.js';
const STAT_KEYS = ['physical','endurance','mental','social','strategic','loyalty','boldness','intuition','temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k,i)=>[k,1+((s*7+i*3)%10)]));
const CAST = Array.from({length:12},(_,i)=>({name:'P'+i,archetype:['mastermind','hero','floater','villain','schemer','goat'][i%6],gender:i%2?'f':'m',sexuality:'straight',stats:spread(i+1)}));
it('bb overview speaks house', () => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(seasonConfig,{format:'big-brother',finaleSize:3,jurySize:7,bbSafetyMode:'off',bbHaveNots:'off',bbDepartures:'off',setting:'bb-house',twistSchedule:[],romance:'enabled'});
  gs.bb={outgoingHoh:null,weeks:[],stats:{},house:null};
  gs.episodeHistory=[]; gs.riPlayers=[]; gs.sideDeals=[]; gs.knowledge={};
  Object.assign(globalThis,{gs,players,seasonConfig,pStats,pronouns,threatScore,getBond,getPerceivedBond,ordinal});
  for (let i=0;i<4;i++) simulateBBEpisode();
  const model = buildSeasonOverviewModel(gs, players);
  expect(model.isBB).toBe(true);
  // Somebody has won something by week four, and the model can see it.
  const totalWins = model.powerRanking.reduce((s,m)=>s+m.challengeWins,0);
  expect(totalWins).toBeGreaterThan(0);
  const anyHoh = model.powerRanking.some(m=>m.hohWins>0);
  expect(anyHoh).toBe(true);
  const leader = model.leaders.find(l=>l.label==='Competition leader');
  expect(leader).toBeTruthy();
  expect(leader.value).toMatch(/HOH|veto|arena/);
});
