// ci-prizes.test.js — "Please collect your prize from the door."
// The show gives a judged contest's winner a reward, never power (US 2's
// golden quill, US 3's rap battle). Here: a trophy, and the room notices.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { prizeOf } from '../js/ci/games.js';
import { GAMES } from '../js/ci/games-data.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

describe('the prize at the door', () => {
  it('a judged contest with no other prize gives a trophy; a game with its own prize keeps it; the rest give none', () => {
    for (const g of GAMES) {
      if (g.prize && g.prize !== 'none') expect(prizeOf(g)).toBe(g.prize);
      else if (['make', 'photo'].includes(g.family)) expect(prizeOf(g)).toBe('trophy');
      else expect(prizeOf(g)).toBeNull();
    }
  });
  it('the winner collects it on screen, somebody in the room has an opinion, and nobody gets power from it', () => {
    const won = [1, 2, 3, 4, 5, 6].flatMap(seed => {
      const cast = rosterCast(12, seed); setPlayers(cast); const names = cast.map(p => p.name);
      return playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed }).state.scenes
        .filter(s => s.kind === 'game' && s.data.prize?.kind === 'trophy');
    });
    expect(won.length).toBeGreaterThan(0);
    for (const sc of won) {
      const keys = sc.script.blocks.map(b => b.key);
      expect(keys).toContain('game.prize.trophy');
      expect(keys).toContain('game.prize.trophy.react');
      expect(sc.data.prize.to).toHaveLength(1);
    }
  });
});
