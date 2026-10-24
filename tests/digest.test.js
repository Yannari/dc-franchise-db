// "Since you were last here": the difference between two pictures of the network.
import { describe, it, expect } from 'vitest';
import { snapshot, digestLines, sinceLabel } from '../js/digest.js';
import { onAirModel, exitSentence } from '../js/on-air.js';
import { SHOWS, DEFAULT_FORMAT } from '../js/shows.js';

const exits = (list) => ({ ok: true, seasons: [{ format: 'big-brother', seasonNumber: 2, title: 'Big Brother 2', updatedAt: 'u',
  exitInterviews: list }] });
const live = ep => ({ format: 'big-brother', airing: true, seasonNumber: 2, episode: ep, updatedAt: 'u',
  players: [{ name: 'Ana', slug: 'ana', status: 'in' }, { name: 'Bo', slug: 'bo', status: 'in' }] });
const ctx = (models, ex, seasons = []) => ({ models, exits: ex, seasons, exitSentence,
  seasonWinners: s => (s.winner ? [{ name: s.winner }] : []), showOf: f => SHOWS[f || DEFAULT_FORMAT] });

describe('digestLines', () => {
  const first = [{ id: 'bb-w1-Sabrina', guest: 'Sabrina', week: 1, placement: 18, how: 'evicted', votes: { against: 15, total: 15 } }];
  const second = [...first, { id: 'bb-w2-Kyle', guest: 'Kyle', week: 2, placement: 17, how: 'evicted', votes: { against: 9, total: 15 } }];

  it('says nothing on a first visit', () => {
    const ex = exits(first); const ms = [onAirModel(live(1), ex)];
    expect(digestLines(null, snapshot({ models: ms, exits: ex }), ctx(ms, ex))).toEqual([]);
  });

  it('tells only what is new: the move, then the exit that aired since', () => {
    const ex1 = exits(first); const m1 = [onAirModel(live(1), ex1)];
    const before = snapshot({ models: m1, exits: ex1, players: 10 });
    const ex2 = exits(second); const m2 = [onAirModel(live(2), ex2)];
    const lines = digestLines(before, snapshot({ models: m2, exits: ex2, players: 12 }), ctx(m2, ex2));
    expect(lines.map(l => l.text)).toEqual([
      'Big Brother 2 moved from week 1 to week 2.',
      'Kyle was evicted 9–6 in week 2, finishing 17th.',
      '2 new players have joined the network.',
    ]);
  });

  it('names a finale and its winner, and a new show on the air', () => {
    const ex = exits(first); const ms = [onAirModel(live(1), ex)];
    const seasons = [{ seasonId: 'ci-1', title: 'The Circle 1', format: 'the-circle', status: 'Complete', winner: 'Lila' }];
    const before = { at: 0, done: [], exitIds: ['bb-w1-Sabrina'], airing: {}, players: 0 };
    const lines = digestLines(before, snapshot({ models: ms, exits: ex, seasons }), ctx(ms, ex, seasons));
    expect(lines[0].text).toBe('The Circle 1 has finished — won by Lila.');
    expect(lines[1].text).toBe('Big Brother 2 is on the air — week 1 so far.');
    expect(lines).toHaveLength(2);
  });
});

describe('sinceLabel', () => {
  it('reads like a person', () => {
    const now = 10 * 86400000;
    expect(sinceLabel(now - 30 * 60000, now)).toBe('30 minutes ago');
    expect(sinceLabel(now - 86400000, now)).toBe('yesterday');
    expect(sinceLabel(now - 3 * 86400000, now)).toBe('3 days ago');
  });
});
