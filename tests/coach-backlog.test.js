import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('the coaching reaches the backlog', () => {
  it('renders the board through the generic twist renderer', () => {
    const backlog = readFileSync('js/text-backlog.js', 'utf8');
    expect(backlog).toMatch(/rpBuildCoachBoard/);
    expect(backlog).toMatch(/_textTwistChallenge\([^)]*coachData/);
  });

  it('comes before the camp post section', () => {
    // A backlog that trails the camp events reads the episode out of order.
    const backlog = readFileSync('js/text-backlog.js', 'utf8');
    expect(backlog.indexOf('rpBuildCoachBoard')).toBeLessThan(backlog.indexOf('_textCampPost'));
  });
});
