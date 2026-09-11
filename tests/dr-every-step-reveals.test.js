// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-every-step-reveals.test.js — a card nobody can ever see
// ══════════════════════════════════════════════════════════════════════
//
// `.dr-step` is `opacity:0` until something adds `dr-vis`, and the only thing
// that ever adds it is `_reapplyVisibility`, which walks `dr-step-<sfx>-<i>`
// for i below the total its controls were given. So a step whose id falls
// outside that range is rendered into the page at zero opacity and never
// revealed by anything.
//
// The maxi screen had exactly that: its room scenes — everything about the
// night that was not one queen's performance — carried `dr-step-<sfx>-room-<i>`
// ids, matched nothing, and were invisible for the life of the show.
//
// tests/dr-vp-sweep.test.js cannot catch this. It searches the rendered HTML
// for each scene's words, and the words ARE in the HTML. They are just painted
// at opacity zero.
//
// This is the generic form: whatever a screen draws, the reveal has to be able
// to reach it.
import { describe, expect, it } from 'vitest';
import { dragScreens } from '../js/vp-dr/screens.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const cast = (n, seed) => {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
};

/* Several seeds, because which challenges a season draws decides which
   builders run at all — the Snatch Game, the Ball and the LaLaPaRUza each
   have their own, and a single season reaches perhaps half of them. */
const seasons = [3, 11, 29].map(seed => playDragSeason({ cast: cast(12, 6), seed }).rows);

describe('every card a screen draws', () => {
  it('is inside the range its controls will reveal', () => {
    const bad = [];
    for (const rows of seasons) {
      for (const row of rows) {
        for (const screen of dragScreens(row)) {
          const html = screen.html || '';
          // What the controls were told, straight off the counter they render.
          for (const [, sfx, total] of html.matchAll(
            /id="dr-counter-([a-z0-9-]+)"[^>]*>\s*0\s*\/\s*(\d+)\s*</g)) {
            const n = Number(total);
            /* A step that ships with `dr-vis` already on it needs nothing
               from the reveal — the cold open's lead card is drawn visible on
               purpose, because the screen opens on it. */
            const ids = [...html.matchAll(
              new RegExp(`class="dr-step(?! dr-vis)[^"]*" id="dr-step-${sfx}-([^"]+)"`, 'g'))]
              .map(m => m[1]);
            for (const id of ids) {
              // A non-numeric suffix can never match `dr-step-<sfx>-<i>`.
              if (!/^\d+$/.test(id)) {
                bad.push(`ep${row.num} ${screen.id || sfx}: step id "${id}" is not a number`);
              } else if (Number(id) >= n) {
                bad.push(`ep${row.num} ${screen.id || sfx}: step ${id} is past the total (${n})`);
              }
            }
          }
        }
      }
    }
    expect([...new Set(bad)].slice(0, 12),
      'these cards are rendered at opacity 0 and nothing will ever reveal them')
      .toEqual([]);
  });

});
