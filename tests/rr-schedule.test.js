// The Ridonculous Race: format constants and the season schedule (engine plan, Task 3).
import { describe, it, expect } from 'vitest';
import { buildSchedule, DEFAULT_OPTIONS, NON_ELIM_PENALTIES } from '../js/rr/schedule.js';
import { RR_FORMAT, PENALTIES, REWARDS } from '../js/rr/format.js';

const sched = (teams, seed = 1, o = {}) => buildSchedule({ teams, seed, options: { ...DEFAULT_OPTIONS, ...o } });

describe('rr schedule', () => {
  it('the format constants', () => {
    expect(RR_FORMAT).toBe('ridonculous-race');
    expect(PENALTIES.standard).toBe(30);
    expect(PENALTIES.botchQuit).toBe(240);
    expect(PENALTIES.eitherSkip).toBe(360);
    expect(REWARDS).toContain('express');
  });

  it('12 teams: 9 elimination legs, 3 non-elimination, one final = 13', () => {
    const s = sched(12);
    expect(s).toHaveLength(13);
    expect(s.filter(l => l.kind === 'elim')).toHaveLength(9);
    expect(s.filter(l => l.kind === 'non')).toHaveLength(3);
    expect(s.at(-1).kind).toBe('final');
    expect(s.map(l => l.n)).toEqual(s.map((_, i) => i + 1));
  });

  it('never a non-elimination leg first or in the last two', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = sched(12, seed * 7919 + 13);
      expect(s[0].kind).not.toBe('non');
      expect(s.at(-2).kind).not.toBe('non');
    }
  });

  it('works from 6 to 18 teams', () => {
    for (const n of [6, 9, 18]) {
      const s = sched(n);
      expect(s.filter(l => l.kind === 'elim')).toHaveLength(n - 3);
      expect(s.at(-1).kind).toBe('final');
      expect(s[0].kind).not.toBe('non');
    }
  });

  it('money, rewards and penalties', () => {
    const s = sched(12, 5);
    expect(s.filter(l => l.money === 0)).toHaveLength(1);
    expect(s[0].money).toBeGreaterThan(0);
    expect(s.at(-1).money).toBeGreaterThan(0);
    for (const l of s) if (l.money) { expect(l.money % 10).toBe(0); expect(l.money).toBeGreaterThanOrEqual(50); expect(l.money).toBeLessThanOrEqual(300); }
    expect(s.at(-1).reward).toBeNull();
    expect(s.filter(l => l.reward)).toHaveLength(4);
    for (const l of s.filter(x => x.reward)) expect(REWARDS).toContain(l.reward);
    for (const l of s.filter(x => x.kind === 'non')) expect(NON_ELIM_PENALTIES).toContain(l.nonElimPenalty);
    expect(sched(12, 5, { nonElimPenalty: 'speed-bump' }).filter(l => l.kind === 'non').every(l => l.nonElimPenalty === 'speed-bump')).toBe(true);
  });

  it('booked twists land on their leg', () => {
    const s = sched(12, 3, { twists: { 4: 'boomerang' } });
    expect(s[3].twist).toBe('boomerang');
    expect(s[2].twist).toBeNull();
  });

  it('is deterministic', () => { expect(sched(12, 9)).toEqual(sched(12, 9)); });
});
