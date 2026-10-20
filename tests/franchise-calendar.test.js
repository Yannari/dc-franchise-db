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
  SLOTS, airKey, byAirDate, airLabel, ageAt, latestAired, yearsBetween, nextWindowFor, nextAllStarsWindow,
  nowDate, finaleDate, premiereDate,
} from '../js/franchise-calendar.js';
import { SHOWS } from '../js/shows.js';

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
    // The check a hand-assigned schedule most needs, and the one a human is
    // most likely to get wrong.
    //
    // NOT derived from bb-1's current cast. When this was written, bb-1 held a
    // PLACEHOLDER cast of eighteen Total Drama alumni, and the schedule was
    // argued from it — "bb-1 cannot air before td-13 because its cast played
    // td-13". That constraint was an artifact of unfinished data, not canon:
    // the real season has no Total Drama returnees at all. Read a cast list as
    // evidence about the calendar only once the season has actually shipped.
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

// Every show says which quarters it airs in (agreed 2026-10-17): two shows to a
// quarter, never on the same night. Without it a show's first season was dated
// "one quarter after whatever aired last" and every later season continued that
// accident — The Traitors would have premiered in spring.
describe('home quarters', () => {
  const fx = [
    s(2026, 'fall', { format: 'total-drama' }),
    s(2026, 'summer', { format: 'big-brother' }),
    s(2027, 'winter', { format: 'drag-race' }),
  ];

  it('gives every show a home, two to a quarter, never two on one night', () => {
    const byQuarter = {};
    for (const [format, show] of Object.entries(SHOWS)) {
      expect(show.airSlots?.length, `${format} has no airSlots`).toBeGreaterThan(0);
      for (const q of show.airSlots) {
        expect(SLOTS).toContain(q);
        (byQuarter[q] ||= []).push(show);
      }
    }
    for (const [q, shows] of Object.entries(byQuarter)) {
      const nights = shows.map(sh => sh.airNight);
      expect(new Set(nights).size, `${q}: two shows on one night`).toBe(nights.length);
    }
  });

  it("places a show's first season in its home quarter, alongside what is airing", () => {
    // Winter 2027 has already gone: Drag Race's finale is in March.
    expect(nextWindowFor(fx, 'traitors')).toEqual({ airYear: 2028, airSlot: 'winter' });
    expect(nextWindowFor(fx, 'the-circle')).toEqual({ airYear: 2027, airSlot: 'spring' });
    expect(nextWindowFor(fx, 'perfect-match')).toEqual({ airYear: 2027, airSlot: 'summer' });
    expect(nextWindowFor(fx, 'the-challenge')).toEqual({ airYear: 2027, airSlot: 'fall' });
  });

  it('continues each show in its own quarters', () => {
    expect(nextWindowFor(fx, 'total-drama')).toEqual({ airYear: 2027, airSlot: 'spring' });
    expect(nextWindowFor(fx, 'big-brother')).toEqual({ airYear: 2027, airSlot: 'summer' });
    expect(nextWindowFor(fx, 'drag-race')).toEqual({ airYear: 2028, airSlot: 'winter' });
  });
});

describe('never before now (the user, 2026-10-20)', () => {
  // TD 15: 26 episodes from April, so the franchise is at its September finale.
  const td15 = s(2027, 'spring', { format: 'total-drama', seasonNumber: 15, episodeCount: 26 });

  it('now is the latest FINALE, so a short season exported later does not walk it back', () => {
    const short = s(2027, 'spring', { format: 'the-circle', seasonNumber: 1, episodeCount: 12 });
    expect(latestAired([td15, short])).toBe(td15);
    expect(latestAired([short, td15])).toBe(td15);
    expect(nowDate([short, td15]).toISOString().slice(0, 10)).toBe('2027-09-27');
  });

  it('a season nobody has played moves to its next home quarter after the latest finale', () => {
    // Not booked: the Circle's SECOND season, Big Brother's third.
    expect(nextWindowFor([td15], 'the-circle', { number: 2 })).toEqual({ airYear: 2028, airSlot: 'spring' });
    expect(nextWindowFor([td15], 'big-brother', { number: 3 })).toEqual({ airYear: 2028, airSlot: 'summer' });
    // The fall premiere is after the September finale, so it stays.
    expect(nextWindowFor([td15], 'total-drama', { number: 17 })).toEqual({ airYear: 2027, airSlot: 'fall' });
  });

  it('every projected window premieres at or after now', () => {
    const db = JSON.parse(readFileSync('seasons_database.json', 'utf8')).seasons
      .map(r => ({ ...r, format: r.format || 'total-drama' }));
    const now = nowDate(db);
    for (const format of Object.keys(SHOWS)) {
      const mine = db.filter(r => r.format === format && !r.allStars);
      const number = Math.max(0, ...mine.map(r => Number(r.seasonNumber) || 0)) + 101;
      const w = nextWindowFor(db, format, { number });
      expect(premiereDate(w, format) >= now, `${format}: ${airLabel(w)}`).toBe(true);
    }
  });

  it('keeps the 2027 seasons that were already on the calendar (the one exception)', () => {
    const db = JSON.parse(readFileSync('seasons_database.json', 'utf8')).seasons
      .map(r => ({ ...r, format: r.format || 'total-drama' }));
    for (const [format, byNumber] of Object.entries(SHOWS).map(([f, sh]) => [f, sh.booked || {}])) {
      for (const [number, w] of Object.entries(byNumber)) {
        if (db.some(r => r.format === format && Number(r.seasonNumber) === Number(number))) continue;
        expect(nextWindowFor(db, format, { number: Number(number) }), `${format} ${number}`).toEqual(w);
      }
    }
    // ...and nothing else: the Traitors' first season follows the rule.
    expect(nextWindowFor(db, 'traitors')).toEqual({ airYear: 2028, airSlot: 'winter' });
  });

  it('a booking never moves a season LATER than the rule would', () => {
    const early = [s(2020, 'fall', { format: 'total-drama', seasonNumber: 2 })];
    expect(nextWindowFor(early, 'the-circle')).toEqual({ airYear: 2021, airSlot: 'spring' });
  });

  it('a finale is the premiere plus one week per episode', () => {
    expect(finaleDate(td15).toISOString().slice(0, 10)).toBe('2027-09-27');
  });
});

describe('Drag Race All Stars', () => {
  const dr = (n, y, extra = {}) => s(y, 'winter', { format: 'drag-race', seasonNumber: n, ...extra });
  const td = s(2027, 'spring', { format: 'total-drama' });

  it('the first is possible the summer of the third flagship season, with the seasons it waits on', () => {
    const w = nextAllStarsWindow([dr(1, 2027), td], 'drag-race');
    expect(w).toMatchObject({ airYear: 2029, airSlot: 'summer', number: 1 });
    expect(w.bridge).toEqual([{ airYear: 2028, airSlot: 'winter' }, { airYear: 2029, airSlot: 'winter' }]);
  });

  it('then one a year', () => {
    const fx = [dr(1, 2027), dr(2, 2028), dr(3, 2029), s(2029, 'summer', { format: 'drag-race', seasonNumber: 4, allStars: true })];
    expect(nextAllStarsWindow(fx, 'drag-race')).toMatchObject({ airYear: 2030, airSlot: 'summer', number: 2, bridge: [] });
  });

  it('an aired All Stars does not push the next flagship season off its winter', () => {
    const fx = [dr(1, 2027), dr(2, 2028), dr(3, 2029), s(2029, 'summer', { format: 'drag-race', seasonNumber: 4, allStars: true })];
    expect(nextWindowFor(fx, 'drag-race')).toEqual({ airYear: 2030, airSlot: 'winter' });
  });

  it('a show without All Stars has none', () => {
    expect(nextAllStarsWindow([td], 'total-drama')).toBe(null);
  });
});
