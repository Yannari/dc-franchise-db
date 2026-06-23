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

  it('explicit camp/tribal/victory maps still win over challenge', () => {
    expect(bedForScreen('tribal')).toBe('tribal-tension');
    expect(bedForScreen('cold-open')).toBe('camp-day');
    expect(bedForScreen('winner-ceremony')).toBe('victory');
  });

  it('generic + twist challenge screens map to the challenge bed', () => {
    expect(bedForScreen('challenge')).toBe('challenge');
    expect(bedForScreen('reward-challenge')).toBe('challenge');
    expect(bedForScreen('finale-challenge')).toBe('challenge');
    expect(bedForScreen('cliff-dive')).toBe('challenge');
    expect(bedForScreen('hp-volcano')).toBe('challenge');   // Hawaiian Punch
    expect(bedForScreen('oc-laser')).toBe('challenge');     // Operation Classified
    expect(bedForScreen('slasher-act1')).toBe('challenge');
    expect(bedForScreen('relay-flagpole')).toBe('challenge');
    expect(bedForScreen('tdd-elim')).toBe('challenge');
  });

  it('non-challenge / misc screens get no bed (keep prior)', () => {
    expect(bedForScreen('relationships')).toBeNull();
    expect(bedForScreen('debug')).toBeNull();
    expect(bedForScreen('twist')).toBeNull();
    expect(bedForScreen('ri-choice')).toBeNull();
    expect(bedForScreen('final-cut')).toBeNull();   // must NOT match the 'fc-' prefix
    expect(bedForScreen('reward-reveal')).toBeNull();
    expect(bedForScreen(null)).toBeNull();
  });
});
