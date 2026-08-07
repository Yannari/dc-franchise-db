import { describe, expect, it } from 'vitest';
import { SHOWS, formatPrefix, seasonId, parseSeasonRef, showName } from '../js/shows.js';

describe('the show registry', () => {
  it('knows both shows by their slugs', () => {
    expect(Object.keys(SHOWS)).toContain('total-drama');
    expect(Object.keys(SHOWS)).toContain('big-brother');
    expect(showName('big-brother')).toBe('Big Brother');
  });

  it('builds a season id from a format and a number', () => {
    expect(seasonId('total-drama', 14)).toBe('td-14');
    expect(seasonId('big-brother', 1)).toBe('bb-1');
    expect(formatPrefix('total-drama')).toBe('td');
  });
});

describe('parseSeasonRef', () => {
  // The whole point: every link ever saved is a bare number.
  it('reads a bare number as Total Drama', () => {
    expect(parseSeasonRef('7')).toEqual({ format: 'total-drama', number: 7 });
    expect(parseSeasonRef(7)).toEqual({ format: 'total-drama', number: 7 });
  });

  it('reads a prefixed id', () => {
    expect(parseSeasonRef('bb-1')).toEqual({ format: 'big-brother', number: 1 });
    expect(parseSeasonRef('td-14')).toEqual({ format: 'total-drama', number: 14 });
  });

  it('round-trips', () => {
    expect(parseSeasonRef(seasonId('big-brother', 3))).toEqual({ format: 'big-brother', number: 3 });
  });

  it('refuses nonsense rather than guessing', () => {
    expect(parseSeasonRef('')).toBeNull();
    expect(parseSeasonRef('xx-2')).toBeNull();
    expect(parseSeasonRef('bb-0')).toBeNull();
    expect(parseSeasonRef(null)).toBeNull();
  });
});
