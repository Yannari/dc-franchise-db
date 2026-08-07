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
  it('still has fourteen seasons, all Total Drama', () => {
    const { seasons } = load('seasons_database.json');
    const td = seasons.filter(s => s.format === 'total-drama');
    expect(td.length).toBe(seasons.length);
    expect(td.length).toBeGreaterThanOrEqual(14);
  });

  it('kept every player and every appearance', () => {
    const { players } = load('players_database.json');
    expect(players.length).toBeGreaterThanOrEqual(152);
    const appearances = players.reduce((n, p) => n + (p.seasonDetails || []).length, 0);
    expect(appearances).toBeGreaterThanOrEqual(262);
  });

  it('did not lose a single challenge win in the move to byShow', () => {
    const { players } = load('players_database.json');
    for (const p of players) {
      const fromDetails = (p.seasonDetails || [])
        .filter(d => d.format === 'total-drama')
        .reduce((n, d) => n + (d.challengeWins || 0), 0);
      const fromByShow = p.byShow?.['total-drama']?.totalChallengeWins || 0;
      expect(fromByShow, `${p.id} lost challenge wins`).toBe(fromDetails);
    }
  });

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
