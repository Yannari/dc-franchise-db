// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-who-should-go.test.js — the twist that ran and reached no screen
// ══════════════════════════════════════════════════════════════════════
//
// "Where is the 'you should go home' section supposed to be? I didn't see it
// in the critique screen."
//
// Nowhere. It was bookable from the twist catalogue, js/dr/critiques.js
// computed the whole thing — who each queen names, the bond it costs, the
// tally it adds up to — js/dr/week.js dispatched on it and put the result on
// the row, and NOT ONE LINE of js/vp-dr drew any of it.
//
// tests/dr-vp-sweep.test.js could not catch it either: it finds scenes that
// are written and never drawn, and this scene carries `text: ''`. There were
// no words to go missing. The whole mechanic was the missing thing.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rpBuildCritiques } from '../js/vp-dr/stage.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const cast = (n, seed) => {
  const r = rngFor(seed); const d = () => 1 + Math.floor(r() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
    stats: Object.fromEntries(STATS.map(k => [k, d()])),
    drag: { acting: d(), comedy: d(), dance: d(), design: d(), runway: d(), lipsync: d(), singing: d() },
  }));
};
// Booked, not hoped for — a seed that happens to draw it stops happening.
const season = playDragSeason({
  cast: cast(12, 6), seed: 3,
  config: { drSchedule: [{ episode: 3, critiqueTwist: 'who-should-go' }] },
});
const row = season.rows.find(r => r.dr?.critiqueTwist?.kind === 'who-should-go');
/* THE MARKUP, NOT THE STYLESHEET. Every class on this screen is also a CSS
   rule in the same string, so `html.includes('dr-wsg-board')` is true on a
   week that never booked the twist — and `indexOf` finds the rule rather
   than the card. Three of the cases below passed or failed on that before
   this existed. */
const body = r => rpBuildCritiques(r).replace(/<style[\s\S]*?<\/style>/g, '');

describe('who should go home', () => {
  it('happens at all when it is booked', () => {
    expect(row, 'the booked twist never ran').toBeTruthy();
    expect(Object.keys(row.dr.critiqueTwist.votes || {}).length)
      .toBeGreaterThan(3);
  });

  it('reaches the critique screen', () => {
    const html = body(row);
    expect(html, 'the twist is still invisible').toMatch(/dr-wsg-board/);
    expect(html).toMatch(/Who should go home/i);
  });

  it('names everybody who was named, and who named them', () => {
    /* Who said it is the whole event — a name with three votes behind it and
       a name with one are different nights. */
    const html = body(row);
    const { votes, tally } = row.dr.critiqueTwist;
    for (const [voter, target] of Object.entries(votes)) {
      expect(html, `${target} was named and is not on the board`).toContain(target);
      expect(html, `${voter} named somebody and is not credited`).toContain(voter);
    }
    // and the count beside each name is the real one
    for (const [name, n] of Object.entries(tally)) {
      const at = html.indexOf(`<b>${name}</b>`);
      expect(at, `${name} has no row on the board`).toBeGreaterThan(-1);
      const row_ = html.slice(at, at + 400);
      expect(row_, `${name} is credited with the wrong count`)
        .toContain(`>${n}</span>`);
    }
  });

  it('puts the most-named queen first', () => {
    const html = body(row);
    const { tally } = row.dr.critiqueTwist;
    const most = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
    /* The first name on the BOARD. A bare <b> match finds RuPaul in the
       bench above it — the board has to be sliced out first. */
    const board = html.slice(html.indexOf('dr-wsg-board'));
    const first = (board.match(/<b>([^<]+)<\/b>/) || [])[1];
    expect(first, `${most} had the most votes and is not at the top`).toBe(most);
  });

  it('leaves the steps contiguous and counted', () => {
    /* The card is a step, so the deliberation after it shifts by one and the
       controls have to be told — an off-by-one here leaves a card that
       `_reapplyVisibility` never reveals. */
    const html = rpBuildCritiques(row);
    const ids = [...new Set((html.match(/id="dr-step-critiques-(\d+)"/g) || [])
      .map(m => Number(m.match(/(\d+)"/)[1])))].sort((a, b) => a - b);
    expect(ids.length).toBeGreaterThan(3);
    expect(ids).toEqual(ids.map((_, i) => i));
    const total = Number((html.match(/0 \/ (\d+)/) || [])[1]);
    expect(total, 'the controls and the steps disagree').toBe(ids.length);
  });

  it('draws nothing on a week that did not book it', () => {
    const plain = season.rows.find(r => r.dr?.critiques?.length
      && r.dr?.critiqueTwist?.kind !== 'who-should-go');
    expect(plain, 'no ordinary week to compare').toBeTruthy();
    expect(body(plain)).not.toMatch(/dr-wsg-board/);
  });
});
