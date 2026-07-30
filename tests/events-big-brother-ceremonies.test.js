// The ceremonies slice of the Big Brother event library.
//
// These run through the REAL scheduler in js/bb/house-events.js rather than a
// stand-in, so the suite fails if the event contract drifts — which is the whole
// point of writing one category before writing a hundred more events.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs } from '../js/core.js';
import { addBond, getBond, addPerceivedBond } from '../js/bonds.js';
import { CEREMONY_EVENTS } from '../js/bb-events/ceremonies.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { scheduleHouseBeats, houseEventState } from '../js/bb/house-events.js';
import { rememberStrategy } from '../js/strategy-memory.js';
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

// A full-size house, for the season-level checks. Rare events need room and
// weeks to happen in.
const BIG_CAST = [
  ...CAST,
  ['K', 'hothead'], ['L', 'wildcard'], ['M', 'chaos-agent'], ['N', 'perceptive-player'],
].map(entry => (Array.isArray(entry) ? { name: entry[0], archetype: entry[1] } : entry));

function resetBig() {
  seedGame(BIG_CAST, { episode: 0, eliminated: [], namedAlliances: [] });
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

  // ── the layering: relationships must actually change outcomes ────────
  //
  // These are the tests that matter. An event library that consults only stats
  // produces the same beat between strangers and between people who have already
  // betrayed each other, which is the failure mode this whole layer exists to
  // avoid. Each case below asserts that the WORLD, not the dice, moved the beat.

  it('will not call it a blindside between strangers', () => {
    const blindside = CEREMONY_EVENTS.find(e => e.id === 'nom-blindside');
    reset();
    // No bond, no promise, no alliance — nobody was betrayed here.
    expect(blindside.weight(HOUSE, nomCtx())).toBe(0);
  });

  it('weights a blindside by how much trust there was to break', () => {
    const blindside = CEREMONY_EVENTS.find(e => e.id === 'nom-blindside');
    reset();
    addBond('A', 'B', 3);
    const mild = blindside.weight(HOUSE, nomCtx());
    reset();
    addBond('A', 'B', 9);
    const deep = blindside.weight(HOUSE, nomCtx());
    expect(mild).toBeGreaterThan(0);
    expect(deep).toBeGreaterThan(mild);
  });

  it('hurts more when the betrayal broke a promise on the record', () => {
    const blindside = CEREMONY_EVENTS.find(e => e.id === 'nom-blindside');
    const damage = withPromise => {
      reset();
      addBond('A', 'B', 6);
      // Canonical store — gs.bb keeps no memory of its own any more.
      if (withPromise) rememberStrategy('B', 'A', 'promise', 0, 1, {});
      const before = getBond('A', 'B');
      scheduleHouseBeats([blindside], HOUSE, nomCtx(), { rng: seededRng(), min: 1, max: 1 });
      return before - getBond('A', 'B');
    };
    expect(damage(true)).toBeGreaterThan(damage(false));
  });

  it('only costs the HOH publicly when the house could see the alliance', () => {
    const blindside = CEREMONY_EVENTS.find(e => e.id === 'nom-blindside');
    const hohStanding = visible => {
      reset();
      addBond('A', 'B', 7);
      // A hidden alliance: the pair are close, the house believes otherwise.
      if (!visible) addPerceivedBond('B', 'A', 0, 'kept it quiet');
      scheduleHouseBeats([blindside], HOUSE, nomCtx(), { rng: seededRng(), min: 1, max: 1 });
      return gs.popularity.A || 0;
    };
    // Betraying an ally in public costs standing; doing it in secret does not.
    expect(hohStanding(false)).toBeGreaterThan(hohStanding(true));
  });

  it('gives a burned pawn less comfort than a trusting one', () => {
    const pawnDeal = CEREMONY_EVENTS.find(e => e.id === 'nom-pawn-reassured');
    const gained = burned => {
      reset();
      addBond('A', 'C', 5);
      if (burned) rememberStrategy('C', 'A', 'betrayal', 0, 3, {});
      const before = getBond('A', 'C');
      scheduleHouseBeats([pawnDeal], HOUSE, nomCtx(), { rng: seededRng(), min: 1, max: 1 });
      return getBond('A', 'C') - before;
    };
    expect(gained(true)).toBeLessThan(gained(false));
  });

  it('treats an ally sitting on the veto as worse than a stranger doing it', () => {
    const left = CEREMONY_EVENTS.find(e => e.id === 'veto-left-on-block');
    const ctx = extra => nomCtx({ act: 'veto-ceremony', used: false, vetoWinner: 'D', nominees: ['B', 'C'], ...extra });
    reset();
    addBond('B', 'D', 8);
    gs.namedAlliances = [{ name: 'The Deal', members: ['B', 'D'] }];
    const allied = left.weight(HOUSE, ctx());
    reset();
    const strangers = left.weight(HOUSE, ctx());
    expect(allied).toBeGreaterThan(strangers);
  });

  // Every event above passed its unit test while five of the nine could never
  // fire in a real season, because the scheduler's ctx carries none of the
  // act's own fields. Only playing seasons caught it, so a season is played here.
  // Runs the FULL library, not ceremonies alone. A house with only ceremony
  // events barely develops any bonds, so a veto used to save someone OTHER than
  // its winner almost never happens — it fired four times in forty seasons that
  // way. That is an artefact of the isolated setup, not of the event: in a real
  // season the social library builds the relationships these turn on.
  it('every event actually fires in real seasons — no dead code', () => {
    const fired = new Set();
    // A full house over many seasons. The rarest event here — a genuine
    // cross-week blindside — lands under once a season by design, so a short
    // sample would fail this for the wrong reason.
    for (const seed of [11, 23, 44, 57, 68, 79, 91, 103, 117, 129, 141, 153, 165, 177, 189, 201]) {
      resetBig();
      const { weeks } = simulateBBSeason({ rng: seededRng(seed), finaleSize: 3, houseEvents: HOUSE_EVENTS });
      for (const act of weeks.flatMap(w => w.acts || [])) {
        (act.socialBeats || []).forEach(b => fired.add(b.eventId));
      }
    }
    const never = CEREMONY_EVENTS.map(e => e.id).filter(id => !fired.has(id));
    expect(never, `these events never fire in a real season: ${never.join(', ')}`).toEqual([]);
  });

  it('does not treat a promise made this ceremony as a betrayal by it', () => {
    const blindside = CEREMONY_EVENTS.find(e => e.id === 'nom-blindside');
    reset();
    // "You're only a pawn", said during THIS week's nomination act. The nominee
    // is already on the block; that promise cannot be what betrayed them.
    rememberStrategy('B', 'A', 'promise', 1, 1, {});   // made in week 1
    expect(blindside.weight(HOUSE, nomCtx({ week: { num: 1, plan: {} } }))).toBe(0);
    // The same promise, made a week earlier and broken now, is a betrayal.
    expect(blindside.weight(HOUSE, nomCtx({ week: { num: 2, plan: {} } }))).toBeGreaterThan(0);
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
        // Farewell speeches are ceremony events too, and they fire on
        // eviction night.
        expect(['nominations', 'veto-ceremony', 'eviction']).toContain(act.type);
      }
    }
  });
});
