import { describe, expect, it } from 'vitest';
import { buildSchedule } from '../js/ci/schedule.js';

/** Walk the schedule counting who is in the building. */
function walk(sched, starters) {
  let active = starters, lowest = Infinity;
  for (const d of sched) {
    active += d.arrivals;
    if (d.block) { lowest = Math.min(lowest, active); active -= 1; }
  }
  return { active, lowest };
}

describe('the schedule', () => {
  it('opens with a rating and a blocking and ends with the final ratings and the finale', () => {
    const s = buildSchedule({ total: 13, starters: 8 });
    expect(s[0]).toMatchObject({ day: 1, slot: 'rating1', block: true });
    expect(s.at(-2)).toMatchObject({ slot: 'final-ratings', final: true });
    expect(s.at(-1)).toMatchObject({ slot: 'finale', finale: true });
    expect(s.filter(d => d.block)).toHaveLength(8);
    expect(s.length).toBe(13);
  });

  it('brings newcomers in after blockings, early, two at most a day', () => {
    const s = buildSchedule({ total: 13, starters: 8 });
    const cutoff = Math.floor(s.length * 2 / 3);
    expect(s.reduce((n, d) => n + d.arrivals, 0)).toBe(5);
    for (const d of s.filter(x => x.arrivals)) {
      expect(d.day).toBeLessThanOrEqual(cutoff);
      expect(d.arrivals).toBeLessThanOrEqual(2);
      expect(s[d.day - 2].block).toBe(true);
    }
  });

  for (const [total, starters] of [[7, 5], [10, 7], [13, 8], [16, 8], [18, 8]]) {
    it(`ends with exactly the finalists for ${total} players (${starters} starting)`, () => {
      const s = buildSchedule({ total, starters });
      const { active, lowest } = walk(s, starters);
      expect(active).toBe(5);
      expect(lowest).toBeGreaterThanOrEqual(3);   // two influencers and someone at risk
    });
  }

  it('honours the author\'s length, never below what the blockings need', () => {
    expect(buildSchedule({ total: 13, starters: 8, days: 20 })).toHaveLength(20);
    expect(buildSchedule({ total: 13, starters: 8, days: 3 })).toHaveLength(10);
  });

  it('refuses a season that cannot work', () => {
    expect(() => buildSchedule({ total: 5, starters: 5 })).toThrow(/at least one blocking/);
    expect(() => buildSchedule({ total: 13, starters: 2 })).toThrow(/three starting/);
  });
});

describe('the schedule — games, parties, videos from home (Plan 3a)', () => {
  it('puts a game on day one, on every social day and on every other middle rating day, and none at the end', () => {
    const s = buildSchedule({ total: 13, starters: 8 });
    expect(s[0].game).toBe(true);
    for (const d of s.filter(x => x.slot === 'social')) { expect(d.game).toBe(true); expect(d.party).toBe(true); }
    expect(s.filter(d => d.final || d.finale).every(d => !d.game && !d.party)).toBe(true);
    const videos = s.filter(d => d.homeVideos);
    expect(videos).toHaveLength(1);
    expect(videos[0].day).toBe(s.length - 3);
    expect(s.filter(d => d.game).length).toBeGreaterThanOrEqual(7);
  });
});
