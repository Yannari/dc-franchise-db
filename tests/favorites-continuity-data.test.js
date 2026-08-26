import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const expected = ['bowie','mike','millie','thom','grett','gabby','james','lake','yul','natalia','julia','dj'];
const history = JSON.parse(readFileSync('data/continuity/fans-vs-favorites-favorites-history.json','utf8'));

describe('Favorites continuity history', () => {
  it('contains the finalized cast once each', () => {
    expect(Object.keys(history.players).sort()).toEqual([...expected].sort());
  });
  it('keeps Thom and archived Tom distinct', () => {
    expect(history.players.thom.canonIdentity).toBe('Tom');
    expect(history.players.thom.appearances.map(x => x.season)).toEqual([11,13]);
    expect(history.players).not.toHaveProperty('tom');
  });
  it('keeps appearances chronological and traceable to archived data', () => {
    for (const player of Object.values(history.players)) {
      expect(player.appearances.length).toBeGreaterThan(0);
      expect(player.appearances.map(x => x.season)).toEqual(player.appearances.map(x => x.season).sort((a,b) => a-b));
      for (const appearance of player.appearances) expect(appearance.sourceFile).toMatch(/^data\/seasons\/season\d+-data\.json$/);
    }
  });
});