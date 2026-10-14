// Where a private conversation goes (js/bb/story/places.js): the user, 2026-10-13, "the spots are
// underutilized". A deal goes somewhere nobody hears it (the storage room, the pier, a pond), a
// couple somewhere nice, somebody upset behind a door; two scenes never share a spot in a stretch;
// a scene that sits on a bed never moves to the island.
import { describe, it, expect } from 'vitest';
import { spotFor, SPOTS, onIsland, openingAt } from '../js/bb/story/places.js';
import { RESORT } from '../js/vp-bb-ep/resort.js';

const ctxOf = (stretch, extra = {}) => ({ week: { num: 3 }, stretch, present: [], ...extra });
const spots = (kind, n = 200, text = '', cast = ['A', 'B']) => Array.from({ length: n }, (_, i) => spotFor(kind, cast, ctxOf(1000 + i), `s${i}`, text)).filter(Boolean);

describe('places for private conversations', () => {
  it('every spot is a plate the house has built', () => {
    for (const id of Object.keys(SPOTS)) expect(RESORT.have.default?.[id], id).toBeTruthy();
  });

  it('sends some deals to the island and some to the storage room, never all of them anywhere', () => {
    const got = spots('alliance.checkin.solid');
    expect(got.length).toBeGreaterThan(60);
    expect(got.length).toBeLessThan(140);
    expect(got.some(s => onIsland(s.spot))).toBe(true);
    expect(got.some(s => s.room === 'storage-room')).toBe(true);
  });

  it('a couple goes somewhere for a couple, somebody upset somewhere alone, the HOH home', () => {
    for (const s of spots('showmance.spark.any')) expect(['beach-shoreline', 'beach-loungers', 'dock', 'pool-edge', 'balcony', 'lagoon', 'havenot']).toContain(s.spot);
    for (const s of spots('life.homesick.alone')) expect(['bathroom', 'beach-shoreline', 'balcony', 'pond-north', 'havenot']).toContain(s.spot);
    const hoh = Array.from({ length: 100 }, (_, i) => spotFor('talk.hohweek.plan.quiet', ['H', 'B'], ctxOf(2000 + i, { hoh: 'H' }), `h${i}`)).filter(Boolean);
    expect(hoh.length).toBeGreaterThan(0);
    for (const s of hoh) expect(s.spot).toBe('hoh-suite');
  });

  it('a scene on a bed or at the kitchen counter never moves to the island', () => {
    for (const s of spots('alliance.checkin.solid', 200, 'Two beds over, Leonard is asleep.')) expect(onIsland(s.spot)).toBe(false);
    for (const s of spots('target.gossip.any', 200, 'They lean on the kitchen counter.')) expect(onIsland(s.spot)).toBe(false);
  });

  it('two conversations never share a spot in the same stretch', () => {
    const ctx = ctxOf(7);
    const got = Array.from({ length: 60 }, (_, i) => spotFor('alliance.checkin.solid', ['A', 'B'], ctx, `same${i}`)).filter(Boolean).map(s => s.spot);
    expect(new Set(got).size).toBe(got.length);
  });

  it('a crowd stays in the house; a public moment is not private', () => {
    expect(spots('alliance.checkin.solid', 100, '', ['A', 'B', 'C', 'D', 'E'])).toHaveLength(0);
    expect(spots('life.banter.any')).toHaveLength(0);
  });

  it('a scene moved to a spot opens there, with its own people', () => {
    expect(openingAt('pier-east', ['Will', 'Ryan'], 'x')).toMatch(/pier/);
    expect(openingAt('storage', ['Will', 'Ryan'], 'y')).not.toMatch(/\{[ab]\}/);
  });
});
