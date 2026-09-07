// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-vp-shell.test.js — the kit every screen is built from
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it, beforeEach } from 'vitest';
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
    // The atmosphere starts BELOW the 46px nav or it paints over it.
    expect(DR_CSS).toMatch(/top: *46px/);
    expect(DR_CSS).toMatch(/max-width: *1100px/);
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
