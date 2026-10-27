// All Stars counts in a queen's Drag Race career and rankings; its winner is
// inducted into the Hall of Fame.
// Plan: docs/superpowers/plans/2026-10-27-drag-race-all-stars-own-show.md (Task 6)
import { describe, it, expect } from 'vitest';
import { _rebuildByShow } from '../js/stats-export.js';
import { boardFile } from '../js/ranking-boards.js';
import { _ruRubric, RU_SHOW } from '../js/rankings-update.js';
import { careersIn } from '../js/records.js';
import { playerTriviaFor } from '../js/player-trivia.js';

const AS = 'drag-race-all-stars';
const det = (format, season, placement, wins = 0) => ({
  format, season, placement, seasonId: `${format === AS ? 'dras' : 'dr'}-${season}`,
  status: placement === 1 ? 'Winner' : 'Eliminated', dr: { wins },
});
const queen = (id, details) => ({ id, name: id.toUpperCase(), seasonDetails: details });

describe('the career', () => {
  it('all-stars wins count in the drag career', () => {
    const a = queen('a', [det('drag-race', 1, 9, 3), det(AS, 1, 1, 2)]);
    _rebuildByShow(a);
    expect(a.byShow['drag-race'].totalMaxiWins).toBe(5);
    expect(a.byShow['drag-race'].seasons).toBe(2);
    expect(a.byShow[AS]).toBeUndefined();
    expect(a.hallOfFame).toEqual([{ seasonId: 'dras-1', format: AS, season: 1 }]);
  });

  it('a main-season winner is not in the Hall of Fame', () => {
    const b = queen('b', [det('drag-race', 1, 1, 4)]);
    _rebuildByShow(b);
    expect(b.hallOfFame).toEqual([]);
  });

  it('the Drag Race career page reads both series', () => {
    const a = queen('a', [det('drag-race', 1, 9, 3), det(AS, 1, 1, 2)]);
    const [c] = careersIn({ players: [a] }, 'drag-race');
    expect(c.seasonsPlayed).toBe(2);
    expect(c.wins).toBe(1);
  });
});

describe('the rankings', () => {
  it('the drag board ranks both series', () => {
    expect(boardFile(AS)).toBe('rankings_dr.json');
    expect(_ruRubric(AS)).toBe(RU_SHOW['drag-race']);
  });
});

describe('the Hall of Fame trivia', () => {
  const field = [
    queen('a', [det('drag-race', 1, 9), det(AS, 1, 1)]),
    queen('b', [det('drag-race', 1, 1), det(AS, 2, 1)]),
    queen('c', [det('drag-race', 2, 4), det(AS, 3, 1)]),
    queen('d', [det('drag-race', 2, 1)]),
  ];
  const careers = careersIn({ players: field }, 'drag-race');
  const triv = id => playerTriviaFor(id, careers, 'drag-race');

  it('names the induction and where she placed first', () => {
    expect(triv('a')).toContain(
      'A was inducted into the Drag Race Hall of Fame on All Stars 1, after placing 9th on Drag Race 1.');
  });

  it('names the first inductee once there are enough to count', () => {
    expect(triv('a')).toContain('A was the first queen inducted into the Drag Race Hall of Fame.');
    expect(triv('c').some(t => t.startsWith('C was the third queen inducted'))).toBe(true);
  });

  it('names a winner who came back and won again', () => {
    expect(triv('b')).toContain('B won Drag Race 1 and was later inducted into the Hall of Fame on All Stars 2.');
  });

  it('says nothing about the Hall of Fame for a queen never inducted', () => {
    expect(triv('d').some(t => /Hall of Fame/.test(t))).toBe(false);
  });
});

import { readFileSync } from 'node:fs';
describe('the player page', () => {
  it('puts the Hall of Fame on the honours shelf, named by the series', () => {
    const page = readFileSync('player.html', 'utf8');
    expect(page).toMatch(/player\.hallOfFame/);
    expect(page).toMatch(/Hall of Fame · \$\{/);
  });
});
