import { describe, it, expect } from 'vitest';
import { _textRosterSwaps, _textTwists } from '../js/text-backlog.js';

function collect(fn, ep) {
  const lines = [];
  fn(ep, s => lines.push(s), s => lines.push('### ' + s));
  return lines;
}
const ep = { twists: [{ type:'producer-swap',
  producerMoves:[{player:'Lake',from:'Saplings',to:'Embers'},{player:'Connor',from:'Embers',to:'Saplings'}],
  newTribes:[{name:'Embers',members:['James','Lake']},{name:'Saplings',members:['Kai','Connor']}] }] };

describe('producer-swap text backlog ordering', () => {
  const early = collect(_textRosterSwaps, ep);
  const twists = collect(_textTwists, ep);
  it('emits the swap in the early TRIBE SHAKE-UP section', () => {
    expect(early.some(l => l.includes('### TRIBE SHAKE-UP'))).toBe(true);
    expect(early.some(l => l.includes('PRODUCER SWAP'))).toBe(true);
  });
  it('lists both reassignments', () => {
    expect(early.some(l => l.includes('Lake reassigned: Saplings → Embers'))).toBe(true);
    expect(early.some(l => l.includes('Connor reassigned: Embers → Saplings'))).toBe(true);
  });
  it('shows the new tribe rosters', () => {
    expect(early.some(l => l.startsWith('EMBERS:') && l.includes('Lake'))).toBe(true);
  });
  it('does NOT duplicate the swap in the later TWISTS section', () => {
    expect(twists.some(l => l.includes('PRODUCER SWAP'))).toBe(false);
  });
});
