import { beforeEach, describe, expect, it } from 'vitest';
import { gs } from '../js/core.js';
import { getBond } from '../js/bonds.js';
import { getRelationshipDimensions } from '../js/relationships.js';
import { memoriesAbout } from '../js/strategy-memory.js';
import { createHouseEventApi, houseEventState, scheduleHouseBeats } from '../js/bb/house-events.js';
import { beatsInvolving } from '../js/bb-events/_read.js';
import { BOND_EVENTS } from '../js/bb-events/bonds.js';
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
    // House acts run MUCH longer than ceremony acts — that is where the week
    // lives, and a house that only says three things a stretch reads as empty.
    // The bound here was 6 for both when a stretch of house life was 3-6 beats.
    const houseActs = week.acts.filter(a => a.type === 'house');
    // Campaign acts are counted separately. Their beats are not scheduler
    // draws — there is one per voter a nominee actually got alone, the same way
    // the alliance lifecycle attaches one per real event — so two nominees
    // working four people each is eight beats and that is correct.
    // The jury house is not one of these and cannot be: it is the one act of
    // the week that happens somewhere the houseguests are not, so no house
    // event can attach to it. It carries its own beats instead.
    const ceremonies = week.acts.filter(a => a.type !== 'house' && a.type !== 'campaign'
      && a.type !== 'jury-house');
    const campaigns = week.acts.filter(a => a.type === 'campaign');
    expect(ceremonies.every(act => act.socialBeats.length >= 1 && act.socialBeats.length <= 6)).toBe(true);
    expect(campaigns.every(act => act.socialBeats.length >= 1)).toBe(true);
    // This runs on a ten-event fixture, so a stretch tops out around twenty.
    expect(houseActs.every(act => act.socialBeats.length >= 8)).toBe(true);
    // Eviction night used to be hardcoded to silence, which made a farewell
    // speech impossible to write. It gets its beats like every other act now.
    // Last act of the week IN THE HOUSE — once the jury is open the week ends
    // somewhere else, in a lodge nobody still playing can reach.
    const eviction = week.acts.filter(a => a.type !== 'jury-house').at(-1);
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

  it('uses the current week in the bad-day bond event prose', () => {
    gs.popularity.A = -1;
    const event = BOND_EVENTS.find(({ id }) => id === 'bond-bad-day');
    const api = createHouseEventApi({ act:'house', week:{ num:2 } });
    const variants = Array.from({ length: 12 }, (_, beat) =>
      event.fire([...gs.activePlayers], { act:'house', beat, week:{ num:2 } }, api).text);
    const elapsedTimeVariant = variants.find(text => text.includes('not a small thing'));

    expect(elapsedTimeVariant).toContain('after 2 weeks in one house');
    expect(elapsedTimeVariant).not.toContain('five weeks');
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

// Every beat is a receipt.
//
// The feed used to read as a series of things that happened to nobody in
// particular: the events have always moved bonds, targets, suspicion and
// deals, and no card ever said so.
//
// The property worth protecting is that effects are MEASURED rather than
// self-reported. A ledger built only from api calls misses everything that
// goes around the api — and the beats a viewer most wants a receipt for do
// exactly that: the scheme layer hands off to Total Drama's
// social-manipulation module, so a forged note and a whisper campaign came
// back with nothing while a remark about the weather did not.
describe('beats say what they changed', () => {
  beforeEach(() => seedGame(CAST, { episode:0, eliminated:[], namedAlliances:[], popularity:{}, showmances:[], romanticSparks:[] }));

  it('attaches an effect to a beat that changes something', () => {
    const week = { num: 1 };
    const beats = scheduleHouseBeats(TEN_EVENTS, [...gs.activePlayers],
      { act:'hoh', hoh:'A', nominees:[], vetoWinner:null, week }, { rng: rng(5), min: 10, max: 10 });
    const withEffects = beats.filter(b => (b.effects || []).length);
    expect(withEffects.length, 'ten events all changed the house and none of them said so')
      .toBeGreaterThanOrEqual(8);
    for (const b of withEffects) {
      for (const fx of b.effects) {
        expect(fx.kind, 'an effect with no kind cannot be drawn').toBeTruthy();
        expect(fx.text, 'an effect with no words is not a receipt').toBeTruthy();
      }
    }
  });

  it('measures a bond move the event never declared', () => {
    // addBond deliberately does NOT record anything. The bond effect comes
    // from diffing the world around the beat, which is the only way to catch
    // the modules that do not go through this api at all.
    const sneaky = [{
      id: 'goes-around-the-api', category: 'vertical-slice',
      weight: () => 10,
      fire(house, ctx) {
        // Straight at shared state, the way the scheme bridge does it.
        gs.bonds[['A', 'B'].sort().join('||')] = (gs.bonds[['A', 'B'].sort().join('||')] || 0) + 2;
        return { text: 'Something happened off the books.', players: ['A', 'B'],
                 badgeText: 'OFF THE BOOKS', badgeClass: 'grey' };
      },
    }];
    const beats = scheduleHouseBeats(sneaky, [...gs.activePlayers],
      { act:'hoh', hoh:'A', nominees:[], vetoWinner:null, week:{ num:1 } }, { rng: rng(9), min: 1, max: 1 });
    const fx = beats[0]?.effects || [];
    expect(fx.some(e => e.kind === 'bond'),
      'a relationship moved during the beat and the feed did not notice').toBe(true);
  });

  it('only counts a movement worth mentioning', () => {
    const trivial = [{
      id: 'rounding-noise', category: 'vertical-slice',
      weight: () => 10,
      fire(house, ctx, api) {
        api.addBond('A', 'B', 0.05);
        return { text: 'Barely anything.', players: ['A', 'B'], badgeText: 'NOTHING', badgeClass: 'grey' };
      },
    }];
    const beats = scheduleHouseBeats(trivial, [...gs.activePlayers],
      { act:'hoh', hoh:'A', nominees:[], vetoWinner:null, week:{ num:1 } }, { rng: rng(3), min: 1, max: 1 });
    expect((beats[0]?.effects || []).some(e => e.kind === 'bond'),
      'rounding noise was dressed up as a consequence').toBe(false);
  });

  it('gives each beat only its own effects', () => {
    const week = { num: 1 };
    const beats = scheduleHouseBeats(TEN_EVENTS, [...gs.activePlayers],
      { act:'hoh', hoh:'A', nominees:[], vetoWinner:null, week }, { rng: rng(5), min: 10, max: 10 });
    // The ledger is drained per beat; if it were not, the last card would carry
    // everything that happened all act.
    const counts = beats.map(b => (b.effects || []).length);
    expect(Math.max(...counts), 'one card absorbed the whole act').toBeLessThan(8);
  });
});

// A week must not get slower because the season got longer.
//
// beatsInvolving() is called from roughly seventy places in the event library,
// almost all inside weight(), which runs for every event on every beat. While
// it scanned the whole event history the cost of a week was proportional to
// everything that had ever happened: episode one took 1.1s and episode six took
// 5.9s, with the same number of beats and FEWER houseguests in the house.
describe('a week costs the same in week ten as in week one', () => {
  beforeEach(() => seedGame(CAST, { episode:0, eliminated:[], namedAlliances:[], popularity:{}, showmances:[], romanticSparks:[] }));

  it('counts screen time instead of re-reading the season', () => {
    // The tally is derived state; it has to agree with the thing it summarises,
    // or the fairness weighting silently drifts as a season goes on.
    const week = { num: 1 };
    scheduleHouseBeats(TEN_EVENTS, [...gs.activePlayers],
      { act:'hoh', hoh:'A', nominees:[], vetoWinner:null, week }, { rng: rng(5), min: 10, max: 10 });
    const history = houseEventState().eventHistory || [];
    for (const name of gs.activePlayers) {
      const scanned = history.filter(h => (h.players || []).includes(name)).length;
      expect(beatsInvolving(name), `${name}: tally disagrees with the history`).toBe(scanned);
    }
  });

  it('rebuilds the tally when the history changes underneath it', () => {
    // A loaded save, or anything appending without going through recordBeat.
    const week = { num: 1 };
    scheduleHouseBeats(TEN_EVENTS, [...gs.activePlayers],
      { act:'hoh', hoh:'A', nominees:[], vetoWinner:null, week }, { rng: rng(7), min: 4, max: 4 });
    const before = beatsInvolving('A');
    houseEventState().eventHistory.push({ week: 1, act: 'hoh', eventId: 'smuggled-in', players: ['A'] });
    expect(beatsInvolving('A'), 'the tally went stale against its own history').toBe(before + 1);
  });

  it('does not get slower as the history grows', () => {
    // A smoke alarm, not a benchmark — the regression it exists for was five
    // times and climbing, so the threshold is deliberately loose enough to
    // survive a loaded machine.
    const time = (weekNum, seed) => {
      const t0 = performance.now();
      scheduleHouseBeats(TEN_EVENTS, [...gs.activePlayers],
        { act:'hoh', hoh:'A', nominees:[], vetoWinner:null, week:{ num: weekNum } },
        { rng: rng(seed), min: 10, max: 10 });
      return performance.now() - t0;
    };
    const early = time(1, 5);
    for (let w = 2; w < 22; w++) time(w, w * 13);   // pile up ~200 beats of history
    const late = time(22, 99);
    expect(houseEventState().eventHistory.length).toBeGreaterThan(180);
    expect(late, `a week costs ${late.toFixed(0)}ms after 200 beats vs ${early.toFixed(0)}ms at the start`)
      .toBeLessThan(Math.max(40, early * 4));
  });
});

// Where a beat happens.
//
// Only eighteen of the ninety-six events declare a room, so the rest were filed
// by hashing the event id — which put a beat opening "gets Caleb alone by the
// back of the kitchen" under the HOH ROOM camera. Measured across two seasons,
// 11.3% of beats sat under a camera their own text contradicted, and 4.2% were
// in the HOH room with no Head of Household present.
describe('a beat happens where it says it happens', () => {
  beforeEach(() => seedGame(CAST, { episode:0, eliminated:[], namedAlliances:[], popularity:{}, showmances:[], romanticSparks:[] }));

  const say = (id, text, players = ['A', 'B']) => ({
    id, category: 'vertical-slice', weight: () => 10,
    fire: () => ({ text, players, badgeText: 'X', badgeClass: 'grey' }),
  });
  const fire = (event, ctx = {}) => scheduleHouseBeats([event], [...gs.activePlayers],
    { act: 'hoh', hoh: 'A', nominees: [], vetoWinner: null, week: { num: 1 }, ...ctx },
    { rng: rng(5), min: 1, max: 1 })[0];

  it('files a beat in the room its own words name', () => {
    expect(fire(say('e1', 'They talk quietly in the kitchen.')).location).toBe('kitchen');
    expect(fire(say('e2', 'Out in the backyard, nobody says much.')).location).toBe('backyard');
    expect(fire(say('e3', 'A whispered row in the storage room.')).location).toBe('pantry');
    expect(fire(say('e4', 'Somebody is crying in the shower.')).location).toBe('washroom');
  });

  it('lets the writing outrank the room the event declared', () => {
    // An event declares one room for all its text variants and those variants
    // disagree with each other. The sentence on the card is what gets read.
    const declared = { ...say('e5', 'The two of them end up in the kitchen.'), location: 'pantry' };
    expect(fire(declared).location, 'the declared room beat the prose').toBe('kitchen');
  });

  it('keeps the HOH room private', () => {
    // The one piece of geography the format actually enforces: it locks, and
    // nobody goes up without the Head of Household.
    const runs = [];
    for (let i = 0; i < 30; i++) {
      const beat = scheduleHouseBeats([say(`p${i}`, 'They find a quiet moment together.', ['B', 'C'])],
        [...gs.activePlayers], { act: 'hoh', hoh: 'A', nominees: [], vetoWinner: null, week: { num: 1 } },
        { rng: rng(i + 1), min: 1, max: 1 })[0];
      runs.push(beat.location);
    }
    expect(runs, 'two houseguests met in a room neither can open').not.toContain('hoh-room');
  });

  it('still allows it when the Head of Household is there', () => {
    const beat = fire(say('e6', 'They go over the names one more time.', ['A', 'B']), { hoh: 'A' });
    // Not asserting it IS the HOH room — only that it is not forbidden, which
    // the gate above would otherwise make impossible for every beat.
    expect(['hoh-room', 'pantry', 'bedroom', 'backyard', 'kitchen', 'living-room', 'washroom', 'diary-room'])
      .toContain(beat.location);
  });
});
