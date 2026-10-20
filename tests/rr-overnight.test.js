// A leg that goes through the night says so. Found by the 2026-10-20 season read (seed 41, Frozen Mine): the second
// flight landed at 18:43, the ice yachts were closed for the night, and the next thing on screen was 08:28 the next
// morning with nothing between: a clock running backwards. When a challenge closes on teams still racing, Don says
// it's shut till morning, before the jump.
import { describe, it, expect } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

const AT_TASK = new Set(['task-start', 'task-try', 'task-done', 'attempt-fail', 'don-demo', 'task-montage']);

describe('rr overnight', () => {
  it('airs Don closing a challenge for the night before every overnight jump in a leg', () => {
    let jumps = 0;
    const silent = [];
    for (const seed of [41, 42, 43, 44]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      for (const ep of airSeason(playRaceSeason({ teams, seed }))) {
        const timed = ep.segments.filter(s => s.t != null && s.t >= 0);
        timed.forEach((s, i) => {
          const next = timed[i + 1];
          // (a long flight is a jump too, and the landing says so: this is the jump INTO a challenge)
          if (!next || next.t - s.t < 360 || !AT_TASK.has(next.kind) || s.kind === 'same-flight') return;
          jumps++;
          // (Don's line, or the teams' own night by the closed challenge, in the twelve hours before the jump)
          const before = timed.slice(0, i + 1).filter(x => x.t >= s.t - 720);
          if (!before.some(x => (x.kind === 'don-narrate' && x.ending === 'overnight') || x.kind === 'closed-for-night')) silent.push(`seed ${seed} leg ${ep.n}: ${s.kind} at ${s.t}, then ${next.kind} at ${next.t}`);
        });
      }
    }
    expect(jumps).toBeGreaterThan(0);
    expect(silent).toEqual([]);
  }, 240000);

  // a challenge closed in the daytime isn't "closed for the night" (2026-10-20 read: "the skyscraper is closed till
  // morning" at 12:56), and in the finale Don's lines about the runners-up's flight and wait don't air at the crown
  it('says "the night" only at night', () => {
    const wrong = [];
    for (const seed of [41, 42, 43, 44]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed });
      airSeason(res).forEach((ep, i) => {
        const clock = res.legs[i].clockStart ?? 420;
        for (const s of ep.segments) {
          if (s.kind !== 'don-narrate' || s.ending !== 'overnight') continue;
          const tod = ((clock + s.t) % 1440 + 1440) % 1440;
          if (tod >= 6 * 60 && tod < 17 * 60) wrong.push(`seed ${seed} leg ${ep.n} at ${Math.floor(tod / 60)}:${String(Math.round(tod % 60)).padStart(2, '0')}`);
        }
      });
    }
    expect(wrong).toEqual([]);
  }, 240000);
});
