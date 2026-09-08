// ══════════════════════════════════════════════════════════════════════
// dr-lipsync.test.js — lip sync for your life
// ══════════════════════════════════════════════════════════════════════
//
// The user's ordering, and it is the whole feel of the thing: lipsync is
// always the heaviest stat, dance is ALWAYS present because knowing how to
// move helps on any song, and the mood decides which third stat carries it.
// The doubles are earned by the performances, never rolled.
import { describe, expect, it } from 'vitest';
import { lipsyncScore, lipsyncCall } from '../js/dr/lipsync.js';
import { songById, SONGS } from '../js/dr/data/songs.js';
import { rngFor } from '../js/dr/rng.js';

const q = (drag, stats = {}) => ({
  name: 'Q', archetype: 'hero', drag,
  stats: { boldness: 5, temperament: 5, ...stats },
});
const mean = (f, n = 500) => { let s = 0; for (let i = 0; i < n; i++) s += f(i); return s / n; };

describe('lipsyncScore', () => {
  it('lipsync is the heaviest stat', () => {
    const sad = songById('Halo');
    const ls = mean(i => lipsyncScore({ player: q({ lipsync: 9, dance: 3, acting: 3 }), song: sad, rng: rngFor(i) }).score);
    const ac = mean(i => lipsyncScore({ player: q({ lipsync: 3, dance: 3, acting: 9 }), song: sad, rng: rngFor(i) }).score);
    const dn = mean(i => lipsyncScore({ player: q({ lipsync: 3, dance: 9, acting: 3 }), song: sad, rng: rngFor(i) }).score);
    expect(ls).toBeGreaterThan(ac);
    expect(ac).toBeGreaterThan(dn);
  });

  it('dance always counts, and counts for more on an uptempo song', () => {
    const ballad = songById('Halo');
    const up = songById('Single Ladies');
    const dancer = { lipsync: 5, dance: 10, acting: 5, comedy: 5 };
    const stiff = { lipsync: 5, dance: 1, acting: 5, comedy: 5 };
    const gapOn = s => mean(i => lipsyncScore({ player: q(dancer), song: s, rng: rngFor(i) }).score)
      - mean(i => lipsyncScore({ player: q(stiff), song: s, rng: rngFor(i) }).score);
    // Present on a ballad...
    expect(gapOn(ballad)).toBeGreaterThan(0.5);
    // ...and worth more when the song asks for it.
    expect(gapOn(up)).toBeGreaterThan(gapOn(ballad));
  });

  it('the mood decides the third stat', () => {
    const sad = songById('Halo');
    const funny = songById('Barbie Girl');
    const actor = { lipsync: 5, dance: 5, acting: 10, comedy: 1 };
    const clown = { lipsync: 5, dance: 5, acting: 1, comedy: 10 };
    const on = (p, s) => mean(i => lipsyncScore({ player: q(p), song: s, rng: rngFor(i) }).score);
    expect(on(actor, sad)).toBeGreaterThan(on(clown, sad));
    expect(on(clown, funny)).toBeGreaterThan(on(actor, funny));
  });

  it('a lip sync record gives confidence and a crash-out costs', () => {
    const s = songById('Toxic');
    const fresh = mean(i => lipsyncScore({ player: q({}), song: s, rng: rngFor(i) }).score);
    const vet = mean(i => lipsyncScore({ player: q({}), song: s, lipsyncRecord: ['W', 'W'], rng: rngFor(i) }).score);
    const shaken = mean(i => lipsyncScore({ player: q({}), song: s, lastReaction: 'crash-out', rng: rngFor(i) }).score);
    expect(vet).toBeGreaterThan(fresh);
    expect(shaken).toBeLessThan(fresh);
    // Confidence does not run away with itself.
    const veteran = mean(i => lipsyncScore({ player: q({}), song: s, lipsyncRecord: ['W', 'W', 'W', 'W', 'W'], rng: rngFor(i) }).score);
    expect(veteran - fresh).toBeLessThan(2);
  });

  it('narrates in four beats and reports the stunt', () => {
    const r = lipsyncScore({ player: q({}), song: songById('Believe'), rng: rngFor(2) });
    expect(r.beats.map(b => b.beat)).toEqual(['verse', 'chorus', 'hook', 'ending']);
    expect(['landed', 'failed', 'none']).toContain(r.stunt);
    expect(r.parts).toBeTruthy();
  });

  it('a bold queen attempts more stunts than a timid one', () => {
    const s = songById('Toxic');
    const rate = b => {
      let n = 0;
      for (let i = 0; i < 400; i++) {
        if (lipsyncScore({ player: q({}, { boldness: b }), song: s, rng: rngFor(i) }).stunt !== 'none') n++;
      }
      return n / 400;
    };
    expect(rate(10)).toBeGreaterThan(rate(1));
  });

  it('plays every song in the bank without throwing', () => {
    for (const song of SONGS) {
      expect(() => lipsyncScore({ player: q({}), song, rng: rngFor(1) }), song.title).not.toThrow();
    }
  });
});

describe('lipsyncCall', () => {
  it('shantay to the higher score, sashay to the lower', () => {
    expect(lipsyncCall({ a: { name: 'A', score: 7 }, b: { name: 'B', score: 5 } }))
      .toMatchObject({ call: 'shantay', winner: 'A', loser: 'B' });
  });

  it('double shantay only with the box on, both high, and close', () => {
    const hi = { a: { name: 'A', score: 9 }, b: { name: 'B', score: 8.7 } };
    expect(lipsyncCall({ ...hi }).call).toBe('shantay');
    expect(lipsyncCall({ ...hi, allowDoubleShantay: true }).call).toBe('double-shantay');
    // Not merely both good: they have to be close.
    expect(lipsyncCall({ a: { name: 'A', score: 9.5 }, b: { name: 'B', score: 8.6 }, allowDoubleShantay: true }).call)
      .toBe('shantay');
    // And not merely close: they have to be good.
    expect(lipsyncCall({ a: { name: 'A', score: 5 }, b: { name: 'B', score: 5.1 }, allowDoubleShantay: true }).call)
      .toBe('shantay');
  });

  it('double sashay only with the box on and both genuinely bad', () => {
    const lo = { a: { name: 'A', score: 2 }, b: { name: 'B', score: 3 } };
    expect(lipsyncCall({ ...lo }).call).toBe('shantay');
    expect(lipsyncCall({ ...lo, allowDoubleSashay: true }).call).toBe('double-sashay');
    expect(lipsyncCall({ a: { name: 'A', score: 2 }, b: { name: 'B', score: 6 }, allowDoubleSashay: true }).call)
      .toBe('shantay');
  });

  it('nobody leaves on a double shantay, and both leave on a double sashay', () => {
    const ds = lipsyncCall({ a: { name: 'A', score: 9 }, b: { name: 'B', score: 8.8 }, allowDoubleShantay: true });
    expect(ds.winner).toBe(null);
    expect(ds.loser).toBe(null);
    const dz = lipsyncCall({ a: { name: 'A', score: 2 }, b: { name: 'B', score: 2.2 }, allowDoubleSashay: true });
    expect(dz.losers).toEqual(['A', 'B']);
  });

  it('the host bend can flip a close one, never a blowout', () => {
    expect(lipsyncCall({ a: { name: 'A', score: 6.2 }, b: { name: 'B', score: 6.0 }, bendB: 0.75 }).winner).toBe('B');
    expect(lipsyncCall({ a: { name: 'A', score: 8 }, b: { name: 'B', score: 5 }, bendB: 0.75 }).winner).toBe('A');
  });

  it('reports the gap, so a screen can say how close it was', () => {
    const c = lipsyncCall({ a: { name: 'A', score: 7 }, b: { name: 'B', score: 5 } });
    expect(c.gap).toBeCloseTo(2);
  });
});
