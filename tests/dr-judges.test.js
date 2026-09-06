// ══════════════════════════════════════════════════════════════════════
// dr-judges.test.js — the panel, and what each of them is actually watching
// ══════════════════════════════════════════════════════════════════════
//
// Step 2 of three. The panel does not score the performance; it scores what it
// SAW, through taste. Two judges watching the same night have to be able to
// disagree, or the whole three-step design collapses back into "the highest
// number wins" — which is the simulator this one is replacing.
import { describe, expect, it } from 'vitest';
import { JUDGES } from '../js/dr/data/judges.js';
import { judgeById, guestTaste, panelFor } from '../js/dr/judges.js';

const sum = t => Object.values(t).reduce((a, b) => a + b, 0);

describe('judges data', () => {
  it('has the seven, two permanent, tastes summing to 1', () => {
    expect(JUDGES.map(j => j.id).sort())
      .toEqual(['carson', 'jamal', 'law', 'michelle', 'ross', 'rupaul', 'ts']);
    expect(JUDGES.filter(j => j.permanent).map(j => j.id).sort()).toEqual(['michelle', 'rupaul']);
    for (const j of JUDGES) {
      expect(Math.abs(sum(j.taste) - 1), `${j.id}'s taste does not sum to 1`).toBeLessThan(1e-9);
      expect(Object.keys(j.taste).sort()).toEqual(['challenge', 'polish', 'risk', 'runway']);
    }
  });

  it('gives the host both faces', () => {
    // Out of drag in the werk room, in drag on the main stage. One character,
    // two portraits, and a screen that uses the wrong one is wrong twice.
    expect(judgeById('rupaul').portrait).toBe('assets/avatars/rupaul.png');
    expect(judgeById('rupaul').portraitStage).toBe('assets/avatars/rupaul-drag.png');
    for (const j of JUDGES) expect(j.portrait, `${j.id} has no portrait`).toMatch(/^assets\/avatars\/.+\.png$/);
  });

  it('their tastes actually differ — a panel that agrees is one judge', () => {
    // The fashion judge and the comedy judge must weigh the runway differently
    // by a wide margin, or "she was robbed" can never happen.
    expect(judgeById('law').taste.runway).toBeGreaterThan(judgeById('ross').taste.runway + 0.25);
    expect(judgeById('ross').taste.challenge).toBeGreaterThan(judgeById('law').taste.challenge + 0.2);
    // And every judge has a style they are soft on.
    for (const j of JUDGES) {
      expect(Object.keys(j.styleBias).length, `${j.id} has no taste in queens`).toBeGreaterThan(1);
    }
  });

  it('returns null for a judge who does not exist rather than guessing', () => {
    expect(judgeById('nobody')).toBe(null);
  });
});

describe('guestTaste', () => {
  const mk = (name, stats, archetype = 'hero') => ({ name, slug: name.toLowerCase(), archetype,
    stats: { mental: 5, social: 5, boldness: 5, strategic: 5, ...stats } });

  it('derives taste from stats: mental → polish, boldness → risk', () => {
    const nerd = guestTaste(mk('N', { mental: 10, boldness: 1 }, 'perceptive-player'));
    const daredevil = guestTaste(mk('D', { mental: 1, boldness: 10 }, 'wildcard'));
    expect(nerd.taste.polish).toBeGreaterThan(daredevil.taste.polish);
    expect(daredevil.taste.risk).toBeGreaterThan(nerd.taste.risk);
    expect(Math.abs(sum(nerd.taste) - 1)).toBeLessThan(1e-9);
    expect(nerd.id).toBe('guest:n');
  });

  it('a warm guest is warmer than a cold one', () => {
    expect(guestTaste(mk('W', { social: 10 })).warmth)
      .toBeGreaterThan(guestTaste(mk('C', { social: 1 })).warmth);
  });

  it('works on a roster entry with no stats at all', () => {
    expect(() => guestTaste({ name: 'Bare' })).not.toThrow();
    expect(Math.abs(sum(guestTaste({ name: 'Bare' }).taste) - 1)).toBeLessThan(1e-9);
    // A name with punctuation still yields a usable id.
    expect(guestTaste({ name: "O'Hara Jones" }).id).toBe('guest:o-hara-jones');
  });
});

describe('panelFor', () => {
  it('seats the two permanents, the rotating judge, and the guest, in that order', () => {
    const p = panelFor({ rotatingId: 'law', guest: { name: 'G', slug: 'g', archetype: 'hero', stats: {} } });
    expect(p.map(j => j.id)).toEqual(['rupaul', 'michelle', 'law', 'guest:g']);
  });

  it('never seats a permanent judge twice, even if asked to rotate one in', () => {
    const p = panelFor({ rotatingId: 'michelle' });
    expect(p.map(j => j.id)).toEqual(['rupaul', 'michelle']);
  });

  it('applies authored weight overrides and renormalises', () => {
    const p = panelFor({ rotatingId: 'ross', weights: { michelle: { runway: 0.8, challenge: 0.2, risk: 0, polish: 0 } } });
    expect(p[1].taste.runway).toBeCloseTo(0.8);
    expect(Math.abs(sum(p[1].taste) - 1)).toBeLessThan(1e-9);
    // An override for one judge must not touch another's.
    expect(p[0].taste).toEqual(judgeById('rupaul').taste);
  });

  it('survives a nonsense rotating judge rather than drawing an empty seat', () => {
    expect(panelFor({ rotatingId: 'nobody' }).map(j => j.id)).toEqual(['rupaul', 'michelle']);
  });
});
