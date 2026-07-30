import { beforeEach, describe, expect, it } from 'vitest';
import { gs } from '../js/core.js';
import { GENERIC_BB_COMPS, runBBCompetition, validateBBCompetitionLibrary } from '../js/bb/comps.js';
import { simulateBBWeek } from '../js/bb/week.js';
import { seedGame } from './helpers/setup.js';

const CAST = ['A','B','C','D','E','F','G','H'].map((name, index) => ({
  name, archetype:['mastermind','social-butterfly','challenge-beast','schemer','hero','floater','villain','loyal-soldier'][index],
}));
const rng = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const FIXTURE_COMP = {
  id:'fixture-pressure-buttons', name:'Pressure Buttons', category:'reaction', types:['hoh','veto'],
  weight:() => 1,
  simulate(participants, ctx, api) {
    const placements = [...participants].reverse();
    const scores = Object.fromEntries(placements.map((name, index) => [name, placements.length - index]));
    api.popDelta(placements[0], 1);
    api.record(placements[0], 'clutch-win', { type:ctx.type });
    return {
      winner:placements[0], placements, scores, variant:'red-buttons',
      beats:[{ type:'round', text:`${placements[0]} hits the final button.`, players:[placements[0]], badgeText:'CLUTCH', badgeClass:'challenge' }],
      events:[{ type:'rivalry', text:`${placements[0]} edges ${placements[1]}.`, players:placements.slice(0,2), badgeText:'PHOTO FINISH', badgeClass:'rivalry' }],
      text:`${placements[0]} wins Pressure Buttons.`,
      debug:{ formula:{ reaction:'custom' }, scoreBreakdown:Object.fromEntries(placements.map(name => [name,{ finalScore:scores[name] }])) },
    };
  },
};

describe('Big Brother competition contract', () => {
  beforeEach(() => seedGame(CAST, { episode:0, eliminated:[], popularity:{}, namedAlliances:[] }));

  it('runs a generic fallback with complete placements and debug math', () => {
    const result = runBBCompetition({ type:'hoh', participants:gs.activePlayers, house:gs.activePlayers, rng:rng(4), forcedId:'generic-memory-booth', seed:404 });
    expect(result.debug).toMatchObject({ source:'generic', competitionId:'generic-memory-booth', type:'hoh', rngSeed:404 });
    expect(result.placements).toHaveLength(8);
    expect(Object.keys(result.scores)).toHaveLength(8);
    expect(result.debug.scoreBreakdown[result.winner]).toMatchObject({ statComponents:expect.any(Object), randomRoll:expect.any(Number), finalScore:expect.any(Number) });
    expect(result.debug.formula.mental).toBeGreaterThan(0);
  });

  it('dispatches a forced custom competition through the same result shape', () => {
    const result = runBBCompetition({ type:'veto', participants:gs.activePlayers.slice(0,6), house:gs.activePlayers, library:[FIXTURE_COMP], forcedId:FIXTURE_COMP.id, rng:rng(8) });
    expect(result).toMatchObject({ id:FIXTURE_COMP.id, variant:'red-buttons', winner:'F' });
    expect(result.debug.source).toBe('custom');
    expect(result.beats[0]).toMatchObject({ badgeText:'CLUTCH', players:['F'] });
    expect(gs.popularity.F).toBe(1);
    expect(gs.bb.competitionMemories.F[0].type).toBe('clutch-win');
  });

  it('rejects malformed definitions and malformed custom results', () => {
    expect(() => validateBBCompetitionLibrary([{ id:'bad', name:'Bad', category:'x', types:['hoh'], stats:{ luck:1 } }])).toThrow(/stat profile/);
    const malformed = { id:'broken', name:'Broken', category:'x', types:['hoh'], simulate:participants => ({ winner:participants[0], placements:[participants[0]], scores:{ [participants[0]]:1 } }) };
    expect(() => runBBCompetition({ type:'hoh', participants:['A','B'], library:[malformed], forcedId:'broken' })).toThrow(/placements/);
  });

  it('supports all required competition contexts with eligible generic fallbacks', () => {
    for (const type of ['hoh','veto','arena','tiebreaker']) {
      const result = runBBCompetition({ type, participants:['A','B','C'], house:gs.activePlayers, rng:rng(type.length) });
      expect(result.type).toBe(type);
      expect(result.winner).toBe(result.placements[0]);
    }
    expect(GENERIC_BB_COMPS.every(comp => comp.types.length && comp.stats)).toBe(true);
  });

  it('integrates custom HOH and veto competitions into week acts and hook data', () => {
    const seen = [];
    const week = simulateBBWeek({
      rng:rng(22), competitions:[FIXTURE_COMP],
      forcedCompetitions:{ hoh:FIXTURE_COMP.id, veto:FIXTURE_COMP.id },
      hooks:{ hohResult:(winner, ctx) => { seen.push(ctx.competition.id); return winner; }, vetoOutcome:(winner, ctx) => { seen.push(ctx.competition.id); return winner; } },
    });
    expect(seen).toEqual([FIXTURE_COMP.id, FIXTURE_COMP.id]);
    expect(week.hohCompetition.debug.source).toBe('custom');
    expect(week.vetoCompetition.debug.source).toBe('custom');
    expect(week.acts.find(act => act.type === 'hoh').competition.id).toBe(FIXTURE_COMP.id);
    expect(week.acts.find(act => act.type === 'veto').competition.id).toBe(FIXTURE_COMP.id);
  });

  it('records category history so repeated generic categories receive cooldown weight', () => {
    runBBCompetition({ type:'hoh', participants:gs.activePlayers, forcedId:'generic-memory-booth', rng:rng(1) });
    const next = runBBCompetition({ type:'hoh', participants:gs.activePlayers, rng:rng(2) });
    const memoryWeight = next.debug.selectionWeights.find(entry => entry.id === 'generic-memory-booth').weight;
    const freshWeight = next.debug.selectionWeights.find(entry => entry.id === 'generic-endurance-wall').weight;
    expect(memoryWeight).toBeLessThan(freshWeight);
  });
});
