// What today did to a couple (pm/script.js sourOf): the fire pit's pleas and
// goodbyes, the night's nerves, the comfort and the dates read it. Season read
// 2026-10-25: Callum, told about Amber that afternoon, pleaded "I've got
// something real with Amber" and left on "I love you, you know".
import { describe, expect, it } from 'vitest';
import { sourOf } from '../js/pm/script.js';

const day = (...evs) => ({ ep: 4, _today: evs.map(e => ({ ep: 4, extra: {}, ...e })) });

describe('sourOf: what today did to two islanders, and whose doing it was', () => {
  it('a clean day is null', () => {
    expect(sourOf(day({ kind: 'chat', players: ['A', 'B'] }), 'A', 'B')).toBe(null);
  });
  it('told about the partner: the one told is wronged, the one told about did it', () => {
    const s = day({ kind: 'gossip', players: ['W', 'A', 'B'] });
    expect(sourOf(s, 'A', 'B')).toBe('theirs');
    expect(sourOf(s, 'B', 'A')).toBe('mine');
  });
  it('a confrontation forgiven is not a sour day; one not forgiven is', () => {
    expect(sourOf(day({ kind: 'told-confront', players: ['A', 'B'], extra: { verdict: 'forgive' } }), 'A', 'B')).toBe(null);
    expect(sourOf(day({ kind: 'told-confront', players: ['A', 'B'], extra: { verdict: 'warning' } }), 'A', 'B')).toBe('theirs');
  });
  it('a turned head, an honest answer, Movie Night and the photos', () => {
    expect(sourOf(day({ kind: 'graft-turn', players: ['B', 'A', 'C'] }), 'A', 'B')).toBe('theirs');
    expect(sourOf(day({ kind: 'where-head', players: ['A', 'B'], extra: { of: 'honest' } }), 'A', 'B')).toBe('theirs');
    expect(sourOf(day({ kind: 'where-head', players: ['A', 'B'], extra: { of: 'reassure' } }), 'A', 'B')).toBe(null);
    expect(sourOf(day({ kind: 'movie-clip', players: ['B', 'C'], extra: { of: 'kiss', audience: ['A', 'B'] } }), 'A', 'B')).toBe('theirs');
    expect(sourOf(day({ kind: 'photos', players: ['A', 'B'] }), 'A', 'B')).toBe('theirs');
  });
  it('a row is both of theirs, and so is a day where each wronged the other', () => {
    expect(sourOf(day({ kind: 'argument', players: ['A', 'B'] }), 'A', 'B')).toBe('row');
    expect(sourOf(day({ kind: 'gossip', players: ['W', 'A', 'B'] }, { kind: 'gossip', players: ['W', 'B', 'A'] }), 'A', 'B')).toBe('row');
  });
  it('yesterday is not today', () => {
    const s = { ep: 5, _today: [{ ep: 4, kind: 'gossip', players: ['W', 'A', 'B'], extra: {} }] };
    expect(sourOf(s, 'A', 'B')).toBe(null);
  });
});
