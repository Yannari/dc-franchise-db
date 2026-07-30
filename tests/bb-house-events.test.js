import { beforeEach, describe, expect, it } from 'vitest';
import { gs } from '../js/core.js';
import { getBond } from '../js/bonds.js';
import { getRelationshipDimensions } from '../js/relationships.js';
import { memoriesAbout } from '../js/strategy-memory.js';
import { createHouseEventApi, houseEventState, scheduleHouseBeats } from '../js/bb/house-events.js';
import { chooseNominationPlan } from '../js/bb/strategy.js';
import { simulateBBWeek } from '../js/bb/week.js';
import { seedGame } from './helpers/setup.js';

const CAST = [
  { name:'A', gender:'m', sexuality:'bisexual', archetype:'mastermind' },
  { name:'B', gender:'f', sexuality:'bisexual', archetype:'social-butterfly' },
  { name:'C', archetype:'challenge-beast' }, { name:'D', archetype:'schemer' },
  { name:'E', archetype:'hero' }, { name:'F', archetype:'floater' },
  { name:'G', archetype:'villain' }, { name:'H', archetype:'loyal-soldier' },
];
const rng = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function fixtureEvent(id, consequence, players = ['A','B']) {
  return {
    id, category: 'vertical-slice',
    weight(house, ctx) { return house.length * (ctx.beat + 1); },
    fire(house, ctx, api) {
      consequence(api, house, ctx);
      return { text: `${id} changes the house.`, players, badgeText: id.toUpperCase(), badgeClass: 'strategy' };
    },
  };
}

const TEN_EVENTS = [
  fixtureEvent('bond-up', api => api.addBond('A','B',1)),
  fixtureEvent('bond-down', api => api.addBond('C','D',-1)),
  fixtureEvent('fan-rise', api => api.popDelta('E',2), ['E']),
  fixtureEvent('fan-fall', api => api.popDelta('G',-1), ['G']),
  fixtureEvent('suspicion', api => api.suspicion('A','G',3), ['A','G']),
  fixtureEvent('target', api => api.setTarget('A','G','caught scheming'), ['A','G']),
  fixtureEvent('memory', api => api.remember('B','D','broken-promise',2), ['B','D']),
  fixtureEvent('spark', api => api.showmance('A','B',{ context:'late-night talk' })),
  fixtureEvent('second-memory', api => api.remember('E','G','protected-me',1), ['E','G']),
  fixtureEvent('second-target', api => api.setTarget('C','D','competition rival'), ['C','D']),
];

describe('Big Brother house-event scheduler contract', () => {
  beforeEach(() => seedGame(CAST, { episode:0, eliminated:[], namedAlliances:[], popularity:{}, showmances:[], romanticSparks:[] }));

  it('runs the ten-event vertical slice with required render fields and no duplicates', () => {
    const week = { num:1 };
    const beats = scheduleHouseBeats(TEN_EVENTS, [...gs.activePlayers], { act:'hoh', hoh:'A', nominees:[], vetoWinner:null, week }, { rng:rng(5), min:10, max:10 });
    expect(beats).toHaveLength(10);
    expect(new Set(beats.map(beat => beat.eventId)).size).toBe(10);
    expect(beats.every(beat => beat.text && Array.isArray(beat.players) && beat.badgeText && beat.badgeClass)).toBe(true);
    expect(houseEventState().eventHistory).toHaveLength(10);
  });

  it('exposes consequences only through the scheduler API', () => {
    const api = createHouseEventApi({ act:'campaign', week:{ num:2 } });
    expect(api.addBond('A','B',2)).toBe(true);
    expect(api.popDelta('A',3)).toBe(true);
    expect(api.suspicion('A','G',4)).toBe(true);
    expect(api.setTarget('A','G','leak')).toBe(true);
    expect(api.remember('A','D','lied',2)).toBe(true);
    expect(getBond('A','B')).toBeGreaterThan(0);
    expect(gs.popularity.A).toBe(3);
    expect(gs.intentions.A.targets[0]).toBe('G');
    expect(memoriesAbout('A','D')[0]).toMatchObject({ subject:'D', type:'lied', details:{ format:'big-brother', act:'campaign' } });
    expect(houseEventState().targets.A).toMatchObject({ target:'G', week:2, act:'campaign' });
    expect(houseEventState().memories.A[0]).toMatchObject({ subject:'D', type:'lied' });
  });

  it('rejects cosmetic or unrenderable event results', () => {
    const cosmetic = { id:'cosmetic', category:'social', weight:() => 1, fire:() => ({ text:'Just flavor.', players:[] }) };
    expect(() => scheduleHouseBeats([cosmetic], gs.activePlayers, { act:'hoh', week:{num:1} }, { rng:() => 0, min:1, max:1 }))
      .toThrow(/badgeText and badgeClass/);
  });

  it('attaches variable social beats to every act, eviction included', () => {
    const week = simulateBBWeek({ rng:rng(14), houseEvents:TEN_EVENTS });
    expect(week.acts.length).toBeGreaterThanOrEqual(6);
    expect(week.acts.every(act => act.socialBeats.length >= 1 && act.socialBeats.length <= 3)).toBe(true);
    // Eviction night used to be hardcoded to silence, which made a farewell
    // speech impossible to write. It gets its beats like every other act now.
    const eviction = week.acts.at(-1);
    expect(eviction.type).toBe('eviction');
    expect(eviction.socialBeats.length).toBeGreaterThan(0);
  });

  it('tells eviction-night events who is actually leaving', () => {
    let seen = null;
    const probe = [{
      id:'probe-eviction-ctx', category:'social',
      weight: (house, ctx) => ctx.act === 'eviction' ? 5 : 0,
      fire: (house, ctx) => {
        seen = { evicted: ctx.evicted, votes: ctx.votes };
        return { text:'probe', players:[house[0]], badgeText:'PROBE', badgeClass:'grey' };
      },
    }];
    const week = simulateBBWeek({ rng:rng(21), houseEvents:probe });
    expect(seen).toBeTruthy();
    expect(seen.evicted).toBe(week.evicted);
    expect(seen.votes).toBeTruthy();
  });

  it('hands events the seeded rng so they can roll without breaking replay', () => {
    let got = null;
    const probe = [{
      id:'probe-rng', category:'social',
      weight: () => 5,
      fire: (house, ctx, api, rngArg) => {
        got = typeof rngArg;
        return { text:'probe', players:[house[0]], badgeText:'PROBE', badgeClass:'grey' };
      },
    }];
    simulateBBWeek({ rng:rng(33), houseEvents:probe });
    expect(got).toBe('function');
  });

  it('feeds event targets and suspicion into later nomination strategy', () => {
    const baseline = chooseNominationPlan('A', gs.activePlayers, () => 0.5);
    const api = createHouseEventApi({ act:'hoh', week:{num:1} });
    api.setTarget('A','B','safety pitch exposed');
    api.suspicion('A','B',8);
    const influenced = chooseNominationPlan('A', gs.activePlayers, () => 0.5);
    const before = baseline.rankings.find(entry => entry.name === 'B').score;
    const after = influenced.rankings.find(entry => entry.name === 'B').score;
    expect(after).toBeGreaterThan(before + 6);
  });

  it('never lets a stale render receipt override canonical intentions', () => {
    const api = createHouseEventApi({ act:'hoh', week:{ num:1 } });
    api.setTarget('A','B','caught making a deal');
    houseEventState().targets.A = { target:'C', reason:'stale save receipt', week:0 };
    const plan = chooseNominationPlan('A', gs.activePlayers, () => 0.5);
    const b = plan.rankings.find(entry => entry.name === 'B').score;
    const c = plan.rankings.find(entry => entry.name === 'C').score;
    expect(b).toBeGreaterThan(c);
  });

  it('routes showmance sparks through shared relationship dimensions', () => {
    const api = createHouseEventApi({ act:'campaign', week:{ num:2 } });
    expect(api.showmance('A','B',{ context:'late-night talk', intensity:0.6 })).toBe(true);
    expect(gs.romanticSparks).toHaveLength(1);
    expect(getRelationshipDimensions('A','B').attraction).toBeGreaterThan(0);
    expect(getRelationshipDimensions('B','A').attraction).toBeGreaterThan(0);
  });

  it('uses proportional numeric weights rather than boolean eligibility thresholds', () => {
    const seen = [];
    const event = fixtureEvent('weighted', (api, house, ctx) => seen.push(ctx.beat));
    expect(event.weight(gs.activePlayers, { beat:0 })).toBe(8);
    expect(event.weight(gs.activePlayers, { beat:2 })).toBe(24);
    scheduleHouseBeats([event], gs.activePlayers, { act:'campaign', week:{num:1} }, { rng:() => 0, min:1, max:1 });
    expect(seen).toEqual([0]);
  });
});
