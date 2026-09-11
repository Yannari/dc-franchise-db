// ══════════════════════════════════════════════════════════════════════
// dr-continue-after-reload.test.js — the season you come back to
// ══════════════════════════════════════════════════════════════════════
//
// A drag season is booked in ONE call at episode one, and the rows are queued
// on `gs._drQueue`. Lose that queue — a reload, an older save — and the next
// press rebuilds the whole season from the seed and drops what already aired.
//
// That only works if the rebuild reproduces the season. It did not.
//
// `_frozenPins` handed back the aired weeks only, so every UNAIRED week was
// drawn again — and a redraw does not reproduce the original, because the
// draw avoids repeating a challenge and the aired weeks are now nailed down.
// Measured on a fixed seed: a season that ran Snatch Game on four and the
// Rusical on five came back with the two swapped. A different week four is a
// different maxi, a different winner, and a different queen going home.
//
// From the outside that reads as: "my next episode un-eliminated the queen who
// went home and sent somebody else instead."
//
// The whole stored booking is authoritative now. The two callers that are
// SUPPOSED to change the future say so by truncating it, and both are checked
// here — a fix that froze the season so hard the re-run button stopped working
// would be a worse bug than the one it replaced.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  gs as gsRef, setGs, setPlayers, seasonConfig, defaultConfig,
} from '../js/core.js';
import {
  simulateDragEpisode, invalidateDragQueue, rerunDragEpisode,
} from '../js/dr-run.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const CAST = Array.from({ length: 12 }, (_, i) => ({
  name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
  stats: Object.fromEntries(STATS.map(k => [k, 3 + ((i * 3) % 8)])),
  drag: {
    acting: 1 + (i % 9), comedy: 2 + ((i * 5) % 8), dance: 1 + ((i * 7) % 9),
    design: 3 + (i % 7), runway: 2 + ((i * 2) % 8), lipsync: 1 + ((i * 4) % 9),
    singing: 4 + (i % 6),
  },
}));

Object.defineProperty(globalThis, 'gs', {
  configurable: true, get: () => gsRef, set: v => setGs(v),
});
globalThis.window = globalThis.window || {};
afterAll(() => { delete globalThis.gs; });

function fresh(seed = 4242) {
  setPlayers(CAST.map(p => ({ ...p })));
  Object.assign(seasonConfig, defaultConfig(), { format: 'drag-race', seasonNumber: 1 });
  setGs({
    episodeHistory: [], activePlayers: CAST.map(p => p.name), eliminated: [],
    popularity: {}, episode: 0, bonds: {}, bondLean: {}, perceivedBonds: {},
    _drInitBonds: {}, _drInitLean: {}, _drSeed: seed,
  });
}
// Everything that makes a night the night it was.
const key = r => `ep${r.num} ${r.dr?.challenge?.id} `
  + `out=${JSON.stringify((r.dr?.exits || []).map(x => x.name))} `
  + `win=${JSON.stringify((r.dr?.placements || []).filter(p => p.result === 'WIN').map(p => p.name))} `
  + `living=${JSON.stringify(r.dr?.living || [])}`;
const play = n => {
  const out = [];
  for (let i = 0; i < n; i++) { const r = simulateDragEpisode(); if (!r) break; out.push(key(r)); }
  return out;
};

beforeEach(() => fresh());

describe('continuing a saved season', () => {
  it('plays the same season a reload interrupted', () => {
    const straight = play(7);
    fresh();
    const before = play(3);
    delete gsRef._drQueue;          // exactly what a reload leaves behind
    const after = [...before, ...play(4)];
    expect(after).toEqual(straight);
  });

  it('keeps the queen who went home gone', () => {
    /* The symptom, stated as itself. Nobody in `eliminated` may walk back into
       a later week's `living` — a returnee twist aside, which this season has
       not booked. */
    play(4);
    const goneBy4 = new Set(gsRef.eliminated);
    expect(goneBy4.size).toBeGreaterThan(0);
    delete gsRef._drQueue;
    const next = simulateDragEpisode();
    for (const n of next.dr.living) {
      expect(goneBy4.has(n), `${n} was eliminated and is back in episode ${next.num}`)
        .toBe(false);
    }
  });

  it('survives being interrupted more than once', () => {
    const straight = play(7);
    fresh();
    const got = [];
    for (let i = 0; i < 7; i++) {
      delete gsRef._drQueue;        // a reload before every single episode
      const r = simulateDragEpisode();
      if (!r) break;
      got.push(key(r));
    }
    expect(got).toEqual(straight);
  });
});

describe('and the two things that ARE meant to change it', () => {
  it('re-runs episode N differently, and leaves 1..N-1 alone', () => {
    const straight = play(6);
    fresh();
    play(6);
    expect(rerunDragEpisode(4)).toBe(true);
    /* The rollback leaves episodes 1-3 in history and `play` returns only the
       nights it runs, so the new rows START at episode four. */
    const again = play(6);
    expect(gsRef.episodeHistory.slice(0, 3).map(key), 'the re-run rewrote the past')
      .toEqual(straight.slice(0, 3));
    expect(again[0], 'the re-run reproduced the episode it was asked to change')
      .not.toEqual(straight[3]);
  });

  it('re-books the future when a pin changes, and not the past', () => {
    const straight = play(6);
    fresh();
    play(3);
    expect(invalidateDragQueue()).toBe(true);
    // The author's booking for a week nobody has seen.
    seasonConfig.twistSchedule = [{ type: 'dr-challenge', episode: 5, maxiId: 'ball' }];
    const rest = play(3);
    expect(rest.length).toBeGreaterThan(1);
    // The aired weeks are still the aired weeks.
    const history = gsRef.episodeHistory.slice(0, 3).map(key);
    expect(history).toEqual(straight.slice(0, 3));
  });
});
