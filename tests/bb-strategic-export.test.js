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

// The rankings board has had a Strat column all along and no house season could
// fill it: the Big Brother export emitted neither `strategicScore` nor
// `strategicRank`, so the field only appeared on a season that had been through
// the AI writing pass, which grafts it on afterwards. A raw export scored every
// houseguest as strategically inert. On S1 that held the runner-up a whole tier
// below where he belonged -- 79.9 against a gate of 80.
//
// This is the third time this exact shape has bitten: the arena wins, then the
// powers, now this. A column the board draws, a number the house has, and
// nothing carrying it across.
describe('what a houseguest did strategically reaches the export', () => {
  it('is counted, on the scale the board multiplies, and not just their stat line', () => {
    seedGame(CAST,{episode:0,eliminated:[],namedAlliances:[]});
    Object.assign(globalThis,{gs,players,seasonConfig,relationships,pStats,pronouns,ordinal,
      getBond,getPerceivedBond,bKey,bondLabel,romanticCompat});
    Object.assign(seasonConfig,{format:'big-brother',finaleSize:3,jurySize:5,popularityEnabled:true});
    gs.riPlayers=gs.riPlayers||[]; gs.tribes=gs.tribes||[];
    withSeededRandom(4242,()=>{ for(let w=0;w<8&&gs.phase!=='complete';w++) simulateBBEpisode(); });

    const weeks=gs.bb?.weeks||[];
    expect(weeks.length,'no weeks to export').toBeGreaterThan(0);
    const tmpl=extractBigBrotherSeasonTemplate(weeks,[...gs.activePlayers].slice(0,3),
      {seasonNumber:1,jurySize:5});

    const scores=tmpl.placements.map(p=>p.strategicScore);
    scores.forEach((v,i)=>expect(typeof v,`${tmpl.placements[i].name}: no strategic score`).toBe('number'));

    // The column exists and something reached it.
    expect(Math.max(...scores),'the export dropped the strategic column').toBeGreaterThan(0);

    // 0-10, because the board multiplies this by 0.12 and that calibration caps
    // the term near one competition win. Total Drama's own strategic score runs
    // 15-30 and would land two to three times heavier than any veto.
    expect(Math.min(...scores)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...scores)).toBeLessThanOrEqual(10);

    // It has to separate people. One value for the whole house is a column that
    // ranks nobody.
    expect(new Set(scores).size,'every houseguest scored identically').toBeGreaterThan(1);

    // BEHAVIOR > STATS. If the score never exceeds what the stat line alone
    // would give, then none of the behavioural terms are reaching it -- which is
    // exactly what pointing Total Drama's scorer at a house would produce.
    const anchorOf=n=>{const s=pStats(n)||{};
      return (s.strategic||0)*0.45+(s.intuition||0)*0.10+(s.boldness||0)*0.10;};
    const movedByPlay=tmpl.placements.filter(p=>p.strategicScore>anchorOf(p.name)+0.05);
    expect(movedByPlay.length,'nothing but the stat line reached the strategic score')
      .toBeGreaterThan(0);
  },900000);
});
