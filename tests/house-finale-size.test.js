import { describe, it, expect } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns, ordinal } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, runBBFinale, houseIsAtFinale } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
const CAST = ['A','B','C','D','E','F','G','H','I','J']
  .map((n,i)=>({name:n,gender:'m',sexuality:'straight',archetype:['mastermind','hero','floater','villain'][i%4]}));
// The Finale Size slider offered 2-4 for a house. A final two crashed the
// season at three remaining (the week engine needs four), and a final four ran
// the finale from four but cut only one, leaving a houseguest neither evicted
// nor a finalist. A house ends at three; the engine now says so regardless.
describe('a house always ends at a final three', () => {
  it.each([2,3,4])('survives a configured finaleSize of %i', (size) => {
    seedGame(CAST,{episode:0,eliminated:[],namedAlliances:[]});
    Object.assign(globalThis,{gs,players,seasonConfig,pStats,pronouns,ordinal,getBond,getPerceivedBond});
    seasonConfig.format='big-brother'; seasonConfig.finaleSize=size; seasonConfig.jurySize=5;
    seasonConfig.twistSchedule=[]; seasonConfig.bbSafetyMode='off'; seasonConfig.bbHaveNots='twist';
    gs.bb={outgoingHoh:null,weeks:[],stats:{},house:null}; gs.episodeHistory=[]; gs.jury=[];
    let guard=0; while(!houseIsAtFinale() && guard++<40) simulateBBEpisode();
    const fin = runBBFinale();
    const accounted = new Set([...(gs.eliminated||[]), ...(gs.activePlayers||[])]);
    expect(accounted.size, 'somebody was left unaccounted for').toBe(CAST.length);
    expect(gs.activePlayers).toHaveLength(2);
    expect(fin.finalTwo).toHaveLength(2);
    expect(fin.winner).toBeTruthy();
  });
});
