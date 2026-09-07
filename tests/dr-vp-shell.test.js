// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-vp-shell.test.js — the kit every screen is built from
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { STAGE_CSS } from '../js/vp-dr/stage.js';
import { DR_CSS, _shell, _icon, _portrait, _judgePortrait, DR_ICONS } from '../js/vp-dr/style.js';
import {
  _state, _controls, _reapplyVisibility, drRevealNext, drRevealAll, _updateSidebar,
} from '../js/vp-dr/reveal.js';

const ep = { num: 3, format: 'drag-race', dr: { ep: 3 } };

beforeEach(() => { window._tvState = {}; window._drSidebar = {}; document.body.innerHTML = ''; });

describe('the shell', () => {
  it('carries its own identity and never covers the nav', () => {
    expect(DR_CSS).toMatch(/\.dr-/);
    expect(DR_CSS).toMatch(/prefers-reduced-motion/);
    /* THE ATMOSPHERE MUST NOT COVER THE NAV OR THE SCROLLBAR, and those are
       two different requirements that a single `top: 46px` only half met.
       It used to be `position:fixed`, which is placed against the VIEWPORT —
       so it spanned the full window width and painted over the scrollbar of
       `.rp-main`, which is the actual scroll container (`flex:1;
       overflow-y:auto`). Pushing it down 46px dodged the nav and did nothing
       about the scrollbar.
       Sticky inside the scroll container fixes both: it cannot reach the
       scrollbar because it is inside the scrolling box, and `.rp-nav` is
       sticky in that same container at z-index 50, so a z-index of 0 here
       puts the atmosphere underneath it. Assert the RULE — never fixed, and
       stacked below the nav — rather than the offset that used to implement
       half of it. */
    expect(DR_CSS, 'a fixed atmosphere covers the scroll container scrollbar')
      .not.toMatch(/\.dr-atmo\{[^}]*position: *fixed/);
    expect(DR_CSS).toMatch(/\.dr-atmo\{[^}]*position: *sticky/);
    const atmoZ = (DR_CSS.match(/\.dr-atmo\{[^}]*z-index: *(\d+)/) || [])[1];
    expect(Number(atmoZ), 'the atmosphere is not below the nav (z-index 50)')
      .toBeLessThan(50);
    /* AND NO HARDCODED WIDTH. `#visual-player[data-view-mode]` sizes .rp-page
       to 860px (quick) and 980px (deep); this pinned 1100px and ignored the
       reader's own mode switch, so a drag screen ran wider than every other
       show's. The shell emits .rp-page and inherits. */
    expect(DR_CSS, 'the shell forces its own width again')
      .not.toMatch(/max-width: *1100px/);
    expect(DR_CSS).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });

  it('renders a phase and a sidebar mount', () => {
    const html = _shell('<p>x</p>', ep, { phase: 'stage', title: 'Main Stage', sidebar: '<b>s</b>' });
    expect(html).toMatch(/dr-phase-stage/);
    expect(html).toMatch(/id="dr-sidebar-inner"/);
    expect(html).toContain('Main Stage');
  });

  it('gives every phase its own atmosphere class, and refuses an unknown one', () => {
    for (const phase of ['werk', 'stage', 'untucked', 'lipsync', 'chart']) {
      expect(_shell('', ep, { phase, title: 't' }), phase).toMatch(new RegExp(`dr-phase-${phase}`));
      expect(DR_CSS, `${phase} has no atmosphere`).toMatch(new RegExp(`\\.dr-phase-${phase}`));
    }
    expect(() => _shell('', ep, { phase: 'nowhere', title: 't' })).toThrow(/nowhere/);
  });

  it('has an icon set and refuses an unknown one', () => {
    for (const t of ['mirror', 'wig', 'sewing', 'runway', 'microphone', 'camera',
      'lipstick', 'crown', 'star', 'hanger', 'spotlight', 'heels']) {
      expect(_icon(t), t).toMatch(/<(span|svg)/);
      expect(_icon(t), t).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    }
    expect(Object.keys(DR_ICONS).length).toBeGreaterThanOrEqual(12);
    // A typo must be a crash, not an invisible blank on the screen.
    expect(() => _icon('nonsense')).toThrow(/nonsense/);
  });

  it('draws a portrait through the resolver, and initials when there is none', () => {
    const withFace = _portrait('Cameron', ep, { slug: 'cameron' });
    expect(withFace).toMatch(/<img|dr-initials/);
    // Somebody the resolver knows nothing about still gets a slot rather than
    // a broken image: the shape of the row must not depend on the art.
    const none = _portrait('Nobody At All', ep, { slug: '' });
    expect(none).toMatch(/dr-initials|<img/);
    expect(none).toContain('N');
  });

  it('gives the host her stage look on the stage and her werk look in the room', () => {
    const stage = _judgePortrait('rupaul', { stage: true });
    const werk = _judgePortrait('rupaul', { stage: false });
    expect(stage).toContain('rupaul-drag');
    expect(werk).not.toContain('rupaul-drag');
    // A judge with no separate stage look uses the one portrait either way.
    expect(_judgePortrait('michelle', { stage: true })).toContain('michellevisage');
    // An unknown judge is a crash, for the same reason an unknown icon is.
    expect(() => _judgePortrait('nobody', {})).toThrow(/nobody/);
  });
});

describe('reveals are DOM-only', () => {
  it('reveals one step at a time and updates the counter', () => {
    document.body.innerHTML = `
      <div id="dr-step-test-0"></div><div id="dr-step-test-1"></div><div id="dr-step-test-2"></div>
      <span id="dr-counter-test"></span><div id="dr-controls-test"><button></button></div>
      <div id="dr-sidebar-inner"></div>`;
    window._drSidebar.test = ['a', 'b', 'c'];
    drRevealNext('test', 3, 3);
    expect(document.getElementById('dr-step-test-0').className).toMatch(/dr-vis/);
    expect(document.getElementById('dr-step-test-1').className).not.toMatch(/dr-vis/);
    expect(document.getElementById('dr-counter-test').textContent).toMatch(/1.*3/);
    drRevealNext('test', 3, 3);
    drRevealNext('test', 3, 3);
    expect(document.getElementById('dr-step-test-2').className).toMatch(/dr-vis/);
    expect(document.getElementById('dr-controls-test').className).toMatch(/dr-done/);
  });

  it('reveal all shows everything, and reapply survives a screen switch', () => {
    /* THE ONE THAT MATTERS. renderVPScreen repaints the whole screen, so the
       elements the last click touched are gone by the time the next one
       lands. Reapply loops 0→idx over the FRESH DOM rather than trusting
       what it did before — every VP in this repo has had a version of this,
       and the ones that patched only the newest step lost every reveal on a
       tab switch. */
    document.body.innerHTML = '<div id="dr-step-t2-0"></div><div id="dr-step-t2-1"></div>'
      + '<span id="dr-counter-t2"></span><div id="dr-controls-t2"></div>';
    drRevealAll('t2', 2, 5);
    expect(document.getElementById('dr-step-t2-1').className).toMatch(/dr-vis/);
    document.body.innerHTML = '<div id="dr-step-t2-0"></div><div id="dr-step-t2-1"></div>'
      + '<span id="dr-counter-t2"></span><div id="dr-controls-t2"></div>';
    _reapplyVisibility('t2', _state({ num: 5 }, 't2').idx, 2);
    expect(document.getElementById('dr-step-t2-1').className).toMatch(/dr-vis/);
  });

  it("state is per episode, so replaying one does not inherit another's reveals", () => {
    drRevealAll('t3', 4, 1);
    expect(_state({ num: 1 }, 't3').idx).toBe(3);
    expect(_state({ num: 2 }, 't3').idx).toBe(-1);
  });

  it('the sidebar updates without rebuilding the page', () => {
    document.body.innerHTML = '<div id="dr-step-t4-0"></div><span id="dr-counter-t4"></span>'
      + '<div id="dr-controls-t4"></div><div id="dr-sidebar-inner">old</div>';
    window._drSidebar.t4 = ['fresh'];
    drRevealNext('t4', 1, 9);
    expect(document.getElementById('dr-sidebar-inner').innerHTML).toBe('fresh');
  });

  it('THE SIDEBAR NEVER SHOWS A STEP AHEAD', () => {
    // Gated on the reveal index, not merely hidden: a panel belonging to a
    // later step is not in the DOM at all.
    document.body.innerHTML = '<div id="dr-step-t5-0"></div><div id="dr-step-t5-1"></div>'
      + '<div id="dr-step-t5-2"></div><span id="dr-counter-t5"></span>'
      + '<div id="dr-controls-t5"></div><div id="dr-sidebar-inner"></div>';
    window._drSidebar.t5 = ['step one', 'step two', 'step three'];
    drRevealNext('t5', 3, 7);
    const shown = document.getElementById('dr-sidebar-inner').innerHTML;
    expect(shown).toBe('step one');
    expect(shown).not.toContain('step two');
    expect(shown).not.toContain('step three');
  });

  it('a missing mount is survivable — a screen may have no sidebar at all', () => {
    document.body.innerHTML = '<div id="dr-step-t6-0"></div>';
    expect(() => drRevealNext('t6', 1, 2)).not.toThrow();
    expect(() => _updateSidebar('t6', 2)).not.toThrow();
  });

  it('the controls carry the ids reapply looks for', () => {
    const html = _controls('mine', 5, 3);
    expect(html).toContain('id="dr-controls-mine"');
    expect(html).toContain('id="dr-counter-mine"');
    expect(html).toMatch(/drRevealNext\('mine', *5, *3\)/);
    expect(html).toMatch(/drRevealAll\('mine', *5, *3\)/);
  });
});

// ══════════════════════════════════════════════════════════════════════
// Measured in the browser, not guessed
// ══════════════════════════════════════════════════════════════════════
describe('the reader has room to read', () => {
  /* Rendered at 1440px and measured: the page was capped at 760, the card
     came out 358, and the paragraph read in a 178px ribbon — 88% of the
     window thrown away. The mode widths are for a single column of reading
     text; a drag screen is a two-column broadcast layout with a 292px rail
     beside the cards, so it takes its own width. */
  it('drag screens take a broadcast width, not an article width', () => {
    const css = readFileSync('css/simulator.css', 'utf8');
    expect(css, 'the drag width override is gone')
      .toMatch(/\[data-view-mode\][^\n]*\.rp-page\[class\*="dr-phase-"\][^\n]*max-width:\s*1180px/);
  });

  /* THE PARAGRAPH IS A GRID CHILD. It used to sit in the middle cell of the
     card's three-column grid — between the portrait and the score, the
     narrowest place on it. */
  it('the walk paragraph spans the card rather than sitting in a column', () => {
    expect(STAGE_CSS).toMatch(/\.dr-walk-line\{[^}]*grid-column:\s*1\/-1/);
    expect(STAGE_CSS).toMatch(/\.dr-walk-line\{[^}]*max-width:\s*74ch/);
  });

  /* THE RAIL MUST NOT ARRIVE EMPTY. Every screen computes a full set of rail
     panels into `window._drSidebar` and then handed the shell a bare heading,
     because the panel is only swapped in on a reveal CLICK — so the rail was
     a 53px box with a title and nothing under it at the moment a reader
     decides whether the screen is worth reading. */
  it('seeds the rail with its first panel', async () => {
    const { _seedRail } = await import('../js/vp-dr/reveal.js');
    globalThis.window = globalThis.window || {};
    window._drSidebar = { runway: ['<b>first panel</b>', '<b>second</b>'] };
    expect(_seedRail('runway', '<h4>fallback</h4>')).toBe('<b>first panel</b>');
    // A screen whose panels do not exist yet still gets its heading rather
    // than a crash.
    expect(_seedRail('nothing', '<h4>fallback</h4>')).toBe('<h4>fallback</h4>');
    window._drSidebar = null;
    expect(_seedRail('runway', '<h4>fallback</h4>')).toBe('<h4>fallback</h4>');
  });

  it('every screen that computes rail panels seeds from them', () => {
    for (const f of ['arrivals', 'challenge', 'results', 'stage']) {
      const src = readFileSync(`js/vp-dr/${f}.js`, 'utf8');
      if (!src.includes('_drSidebar')) continue;
      expect(src, `${f}.js hands the shell a bare heading again`)
        .not.toMatch(/sidebar:\s*'<h4/);
    }
  });
});
