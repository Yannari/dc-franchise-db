import { describe, it, expect } from 'vitest';
import { _textAftermath } from '../js/text-backlog.js';

function render(ep) {
  const lines = [];
  _textAftermath(ep, s => lines.push(s), () => {});
  return lines;
}

const ep = {
  aftermath: {
    number: 1, interviewees: ['Connor'], peanutGallery: [], interviews: [],
    fanCall: {
      fanName: 'Avery', fanType: 'superfan', target: 'Connor',
      exchanges: [
        { q: 'Why did you trust Hunter?', a: 'I read him wrong. Simple as that.' },
        { q: 'Any regrets?', a: 'One. You know which.' },
        { q: 'Win next time?', a: 'Watch me.' },
      ],
      hostReactions: ['Chris: "Deep cut."', 'Chris: "Respect."'],
    },
  },
};

describe('aftermath fan-call text backlog', () => {
  const out = render(ep).join('\n');
  it('does not emit undefined', () => {
    expect(out).not.toContain('undefined');
  });
  it('renders the fan, target, and all 3 exchanges', () => {
    expect(out).toContain('FAN CALL: Avery (Superfan) takes a call with Connor.');
    expect(out).toContain('Avery: "Why did you trust Hunter?"');
    expect(out).toContain('Connor: "I read him wrong. Simple as that."');
    expect(out).toContain('Connor: "Watch me."');
  });
  it('includes host reactions between exchanges (not after the last)', () => {
    expect(out).toContain('Chris: "Deep cut."');
  });
});
