import { describe, it, expect, beforeAll } from 'vitest';

// vp-ui.js calls window.matchMedia at module-eval time; jsdom doesn't provide it.
let bedForScreen;
beforeAll(async () => {
  if (!window.matchMedia) {
    window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  }
  ({ bedForScreen } = await import('../js/vp-ui.js'));
});

describe('bedForScreen', () => {
  it('explicit data-ambient wins', () => {
    expect(bedForScreen('challenge', 'victory')).toBe('victory');
  });

  it('aftermath screens map to the aftermath bed', () => {
    expect(bedForScreen('aftermath')).toBe('aftermath');
    expect(bedForScreen('aftermath-opening')).toBe('aftermath');
    expect(bedForScreen('aftermath-fancall')).toBe('aftermath');
    expect(bedForScreen('aftermayhem-board')).toBe('aftermath');
  });

  it('camp-day covers cold-open and pre-challenge screens', () => {
    expect(bedForScreen('cold-open')).toBe('camp-day');
    expect(bedForScreen('first-impressions')).toBe('camp-day');
    expect(bedForScreen('merge')).toBe('camp-day');
    expect(bedForScreen('twist')).toBe('camp-day');
  });

  it('generic + twist challenge screens map to the challenge bed', () => {
    expect(bedForScreen('challenge')).toBe('challenge');
    expect(bedForScreen('reward-challenge')).toBe('challenge');
    expect(bedForScreen('finale-challenge')).toBe('challenge');
    expect(bedForScreen('cliff-dive')).toBe('challenge');
    expect(bedForScreen('iib-summit')).toBe('challenge');   // Ice Ice Baby
    expect(bedForScreen('hp-volcano')).toBe('challenge');   // Hawaiian Punch
    expect(bedForScreen('oc-laser')).toBe('challenge');     // Operation Classified
    expect(bedForScreen('slasher-act1')).toBe('challenge');
    expect(bedForScreen('relay-flagpole')).toBe('challenge');
    expect(bedForScreen('tdd-elim')).toBe('challenge');
  });

  it('camp-night covers post-challenge wind-down / pre-tribal social screens', () => {
    expect(bedForScreen('voting-plans')).toBe('camp-night');
    expect(bedForScreen('relationships')).toBe('camp-night');
    expect(bedForScreen('mole-exposed')).toBe('camp-night');
    expect(bedForScreen('ri-choice')).toBe('camp-night');
    expect(bedForScreen('post-twist')).toBe('camp-night');
    expect(bedForScreen('final-cut')).toBe('camp-night');   // must NOT match the 'fc-' challenge prefix
  });

  it('tribal phase covers council, votes, jury vote, and double-boot re-votes', () => {
    expect(bedForScreen('tribal')).toBe('tribal-tension');
    expect(bedForScreen('votes')).toBe('tribal-tension');
    expect(bedForScreen('votes-2')).toBe('tribal-tension');
    expect(bedForScreen('voting-plans-2')).toBe('tribal-tension'); // re-vote, not camp-night
    expect(bedForScreen('ftc')).toBe('tribal-tension');
    expect(bedForScreen('tribal-Sharks')).toBe('tribal-tension'); // multi-tribal
  });

  it('victory + unclassified', () => {
    expect(bedForScreen('winner-ceremony')).toBe('victory');
    expect(bedForScreen('reunion')).toBe('victory');
    expect(bedForScreen('debug')).toBeNull();
    expect(bedForScreen(null)).toBeNull();
  });
});
