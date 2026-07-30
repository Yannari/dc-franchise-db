// The social slice of the Big Brother event library — the house between the
// ceremonies. Runs through the REAL scheduler, and plays real seasons, because
// both bugs this file has already produced were invisible to unit tests.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { getBond } from '../js/bonds.js';
import { SOCIAL_EVENTS } from '../js/bb-events/social.js';
import { CEREMONY_EVENTS } from '../js/bb-events/ceremonies.js';
import { scheduleHouseBeats, houseEventState } from '../js/bb/house-events.js';
import { simulateBBSeason } from '../js/bb/week.js';
import { seedGame } from './helpers/setup.js';

// Gendered and with sexualities, or romanticCompat rejects every pair and the
// showmance event silently never fires — which is exactly what a first
// measurement did, and it read as a bug in the event rather than the cast.
const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
].map(([name, archetype, gender]) => ({ name, archetype, gender, sexuality: 'straight' }));

const HOUSE = CAST.map(p => p.name);
const ALL = [...SOCIAL_EVENTS, ...CEREMONY_EVENTS];

const seededRng = (seed = 7) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {};
  gs.showmances = [];
  gs.romanticSparks = [];
  seasonConfig.romance = 'enabled';
}

const ctxFor = (act = 'hoh', extra = {}) => ({
  act, beat: 0, hoh: 'A', nominees: ['B', 'C'], vetoWinner: null,
  week: { num: 2, plan: { target: 'B', pawn: 'C', backdoorTarget: null } }, ...extra,
});

describe('Big Brother social events', () => {
  beforeEach(reset);

  it('every event satisfies the scheduler contract', () => {
    for (const event of SOCIAL_EVENTS) {
      expect(typeof event.id).toBe('string');
      expect(event.category).toBe('social');
      expect(typeof event.weight).toBe('function');
      expect(typeof event.fire).toBe('function');
    }
    const ids = SOCIAL_EVENTS.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // THE regression that matters. An event whose weight() said "yes" while its
  // fire() had nobody to act on fell through to a filler beat with an empty
  // badgeClass — which the scheduler rejects by THROWING, taking the whole
  // season down. Anything weight() green-lights must produce a valid beat.
  it('anything it says can happen, it can actually narrate', () => {
    const acts = ['hoh', 'nominations', 'veto', 'veto-ceremony', 'campaign'];
    for (const event of SOCIAL_EVENTS) {
      for (const act of acts) {
        for (const size of [4, 6, 9, 12]) {
          reset();
          const house = HOUSE.slice(0, size);
          const ctx = ctxFor(act, { nominees: house.slice(1, 3) });
          if (event.weight(house, ctx) <= 0) continue;
          expect(() => scheduleHouseBeats([event], house, ctx, { rng: seededRng(), min: 1, max: 1 }))
            .not.toThrow();
        }
      }
    }
  });

  it('defers inside a ceremony, and fills the downtime around it', () => {
    // Same house, same week — only the act differs.
    const at = act => SOCIAL_EVENTS.reduce((sum, e) => sum + e.weight(HOUSE, ctxFor(act)), 0);
    reset();
    const downtime = at('hoh');
    const ceremony = at('nominations');
    expect(downtime).toBeGreaterThan(0);
    expect(ceremony).toBeGreaterThan(0);         // still possible, just quieter
    expect(ceremony).toBeLessThan(downtime * 0.5);
  });

  it('never lets a nice archetype plant a rumour', () => {
    // The franchise rule: villains scheme freely, nice archetypes never.
    const rumour = SOCIAL_EVENTS.find(e => e.id === 'social-rumour');
    seedGame(
      [['P', 'hero'], ['Q', 'loyal-soldier'], ['R', 'social-butterfly'], ['S', 'goat'], ['T', 'underdog']]
        .map(([name, archetype]) => ({ name, archetype })),
      { episode: 0, eliminated: [], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    expect(rumour.weight(['P', 'Q', 'R', 'S', 'T'], ctxFor())).toBe(0);
  });

  it('fires every event in real seasons — no dead code', () => {
    const fired = new Set();
    for (const seed of [11, 23, 44, 57, 68, 79, 91, 103, 117, 129]) {
      reset();
      const { weeks } = simulateBBSeason({ rng: seededRng(seed), finaleSize: 3, houseEvents: ALL });
      for (const act of weeks.flatMap(w => w.acts || [])) {
        (act.socialBeats || []).forEach(b => fired.add(b.eventId));
      }
    }
    const never = SOCIAL_EVENTS.map(e => e.id).filter(id => !fired.has(id));
    expect(never, `never fire in a real season: ${never.join(', ')}`).toEqual([]);
  });

  it('every beat changes something — no purely cosmetic events', () => {
    for (const event of SOCIAL_EVENTS) {
      reset();
      const ctx = ctxFor('hoh');
      if (event.weight(HOUSE, ctx) <= 0) continue;
      const before = JSON.stringify({ b: gs.bonds, p: gs.popularity, h: houseEventState(), s: gs.romanticSparks });
      scheduleHouseBeats([event], HOUSE, ctx, { rng: seededRng(), min: 1, max: 1 });
      const after = JSON.stringify({ b: gs.bonds, p: gs.popularity, h: houseEventState(), s: gs.romanticSparks });
      expect(after, `${event.id} fired without changing anything`).not.toBe(before);
    }
  });

  it('replays identically for the same seed', () => {
    const run = () => {
      reset();
      return scheduleHouseBeats(SOCIAL_EVENTS, HOUSE, ctxFor('hoh'), { rng: seededRng(4), min: 3, max: 3 })
        .map(b => b.text);
    };
    expect(run()).toEqual(run());
  });

  // The reason this library exists: the ceremonies were starved of the
  // relationships they read. Bonds must actually accumulate over a season.
  it('builds a connected house, which the ceremony events depend on', () => {
    const connectedness = library => {
      reset();
      simulateBBSeason({ rng: seededRng(31), finaleSize: 3, houseEvents: library });
      const values = Object.values(gs.bonds || {}).map(Math.abs);
      return values.filter(v => v >= 3).length;
    };
    const withoutSocial = connectedness(CEREMONY_EVENTS);
    const withSocial = connectedness(ALL);
    expect(withSocial).toBeGreaterThan(withoutSocial * 2);
  });
});
