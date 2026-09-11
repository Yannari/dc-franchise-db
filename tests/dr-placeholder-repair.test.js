// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-placeholder-repair.test.js — episodes that already aired get fixed too
// ══════════════════════════════════════════════════════════════════════
//
// A scene's words are written once, when the episode is simulated, and stored
// on the row. So every season played before the placeholder fix carries the
// holes forever, and re-reading the episode re-reads them: "while Autumnatic
// and {c} agree about her in the third person", reported from a live season
// after the renderer had already been fixed.
//
// The repair consults no pool and re-draws nothing. The stored scene knows who
// was in it and {a}..{d} are its players in order — the same mapping the
// renderer used — so the episode keeps the sentence it aired and gets the
// names it was meant to have.
import { describe, expect, it } from 'vitest';
import * as core from '../js/core.js';

describe('repairing an episode that already aired', () => {
  const row = () => ({
    num: 3,
    dr: { scenes: [
      { kind: 'werk:the-early-favourite',
        data: { players: ['Autumnatic', 'Ginger Hollywood', 'Taystee'],
          note: 'Somebody says {b} will win and {a} and {c} agree.' },
        text: '"{b} is winning this." {a} says it. {c} nods.' },
      // nobody to be {b}: the token stays visible rather than becoming a gap
      { kind: 'chal:mini-attempt', data: { players: ['Quin'] },
        text: 'What {a} gives {b} is a wig.' },
    ] },
  });

  it('fills the tokens from the queens the scene recorded', async () => {
    const dr = await import('../js/dr-run.js');
    const r = row();
    const fixed = dr.repairDragPlaceholders([r]);
    expect(fixed).toBeGreaterThan(0);
    const sc = r.dr.scenes[0];
    expect(sc.text).toBe('"Ginger Hollywood is winning this." Autumnatic says it. Taystee nods.');
    expect(sc.data.note)
      .toBe('Somebody says Ginger Hollywood will win and Autumnatic and Taystee agree.');
  });

  it('leaves a token with nobody to fill it rather than blanking it', async () => {
    /* A visible {b} is a bug somebody can see and report. An empty gap reads
       as a typo and hides — the harder half of this to find, and not one to
       manufacture on purpose. */
    const dr = await import('../js/dr-run.js');
    const r = row();
    dr.repairDragPlaceholders([r]);
    expect(r.dr.scenes[1].text).toBe('What Quin gives {b} is a wig.');
  });

  it('is idempotent, because it runs on every repaint', async () => {
    const dr = await import('../js/dr-run.js');
    const r = row();
    dr.repairDragPlaceholders([r]);
    const after = JSON.stringify(r);
    expect(dr.repairDragPlaceholders([r]), 'a second pass still reports work').toBe(0);
    expect(JSON.stringify(r)).toBe(after);
  });

  it('does nothing to a season that has no holes — the control arm', async () => {
    const dr = await import('../js/dr-run.js');
    const clean = { num: 1, dr: { scenes: [
      { kind: 'werk:x', data: { players: ['A', 'B'], note: 'A and B talked.' }, text: 'They did.' },
    ] } };
    const before = JSON.stringify(clean);
    expect(dr.repairDragPlaceholders([clean])).toBe(0);
    expect(JSON.stringify(clean)).toBe(before);
  });
});
