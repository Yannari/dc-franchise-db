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

// @vitest-environment jsdom
//
// A four-way tie between four voters re-ran with all four still voting, tied
// again by construction, and went to rocks — while the screen said "X and Y
// and Z cannot vote". One of the two revote paths passed only `gs.lostVotes`
// to simulateVotes and never silenced the tied players at all.
//
// And every revote reported `isTie: true` even after producing a name, so the
// final tally printed all four as TIE with nobody eliminated over a revote
// that had just settled it.
import { describe as _d3, expect as _e3, it as _i3 } from 'vitest';
import { runHeadlessSeason as _rhs } from './helpers/coach-season.js';

_d3('a revote is a revote', () => {
  _i3('never lets a tied player vote, and records when it settles the tribal', async () => {
    let ties = 0, resolved = 0, rocks = 0, tiedVoted = 0;
    for (let r = 0; r < 4; r++) {
      const { episodes } = await _rhs({ twist: 'coaches', coachesPerTribe: 2, castSize: 16, mergeAt: 10 });
      for (const e of episodes) {
        if (!e.ep.revoteVotes) continue;
        ties++;
        if (e.ep.revoteResolved) resolved++;
        if (e.ep.isRockDraw) rocks++;
        const silenced = e.ep.revoteSilenced || [];
        for (const v of (e.ep.revoteLog || [])) {
          if (silenced.includes(v.voter)) tiedVoted++;
        }
      }
    }
    _e3(ties, 'no tie occurred at all, so this proves nothing').toBeGreaterThan(0);
    _e3(tiedVoted, 'a tied player cast a ballot in the revote that exists to exclude them').toBe(0);
    _e3(resolved, 'not one revote ever settled a tribal — every tie fell through to rocks')
      .toBeGreaterThan(0);
    _e3(rocks, 'rocks should be the exception once revotes actually resolve')
      .toBeLessThan(ties);
  }, 900000);
});
