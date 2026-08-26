// The Traitors, as the registry sees it. Everything downstream of a show —
// filenames, storage keys, every sentence a screen generates about a season —
// comes from this entry, so it is worth asserting rather than assuming.
import { describe, expect, it } from 'vitest';
import { SHOWS } from '../js/shows.js';

describe('the traitors registry entry', () => {
  it('is registered with the prefix every filename depends on', () => {
    const tr = SHOWS['traitors'];
    expect(tr, 'no traitors entry in js/shows.js').toBeTruthy();
    expect(tr.prefix).toBe('tr');
    expect(tr.name).toBe('The Traitors');
    expect(tr.short).toBe('TR');
    expect(tr.emoji).toBeTruthy();
  });

  it('does not collide with another show on prefix or name', () => {
    const prefixes = Object.values(SHOWS).map(s => s.prefix);
    expect(new Set(prefixes).size, 'two shows share a prefix').toBe(prefixes.length);
    const names = Object.values(SHOWS).map(s => s.name);
    expect(new Set(names).size, 'two shows share a name').toBe(names.length);
  });

  it('speaks its own language, and never another show\'s', () => {
    const w = SHOWS['traitors'].words;
    expect(w.round).toBe('Episode');
    expect(w.exit).toBe('banished');
    expect(w.player).toBe('player');
    // The two words that shipped as bugs on the other shows.
    expect(w.exit).not.toBe('evicted');
    expect(w.exit).not.toBe('voted out');
    expect(w.player).not.toBe('houseguest');
    expect(w.player).not.toBe('contestant');
  });

  it('omits audienceAward rather than naming an award the format lacks', () => {
    expect('audienceAward' in SHOWS['traitors'].words).toBe(false);
  });

  it('declares an audience overlay, which tests/ratings.test.js requires', () => {
    const a = SHOWS['traitors'].audience;
    expect(a, 'no audience overlay — the show would rate as generic reality TV').toBeTruthy();
    // Must not be a copy of another show's, or the same week rates identically.
    expect(a).not.toEqual(SHOWS['big-brother'].audience);
    expect(a).not.toEqual(SHOWS['total-drama'].audience);
  });

  it('declares careerStats so a season rolls up into a career', () => {
    const cs = SHOWS['traitors'].careerStats;
    expect(Array.isArray(cs)).toBe(true);
    expect(cs.length).toBeGreaterThan(0);
    for (const row of cs) expect(row).toHaveLength(2);
  });

  it('takes its franchise history from the ledger, not a checkbox', () => {
    expect(SHOWS['traitors'].historyFromLedger).toBe(true);
    // The other two shows must NOT gain this behaviour.
    expect(SHOWS['total-drama'].historyFromLedger).toBeFalsy();
    expect(SHOWS['big-brother'].historyFromLedger).toBeFalsy();
  });
});
