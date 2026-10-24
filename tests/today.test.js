// Today on Blindside: the same three for everybody today, different tomorrow.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { todayPicks, careerLine, dayKey } from '../js/today.js';

const j = p => JSON.parse(readFileSync(p, 'utf8'));
const data = {
  players: j('players_database.json').players,
  seasons: j('seasons_database.json').seasons,
  rankings: j('rankings_database.json').rankings,
};

describe('todayPicks', () => {
  it('is the same all day and changes with the date', () => {
    const a = todayPicks(data, '2026-10-24');
    expect(todayPicks(data, '2026-10-24')).toEqual(a);
    const week = ['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28']
      .map(d => todayPicks(data, d).player.id);
    expect(new Set([a.player.id, ...week]).size).toBeGreaterThan(2);
  });

  it('only offers a finished season with a winner, and a played career', () => {
    for (const d of ['2026-01-01', '2026-06-15', '2026-10-24', '2027-03-09']) {
      const t = todayPicks(data, d);
      expect(t.season.status).toMatch(/complete/i);
      expect(t.player.seasonsPlayed || t.player.totalSeasons).toBeGreaterThan(0);
    }
  });

  it('pairs rankings neighbours, never two far apart', () => {
    for (const d of ['2026-01-01', '2026-06-15', '2026-10-24', '2027-03-09']) {
      const { duel } = todayPicks(data, d);
      expect(duel.a.playerId).not.toBe(duel.b.playerId);
      expect(Math.abs(duel.a.rank - duel.b.rank)).toBeLessThanOrEqual(4);
    }
  });

  it('says nothing when there is nothing', () => {
    expect(todayPicks({}, '2026-10-24')).toMatchObject({ player: null, season: null, duel: null });
  });
});

describe('careerLine', () => {
  it('names the show and the best result', () => {
    expect(careerLine({ seasonsPlayed: 3, byShow: { 'total-drama': {} }, bestPlacement: 4, totalChallengeWins: 1 }))
      .toBe('3 seasons of Total Drama · best finish 4th · 1 challenge win');
    expect(careerLine({ seasonsPlayed: 2, wins: 2, byShow: { 'total-drama': {}, 'big-brother': {} } }))
      .toBe('2 seasons of Total Drama and Big Brother · 2-time winner');
  });
});

it('dayKey is the local calendar date', () => {
  expect(dayKey(new Date(2026, 9, 4, 23, 30))).toBe('2026-10-04');
});
