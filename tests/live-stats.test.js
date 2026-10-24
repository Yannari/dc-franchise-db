// The live snapshot's per-player numbers, labelled in each show's own words.
// "1 win" said nothing: an HOH, a veto and an immunity necklace are different
// wins, and Drag Race has maxi challenges, not competitions.
import { describe, it, expect } from 'vitest';
import { _liveStats } from '../js/stats-export.js';

const labels = s => s.map(x => `${x.label}:${x.value}`);

describe('_liveStats', () => {
  it('names the house in the house\'s words, without the bare total', () => {
    const s = _liveStats('big-brother', { challengeWins: 3, comps: { hoh: 2, veto: 1, blockBuster: 0 }, timesNominated: 4 });
    expect(labels(s)).toEqual(['HOH wins:2', 'vetoes won:1', 'Block Busters won:0', 'nominations:4']);
  });

  it('splits a camp\'s wins into immunity and reward', () => {
    const s = _liveStats('total-drama', { challengeWins: 3, immunityWins: 2, rewardWins: 1 });
    expect(labels(s)).toEqual(['immunity wins:2', 'reward wins:1']);
  });

  it('reads the drag record', () => {
    const s = _liveStats('drag-race', { challengeWins: 2, maxiWins: 2, lipsyncWins: 1, highs: 3, lows: 0, bottoms: 1 });
    expect(labels(s)).toContain('maxi challenges won:2');
    expect(labels(s)).toContain('lip syncs won:1');
    expect(labels(s).join(' ')).not.toMatch(/immunity|HOH|competition/);
  });

  it("falls back to the show's own word when its parts are not in the snapshot", () => {
    expect(labels(_liveStats('the-challenge', { challengeWins: 2 }))).toEqual(['dailies won:2']);
    expect(labels(_liveStats('ridonculous-race', { challengeWins: 1 }))).toEqual(['legs won:1']);
  });
});
