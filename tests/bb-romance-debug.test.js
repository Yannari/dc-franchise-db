// @vitest-environment jsdom
import { it, expect } from 'vitest';
import { gs, seasonConfig, players } from '../js/core.js';
import { pStats, pronouns, threatScore } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { ordinal } from '../js/finale.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { rpBuildBBDebug } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';
const STAT_KEYS = ['physical','endurance','mental','social','strategic','loyalty','boldness','intuition','temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k,i)=>[k,1+((s*7+i*3)%10)]));
const CAST = Array.from({length:14},(_,i)=>({name:'P'+i,archetype:['showmancer','hero','floater','villain','schemer','goat','social-butterfly'][i%7],gender:i%2?'f':'m',sexuality:'straight',stats:spread(i+1)}));
it('has an always-visible romance tab with pipeline status', () => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(seasonConfig,{format:'big-brother',finaleSize:3,jurySize:7,bbSafetyMode:'off',bbHaveNots:'off',bbDepartures:'off',setting:'bb-house',twistSchedule:[],romance:'enabled'});
  gs.bb={outgoingHoh:null,weeks:[],stats:{},house:null};
  gs.episodeHistory=[]; gs.riPlayers=[]; gs.sideDeals=[]; gs.knowledge={}; gs.showmances=[]; gs.romanticSparks=[];
  Object.assign(globalThis,{gs,players,seasonConfig,pStats,pronouns,threatScore,getBond,getPerceivedBond,ordinal});
  let g=0; while (g++<8) { if (!simulateBBEpisode()) break; }
  localStorage.setItem('vp_bbdebug_tab','romance');
  const html = rpBuildBBDebug(gs.episodeHistory.at(-1));
  expect(html).toContain('ROMANCE STATUS');
  expect(html).toContain("'vp_bbdebug_tab','romance'");
  expect(html).toContain('SPARKS (');
  expect(html).toContain('SHOWMANCES (');
  seasonConfig.romance = 'disabled';
  expect(rpBuildBBDebug(gs.episodeHistory.at(-1))).toContain('DISABLED');
  seasonConfig.romance = 'enabled';

  // Historical accuracy: an old episode reads its OWN closing snapshot, not
  // the live stores — planting a fresh live spark must not appear on week 1.
  const ep1 = gs.episodeHistory[0];
  expect(ep1.closingState.romanticSparks, 'week 1 has no romance snapshot').toBeTruthy();
  gs.romanticSparks.push({ players: ['P0', 'P1'], sparkEp: 99, context: 'time travel', intensity: 0.9, fake: false, saboteur: null });
  const w1html = rpBuildBBDebug(ep1);
  expect(w1html).toContain(`closing state (week ${ep1.num})`);
  expect(w1html).not.toContain('time travel');
  gs.romanticSparks.pop();

  // An episode recorded before the snapshot upgrade falls back to live state
  // and SAYS so, instead of quietly lying about the past.
  const legacy = { ...ep1, closingState: { ...ep1.closingState, romanticSparks: undefined } };
  expect(rpBuildBBDebug(legacy)).toContain('LIVE state');
});
