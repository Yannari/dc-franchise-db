// ══════════════════════════════════════════════════════════════════════
// dr-setup.test.js — the setup screen offers this show what it actually reads
// ══════════════════════════════════════════════════════════════════════
//
// The rule CONFIG_SCOPE encodes: a control is shown only if that format's
// engine reads the value. Every Total Drama mechanic sat on the screen for a
// Big Brother season silently doing nothing until that map existed, and a
// fourth show is a fourth chance to draw a tribe swap over a runway.
import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../js/core.js';
import { configScopeFor, blueprintFor } from '../js/quick-setup.js';

describe('drag-race setup scope', () => {
  it('defaults every dr field', () => {
    const c = defaultConfig();
    expect(c.drPremiere).toBe('standard');
    expect(c.drFinale).toBe('top4');
    expect(c.drDoubleShantay).toBe(true);
    expect(c.drDoubleSashay).toBe(false);
    expect(c.drImmunity).toBe(false);
    expect(c.drTripleLipsync).toBe(false);
    expect(c.drSchedule).toEqual([]);
    expect(c.drJudgeWeights).toEqual({});
  });

  it('shows only what the engine reads', () => {
    const s = configScopeFor('drag-race');
    expect(s.sections).toContain('sec-dr-options');
    expect(s.fields).toEqual(expect.arrayContaining(['cfg-dr-premiere', 'cfg-dr-finale',
      'cfg-dr-double-shantay', 'cfg-dr-double-sashay', 'cfg-dr-immunity', 'cfg-dr-triple']));
    // No tribes to swap, no merge to reach, no theme to author, no castle pot.
    for (const gone of ['cfg-teams', 'cfg-merge', 'cfg-days', 'cfg-theme', 'cfg-tr-pot', 'f-tribe']) {
      expect(s.fields, `${gone} still shown on a runway`).not.toContain(gone);
    }
    for (const gone of ['idol', 'ri', 'mole', 'coaches', 'advantages', 'sid', 'exile']) {
      expect(s.accordions, `${gone} still shown on a runway`).not.toContain(gone);
    }
    // Popularity IS read: every scene writes the ledger.
    expect(s.accordions).toContain('popularity');
  });

  it('draws a blueprint for a stage, not a camp', () => {
    const segs = blueprintFor({ format: 'drag-race', drFinale: 'top4' }, 14);
    expect(segs.map(x => x.label)).toEqual(['14 queens', 'one werk room', 'finale at top 4']);
    expect(segs.every(x => x.ok)).toBe(true);
    // Too few queens is a real answer, not a crash.
    expect(blueprintFor({ format: 'drag-race' }, 5)[0].ok).toBe(false);
    // And a finale bigger than the cast is refused.
    expect(blueprintFor({ format: 'drag-race', drFinale: 'top4' }, 4)[2].ok).toBe(false);
  });

  it('leaves the other three shows\' blueprints alone', () => {
    expect(blueprintFor({ format: 'big-brother', jurySize: 9, finaleSize: 3 }, 16)[0].label)
      .toMatch(/houseguest/);
    expect(blueprintFor({ format: 'total-drama', teams: 2, mergeAt: 12, jurySize: 9, finaleSize: 3 }, 18)[0].label)
      .toMatch(/player/);
  });
});
