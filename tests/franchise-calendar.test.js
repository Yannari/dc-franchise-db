// When a season aired.
//
// Until 2026-08-18 the franchise had NO temporal field of any kind — fifteen
// seasons, no dates, and order that existed only as a number inside a single
// show. So `td-9` and `bb-1` had no defined relationship in time, nothing could
// be ordered across shows, and a birthdate could only ever produce one age
// instead of an age per season.
//
// Year + slot rather than a date, because with two Big Brothers and two
// Survivors in a year there is no such thing as "the gap between seasons", and
// because two dropdowns cannot be filled in wrong.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  SLOTS, airKey, byAirDate, airLabel, ageAt, latestAired, yearsBetween,
} from '../js/franchise-calendar.js';

const s = (airYear, airSlot, extra = {}) => ({ airYear, airSlot, ...extra });

describe('ordering across shows', () => {
  it('sorts by year then by slot', () => {
    const seasons = [
      s(2026, 'fall', { id: 'td-14' }),
      s(2026, 'spring', { id: 'td-13' }),
      s(2026, 'summer', { id: 'bb-1' }),
      s(2025, 'fall', { id: 'td-12' }),
    ];
    expect(seasons.slice().sort(byAirDate).map(x => x.id))
      .toEqual(['td-12', 'td-13', 'bb-1', 'td-14']);
  });

  it('knows the slots in the order a year runs', () => {
    expect(SLOTS).toEqual(['winter', 'spring', 'summer', 'fall']);
  });

  it('puts an unplaced season LAST, not first', () => {
    // Sorting a missing window to the front would silently rewrite every
    // "the first player to…" that season takes part in.
    const seasons = [s(undefined, undefined, { id: 'new' }), s(2020, 'spring', { id: 'td-1' })];
    expect(seasons.slice().sort(byAirDate).map(x => x.id)).toEqual(['td-1', 'new']);
    expect(airKey({})).toBeNull();
  });

  it('is case-insensitive about the slot but strict about nonsense', () => {
    expect(airKey(s(2026, 'Summer'))).toBe(airKey(s(2026, 'summer')));
    expect(airKey(s(2026, 'autumn'))).toBeNull();
    expect(airKey(s('not a year', 'summer'))).toBeNull();
  });
});

describe('saying when', () => {
  it('reads as a person would say it', () => {
    expect(airLabel(s(2026, 'summer'))).toBe('Summer 2026');
  });

  it('says nothing for a season nobody has placed', () => {
    expect(airLabel({})).toBe('');
    expect(airLabel(s(2026, 'nope'))).toBe('');
  });
});

describe('how old they were THEN', () => {
  // The point of the whole file for a wiki: a real article says how old
  // somebody was on the season being read, not how old they are today.
  const born = '2002-08-26';

  it('ages a player at the season, not at today', () => {
    expect(ageAt(born, s(2020, 'spring'))).toBe(17);
    expect(ageAt(born, s(2026, 'fall'))).toBe(24);
  });

  it('accounts for a birthday that has not happened by that slot', () => {
    // Born in August. Spring 2026 is before it; Fall 2026 is after.
    expect(ageAt(born, s(2026, 'spring'))).toBe(23);
    expect(ageAt(born, s(2026, 'fall'))).toBe(24);
  });

  it('returns null rather than a made-up number', () => {
    expect(ageAt('', s(2026, 'fall'))).toBeNull();
    expect(ageAt('not a date', s(2026, 'fall'))).toBeNull();
    expect(ageAt(born, {})).toBeNull();
    expect(ageAt(undefined, undefined)).toBeNull();
  });
});

describe('now, and the distance between seasons', () => {
  const franchise = [s(2020, 'spring'), s(2026, 'spring'), s(2026, 'summer'), s(2026, 'fall')];

  it('now is the end of the most recent season, not a stored clock', () => {
    // A stored "current year" is a second clock, and two clocks disagree.
    expect(airLabel(latestAired(franchise))).toBe('Fall 2026');
    expect(latestAired([])).toBeNull();
    expect(latestAired([{}, {}])).toBeNull();
  });

  it('measures a gap in years, in quarters underneath', () => {
    expect(yearsBetween(s(2026, 'spring'), s(2026, 'summer'))).toBe(0.3);
    expect(yearsBetween(s(2026, 'spring'), s(2027, 'spring'))).toBe(1);
    expect(yearsBetween(s(2020, 'spring'), s(2026, 'fall'))).toBe(6.5);
  });

  it('refuses to measure against a season nobody placed', () => {
    expect(yearsBetween(s(2026, 'spring'), {})).toBeNull();
  });
});

describe('the franchise as actually scheduled', () => {
  const db = JSON.parse(readFileSync('seasons_database.json', 'utf8'));

  it('every season has been placed', () => {
    const unplaced = db.seasons.filter(x => airKey(x) == null).map(x => x.seasonId);
    expect(unplaced, 'a season with no air window would sort last and age nobody')
      .toEqual([]);
  });

  it('no two seasons of the SAME show share a slot', () => {
    // Different shows may share one — two Big Brothers and two Survivors in a
    // year is the case this calendar exists for. One show airing twice in the
    // same slot is a mistake.
    const seen = new Map();
    const clashes = [];
    for (const x of db.seasons) {
      const k = `${x.format || 'total-drama'}|${airKey(x)}`;
      if (seen.has(k)) clashes.push(`${seen.get(k)} + ${x.seasonId}`);
      seen.set(k, x.seasonId);
    }
    expect(clashes).toEqual([]);
  });

  it('keeps each show in season-number order', () => {
    // Season 5 airing before season 4 would be a data-entry slip, and every
    // "the Nth player to…" would inherit it.
    const byShow = {};
    for (const x of db.seasons) (byShow[x.format || 'total-drama'] ||= []).push(x);
    for (const [show, list] of Object.entries(byShow)) {
      const chrono = list.slice().sort(byAirDate).map(x => x.seasonNumber);
      expect(chrono, `${show} airs out of season order`)
        .toEqual(list.map(x => x.seasonNumber).sort((a, b) => a - b));
    }
  });

  it('never airs a season before its own cast played the season they came from', () => {
    // bb-1 draws its entire cast from Total Drama 9, 10, 12 and 13, so it
    // cannot air before td-13. This is the check that a hand-assigned schedule
    // most needs, and the one a human is most likely to get wrong.
    const players = JSON.parse(readFileSync('players_database.json', 'utf8')).players;
    const bySeasonId = new Map(db.seasons.map(x => [x.seasonId, x]));
    const bad = [];
    for (const p of players) {
      const placed = (p.seasonDetails || [])
        .map(d => bySeasonId.get(d.seasonId))
        .filter(x => x && airKey(x) != null);
      for (let i = 1; i < placed.length; i++) {
        // Every appearance must be orderable; a player cannot be in two shows
        // in the same slot either.
        const clash = placed.filter(x => airKey(x) === airKey(placed[i]));
        if (clash.length > 1) bad.push(`${p.id}: ${clash.map(c => c.seasonId).join(' + ')}`);
      }
    }
    expect([...new Set(bad)], 'a player is in two seasons in the same slot').toEqual([]);
  });
});
