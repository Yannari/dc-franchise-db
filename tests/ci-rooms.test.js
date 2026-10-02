// ci-rooms.test.js — every player lives in one of the twelve rendered
// apartments (assets/sets/circle/apt, tools/blender/circle-apartments.py).
// The user, 2026-10-02: "six seem a little low when we often have 12 max person
// at the same time" and "all the apartment are different". A newcomer moves
// into the room a blocked player left, as on the show.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';
import { ROOMS, roomOf } from '../js/vp-ci/parts.js';

describe('apartments', () => {
  it('nobody on at the same time shares a room, and a room is kept all season', () => {
    let rowsSeen = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const cast = rosterCast(14, seed); setPlayers(cast);
      const names = cast.map(p => p.name);
      const { rows } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed });
      const kept = {};
      for (const row of rows) {
        const active = row.ci.active || [];
        if (!active.length) continue;
        rowsSeen++;
        const rooms = active.map(h => roomOf(row, h));
        for (const r of rooms) expect(ROOMS).toContain(r);
        if (active.length <= ROOMS.length) expect(new Set(rooms).size).toBe(rooms.length);
        for (const h of active) {
          expect(row.ci.profiles[h].room, `${h} has a room`).toBeTypeOf('number');
          kept[h] ??= roomOf(row, h);
          expect(roomOf(row, h)).toBe(kept[h]);
        }
      }
    }
    expect(rowsSeen).toBeGreaterThan(50);
  });

  it('an older save without rooms still gets one per apartment number', () => {
    const row = { ci: { profiles: { '@a': {}, '@b': {} } } };
    expect(roomOf(row, '@a')).toBe(ROOMS[0]);
    expect(roomOf(row, '@b')).toBe(ROOMS[1]);
  });
});
