// tests/multishow-regression.test.js
// The promise of sub-project A is that NOTHING looks different. These are the
// properties that would be silently broken by a bad migration and not noticed
// until a page rendered wrong weeks later.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSeasonRef, seasonId } from '../js/shows.js';

// process.cwd(), not import.meta.url — a relative URL resolved against
// import.meta.url lands on the drive root under Windows (same workaround as
// tests/multishow-json.test.js).
const load = f => JSON.parse(readFileSync(join(process.cwd(), f), 'utf8'));

describe('nothing about Total Drama changed', () => {
  // A FLOOR, NOT AN EQUALITY — DELIBERATELY. The obvious way to write this is
  // `expect(td.length).toBe(seasons.length)`, and it passes today. It would go
  // red the first time a Big Brother season lands in seasons_database.json,
  // which is the entire purpose of the multi-show migration: a gate that fails
  // when you do the thing the migration was built for gets deleted, not read.
  // The promise being guarded is that the fourteen Total Drama seasons all
  // survived and are all still tagged Total Drama — NOT that no other show may
  // exist. Do not "tighten" this back to an equality.
  it('still has all fourteen Total Drama seasons, still tagged Total Drama', () => {
    const { seasons } = load('seasons_database.json');
    const td = seasons.filter(s => s.format === 'total-drama');
    expect(td.length).toBeGreaterThanOrEqual(14);
    // Checked by number, not just by count: a season that lost its format tag
    // drops out of `td` and is caught here as a specific missing season, rather
    // than being masked by some other show's seasons topping the count back up.
    const numbers = new Set(td.map(s => s.seasonNumber));
    for (let n = 1; n <= 14; n++) {
      expect(numbers.has(n), `Total Drama season ${n} is missing or lost its format`).toBe(true);
    }
  });

  it('kept every player and every appearance', () => {
    const { players } = load('players_database.json');
    expect(players.length).toBeGreaterThanOrEqual(152);
    const appearances = players.reduce((n, p) => n + (p.seasonDetails || []).length, 0);
    expect(appearances).toBeGreaterThanOrEqual(262);
  });

  // NO byShow/seasonDetails AGREEMENT TEST LIVES HERE — ON PURPOSE.
  // `tests/multishow-json.test.js` ("agrees with itself: byShow totals are the
  // sum of that show's details") already owns that invariant and covers strictly
  // more of it: the season count plus challenge, immunity, reward and idol
  // totals, where a copy here only ever checked challenge wins. One invariant,
  // one owner — a weaker duplicate just makes it ambiguous which file to fix.
  //
  // Worth knowing what that assertion does and does not prove, since its name
  // used to over-claim: byShow and seasonDetails are BOTH post-backfill fields,
  // so it catches a backfill that summed the wrong field and any later hand-edit
  // — real value — but it is not conservation ACROSS the migration. There is no
  // pre-migration baseline to compare against: the only pre-existing anchor is
  // the top-level career total, and that is unusable here because of the nine
  // known, deliberately unreconciled total-vs-details drifts (e.g. cameron's
  // totalChallengeWins is 6 top-level, 7 summed). If details had gone missing
  // before the backfill ran, both sides would agree at the wrong number.

  it('resolves every old-style season link', () => {
    const { seasons } = load('seasons_database.json');
    for (const s of seasons.filter(x => x.format === 'total-drama')) {
      expect(parseSeasonRef(String(s.seasonNumber)))
        .toEqual({ format: 'total-drama', number: s.seasonNumber });
    }
  });

  it('lets two shows hold the same season number', () => {
    expect(seasonId('total-drama', 1)).not.toBe(seasonId('big-brother', 1));
    expect(parseSeasonRef('td-1')).not.toEqual(parseSeasonRef('bb-1'));
  });
});
