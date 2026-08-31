import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const expected = ['bowie','mike','millie','thom','grett','gabby','james','lake','yul','natalia','julia','dj'];
const history = JSON.parse(readFileSync('data/continuity/fans-vs-favorites-favorites-history.json','utf8'));
const bible = readFileSync('docs/continuity/fans-vs-favorites-favorites-bible.md','utf8');
const context = JSON.parse(readFileSync('data/continuity/fans-vs-favorites-favorites-context.json','utf8'));

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
describe('Favorites continuity bible', () => {
  const required = ['Canon baseline','Simulator chronology','Evolution','Current motivation','Voice','Behavioral boundaries','Favorites relationships','Open hooks'];
  for (const slug of expected) it(`${slug} has a complete writing reference`, () => {
    const start = bible.indexOf(`<!-- favorite:${slug} -->`);
    expect(start).toBeGreaterThan(-1);
    const next = bible.indexOf('<!-- favorite:', start + 20);
    const section = bible.slice(start, next < 0 ? bible.length : next);
    for (const label of required) expect(section).toContain(`### ${label}`);
    for (const appearance of history.players[slug].appearances) expect(section).toContain(`Season ${appearance.season}`);
  });
  it('documents Bowie and Julia as shared-history rivals', () => {
    expect(bible).toContain('Bowie ↔ Julia');
    expect(bible).toContain('shared simulator history');
  });
});
describe('compact Favorites episode context', () => {
  it('contains the finalized cast exactly once in order', () => {
    expect(context.cast.map(x => x.slug)).toEqual(expected);
    expect(new Set(context.cast.map(x => x.name)).size).toBe(12);
  });
  it('keeps every writer block compact but continuity-rich', () => {
    for (const player of context.cast) {
      expect(player.context.length, player.slug).toBeLessThanOrEqual(1200);
      expect(player.context).toMatch(/Placement history:/);
      expect(player.context).toMatch(/Open hook:/);
    }
  });
  it('keeps Thom on Thom seasons only', () => {
    const thom = context.cast.find(x => x.slug === 'thom').context;
    expect(thom).toContain('Season 11');
    expect(thom).toContain('Season 13');
    expect(thom).not.toContain('Season 7');
  });
});