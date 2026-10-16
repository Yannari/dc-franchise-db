// The Challenge's one-episode twists (js/ch/ep-twists.js), booked on the Season Timeline: a purge, a return, a
// double. Each one plays on its episode, airs, and leaves the season's placements and rows consistent.
import { describe, it, expect, beforeAll } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeRows, challengeOptions } from '../js/ch-run.js';
import { challengeCast } from './helpers/ch-cast.js';

describe('one-episode twists', () => {
  const runs = [];
  beforeAll(() => {
    for (const seed of [21, 23]) {
      const { cast, names, background } = challengeCast(24, seed);
      setPlayers(cast);
      const r = playChallengeSeason({ cast: names, background, seed, options: { episodeTwists: { 3: 'purge', 6: 'return', 8: 'double' } } });
      airSeason(r.state);
      runs.push({ r, rows: challengeRows(r), ep: n => r.episodes.find(e => e.ep === n) });
    }
  });

  it('reads one twist per episode from the bookings, never a season rule', () => {
    const o = challengeOptions({ twistSchedule: [{ episode: 4, type: 'ch-purge' }, { episode: 7, type: 'ch-return' }, { episode: 4, type: 'ch-double' }] });
    expect(o.episodeTwists).toEqual({ 4: 'purge', 7: 'return' });
    expect(o.format).toBe('vote-callout');
    expect(o.redemption).toBe(false);
  });

  it('purges the slowest with no vote and no Arena that week', () => {
    for (const { ep } of runs) {
      const e = ep(3);
      expect(e.purged).toBeTruthy();
      expect(e.votes.length).toBe(0);
      expect(e.arena.length).toBe(0);
      expect(e.aired.some(a => a.kind === 'purge' && a.script?.lines?.length >= 6)).toBe(true);
    }
  });

  it('brings one Arena loser back, airs the fight, and keeps the rows straight', () => {
    for (const { r, rows, ep } of runs) {
      const ret = ep(6).returnArena;
      expect(ret?.winner).toBeTruthy();
      expect(ep(6).aired.some(a => a.kind === 'return-arena')).toBe(true);
      // out of the house between the two episodes, back in from the return on
      const out = r.state.returnedFrom.find(x => x.name === ret.winner);
      for (const row of rows.filter(x => x.num >= out.ep && x.num < 6)) expect(row.ch.people).not.toContain(ret.winner);
      expect(rows.find(x => x.num === out.ep).exits.map(x => x.name)).toContain(ret.winner);
      expect(rows.find(x => x.num === 6).ch.people).toContain(ret.winner);
      // everybody who left before the final has a place of their own
      const gone = r.state.gone.map(g => g.place).sort((a, b) => a - b);
      expect(new Set(gone).size).toBe(gone.length);
      expect(r.state.final.finalists.length).toBe(8);
    }
  });

  it('runs two Arenas on a booked double', () => {
    expect(runs.some(({ ep }) => ep(8).arena.length === 2)).toBe(true);
  });
});
