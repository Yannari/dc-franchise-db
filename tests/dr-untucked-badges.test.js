// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-untucked-badges.test.js — the lounge says what it did
// ══════════════════════════════════════════════════════════════════════
//
// Asked of a played episode: "do untucked has an impact on popularity and
// bond cause i see no badge yet on their card so idk".
//
// It does. `applyUntuckedScene` moves both and THROWS on an event that
// changes nothing, so every scene in the room has a consequence by
// construction. The card just never said so — it read `effects.bond` only to
// tint itself warm or cold, so the one room in the show that exists to change
// relationships was the one room whose screen did not show it.
//
// A viewer cannot tell a real effect from a cosmetic one by looking, which is
// the same failure as a cosmetic event — it is just wearing the other mask.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';
import { dragScreens } from '../js/vp-dr/screens.js';

const S = ['physical','endurance','mental','social','strategic','loyalty','boldness','intuition','temperament'];
const A = ['villain','hero','floater','wildcard','goat','schemer','social-butterfly','mastermind','underdog','perceptive-player'];
const cast = (n, seed) => {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', archetype: A[i % A.length], age: 21 + i,
    stats: Object.fromEntries(S.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
};

/** Every untucked screen a few seasons produce, with its scenes. */
function lounges(seasons = 6) {
  const out = [];
  for (let s = 0; s < seasons; s++) {
    const run = playDragSeason({
      cast: cast(14, 400 + s), seed: s, config: { drFinale: 'top4' },
    });
    for (const row of run.rows) {
      const scenes = (row.dr?.scenes || []).filter(x => x.step === 'untucked' && x.text);
      if (!scenes.length) continue;
      const scr = dragScreens(row).find(x => x.id === 'dr-untucked');
      if (scr) out.push({ html: scr.html, scenes });
    }
  }
  return out;
}

describe('the untucked card', () => {
  const all = lounges();

  it('found lounges to look at', () => {
    expect(all.length).toBeGreaterThan(5);
    // ...and they really do carry consequences, or the rest proves nothing.
    const withEffect = all.flatMap(l => l.scenes)
      .filter(sc => sc.effects && (sc.effects.bond || Object.keys(sc.effects.pop || {}).length));
    expect(withEffect.length).toBeGreaterThan(10);
  });

  it('draws the bond and audience badges it earned', () => {
    let expected = 0; let drawn = 0;
    for (const l of all) {
      for (const sc of l.scenes) {
        const e = sc.effects || {};
        const players = sc.data?.players || [];
        if (e.bond && players[1]) expected++;
        for (const [who, d] of Object.entries(e.pop || {})) {
          if (d && (who === 'a' ? players[0] : players[1])) expected++;
        }
      }
      drawn += (l.html.match(/dr-arrow/g) || []).length;
    }
    expect(expected, 'no consequences to draw').toBeGreaterThan(10);
    // Every earned badge is on the screen. More is fine (the shell may carry
    // its own arrows); none is the bug.
    expect(drawn, `${drawn} badges drawn for ${expected} consequences`)
      .toBeGreaterThanOrEqual(expected);
  });

  it('carries the styles those badges need', () => {
    /* THE CONTROL ARM. The markup can be right and invisible: these classes
       live in WERK_CSS, and the untucked screen did not load it. */
    expect(all[0].html).toContain('.dr-bond-row');
    expect(all[0].html).toMatch(/\.dr-up\{/);
  });
});
