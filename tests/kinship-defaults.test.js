// "It seems like the only event playing when they're exes."
//
// Correct, and measurable: two ex pairs across five eight-week seasons produced
// kin-ex-cold-war and nothing else, ever.
//
// The cause was not the events. Init seeded bonds and leans ONLY from authored
// numbers, so marking two people as exes and leaving the sliders alone produced
// a pair sitting at exactly zero, symmetrically — arithmetically identical to
// two strangers who had never met.
//
// The three ex beats divide that space between them: one for a pair still warm
// on both sides, one for a pair pulling in different directions, one for a pair
// who are finished. A pair at 0/0 with no gap can only be the third — and the
// third deals them -1.1 when it fires, which keeps them there.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, players, seasonConfig, relationships, setPlayers, setGs,
  setRelationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel, feelsFor, leanGap } from '../js/bonds.js';
import { initGameState } from '../js/savestate.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

function cast(rels) {
  setGs(null);
  setPlayers(NAMES.map((name, i) => ({ name, slug: name.toLowerCase(),
    gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: 'floater',
    stats: Object.fromEntries(KEYS.map((k, j) => [k, 1 + ((i * 7 + j * 3) % 10)])) })));
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats,
    pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, seasonNumber: 1 });
  seasonConfig.twistSchedule = [];
  setRelationships(rels);
  initGameState();
  globalThis.gs = gs;
}

beforeEach(() => setRelationships([]));

describe('a kinship nobody priced still means something', () => {
  it('does not open two exes at exactly neutral', () => {
    cast([{ a: 'Bowie', b: 'Chase', kin: 'exes' }]);
    expect(getBond('Bowie', 'Chase'), 'exes started as strangers').not.toBe(0);
  });

  it('opens them lopsided, because nobody is equally over it', () => {
    // The asymmetry is the important half: it is the entire input to the
    // unrequited read, and nothing in a week generates it on its own.
    cast([{ a: 'Bowie', b: 'Chase', kin: 'exes' }]);
    expect(leanGap('Bowie', 'Chase'), 'both equally over it').toBeGreaterThan(1.5);
  });

  it('lets one of them still be warm about it', () => {
    cast([{ a: 'Bowie', b: 'Chase', kin: 'exes' }]);
    const warm = Math.max(feelsFor('Bowie', 'Chase'), feelsFor('Chase', 'Bowie'));
    const cold = Math.min(feelsFor('Bowie', 'Chase'), feelsFor('Chase', 'Bowie'));
    expect(warm, 'neither of them carries anything').toBeGreaterThan(cold);
  });

  it('opens a marriage warm and an estrangement cold', () => {
    cast([{ a: 'Bowie', b: 'Chase', kin: 'married' },
      { a: 'Scary', b: 'Nichelle', kin: 'estranged' }]);
    expect(getBond('Bowie', 'Chase')).toBeGreaterThan(3);
    expect(getBond('Scary', 'Nichelle')).toBeLessThan(0);
  });
});

describe('it never argues with the person who authored it', () => {
  it('keeps an authored bond', () => {
    cast([{ a: 'Bowie', b: 'Chase', kin: 'exes', bond: 7 }]);
    expect(getBond('Bowie', 'Chase')).toBe(7);
  });

  it('keeps authored leans', () => {
    cast([{ a: 'Bowie', b: 'Chase', kin: 'exes', bond: 0, leanA: 5, leanB: -5 }]);
    expect(feelsFor('Bowie', 'Chase')).toBe(5);
    expect(feelsFor('Chase', 'Bowie')).toBe(-5);
  });

  it('leaves a relationship with no kinship alone', () => {
    cast([{ a: 'Bowie', b: 'Chase', bond: 2 }]);
    expect(getBond('Bowie', 'Chase')).toBe(2);
    expect(leanGap('Bowie', 'Chase')).toBe(0);
  });
});

describe('the same cast opens the same way', () => {
  it('is derived from the pair, not rolled', () => {
    // A replayed season has to start where it started the first time.
    const read = () => {
      cast([{ a: 'Bowie', b: 'Chase', kin: 'exes' }]);
      return [feelsFor('Bowie', 'Chase'), feelsFor('Chase', 'Bowie')];
    };
    expect(read()).toEqual(read());
  });

  it('does not make the same person warmer in every pairing', () => {
    // Which of the two is further into it comes from the pair, so it varies.
    const warmerIsFirst = [];
    for (const [a, b] of [['Bowie', 'Chase'], ['Scary', 'Nichelle'],
      ['Ripper', 'Axel'], ['Zee', 'Brightly']]) {
      cast([{ a, b, kin: 'exes' }]);
      warmerIsFirst.push(feelsFor(a, b) > feelsFor(b, a));
    }
    expect(new Set(warmerIsFirst).size, 'the first name is always the warm one').toBe(2);
  });
});
