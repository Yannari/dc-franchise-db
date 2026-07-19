import { describe, it, expect } from 'vitest';
import { dramaticVoteOrder } from '../js/vp-screens.js';

describe('dramatic vote reveal order (clinch last)', () => {
  it('reveals the winner\'s deciding vote last and holds the clincher below majority until then', () => {
    // 4–2 for W (majority = 4).
    const entries = [
      { juror: 'a', votedFor: 'W' }, { juror: 'b', votedFor: 'W' }, { juror: 'c', votedFor: 'W' }, { juror: 'd', votedFor: 'W' },
      { juror: 'e', votedFor: 'L' }, { juror: 'f', votedFor: 'L' },
    ];
    const order = dramaticVoteOrder(entries, 'votedFor', 'W');
    expect(order.length).toBe(6);
    expect(order[order.length - 1].votedFor).toBe('W');       // the clinch lands last
    // W never hits the winning count (4) before the final card.
    let w = 0;
    order.slice(0, -1).forEach(e => { if (e.votedFor === 'W') w++; });
    expect(w).toBeLessThan(4);
    // Same votes, same multiset.
    expect(order.filter(e => e.votedFor === 'W').length).toBe(4);
    expect(order.filter(e => e.votedFor === 'L').length).toBe(2);
  });

  it('keeps the tally tight early (lead never runs away)', () => {
    const entries = 'WWWWWLLL'.split('').map((v, i) => ({ i, votedFor: v === 'W' ? 'W' : 'L' }));
    const order = dramaticVoteOrder(entries, 'votedFor', 'W'); // 5–3, majority 5
    const counts = { W: 0, L: 0 };
    let maxGap = 0;
    order.slice(0, -1).forEach(e => { counts[e.votedFor]++; maxGap = Math.max(maxGap, Math.abs(counts.W - counts.L)); });
    expect(maxGap).toBeLessThanOrEqual(2);                    // stays close, no early blowout
    expect(order[order.length - 1].votedFor).toBe('W');
  });

  it('leaves trivial or clincher-less inputs untouched', () => {
    const two = [{ votedFor: 'A' }, { votedFor: 'B' }];
    expect(dramaticVoteOrder(two, 'votedFor', 'A')).toEqual(two);
    expect(dramaticVoteOrder([{ votedFor: 'A' }, { votedFor: 'B' }, { votedFor: 'C' }], 'votedFor', null).length).toBe(3);
  });
});
