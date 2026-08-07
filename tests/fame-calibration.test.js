// The weights in js/fame.js are arbitrary until something measures them.
//
// Without this file they rot in silence: a plausible-looking formula can put
// half the roster on five stars or everybody on one, and nothing else in the
// suite would notice. It already earned its place twice — it caught a flat decay
// rate that had 69% of the franchise sitting at half a star or less with no way
// to tell any of them apart, and before that a status-string mismatch that
// scored 226 of 262 real season details at zero.
//
// The assertions are deliberately about the SHAPE of the distribution rather
// than about any individual player, so tuning the weights does not mean
// rewriting the test — only the bands move, and only on purpose.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { computeFame } from '../js/fame.js';

// process.cwd(), not import.meta.url — vitest rewrites module URLs, so a
// relative URL resolved against import.meta.url lands at the drive root here.
// tests/multishow-json.test.js hit the same thing and says so too.
const load = f => JSON.parse(readFileSync(join(process.cwd(), f), 'utf8'));

const dbs = {
  players: load('players_database.json'),
  rankings: load('rankings_database.json'),
  seasons: load('seasons_database.json'),
  franchise: load('franchise_database.json'),
};
const fame = computeFame(dbs);
const all = [...fame.values()];
const at = s => all.filter(f => f.stars === s).length;

describe('fame across the real franchise', () => {
  it('rates everybody who has ever played', () => {
    expect(all.length).toBe(dbs.players.players.length);
    expect(all.every(f => f.stars >= 0 && f.stars <= 5)).toBe(true);
    expect(all.every(f => f.stars * 2 === Math.round(f.stars * 2))).toBe(true);
  });

  it('keeps five stars rare', () => {
    // A handful. Failing high means the weights are too generous; failing low
    // means nobody in fifteen seasons is famous, which is also wrong.
    expect(at(5), `${at(5)} players are at five stars`).toBeLessThanOrEqual(8);
    expect(at(5), 'nobody in the whole franchise is famous').toBeGreaterThanOrEqual(1);
  });

  it('puts a real share of the roster in the middle', () => {
    const mid = all.filter(f => f.stars >= 1 && f.stars <= 3).length;
    expect(mid / all.length, 'the distribution collapsed to the edges')
      .toBeGreaterThan(0.4);
  });

  it('does not put everybody on the same number', () => {
    // The failure mode the neutral fallbacks could cause: with no popularity and
    // no per-show rankings, a bad formula flattens the whole roster.
    expect(new Set(all.map(f => f.stars)).size,
      'fame is not discriminating between careers').toBeGreaterThanOrEqual(5);
  });

  it('scores the overwhelming majority of real season details', () => {
    // The status-string bug this file caught: players_database.json says Juror,
    // Pre-Juror and Pre-Merge, the Big Brother export says Jury and Pre-Jury,
    // and matching literally scored 226 of 262 details at nothing. A franchise
    // of zeroes reads as "tune the weights", not as a bug.
    const played = all.reduce((n, f) => n + f.timeline.filter(t => t.event === 'played').length, 0);
    const scored = all.reduce((n, f) =>
      n + f.timeline.filter(t => t.event === 'played' && t.delta > 0).length, 0);
    expect(scored / played, `${played - scored} of ${played} season details scored zero`)
      .toBeGreaterThan(0.95);
  });

  it('keeps one forgettable season out of the top', () => {
    const oneAndDone = all.filter(f => f.seasonsPlayed === 1);
    expect(oneAndDone.length).toBeGreaterThan(0);
    expect(Math.max(...oneAndDone.map(f => f.stars)),
      'a single season reached five stars').toBeLessThanOrEqual(4.5);
    const forgettable = oneAndDone.filter(f => f.score < 15);
    if (forgettable.length) {
      expect(Math.max(...forgettable.map(f => f.stars))).toBeLessThanOrEqual(2);
    }
  });

  it('ranks a decorated multi-season career above a single quiet one', () => {
    const veterans = all.filter(f => f.seasonsPlayed >= 3);
    const rookies = all.filter(f => f.seasonsPlayed === 1);
    expect(veterans.length).toBeGreaterThan(0);
    const avg = xs => xs.reduce((s, f) => s + f.score, 0) / xs.length;
    expect(avg(veterans)).toBeGreaterThan(avg(rookies));
  });

  it('fades an old career relative to an identical recent one', () => {
    // Decay has to be observable on real data, not just in a unit test.
    const withDecay = all.filter(f => f.timeline.some(t => t.event === 'missed'));
    expect(withDecay.length, 'nobody in fifteen seasons ever missed one').toBeGreaterThan(50);
    expect(withDecay.every(f => f.timeline
      .filter(t => t.event === 'missed').every(t => t.delta < 0))).toBe(true);
  });
});
