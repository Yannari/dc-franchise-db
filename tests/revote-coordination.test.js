import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setBond } from '../js/bonds.js';
import { simulateRevote } from '../js/voting.js';
import { seedGame } from './helpers/setup.js';

const tied = ['Julia', 'Axel', 'Nichelle', 'Raj', 'Hicks', 'Bowie'];
const voters = ['Scary Girl', 'Caleb', 'Damien', 'Aiden', 'Priya', 'MK'];
const tribal = [...tied, ...voters];
const originalLog = [
  { voter: 'Scary Girl', voted: 'Julia' },
  { voter: 'Caleb', voted: 'Nichelle' },
  { voter: 'Damien', voted: 'Caleb' },
  { voter: 'Aiden', voted: 'Caleb' },
  { voter: 'Priya', voted: 'Hicks' },
  { voter: 'MK', voted: 'Bowie' },
];

describe('multi-way revote coordination', () => {
  beforeEach(() => {
    seedGame(tribal.map(name => ({ name, stats: { loyalty: 5, boldness: 5 } })), {
      episode: 10, activePlayers: tribal, phase: 'post-merge', isMerged: true,
    });
  });

  it('consolidates an Episode 10-style six-way tie around a shared target', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // discipline wins; no isolated holdouts
    const result = simulateRevote(tribal, tied, [], originalLog, []);
    vi.restoreAllMocks();

    expect(result.log).toHaveLength(6);
    expect(Object.keys(result.votes).length).toBe(1);
    expect(Math.max(...Object.values(result.votes))).toBe(6);
    expect(result.coordination).toMatchObject({ distinctTargets: 1 });
    expect(result.log.every(v => /consensus|consolidated/.test(v.reason))).toBe(true);
  });

  it('allows a close relationship to create a secondary coalition instead of random scatter', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const anchoredLog = originalLog.map(v => v.voter === 'Damien' ? { ...v, voted: 'Nichelle' } : v);
    const baseline = simulateRevote(tribal, tied, [], anchoredLog, []);
    const primary = baseline.coordination.primaryTarget;
    setBond('Priya', primary, 5);
    const result = simulateRevote(tribal, tied, [], anchoredLog, []);
    vi.restoreAllMocks();

    expect(Object.keys(result.votes).length).toBeLessThanOrEqual(2);
    expect(result.log.find(v => v.voter === 'Priya').voted).not.toBe(primary);
    expect(result.log.find(v => v.voter === 'Priya').reason).toContain('refused to sacrifice ally');
  });

  it('preserves normal two-way revote behavior', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const twoTied = ['Julia', 'Axel'];
    const result = simulateRevote(tribal, twoTied, [], originalLog, []);
    vi.restoreAllMocks();

    expect(result.coordination).toBeNull();
    expect(result.log.every(v => twoTied.includes(v.voted))).toBe(true);
  });
});
