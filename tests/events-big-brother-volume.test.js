// The whole Big Brother event library, tested as a library.
//
// The per-category files test their own events; this covers the properties that
// only exist across all of them at once — that nothing is dead, that no
// category has quietly taken over the house, and that every event still
// satisfies the scheduler contract no matter which act it lands in.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { simulateBBSeason } from '../js/bb/week.js';
import { scheduleHouseBeats, houseEventState } from '../js/bb/house-events.js';
import {
  HOUSE_EVENTS, HOUSE_EVENTS_BY_CATEGORY, houseEventsFor, assertUniqueEventIds,
} from '../js/bb-events/index.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = seed => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
  ['M', 'wildcard', 'm'], ['N', 'chaos-agent', 'f'],
].map(([name, archetype, gender], i) =>
  ({ name, archetype, gender, sexuality: 'straight', stats: spread(i + 1) }));
const HOUSE = CAST.map(p => p.name);

const seededRng = (seed = 5) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {};
  gs.showmances = [];
  gs.romanticSparks = [];
  seasonConfig.romance = 'enabled';
  seasonConfig.finaleSize = 3;
}

const ACTS = ['hoh', 'nominations', 'veto', 'veto-ceremony', 'campaign'];
const ctxFor = (act, extra = {}) => ({
  act, beat: 0, hoh: 'A', nominees: ['B', 'C'], vetoWinner: 'D',
  week: { num: 3, plan: { target: 'B', pawn: 'C', backdoorTarget: null },
    initialNominees: ['B', 'C'], finalNominees: ['B', 'C'], houseAtStart: HOUSE },
  ...extra,
});

function playSeasons(seeds) {
  const fired = {};
  for (const seed of seeds) {
    reset();
    const { weeks } = simulateBBSeason({
      rng: seededRng(seed), finaleSize: 3,
      houseEvents: HOUSE_EVENTS, competitions: BB_COMPETITIONS,
    });
    for (const act of weeks.flatMap(w => w.acts || [])) {
      for (const b of act.socialBeats || []) fired[b.eventId] = (fired[b.eventId] || 0) + 1;
    }
  }
  return fired;
}

describe('the Big Brother event library as a whole', () => {
  beforeEach(reset);

  it('has four categories and no duplicate ids', () => {
    expect(Object.keys(HOUSE_EVENTS_BY_CATEGORY).sort())
      .toEqual(['ceremonies', 'deals', 'house-life', 'social']);
    expect(assertUniqueEventIds()).toBe(true);
    expect(HOUSE_EVENTS.length).toBeGreaterThanOrEqual(35);
    // Each event's declared category must match the bucket it is filed under.
    for (const [cat, list] of Object.entries(HOUSE_EVENTS_BY_CATEGORY)) {
      for (const e of list) expect(e.category, `${e.id} filed under ${cat}`).toBe(cat);
    }
  });

  it('can hand back one category at a time', () => {
    expect(houseEventsFor('deals')).toEqual(HOUSE_EVENTS_BY_CATEGORY.deals);
    expect(houseEventsFor()).toEqual(HOUSE_EVENTS);
    expect(houseEventsFor('nonsense')).toEqual([]);
  });

  // The recurring bug in this project: written, registered, and still unreachable.
  it('fires every event in real seasons — no dead code', () => {
    const fired = playSeasons([11, 23, 37, 44, 58, 63, 71, 88, 95, 102]);
    const never = HOUSE_EVENTS.map(e => e.id).filter(id => !fired[id]);
    expect(never, `never fire in a real season: ${never.join(', ')}`).toEqual([]);
  });

  it('keeps any one category from taking over the house', () => {
    const fired = playSeasons([11, 23, 37, 44, 58]);
    const total = Object.values(fired).reduce((a, b) => a + b, 0);
    for (const [cat, list] of Object.entries(HOUSE_EVENTS_BY_CATEGORY)) {
      const share = list.reduce((s, e) => s + (fired[e.id] || 0), 0) / total;
      expect(share, `${cat} is silent`).toBeGreaterThan(0.03);
      expect(share, `${cat} dominates the house`).toBeLessThan(0.6);
    }
  });

  // Every event, in every act, at several house sizes: weight() saying yes must
  // always mean fire() can produce a renderable beat. A mismatch throws inside
  // the scheduler and takes the whole season with it.
  it('never green-lights an event it cannot narrate', () => {
    for (const event of HOUSE_EVENTS) {
      for (const act of ACTS) {
        for (const size of [4, 6, 9, 14]) {
          reset();
          const house = HOUSE.slice(0, size);
          const ctx = ctxFor(act, { nominees: house.slice(1, 3) });
          if (event.weight(house, ctx) <= 0) continue;
          expect(() => scheduleHouseBeats([event], house, ctx, { rng: seededRng(), min: 1, max: 1 }),
            `${event.id} in ${act} with ${size}`).not.toThrow();
        }
      }
    }
  });

  it('changes something every time it fires', () => {
    for (const event of HOUSE_EVENTS) {
      reset();
      const ctx = ctxFor(event.category === 'ceremonies' ? 'nominations' : 'hoh');
      if (event.weight(HOUSE, ctx) <= 0) continue;
      const snap = () => JSON.stringify({
        b: gs.bonds, p: gs.popularity, h: houseEventState(),
        m: gs.strategicMemories, i: gs.intentions, s: gs.romanticSparks,
      });
      const before = snap();
      scheduleHouseBeats([event], HOUSE, ctx, { rng: seededRng(), min: 1, max: 1 });
      expect(snap(), `${event.id} fired without changing anything`).not.toBe(before);
    }
  });

  it('gives a week enough to say without repeating itself inside an act', () => {
    reset();
    const { weeks } = simulateBBSeason({
      rng: seededRng(31), finaleSize: 3,
      houseEvents: HOUSE_EVENTS, competitions: BB_COMPETITIONS,
    });
    const perWeek = weeks.map(w => (w.acts || []).flatMap(a => a.socialBeats || []).length);
    const average = perWeek.reduce((a, b) => a + b, 0) / perWeek.length;
    expect(average).toBeGreaterThan(6);
    // The scheduler de-duplicates by id within an act; confirm it holds.
    for (const act of weeks.flatMap(w => w.acts || [])) {
      const ids = (act.socialBeats || []).map(b => b.eventId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('replays a season identically for the same seed', () => {
    const textOf = () => {
      reset();
      const { weeks } = simulateBBSeason({
        rng: seededRng(77), finaleSize: 3,
        houseEvents: HOUSE_EVENTS, competitions: BB_COMPETITIONS,
      });
      return weeks.flatMap(w => (w.acts || []).flatMap(a => (a.socialBeats || []).map(b => b.text)));
    };
    expect(textOf()).toEqual(textOf());
  });
});
