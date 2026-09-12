// ══════════════════════════════════════════════════════════════════════
// dr-runway-themes.test.js — the prompt has to actually ask something
// ══════════════════════════════════════════════════════════════════════
//
// Reported as "the runway theme is always the same". It was not the same
// name every week — it was the same QUESTION every week, and most weeks it
// was not even that.
//
// A category's fit reads `drag.style`, which is authored, and when nobody
// authored one it was derived from a queen's single best craft through a
// seven-entry map. Three of the ten styles had no craft pointing at them, so
// on any generated cast `pageant`, `spooky` and `art` did not exist —
// measured over 720 queens, all three at zero. Which meant Night of a
// Thousand Ghouls (spooky + art) and Creatures of the Deep (art + spooky)
// flattered NOBODY in any season anybody has ever played, and six more were
// half inert.
//
// Measured before: home 15.2% of walks, against 11.7%, neutral 73.2%.
// Measured after:  home 18.8%, against 18.8%, neutral 62.4% — and the
// best-runway queen's crown rate went UP, 15% to 20%, so the prompt bites
// more often without deciding anything. That is the balance this file holds:
// a wheelhouse night is an edge and never a verdict.
import { describe, expect, it } from 'vitest';
import { RUNWAY_CATEGORIES, runwayById } from '../js/dr/data/runways.js';
import { THEME_BY_CATEGORY } from '../js/dr/data/runway-voices.js';
import { DRAG_STATS, DRAG_STYLES, DRAG_TRAITS, dragOf } from '../js/dr/queen.js';
import { runwayScore } from '../js/dr/perform.js';
import { rngFor } from '../js/dr/rng.js';

const ARCH = ['villain', 'hero', 'schemer', 'floater', 'mastermind', 'goat',
  'wildcard', 'underdog', 'chaos-agent', 'social-butterfly', 'loyal-soldier',
  'hothead', 'challenge-beast', 'perceptive-player', 'showmancer'];
const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const cast = (n, seed) => {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, archetype: ARCH[Math.floor(rng() * ARCH.length)],
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
};

describe('every style a category can name is a style a queen can be', () => {
  it('reaches all ten styles on a cast nobody authored', () => {
    /* THE BUG THIS WHOLE FILE EXISTS FOR. A category flatters a style; a
       style no generated queen can have is a category that flatters nobody,
       and it fails silently — the prompt still prints, the week still runs,
       and the number under it never moves. */
    const seen = {};
    let queens = 0;
    for (let s = 1; s <= 120; s++) {
      for (const p of cast(12, s * 31)) {
        const st = dragOf(p).style;
        seen[st] = (seen[st] || 0) + 1;
        queens++;
      }
    }
    for (const style of DRAG_STYLES) {
      expect(seen[style], `no generated queen is ever ${style}`).toBeGreaterThan(0);
      /* And not vanishingly: a style one queen in five hundred has is a
         category that fires once a decade, which on a screen is the same
         thing as never. */
      expect(seen[style] / queens, `${style} is too rare to matter`)
        .toBeGreaterThan(0.03);
      expect(seen[style] / queens, `${style} has swallowed the room`)
        .toBeLessThan(0.30);
    }
  });

  it('still lets an authored style win', () => {
    /* `player.drag.style` is AUTHORED and the derivation is only a fallback.
       A queen a human made spooky is spooky however her crafts read. */
    const p = { name: 'Q', archetype: 'hero',
      drag: { acting: 9, comedy: 9, dance: 1, design: 1, runway: 1, lipsync: 1, singing: 1, style: 'spooky' } };
    expect(dragOf(p).style).toBe('spooky');
  });
});

describe('the catalogue', () => {
  it('names only things that exist', () => {
    for (const c of RUNWAY_CATEGORIES) {
      expect(typeof c.label).toBe('string');
      for (const s of [...(c.styles || []), ...(c.clashes || [])]) {
        expect(DRAG_STYLES, `"${c.label}" names style "${s}"`).toContain(s);
      }
      if (c.asks) expect(DRAG_STATS, `"${c.label}" asks for "${c.asks}"`).toContain(c.asks);
      for (const t of c.rewards || []) {
        expect(DRAG_TRAITS, `"${c.label}" rewards trait "${t}"`).toContain(t);
      }
      /* A category cannot both flatter and fight the same style, which would
         make the narration pick one of two contradictory paragraphs by list
         order. */
      for (const s of c.styles || []) {
        expect(c.clashes || [], `"${c.label}" both flatters and fights ${s}`).not.toContain(s);
      }
      // A prompt that names no styles asks everybody the same question, so it
      // may not quietly ask for a craft either.
      if (!(c.styles || []).length) {
        expect(c.asks, `"${c.label}" is neutral and still asks for a craft`).toBeFalsy();
        expect((c.rewards || []).length, `"${c.label}" is neutral and pays a trait`).toBe(0);
      }
    }
    expect(new Set(RUNWAY_CATEGORIES.map(c => c.label)).size,
      'two categories share a label').toBe(RUNWAY_CATEGORIES.length);
  });

  it('spreads the advantage evenly over the ten styles', () => {
    /* No style may be the show's punching bag. Measured when the expansion
       first landed: `pageant` was a clash on twenty of thirty-nine prompts
       and home on five, so a pageant queen fought the runway on HALF her
       weeks — an accident of every new prompt reaching for the same foil. */
    const home = {}; const clash = {};
    const angled = RUNWAY_CATEGORIES.filter(c => (c.styles || []).length);
    for (const c of angled) {
      for (const s of c.styles) home[s] = (home[s] || 0) + 1;
      for (const s of c.clashes || []) clash[s] = (clash[s] || 0) + 1;
    }
    const fair = (angled.length * 2) / DRAG_STYLES.length;
    for (const style of DRAG_STYLES) {
      expect(home[style] || 0, `nothing flatters ${style}`).toBeGreaterThan(fair * 0.5);
      expect(home[style] || 0, `${style} is flattered by everything`).toBeLessThan(fair * 1.8);
      expect(clash[style] || 0, `${style} fights nothing`).toBeGreaterThan(fair * 0.4);
      expect(clash[style] || 0, `${style} is the show's punching bag`)
        .toBeLessThan(fair * 1.8);
    }
  });

  it('keeps a real spread of things to be good at, and some neutral weeks', () => {
    const asks = {};
    for (const c of RUNWAY_CATEGORIES) asks[c.asks || '—'] = (asks[c.asks || '—'] || 0) + 1;
    // Every craft a runway can plausibly test is tested by something.
    for (const k of ['design', 'runway', 'dance', 'acting', 'comedy', 'singing']) {
      expect(asks[k] || 0, `no category asks for ${k}`).toBeGreaterThan(0);
    }
    /* And the neutral weeks survive. They are the baseline an angled prompt
       is only interesting against, and the first thing an expansion quietly
       deletes. */
    expect(asks['—'], 'every week now has an angle').toBeGreaterThan(2);
    expect(RUNWAY_CATEGORIES.length, 'the catalogue shrank').toBeGreaterThan(35);
  });

  it('files every category under a narration family', () => {
    // Duplicated from tests/dr-runway-voices.test.js on purpose: that one is
    // about the voices, this one is about not shipping a category half-wired.
    for (const c of RUNWAY_CATEGORIES) {
      expect(THEME_BY_CATEGORY[c.label], `"${c.label}" is filed under no family`)
        .toBeTruthy();
    }
  });
});

describe('what a prompt is worth', () => {
  const base = { name: 'Q', archetype: 'floater',
    drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, style: 'camp' } };
  const flat = () => 0.5;      // no noise, so the terms are readable

  it('helps the queen it asks for and costs the one it does not', () => {
    const sews = { ...base, drag: { ...base.drag, design: 10 } };
    const cannot = { ...base, drag: { ...base.drag, design: 1 } };
    const good = runwayScore({ player: sews, category: 'x', asks: 'design', rng: flat });
    const bad = runwayScore({ player: cannot, category: 'x', asks: 'design', rng: flat });
    expect(good.ask, 'asking for design paid the queen who sews nothing')
      .toBeGreaterThan(0);
    expect(bad.ask, 'asking for design cost the queen who cannot nothing')
      .toBeLessThan(0);
    expect(good.score).toBeGreaterThan(bad.score);
  });

  it('is an edge and never a verdict', () => {
    /* THE BUDGET. `fit` alone used to be worth 1.5 points, set there by
       measurement: at 2.5 the prompt the season drew mattered as much as
       whether she can walk, and the best queen's crown rate fell from 22% to
       12.5%. The style fit and the craft ask now SPLIT that 1.5, so the
       combined swing must stay AT that 1.5 rather than on top of it. The
       first build of this put the ask on top and measured 2.88. */
    const worst = runwayScore({ player: { ...base, drag: { ...base.drag, design: 1, style: 'art' } },
      category: 'x', categoryStyles: ['camp'], asks: 'design', rng: flat });
    const bestFit = runwayScore({ player: { ...base, drag: { ...base.drag, design: 10, style: 'camp' } },
      category: 'x', categoryStyles: ['camp'], asks: 'design', rng: flat });
    const themeSwing = (bestFit.score - worst.score)
      - (bestFit.parts.craft - worst.parts.craft) * 0.7;
    expect(themeSwing, 'the theme decides the night').toBeLessThan(1.6);
    expect(themeSwing, 'the theme does nothing').toBeGreaterThan(1.1);
  });

  it('pays a trait, and pays it small', () => {
    const plain = { ...base, drag: { ...base.drag, traits: [] } };
    const reveals = { ...base, drag: { ...base.drag, traits: ['reveal-queen'] } };
    const a = runwayScore({ player: plain, category: 'x', rewards: ['reveal-queen'], rng: flat });
    const b = runwayScore({ player: reveals, category: 'x', rewards: ['reveal-queen'], rng: flat });
    expect(b.score).toBeGreaterThan(a.score);
    /* Small because traits are AUTHORED ONLY: a generated queen has none, so
       a large bonus would hand every season to the hand-built cast. */
    expect(b.score - a.score, 'the trait bonus is doing too much').toBeLessThan(0.5);
  });

  it('leaves a neutral category neutral for everybody', () => {
    const scores = DRAG_STYLES.map(style => runwayScore({
      player: { ...base, drag: { ...base.drag, style } },
      category: 'Best Drag', categoryStyles: runwayById('Best Drag').styles, rng: flat,
    }).score);
    expect(new Set(scores).size, 'a neutral prompt advantaged somebody').toBe(1);
  });

  it('does not ask twice on a walk she sewed', () => {
    /* A sewn look is already judged on `design` outright — that is what
       `sewn` means — so applying a design ASK on top counts the same fact
       twice. js/dr/week.js drops both the styles and the ask on a sewn walk;
       this is the half of that contract the scorer owns. */
    const p = { ...base, drag: { ...base.drag, design: 10 } };
    const sewn = runwayScore({ player: p, category: 'x', sewn: true, rng: flat });
    expect(sewn.parts.craft, 'a sewn walk was not judged on design').toBe(10);
    expect(sewn.ask, 'a sewn walk took an ask as well').toBe(0);
  });
});
