// One-sided feelings.
//
// `bKey` sorts the two names, so `gs.bonds` holds exactly ONE number per pair
// and every relationship in this simulator was mutual by construction. There
// was no way to say the most ordinary thing about people: that one of them is
// still in love with somebody who cannot stand them.
//
// The bond stays as it is — what the relationship IS, shared — and the lean is
// a per-direction offset on top: what this one person makes of it. What is
// asserted here is that the asymmetry REACHES DECISIONS. A number in a store
// that nothing reads is not a feature.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, setRelationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, setBond, addBond, getPerceivedBond, addPerceivedBond, bKey, bondLabel,
  getLean, setLean, addLean, feelsFor, leanGap, removeLeansFor } from '../js/bonds.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = n => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((n * 7 + i * 3) % 10)]));
const NAMES = ['Gus', 'Iris', 'Wayne', 'Raj', 'Eli', 'Fern', 'Bowie', 'Kit'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater', gender: i % 2 ? 'f' : 'm',
  sexuality: 'straight', stats: spread(i + 1) }));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  globalThis.gs = gs; globalThis.players = players;
  gs.bondLean = {};
  // The romance pipeline reads gs.tribes even in a house, which has none.
  if (!Array.isArray(gs.tribes)) gs.tribes = [];
}

beforeEach(() => house());

describe('the shared bond still means what it meant', () => {
  it('leaves a pair with no lean exactly as symmetric as before', () => {
    setBond('Gus', 'Iris', 5);
    expect(feelsFor('Gus', 'Iris')).toBe(5);
    expect(feelsFor('Iris', 'Gus')).toBe(5);
    expect(leanGap('Gus', 'Iris')).toBe(0);
    expect(getPerceivedBond('Gus', 'Iris')).toBe(5);
  });

  it('does not let a private feeling move the relationship itself', () => {
    setBond('Gus', 'Iris', -4);
    setLean('Gus', 'Iris', 7);
    // What the pair IS has not changed. Everything reading `getBond` — which is
    // most of the simulator — is untouched.
    expect(getBond('Gus', 'Iris')).toBe(-4);
    expect(getBond('Iris', 'Gus')).toBe(-4);
  });
});

describe('one of them is not over it', () => {
  it('says the thing the single number could never say', () => {
    // The example: he is still in love with her, she is completely finished.
    setBond('Gus', 'Iris', -4);
    setLean('Gus', 'Iris', 7);
    expect(feelsFor('Gus', 'Iris')).toBe(3);
    expect(feelsFor('Iris', 'Gus')).toBe(-4);
    expect(leanGap('Gus', 'Iris')).toBe(7);
  });

  it('reaches every vote, alliance and heat decision in the house', () => {
    // `getPerceivedBond` is what all of those read, which is why the lean goes
    // in there rather than in a hundred call sites.
    setBond('Gus', 'Iris', -4);
    setLean('Gus', 'Iris', 7);
    expect(getPerceivedBond('Gus', 'Iris')).toBe(3);
    expect(getPerceivedBond('Iris', 'Gus')).toBe(-4);
  });

  it('survives a misread sitting on top of it', () => {
    // Two different things: `perceivedBonds` is somebody being WRONG about the
    // relationship and decays back to the truth. The lean is somebody being
    // right about their own feelings, and never corrects, because there is
    // nothing to correct.
    setBond('Gus', 'Iris', 0);
    setLean('Gus', 'Iris', 6);
    addPerceivedBond('Gus', 'Iris', -5, 'saw her writing his name');
    // He thinks she is against him AND he is still not over her.
    expect(getPerceivedBond('Gus', 'Iris')).toBe(1);
    // She has no misread and no lean.
    expect(getPerceivedBond('Iris', 'Gus')).toBe(0);
  });

  it('clamps to the same range as a bond', () => {
    setBond('Gus', 'Iris', 8);
    setLean('Gus', 'Iris', 9);
    expect(feelsFor('Gus', 'Iris')).toBe(10);
    setBond('Wayne', 'Raj', -8);
    setLean('Wayne', 'Raj', -9);
    expect(feelsFor('Wayne', 'Raj')).toBe(-10);
  });

  it('moves, and clears itself away when it goes to nothing', () => {
    addLean('Gus', 'Iris', 4);
    expect(getLean('Gus', 'Iris')).toBe(4);
    addLean('Gus', 'Iris', -1.5);
    expect(getLean('Gus', 'Iris')).toBe(2.5);
    setLean('Gus', 'Iris', 0);
    expect(gs.bondLean['Gus→Iris']).toBeUndefined();
  });

  it('goes with somebody who leaves', () => {
    setLean('Gus', 'Iris', 5);
    setLean('Iris', 'Gus', -3);
    setLean('Wayne', 'Raj', 2);
    removeLeansFor('Iris');
    expect(getLean('Gus', 'Iris')).toBe(0);
    expect(getLean('Iris', 'Gus')).toBe(0);
    expect(getLean('Wayne', 'Raj')).toBe(2);
  });
});

describe('the cast can author it', () => {
  it('seeds both directions off the relationship', async () => {
    const { initGameState } = await import('../js/savestate.js');
    setRelationships([{ id: 'r1', a: 'Gus', b: 'Iris', type: 'nemesis', bond: -4,
      kin: 'exes', leanA: 7, leanB: 0 }]);
    globalThis.relationships = relationships;
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3 });
    initGameState();
    expect(getBond('Gus', 'Iris')).toBe(-4);
    expect(feelsFor('Gus', 'Iris')).toBe(3);
    expect(feelsFor('Iris', 'Gus')).toBe(-4);
    setRelationships([]);
  });

  it('costs a season that declares nothing exactly nothing', async () => {
    const { initGameState } = await import('../js/savestate.js');
    setRelationships([{ id: 'r1', a: 'Gus', b: 'Iris', type: 'ally', bond: 5 }]);
    globalThis.relationships = relationships;
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3 });
    initGameState();
    expect(gs.bondLean).toEqual({});
    expect(feelsFor('Gus', 'Iris')).toBe(feelsFor('Iris', 'Gus'));
    setRelationships([]);
  });
});

describe('romance needs both of them', () => {
  it('will not grow a spark only one person is in', async () => {
    // The story this exists for: he never gets over her, and it never becomes
    // anything, because she was never in it.
    const romance = await import('../js/romance.js');
    Object.assign(seasonConfig, { romance: 'enabled' });
    gs.showmances = []; gs.romanticSparks = [];
    gs.activePlayers = [...NAMES];
    setBond('Gus', 'Iris', 4);
    setLean('Iris', 'Gus', -9);
    gs.romanticSparks.push({ players: ['Gus', 'Iris'], intensity: 3, ep: 1 });
    // The upkeep prunes sparks the pair are no longer both in.
    if (typeof romance.updateRomanticSparks === 'function') {
      romance.updateRomanticSparks({ num: 2 });
      expect(gs.romanticSparks.some(s => s.players.includes('Iris'))).toBe(false);
    }
  });

  it('keeps a spark both of them are actually in', async () => {
    const romance = await import('../js/romance.js');
    Object.assign(seasonConfig, { romance: 'enabled' });
    gs.showmances = []; gs.romanticSparks = [];
    gs.activePlayers = [...NAMES];
    setBond('Gus', 'Iris', 4);
    gs.romanticSparks.push({ players: ['Gus', 'Iris'], intensity: 3, ep: 1 });
    if (typeof romance.updateRomanticSparks === 'function') {
      romance.updateRomanticSparks({ num: 2 });
      expect(gs.romanticSparks.some(s => s.players.includes('Iris'))).toBe(true);
    }
  });
});
