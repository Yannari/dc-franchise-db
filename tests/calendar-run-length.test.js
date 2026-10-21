// The user, 2026-10-21: the calendar drew the next Total Drama at 26 weeks because the season before it ran 26 —
// "a 15 episode season of total drama would probably not go from fall to winter". An unaired season's bar now runs
// as long as its cast (franchise-calendar.js projectedRun).
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { projectedRun, episodeAirDates } from '../js/franchise-calendar.js';
import { SHOWS } from '../js/shows.js';

const seasons = JSON.parse(readFileSync('seasons_database.json', 'utf8')).seasons.map(s => ({ ...s, format: s.format || 'total-drama' }));

describe('how long an unaired season is drawn', () => {
  it('follows its cast: fifteen Total Drama players stay in the fall', () => {
    const run = projectedRun('total-drama', seasons, 15);
    expect(run.basis).toBe('cast');
    expect(run.count).toBeLessThanOrEqual(14);
    const dates = episodeAirDates({ airYear: 2027, airSlot: 'fall' }, run.count, 'total-drama');
    expect(dates.at(-1).getUTCFullYear() === 2027 || dates.at(-1).getUTCDate() <= 7).toBe(true);
    expect(projectedRun('total-drama', seasons, 24).count).toBeGreaterThan(run.count);
  });
  it('without a cast, runs the show’s usual length, not whatever the last season ran', () => {
    const td = seasons.filter(s => s.format === 'total-drama');
    const run = projectedRun('total-drama', seasons);
    expect(run.basis).toBe('typical');
    expect(run.count).toBeLessThan(Number(td.at(-1).episodeCount));
  });
  it('uses the measured rate for a show that has not aired', () => {
    for (const [format, show] of Object.entries(SHOWS)) expect(show.runPerPlayer, format).toBeGreaterThan(0);
    // a Challenge cast of 24 played 15 episodes, not 24
    expect(projectedRun('the-challenge', [], 24).count).toBeLessThanOrEqual(15);
    expect(projectedRun('traitors', [], 22).count).toBeLessThanOrEqual(12);
  });
});
