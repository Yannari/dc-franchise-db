// Two pickers, two stores, and neither has ever read the other.
//
// The weeks write `bbCompSchedule`; finale night writes `bbFinalComps`. Nothing
// cross-referenced them, so there was no way to notice that the competition you
// were about to pin to week nine is the one already running in week four —
// short of opening every dropdown in the timeline and remembering what you saw.
import { beforeEach, describe, expect, it } from 'vitest';
import { seasonConfig } from '../js/core.js';
import { _bbPinnedIndex, _bbUsedTag } from '../js/run-ui.js';

beforeEach(() => {
  // run-ui.js has no imports — it reads the globals main.js exposes on window,
  // so a test that only imports seasonConfig is talking to a different object.
  globalThis.seasonConfig = seasonConfig;
  seasonConfig.bbCompSchedule = [
    { episode: 4, hoh: 'bb-the-wall', veto: 'bb-otev' },
    { episode: 9, hoh: 'bb-slip-and-slide' },
  ];
  seasonConfig.bbFinalComps = { one: 'bb-final-part-one', two: 'bb-the-wall' };
});

describe('a competition already pinned somewhere says so', () => {
  it('finds every pin across the weeks and the finale', () => {
    const used = _bbPinnedIndex();
    expect(used.get('bb-otev')).toEqual(['wk 4 VETO']);
    expect(used.get('bb-slip-and-slide')).toEqual(['wk 9 HOH']);
    // The one that matters: the same comp in a week AND on finale night.
    expect(used.get('bb-the-wall')).toEqual(['wk 4 HOH', 'Finale P2']);
  });

  it('leaves out the slot being edited, or every pin reports itself', () => {
    const editingWk4Hoh = _bbPinnedIndex({ skipEp: 4, skipSlot: 'hoh' });
    expect(editingWk4Hoh.get('bb-the-wall'), 'week 4 flagged its own pin as a clash')
      .toEqual(['Finale P2']);
    const editingFinaleTwo = _bbPinnedIndex({ skipRole: 'two' });
    expect(editingFinaleTwo.get('bb-the-wall')).toEqual(['wk 4 HOH']);
  });

  it('says where, not just that', () => {
    const used = _bbPinnedIndex();
    expect(_bbUsedTag(used, 'bb-the-wall')).toBe(' — already wk 4 HOH, Finale P2');
    expect(_bbUsedTag(used, 'bb-nothing-here')).toBe('');
  });

  it('summarises rather than running off the end of the option', () => {
    seasonConfig.bbCompSchedule = [1, 2, 3, 4].map(episode => ({ episode, hoh: 'bb-the-wall' }));
    seasonConfig.bbFinalComps = {};
    const tag = _bbUsedTag(_bbPinnedIndex(), 'bb-the-wall');
    expect(tag).toBe(' — already wk 1 HOH, wk 2 HOH +2');
  });

  it('is empty on a season with nothing pinned', () => {
    seasonConfig.bbCompSchedule = [];
    seasonConfig.bbFinalComps = {};
    expect(_bbPinnedIndex().size).toBe(0);
  });
});
