// The Ridonculous Race: a plain transcript of a played season (engine plan, Task 21).
import { describe, it, expect, beforeAll } from 'vitest';
import { seasonText } from '../js/rr/transcript.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr transcript', () => {
  let result, text;
  beforeAll(() => {
    const { cast, teams } = raceCast(6, 2);
    setPlayers(cast);
    result = playRaceSeason({ teams, seed: 2 });
    text = seasonText(result);
  });

  it('has a header for every leg, with its place, kind and money', () => {
    for (const l of result.legs) {
      expect(text).toMatch(new RegExp(`^LEG ${l.n} · ${l.placeName} · ${l.kind} · \\$${l.money}`, 'm'));
    }
  });

  it('prints every scene exactly once, by id', () => {
    for (const sc of result.state.scenes) {
      const n = text.split(/\s/).filter(w => w === `#${sc.id}`).length;
      expect(n, `#${sc.id} ${sc.kind}`).toBe(1);
    }
  });

  it('shows the time of day, the mat and who went out', () => {
    expect(text).toMatch(/\[\d\d:\d\d\]/);
    for (const l of result.legs) for (const id of l.eliminated) expect(text).toContain(`OUT ${result.state.teams[id].name}`);
  });

  it('contains no undefined, NaN or [object', () => {
    expect(text).not.toMatch(/undefined|NaN|\[object/);
  });
});
