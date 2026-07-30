import { beforeEach, describe, expect, it } from 'vitest';
import { gs } from '../js/core.js';
import { simulateBBWeek } from '../js/bb/week.js';
import { simulateDoubleEviction } from '../js/bb/bb-twists.js';
import { bbVpRevealAll, bbVpRevealNext, buildBBDoubleEvictionVPScreens, buildBBVPScreens } from '../js/bb/bb-vp.js';
import { seedGame } from './helpers/setup.js';

const CAST = ['A','B','C','D','E','F','G','H'].map((name, index) => ({
  name, archetype: ['mastermind','social-butterfly','challenge-beast','schemer','hero','floater','villain','loyal-soldier'][index],
}));
const rng = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

describe('Big Brother visual player', () => {
  beforeEach(() => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    window._bbVpState = {};
    document.body.innerHTML = '';
  });

  it('builds ordered screens from the variable act contract', () => {
    const week = simulateBBWeek({ rng: rng(7) });
    const screens = buildBBVPScreens(week);
    expect(screens).toHaveLength(week.acts.length);
    expect(screens.map(screen => screen.label)).toEqual([
      'Act 1 · HOH', 'Act 2 · Nominations', 'Act 3 · Veto', 'Act 4 · Ceremony',
      'Act 5 · Campaign 1', 'Act 6 · Campaign 2', 'Act 7 · Eviction',
    ]);
    expect(screens.every(screen => screen.id && screen.html)).toBe(true);
  });

  it('shows initial-to-final nomination changes and campaign vote drift', () => {
    const week = simulateBBWeek({ rng: rng(19) });
    const screens = buildBBVPScreens(week);
    expect(screens[1].html).toContain('private intent');
    expect(screens[3].html).toContain('Final nominees');
    expect(screens[4].html).toContain('Where the vote stands');
    expect(screens[6].html).toContain('Final locked vote');
    for (const nominee of week.finalNominees) expect(screens[6].html).toContain(nominee);
  });

  it('progressively reveals results and updates its accessible counter', () => {
    const week = simulateBBWeek({ rng: rng(27) });
    const screen = buildBBVPScreens(week)[0];
    document.body.innerHTML = screen.html;
    const key = `bb-w${week.num}-a0`;
    expect(document.querySelectorAll('.bbvp-step--shown')).toHaveLength(0);
    bbVpRevealNext(key, 2);
    expect(document.querySelectorAll('.bbvp-step--shown')).toHaveLength(1);
    expect(document.getElementById(`bbvp-count-${key}`).textContent).toContain('1 / 2');
    bbVpRevealAll(key, 2);
    expect(document.querySelectorAll('.bbvp-step--shown')).toHaveLength(2);
  });

  it('uses minimum-size reveal controls and reduced-motion support', () => {
    const html = buildBBVPScreens(simulateBBWeek({ rng: rng(4) }))[0].html;
    expect(html).toContain('min-height:44px');
    expect(html).toContain('prefers-reduced-motion:reduce');
    expect(html).toContain('aria-current="step"');
  });

  it('builds fourteen acts for a Double Eviction and marks the live half', () => {
    const result = simulateDoubleEviction({ rng: rng(38) });
    const screens = buildBBDoubleEvictionVPScreens(result);
    expect(screens).toHaveLength(result.weeks[0].acts.length + result.weeks[1].acts.length);
    expect(screens.slice(result.weeks[0].acts.length).every(screen => screen.id.includes('-de-'))).toBe(true);
    expect(screens[result.weeks[0].acts.length].html).toContain('LIVE DOUBLE EVICTION');
    expect(gs.episode).toBe(1);
  });
});
