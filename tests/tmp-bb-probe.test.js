import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns, ordinal } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';

const CAST = ['A','B','C','D','E','F','G','H','I','J','K','L']
  .map((name, i) => ({ name, gender: i % 2 ? 'f' : 'm', sexuality: 'straight',
    archetype: ['mastermind','hero','floater','villain'][i % 4] }));

describe('probe', () => {
  beforeEach(() => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, ordinal, getBond, getPerceivedBond });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
      twistSchedule: [], bbCompSchedule: [], bbSafetyMode: 'off', bbHaveNots: 'off', bbDepartures: 'off' });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null, returns: [] };
    gs.episodeHistory = [];
    gs.jury = [];
  });

  it('tonight-evictee return flags', () => {
    seasonConfig.twistSchedule = [{ id:'t1', episode: 3, type:'bb-battle-back', bbStyle:'gauntlet', bbComp:'' }];
    let out = [];
    for (let i = 0; i < 3; i++) {
      const ep = simulateBBEpisode();
      out.push(`ep${i+1} evicted=${ep.eliminated}`);
    }
    const wk = gs.bb.weeks[gs.bb.weeks.length - 1];
    const act = (wk.acts || []).find(a => a.type === 'battle-back');
    out.push(`returned=${act?.returned} tonightEvictee=${wk.evicted} grudges=${JSON.stringify(act?.grudges)}`);
    out.push(`reversedFlags=${JSON.stringify(gs.bb.weeks.map(w => [w.num, w.evicted, !!w.evictionReversed]))}`);
    console.log(out.join('\n'));
    expect(true).toBe(true);
  });
});
