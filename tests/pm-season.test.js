import { describe, expect, it } from 'vitest';
import { gs, setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { SEASON_TEMPLATE } from '../js/pm/schedule.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

function play(seed, n = 22) {
  const cast = makeIslanders(n, seed);
  setPlayers(cast);
  const names = cast.map(p => p.name);
  return { ...playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed }), names };
}

describe('a whole Perfect Match season', () => {
  it('plays sixteen episodes and ends with winners and at most four couples', () => {
    const { rows, winners, final } = play(1);
    expect(rows).toHaveLength(SEASON_TEMPLATE.length);
    expect(rows.every(r => r.format === 'perfect-match')).toBe(true);
    expect(winners).toHaveLength(2);
    expect(final.length).toBeGreaterThanOrEqual(2);
    expect(final.length).toBeLessThanOrEqual(4);
    expect(gs.episodeHistory).toBe(rows);
  });

  it('villa episodes carry about a hundred events', () => {
    const { rows } = play(2);
    for (const r of rows.filter(r => r.moment !== 'reunion')) {
      expect(r.pm.events.length, `episode ${r.num}`).toBeGreaterThanOrEqual(80);
    }
  });

  it("every exit uses the show's verbs and nobody leaves twice", () => {
    const { rows, names } = play(3);
    const gone = rows.flatMap(r => r.exits.map(x => x.name));
    expect(new Set(gone).size).toBe(gone.length);
    expect(gone.every(n => names.includes(n))).toBe(true);
    for (const x of rows.flatMap(r => r.exits)) expect(['dumped', 'walked']).toContain(x.verb);
  });

  it('replays byte-for-byte off the same seed', () => {
    const sig = rows => rows.map(r => `${r.num}:${r.exits.map(x => x.name).join(',')}:${r.pm.events.length}`).join('|');
    expect(sig(play(4).rows)).toBe(sig(play(4).rows));
    expect(sig(play(4).rows)).not.toBe(sig(play(5).rows));
  });

  it('a 20-islander cast still finishes', () => {
    const { rows, winners } = play(6, 20);
    expect(rows.length).toBe(SEASON_TEMPLATE.length);
    expect(winners).toHaveLength(2);
  });
});
