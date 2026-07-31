// Total Drama's social schemes, played in a house.
//
// These are a BRIDGE, not a reimplementation: the generators in
// js/social-manipulation.js do the work and apply their own consequences, and
// js/bb-events/schemes.js decides who schemes, when, and in which room. So
// what is worth testing is the seam — that the house calls them with the shape
// they expect, that a seeded season stays reproducible even though the
// generators reach for Math.random internally, and that the one event the
// no-dead-code sweep exempts genuinely works when its conditions align.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns, romanticCompat } from '../js/players.js';
import { getBond, setBond, getPerceivedBond } from '../js/bonds.js';
import { SCHEME_EVENTS } from '../js/bb-events/schemes.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { createHouseEventApi } from '../js/bb/house-events.js';
import { seedGame } from './helpers/setup.js';
import { seededRandom } from './helpers/rng.js';

const CAST = [
  { name: 'A', gender: 'm', sexuality: 'straight', archetype: 'villain' },
  { name: 'B', gender: 'f', sexuality: 'straight', archetype: 'hero' },
  { name: 'C', gender: 'm', sexuality: 'straight', archetype: 'hero' },
  { name: 'D', gender: 'f', sexuality: 'straight', archetype: 'floater' },
  { name: 'E', gender: 'm', sexuality: 'straight', archetype: 'goat' },
  { name: 'F', gender: 'f', sexuality: 'straight', archetype: 'loyal-soldier' },
];
const HOUSE = CAST.map(p => p.name);

function reset() {
  seedGame(CAST, { episode: 4, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond, romanticCompat });
  seasonConfig.romance = 'enabled';
  gs.isMerged = true;
  gs.tribes = [];
  gs.showmances = [];
  gs.romanticSparks = [];
}

const ctx = { act: 'house', phase: 'post-noms', week: { num: 4 }, beat: 0, nominees: ['E', 'F'] };

describe('the scheme bridge', () => {
  it('registers every scheme in the house library', () => {
    for (const ev of SCHEME_EVENTS) {
      expect(HOUSE_EVENTS, `${ev.id} not registered`).toContain(ev);
      expect(typeof ev.weight).toBe('function');
      expect(typeof ev.fire).toBe('function');
      expect(ev.location, `${ev.id} has no room`).toBeTruthy();
    }
  });

  it('never says tribe in a house', () => {
    reset();
    setBond('A', 'B', 3);
    const api = createHouseEventApi(ctx);
    for (const ev of SCHEME_EVENTS) {
      if (ev.weight(HOUSE, ctx) <= 0) continue;
      const beat = ev.fire(HOUSE, ctx, api, seededRandom(9));
      expect(beat.text, `${ev.id} says tribe`).not.toMatch(/\btribes?\b/i);
    }
  });

  it('always returns something renderable, even when the cast falls through', () => {
    reset();   // no bonds, no showmances: most schemes have nobody to work with
    const api = createHouseEventApi(ctx);
    for (const ev of SCHEME_EVENTS) {
      if (ev.weight(HOUSE, ctx) <= 0) continue;
      const beat = ev.fire(HOUSE, ctx, api, seededRandom(3));
      expect(beat, `${ev.id} returned nothing`).toBeTruthy();
      expect(typeof beat.text).toBe('string');
      expect(beat.text.length).toBeGreaterThan(0);
      expect(Array.isArray(beat.players)).toBe(true);
      expect(beat.badgeText).toBeTruthy();
      expect(beat.badgeClass).toBeTruthy();
    }
  });

  it('stays reproducible despite the generators using Math.random', () => {
    const run = () => {
      reset();
      setBond('A', 'B', 4);
      setBond('A', 'D', 4);
      const api = createHouseEventApi(ctx);
      return SCHEME_EVENTS
        .filter(ev => ev.weight(HOUSE, ctx) > 0)
        .map(ev => ev.fire(HOUSE, ctx, api, seededRandom(2024)).text);
    };
    expect(run()).toEqual(run());
  });

  it('leaves Math.random alone afterwards', () => {
    reset();
    setBond('A', 'B', 4);
    const before = Math.random;
    SCHEME_EVENTS[0].fire(HOUSE, ctx, createHouseEventApi(ctx), seededRandom(5));
    expect(Math.random).toBe(before);
  });

  // The one event the no-dead-code sweep exempts. It is exempt because its
  // four prerequisites never aligned across twenty seeded seasons — NOT
  // because it is broken, which is what this proves.
  it('fires the kiss trap when its conditions actually align', () => {
    reset();
    // The generator kisses the higher-mental partner, so she has to be the one
    // a straight male schemer is plausible with.
    gs.showmances = [{ players: ['B', 'C'], phase: 'honeymoon', sparkEp: 2 }];
    players.find(p => p.name === 'B').stats.mental = 9;
    players.find(p => p.name === 'C').stats.mental = 2;
    players.find(p => p.name === 'D').stats.social = 8;
    setBond('D', 'A', 4);   // an accomplice who trusts the schemer

    const ev = SCHEME_EVENTS.find(e => e.id === 'scheme-kiss-trap');
    expect(ev.weight(HOUSE, ctx), 'not eligible with a valid setup').toBeGreaterThan(0);
    const beat = ev.fire(HOUSE, ctx, createHouseEventApi(ctx), seededRandom(7));
    expect(beat.text.length).toBeGreaterThan(40);
    expect(beat.badgeText).not.toBe('NOTHING COMES OF IT');
    expect(beat.players).toContain('A');
  });

  it('does not offer the kiss trap when there is no showmance to break', () => {
    reset();
    const ev = SCHEME_EVENTS.find(e => e.id === 'scheme-kiss-trap');
    expect(ev.weight(HOUSE, ctx)).toBe(0);
  });
});
