// The catfish calibration (Plan 3b Task 1). The real show: catfish are about
// a third of a cast and won 5 of 10 seasons. The engine had them reaching
// the final as often as honest players and then losing it (win given final
// 11% vs 25%, 60 seasons): a curated face earned nothing in the chats, and
// "deserves it" counted raw Influencer nights, which a late arrival can't have.
import { describe, expect, it } from 'vitest';
import { room } from './helpers/ci-room.js';
import { rel } from '../js/ci/state.js';
import { runChat, CURATED } from '../js/ci/conversation.js';
import { voterScore } from '../js/ci/ratings.js';
import { streamFor } from '../js/dr/rng.js';

describe('a curated face is easier to like (spec 5.3, the hyperpersonal effect)', () => {
  it('a warm chat warms the room more toward a catfish than toward the same profile honest (control arm)', () => {
    const warmth = mode => {
      let total = 0;
      for (let seed = 1; seed <= 200; seed++) {
        const s = room(4, seed);
        s.profiles['@q0'].mode = mode;
        runChat(s, streamFor(seed, 'chat'), { from: '@q0', to: '@q1', intent: 'bond' });
        total += rel('@q1', '@q0', 'affection');
      }
      return total;
    };
    expect(CURATED).toBeGreaterThan(0);
    expect(warmth('catfish')).toBeGreaterThan(warmth('honest') * 1.1);
  });
});

describe('"deserves it" is a rate, not a count', () => {
  it('a late arrival who led every rating they were in deserves as much as an original who did', () => {
    const s = room(5, 1);
    s.ratings = [1, 2, 3, 4].map(day => ({ day, final: false, targets: day >= 3 ? ['@q0', '@q1', '@q2'] : ['@q1', '@q2'], results: [] }));
    s.influencerCount = { '@q0': 2, '@q1': 4 };
    const d = t => voterScore(s, () => 0.5, '@q3', t, { final: true }).parts.deserves;
    expect(d('@q0')).toBeCloseTo(d('@q1'), 5);
  });
});

import { goodbyeVideo, SOUR_GRAPES } from '../js/ci/blocking.js';
import { belief } from '../js/ci/beliefs.js';
import { THEORY_LINE } from '../js/ci/slips.js';
import { bump } from '../js/ci/state.js';
describe('a goodbye video is a grievance more often than an accusation', () => {
  function leaving(realAboutQ1) {
    const s = room(5, 3);
    s.profiles['@q1'].mode = 'catfish';
    s.active = s.active.filter(h => h !== '@q0');
    s.blocked.push({ handle: '@q0', day: 1, channel: 'influencers', by: ['@q2'] });
    belief(s, '@q0', '@q1').real = realAboutQ1;
    bump('@q0', '@q1', 'resentment', 2);
    return s;
  }
  it('calls somebody a catfish only past the theory line; a doubt short of it is a grievance', () => {
    const doubt = goodbyeVideo(leaving(THEORY_LINE + 0.1), () => 0.5, '@q0');
    expect(doubt.data.warning?.kind).not.toBe('catfish');
    const theory = goodbyeVideo(leaving(THEORY_LINE - 0.1), () => 0.5, '@q0');
    expect(theory.data.warning?.kind).toBe('catfish');
  });
  it('the room takes a blocked player\'s parting accusation at a discount', () => {
    expect(SOUR_GRAPES).toBeLessThan(1);
    const s = leaving(0.1);
    const before = belief(s, '@q3', '@q1').real;
    goodbyeVideo(s, () => 0.5, '@q0');
    const drop = before - belief(s, '@q3', '@q1').real;
    expect(drop).toBeGreaterThan(0);
    expect(drop).toBeLessThan(0.25 * 1.2 * SOUR_GRAPES + 1e-9);
  });
});
