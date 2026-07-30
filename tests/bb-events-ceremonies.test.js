// The ceremonies slice of the Big Brother event library.
//
// These run through the REAL scheduler in js/bb/house-events.js rather than a
// stand-in, so the suite fails if the event contract drifts — which is the whole
// point of writing one category before writing a hundred more events.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs } from '../js/core.js';
import { CEREMONY_EVENTS } from '../js/bb-events/ceremonies.js';
import { scheduleHouseBeats, houseEventState } from '../js/bb/house-events.js';
import { simulateBBSeason } from '../js/bb/week.js';
import { seedGame } from './helpers/setup.js';

const CAST = [
  ['A', 'mastermind'], ['B', 'social-butterfly'], ['C', 'challenge-beast'], ['D', 'schemer'],
  ['E', 'hero'], ['F', 'floater'], ['G', 'villain'], ['H', 'loyal-soldier'],
  ['I', 'underdog'], ['J', 'goat'],
].map(([name, archetype]) => ({ name, archetype }));

const HOUSE = CAST.map(p => p.name);

function seededRng(seed = 7) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {};
}

// A nomination-act context of the shape week.js builds.
function nomCtx(extra = {}) {
  return {
    act: 'nominations', beat: 0, hoh: 'A', nominees: ['B', 'C'],
    target: 'B', pawn: 'C', vetoWinner: null,
    week: { num: 1, plan: { target: 'B', pawn: 'C', backdoorTarget: null } },
    ...extra,
  };
}

describe('Big Brother ceremony events', () => {
  beforeEach(reset);

  it('every event satisfies the scheduler contract', () => {
    for (const event of CEREMONY_EVENTS) {
      expect(typeof event.id).toBe('string');
      expect(event.category).toBe('ceremonies');
      expect(typeof event.weight).toBe('function');
      expect(typeof event.fire).toBe('function');
    }
    const ids = CEREMONY_EVENTS.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('fires through the real scheduler and returns renderable beats', () => {
    const beats = scheduleHouseBeats(CEREMONY_EVENTS, HOUSE, nomCtx(), { rng: seededRng(), min: 1, max: 3 });
    expect(beats.length).toBeGreaterThan(0);
    for (const beat of beats) {
      // validateBeat would have thrown, but assert the shape the VP relies on.
      expect(beat.text.trim().length).toBeGreaterThan(30);
      expect(Array.isArray(beat.players)).toBe(true);
      expect(beat.players.length).toBeGreaterThan(0);
      expect(beat.badgeText).toBeTruthy();
      expect(beat.badgeClass).toBeTruthy();
      expect(beat.eventId).toBeTruthy();
    }
  });

  it('never fires an event outside its own act', () => {
    for (const event of CEREMONY_EVENTS) {
      const wrongAct = { ...nomCtx(), act: 'hoh' };
      const vetoOnly = event.id.startsWith('veto-');
      const weight = event.weight(HOUSE, wrongAct);
      expect(weight).toBe(0);
      if (vetoOnly) expect(event.weight(HOUSE, nomCtx())).toBe(0);
    }
  });

  it('every beat changes something — no purely cosmetic events', () => {
    for (const event of CEREMONY_EVENTS) {
      reset();
      const ctx = event.id.startsWith('veto-')
        ? nomCtx({ act: 'veto-ceremony', vetoWinner: 'D', used: true, saved: 'B', replacement: 'F' })
        : nomCtx();
      if (event.weight(HOUSE, ctx) <= 0) continue;

      const before = JSON.stringify({ pop: gs.popularity, house: houseEventState() });
      scheduleHouseBeats([event], HOUSE, ctx, { rng: seededRng(), min: 1, max: 1 });
      const after = JSON.stringify({ pop: gs.popularity, house: houseEventState() });
      expect(after, `${event.id} fired without changing any state`).not.toBe(before);
    }
  });

  it('picks text deterministically, so a seeded season replays identically', () => {
    const run = () => {
      reset();
      return scheduleHouseBeats(CEREMONY_EVENTS, HOUSE, nomCtx(), { rng: seededRng(4), min: 2, max: 2 })
        .map(b => b.text);
    };
    expect(run()).toEqual(run());
  });

  it('varies its text across weeks rather than repeating one line', () => {
    const texts = new Set();
    for (let week = 1; week <= 6; week++) {
      reset();
      const beats = scheduleHouseBeats([CEREMONY_EVENTS[0]], HOUSE,
        nomCtx({ week: { num: week, plan: {} } }), { rng: seededRng(1), min: 1, max: 1 });
      beats.forEach(b => texts.add(b.text));
    }
    expect(texts.size).toBeGreaterThan(1);
  });

  it('only backdoors when the replacement was the plan', () => {
    const backdoor = CEREMONY_EVENTS.find(e => e.id === 'veto-backdoor-lands');
    const planned = nomCtx({
      act: 'veto-ceremony', used: true, replacement: 'F', vetoWinner: 'D',
      week: { num: 1, plan: { backdoorTarget: 'F' } },
    });
    const unplanned = nomCtx({
      act: 'veto-ceremony', used: true, replacement: 'F', vetoWinner: 'D',
      week: { num: 1, plan: { backdoorTarget: null } },
    });
    expect(backdoor.weight(HOUSE, planned)).toBeGreaterThan(0);
    expect(backdoor.weight(HOUSE, unplanned)).toBe(0);
  });

  it('drops into a real season without breaking the engine', () => {
    reset();
    const { weeks } = simulateBBSeason({ rng: seededRng(9), finaleSize: 3, houseEvents: CEREMONY_EVENTS });
    expect(weeks.length).toBeGreaterThan(0);

    const fired = weeks.flatMap(w => (w.acts || []).flatMap(a => a.socialBeats || []));
    expect(fired.length).toBeGreaterThan(0);
    // Ceremony events must only ever appear in ceremony acts.
    for (const act of weeks.flatMap(w => w.acts || [])) {
      if (!(act.socialBeats || []).length) continue;
      if (act.socialBeats.some(b => b.category === 'ceremonies')) {
        expect(['nominations', 'veto-ceremony']).toContain(act.type);
      }
    }
  });
});
