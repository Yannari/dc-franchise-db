// The rankings page draws a show without a vote in its own words, and a
// spin-off's tab finds its family's board.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SHOWS } from '../js/shows.js';

const page = readFileSync('rankings.html', 'utf8');

describe('a show without a vote on the rankings page', () => {
  it('declares the number it shows instead of votes', () => {
    expect(SHOWS['drag-race'].words.socialStat).toBe('In the bottom');
    expect(SHOWS['drag-race-all-stars'].words.socialStat).toBe('In the bottom');
  });
  it('draws that box, sorts by it and names the sort by it', () => {
    expect(page).toMatch(/_meta\.words && _meta\.words\.socialStat/);
    expect(page).toMatch(/socialStat \? \(ranking\.blockSurvived \|\| 0\) : \(ranking\.votesAgainst \|\| 0\)/);
    expect(page).toMatch(/option\[value="votesDesc"\]/);
  });
});

describe('a spin-off tab on the rankings page', () => {
  it("finds its family's board", () => {
    expect(page).toMatch(/familyOfFormat\(formatOfBoard\(b\)\) === familyOfFormat\(show\)/);
  });
});
