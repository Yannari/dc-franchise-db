// ══════════════════════════════════════════════════════════════════════
// pm-ratings.test.js — Plan 6: the villa's ratings signals are real
// ══════════════════════════════════════════════════════════════════════
//
// docs/ADDING-A-SHOW.md §2.5: a signal the reader cannot find reads as zero,
// and a zero is a plausible rating that is wrong for ever. The vote reader
// found none of what a villa writes. So: the registry names the villa's own
// reader, and every signal must stay inside the band CALIBRATION claims and
// MOVE across a season (the same two questions ratings-distribution asks of
// Total Drama).
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { SHOWS, PERFECT_MATCH_FORMAT } from '../js/shows.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { CALIBRATION, readSignals, ratingsForSeason } from '../js/ratings.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

function signalsOf(seed) {
  const cast = makeIslanders(22, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  const { rows } = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed });
  let prev = null;
  return { rows, cast, signals: rows.map(r => (prev = readSignals(r, prev, { format: PERFECT_MATCH_FORMAT, players: cast }))) };
}

describe('the villa reads its own signals', () => {
  it('the registry names the reader', () => {
    expect(SHOWS[PERFECT_MATCH_FORMAT].signals).toBe('villa');
  });
  it('every signal stays in its band and moves', () => {
    const seen = {};
    for (const seed of [1, 2, 3]) for (const s of signalsOf(seed).signals) for (const k of Object.keys(CALIBRATION)) (seen[k] ||= []).push(s[k]);
    for (const [key, vals] of Object.entries(seen)) {
      vals.sort((a, b) => a - b);
      expect(vals[0], `${key} below zero`).toBeGreaterThanOrEqual(0);
      expect(vals[vals.length - 1], `${key} above one`).toBeLessThanOrEqual(1);
      // A plain season can have nobody come back.
      if (key === 'returns') continue;
      const [lo, hi] = CALIBRATION[key];
      const p90 = vals[Math.floor(vals.length * 0.9)];
      expect(p90, `${key}: p90 ${p90.toFixed(2)} never reaches its band`).toBeGreaterThan(lo + (hi - lo) * 0.15);
      // …and never lives pinned at the top of it either (mess, showmance and
      // steamroll all did, before the reader was scaled for a hundred scenes).
      const p50 = vals[Math.floor(vals.length * 0.5)];
      expect(p50, `${key}: p50 ${p50.toFixed(2)} is at the top of its band`).toBeLessThan(hi);
      expect(vals[vals.length - 1] - vals[0], `${key} never varied`).toBeGreaterThan(0.05);
    }
  });
  it('a steal or a Casa twist is a blindside; a stale villa is a steamroll', () => {
    const { rows, signals } = signalsOf(1);
    rows.forEach((r, i) => {
      const s = signals[i];
      const steals = r.pm.events.filter(e => e.aired && (e.kind === 'steal' || (e.kind === 'recouple-pick' && e.extra?.stole)
        || (e.kind === 'casa-return' && e.extra?.choice === 'twist'))).length;
      if (steals) expect(s.blindside, `ep ${r.num}`).toBeGreaterThan(0);
    });
    // A night where people arrive or leave is never a stale one.
    rows.forEach((r, i) => {
      if (i && (r.exits.length || r.pm.events.some(e => /entrance/.test(e.kind))) && signals[i - 1].steamroll === 0) {
        expect(signals[i].steamroll).toBeLessThanOrEqual(0.45);
      }
    });
  });
  it('a season gets a rating, in the same range as the other shows', () => {
    const { rows, cast } = signalsOf(2);
    const rt = ratingsForSeason(rows, { format: PERFECT_MATCH_FORMAT, players: cast });
    expect(rt.format).toBe(PERFECT_MATCH_FORMAT);
    expect(rt.score).toBeGreaterThan(25);
    expect(rt.score).toBeLessThan(75);
  });
});
