// A queen's past and her family read both Drag Race series.
// Plan: docs/superpowers/plans/2026-10-27-drag-race-all-stars-own-show.md (Task 4)
import { describe, it, expect } from 'vitest';
import { seasonsFromDocs, pastSeasonLabel } from '../js/dr/history.js';
import { queenPast } from '../js/dr/past.js';
import { seasonEdges } from '../js/dr/genealogy.js';

const AS = 'drag-race-all-stars';
const doc = (format, seasonNumber, order, families = []) => ({
  format, seasonNumber,
  placements: order.map((name, i) => ({ name, placement: i + 1, dr: { wins: i === 0 ? 3 : 0 } })),
  dr: { episodes: [], families },
});

const dr1 = doc('drag-race', 1, ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'A']);
const dr4 = doc('drag-race', 4, ['J', 'K', 'L', 'M']);
const as1 = doc(AS, 1, ['C', 'A', 'B', 'D'], [{ edges: [{ a: 'A', b: 'Z', kind: 'mother' }] }]);

describe("a queen's past across both series", () => {
  it('keeps the show on every stored season, newest first in air order', () => {
    const seasons = seasonsFromDocs([dr1, as1, dr4]);
    expect(seasons.map(s => `${s.format}/${s.season}`))
      .toEqual(['drag-race/4', `${AS}/1`, 'drag-race/1']);
  });

  it('arrives as her latest run, named by its show', () => {
    const past = queenPast({ name: 'A' }, { seasons: seasonsFromDocs([dr1, as1]) });
    expect(past.real).toBe(true);
    expect(past.format).toBe(AS);
    expect(past.rank).toBe(2);
    expect(pastSeasonLabel(past)).toBe('All Stars 1');
    expect(pastSeasonLabel({ season: 1, format: 'drag-race' })).toBe('Season 1');
    expect(pastSeasonLabel({ season: 3 })).toBe('Season 3');
  });

  it('counts the houses an All Stars season recorded', () => {
    expect(seasonEdges([as1])).toHaveLength(1);
  });
});
