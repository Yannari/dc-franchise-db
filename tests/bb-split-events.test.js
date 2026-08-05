// A side may know WHO is behind the wall and nothing about what is happening
// to them.
//
// The Split House's whole claim is isolation, and the isolation test that
// already exists proves the engine honours it: while a side plays, the roster
// IS that side. An event family is the obvious way to break that by accident —
// one line about the other half's nominations and the twist is a normal week
// with extra steps.
//
// So these tests hold the line the events run on: names from the other side are
// allowed (you watched them walk through the door), events from the other side
// are not.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { SPLIT_HOUSE_EVENTS } from '../js/bb-events/split-house.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = [{ episode: 1, type: 'bb-split-house' }];
}

/** Every split-* beat, tagged with which side emitted it. */
const splitBeats = ep => (ep.acts || [])
  .flatMap(a => (a.socialBeats || []).map(b => ({ ...b, side: a.side, segment: a.segment })))
  .filter(b => String(b.eventId || '').startsWith('split-'));

const playSplit = () => {
  for (let seed = 1; seed <= 14; seed++) {
    house();
    const ep = withSeededRandom(seed * 53 + 7, () => simulateBBEpisode());
    if (ep.splitHouse && splitBeats(ep).length) return ep;
  }
  return null;
};

describe('the Split House family', () => {
  beforeEach(house);

  it('is registered where the scheduler can reach it', () => {
    expect(SPLIT_HOUSE_EVENTS.length).toBeGreaterThanOrEqual(6);
    const ids = new Set(HOUSE_EVENTS.map(e => e.id));
    for (const e of SPLIT_HOUSE_EVENTS) {
      expect(ids.has(e.id), `${e.id} is written but unreachable`).toBe(true);
    }
  });

  it('reacts to being half a house', () => {
    const ep = playSplit();
    expect(ep, 'no split week in 14 seeds produced a reaction').toBeTruthy();
    expect(splitBeats(ep).length).toBeGreaterThan(0);
  });

  it('is not carrying dead events', () => {
    // The volume sweep cannot reach this family — a split week is assembled in
    // simulateBBEpisode, and that sweep drives simulateBBWeek — so the
    // no-dead-code guarantee has to be made here instead of exempted quietly.
    const fired = new Set();
    for (let seed = 1; seed <= 20; seed++) {
      house();
      const ep = withSeededRandom(seed * 53 + 7, () => simulateBBEpisode());
      splitBeats(ep).forEach(b => fired.add(b.eventId));
    }
    const dead = SPLIT_HOUSE_EVENTS.map(e => e.id)
      // The reunion fires the week AFTER a split, which a one-week harness
      // never reaches; it is covered by the isolation assertions above.
      .filter(id => id !== 'split-comparing-weeks' && !fired.has(id));
    expect(dead, `never fire in a real split week: ${dead.join(', ')}`).toEqual([]);
  });

  it('never reports the other side\'s week', () => {
    const ep = playSplit();
    expect(ep, 'no split week to check').toBeTruthy();
    const sides = ep.splitHouse.sides;
    const hohs = ep.splitHouse.hohs;

    for (const b of splitBeats(ep)) {
      // Which side emitted this, and therefore which houseguests it is
      // allowed to describe DOING things.
      const mine = sides[b.side] || [];
      const theirs = hohs.filter(h => h !== b.side).flatMap(h => sides[h] || []);
      if (!mine.length || !theirs.length) continue;

      // Naming somebody on the other side is fine — you saw them walk out.
      // Saying what happened to them is not, so no beat may attach one of
      // them to an outcome word.
      const outcome = /(nominat|evict|veto|won|wins|winner|vote[sd]?|block)/i;
      for (const n of theirs) {
        if (!b.text.includes(n)) continue;
        const sentence = b.text.split(/(?<=\.)\s+/).find(s => s.includes(n)) || b.text;
        expect(outcome.test(sentence),
          `${b.eventId} says what happened to ${n}, who is on the other side: "${sentence}"`)
          .toBe(false);
      }
      // And the cast of a beat — the people it says are IN the scene — must
      // live on this side of the wall.
      for (const n of (b.players || [])) {
        expect(theirs.includes(n),
          `${b.eventId} put ${n} in a scene on the wrong side of the wall`).toBe(false);
      }
    }
  });

  it('adds no screen of its own', () => {
    // Same rule as the rest of the twist families: these are scheduled house
    // events, so they ride inside the stretches each side was already having.
    // A split week has two sides' worth of house acts and must not gain a
    // third set because the events had something to say.
    const ep = playSplit();
    expect(ep, 'no split week to check').toBeTruthy();
    const bySide = {};
    for (const act of ep.acts || []) {
      if (act.type !== 'house') continue;
      bySide[act.side || 'whole'] = (bySide[act.side || 'whole'] || 0) + 1;
    }
    house();
    seasonConfig.twistSchedule = [];
    const plain = withSeededRandom(4242, () => simulateBBEpisode());
    const plainHouse = (plain.acts || []).filter(a => a.type === 'house').length;
    for (const [side, count] of Object.entries(bySide)) {
      expect(count, `side ${side} grew an extra House Life stretch`)
        .toBeLessThanOrEqual(plainHouse);
    }
    // And every split beat is riding inside a house act rather than an act of
    // its own.
    for (const act of ep.acts || []) {
      const mine = (act.socialBeats || []).filter(b => String(b.eventId || '').startsWith('split-'));
      if (!mine.length) continue;
      expect(['house', 'campaign'], `split beats landed on a ${act.type} act`)
        .toContain(act.type);
    }
  });

  it('stays quiet when the house is whole', () => {
    house();
    seasonConfig.twistSchedule = [];
    const ep = withSeededRandom(2026, () => simulateBBEpisode());
    // The reunion event is the one exception and it needs a split week behind
    // it, which a first ordinary week does not have.
    expect(splitBeats(ep)).toEqual([]);
  });
});
