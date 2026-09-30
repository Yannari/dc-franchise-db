// ci-day-one.test.js — Day 1 opens like the show (user: "I don't see a group
// chat screen in ep 1"). The first Circle Chat is where the strangers say
// hello, straight after the profiles, before any private chat.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';
import { POOLS } from '../js/ci/lines/index.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';

describe('Day 1', () => {
  it('the Circle Chat airs right after the profiles, once, as introductions', () => {
    for (let s = 1; s <= 5; s++) {
      const cast = rosterCast(13, s); setPlayers(cast);
      const names = cast.map(p => p.name);
      const { rows } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed: s });
      const kinds = rows[0].ci.aired.map(x => x.kind);
      expect(kinds.slice(0, 2), `season ${s}`).toEqual(['profiles', 'circle-chat']);
      expect(kinds.filter(k => k === 'circle-chat')).toHaveLength(1);
      // the host opens it; then the first hellos
      expect(rows[0].ci.aired[1].script.blocks.map(b => b.key)).toContain('circle.first');
    }
  });
  it('the opening lines are introductions, and there are plenty of them', () => {
    expect(POOLS['circle.first'].length).toBeGreaterThanOrEqual(5);
  });
});
