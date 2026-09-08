// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-vp-rate.test.js — the Rate-a-Queen screen
// ══════════════════════════════════════════════════════════════════════
//
// The screen is a scoreboard, so the thing worth asserting is that the
// scoreboard is REAL: that the order it settles on is the order the engine
// actually called, rather than a decorative bar chart sitting next to a
// result somebody else decided. If those two ever drift, the twist is
// lying to the viewer about why she went home.
import { describe, expect, it, beforeEach } from 'vitest';
import { dragScreens } from '../js/vp-dr/screens.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const cast = (n, seed) => {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: ['villain', 'hero', 'schemer', 'floater', 'mastermind', 'goat'][i % 6],
    age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
};

const season = () => playDragSeason({
  cast: cast(12, 5), seed: 5,
  config: { drSchedule: [{ episode: 3, rateAQueen: true }] },
  bond: () => 0, addBond: () => {}, popDelta: () => {},
});

describe('the Rate-a-Queen screen', () => {
  let row; let html;
  beforeEach(() => {
    window._tvState = {};
    row = season().rows.find(r => r.num === 3);
    html = dragScreens(row).find(s => s.id === 'dr-rate')?.html || '';
    document.body.innerHTML = html;
  });

  it('appears only on the week the twist is booked', () => {
    expect(html, 'the screen never built').toBeTruthy();
    const other = season().rows.find(r => r.num === 4);
    expect(dragScreens(other).some(s => s.id === 'dr-rate')).toBe(false);
  });

  it('draws a step per CHOICE, so Next advances one score at a time', () => {
    const { ballots } = row.dr.rateAQueen;
    const choices = Object.values(ballots).reduce((n, b) => n + b.length, 0);
    expect(document.querySelectorAll('.dr-step').length).toBe(choices);
    // One tab per queen, to step between ballots rather than through them.
    expect(document.querySelectorAll('.raq-tab').length).toBe(Object.keys(ballots).length);
  });

  it('gives every row a scoreboard slot it can be slid to', () => {
    /* Eurovision movement needs the rows absolutely positioned: reordering
       flex children with `order` does not animate, it jumps. If these ever
       stop being absolute the board still works and stops MOVING, which is
       the entire point of the screen and would be invisible in any assertion
       about numbers. */
    const rows = [...document.querySelectorAll('.raq-row')];
    expect(rows.length).toBe(row.dr.rateAQueen.board.length);
    expect(html).toMatch(/\.raq-row\{position:absolute/);
    for (const r of rows) expect(r.getAttribute('style')).toMatch(/translateY/);
  });

  it('settles on the order the engine actually called', () => {
    const { ballots, board } = row.dr.rateAQueen;
    const voters = Object.keys(ballots);
    // Recompute the Borda the way the screen's hook does.
    const pts = Object.fromEntries(board.map(r => [r.name, 0]));
    for (const v of voters) {
      const b = ballots[v];
      b.forEach((n, k) => { pts[n] += b.length - k; });
    }
    const order = [...board.map(r => r.name)].sort((a, b) => pts[b] - pts[a] || a.localeCompare(b));
    expect(order[0], 'the board crowned somebody the panel did not')
      .toBe(row.dr.call.win[0]);
    const last2 = order.slice(-2).sort();
    expect(last2, 'the board sank somebody the panel did not')
      .toEqual([...row.dr.call.bottom].sort());
  });

  it('does not print the verdict before the ballots are open', () => {
    /* The always-visible region is everything outside a .dr-step. The board
       starts at zero for everybody and marks nobody top or bottom — those
       classes are added by the reveal hook, never rendered into the HTML. */
    // Past the <style> block: the rule DEFINITIONS live there and matching
    // them proves nothing about what was rendered.
    const markup = html.replace(/<style>[\s\S]*?<\/style>/g, '');
    expect(markup).not.toMatch(/raq-top|raq-btm/);
    const pts = [...document.querySelectorAll('.raq-pts')].map(e => e.textContent);
    expect(new Set(pts)).toEqual(new Set(['0']));
    const ranks = [...document.querySelectorAll('.raq-rank')].map(e => e.textContent);
    expect(new Set(ranks)).toEqual(new Set(['–']));
  });
});
