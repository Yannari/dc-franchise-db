// ══════════════════════════════════════════════════════════════════════
// Is the calibration table still telling the truth?
// ══════════════════════════════════════════════════════════════════════
//
// CALIBRATION in js/ratings.js stretches each raw signal onto the range it
// actually occupies, measured across played seasons. That measurement is a
// snapshot and it rots: change the camp event pool, the flip detector or the
// popularity engine and a signal quietly moves somewhere else.
//
// When it rots it fails SILENTLY and expensively. Before this table existed
// `mess` never once passed 0.25 while being scored against a 0..1 scale, so
// the signal meant to separate a scrappy season from a polished one delivered
// a quarter of its weight at full tilt, and every season in the franchise came
// out inside four points of every other.
//
// So this plays real seasons and asks two things of every signal: does it stay
// inside the band the table claims, and does it VARY. A signal pinned at one
// value is not a signal, whatever its range says.
//
// It plays two whole seasons and takes about twelve seconds, which is inside
// the fast suite's budget — so it runs on every push rather than nightly.
import { describe, it, expect } from 'vitest';
import { core, runOneSeason, seededRun } from './helpers/season-harness.js';
import { CALIBRATION, readSignals } from '../js/ratings.js';

const KEYS = Object.keys(CALIBRATION);

// Signals a vanilla audit season cannot produce: nothing here schedules a
// twist and nobody comes back. Their bands are exercised by the synthetic
// coverage in ratings.test.js instead of being asserted against a flat zero.
const NOT_IN_A_PLAIN_SEASON = new Set(['twist', 'returns']);

function play(seed) {
  seededRun(() => runOneSeason({ popularityEnabled: true, romance: 'enabled' }, 16), seed);
  const out = [];
  let prev = null;
  core.gs.episodeHistory.forEach(ep => {
    const s = readSignals(ep, prev, { format: 'total-drama' });
    if (s) { prev = s; out.push(s); }
  });
  return out;
}

describe('the calibration table against real seasons', () => {
  it('still describes the range each signal lives in', () => {
    const seen = {};
    [7919, 15838].forEach(seed => {
      play(seed).forEach(s => KEYS.forEach(k => (seen[k] = seen[k] || []).push(s[k])));
    });

    expect(Object.keys(seen).length, 'no seasons were read').toBeGreaterThan(0);

    for (const key of KEYS) {
      const vals = (seen[key] || []).slice().sort((a, b) => a - b);
      expect(vals.length, `${key} was never read`).toBeGreaterThan(10);
      const p90 = vals[Math.floor(vals.length * 0.9)];
      const [lo, hi] = CALIBRATION[key];

      // Every reading is a proportion. A signal outside 0..1 is a bug in the
      // reader, not a stale table.
      expect(vals[0], `${key} went below zero`).toBeGreaterThanOrEqual(0);
      expect(vals[vals.length - 1], `${key} went above one`).toBeLessThanOrEqual(1);

      if (NOT_IN_A_PLAIN_SEASON.has(key)) continue;

      // The table claims this signal reaches `hi`. If nine weeks in ten come
      // in under half of it, the top of the band is fiction and the signal is
      // delivering a fraction of its weight — the exact failure that flattened
      // the whole franchise into one tier.
      expect(p90, `${key}: p90 is ${p90.toFixed(2)} but the table claims it reaches ${hi}`)
        .toBeGreaterThan(lo + (hi - lo) * 0.15);

      // And it has to MOVE. A constant carries no information however well its
      // range is described.
      const spread = vals[vals.length - 1] - vals[0];
      expect(spread, `${key} never varied across two seasons`).toBeGreaterThan(0.05);
    }
  }, 900000);
});
