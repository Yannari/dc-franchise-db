// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-critique-rail.test.js — the panel rail does not announce the winner
// ══════════════════════════════════════════════════════════════════════
//
// The critiques screen carries a running rail, "The panel, so far". It ranked
// the queens from the FIRST critique onward, and the queen in its top slot
// goes on to win the week 94% of the time — 99% within the top two. So the
// number 1 sat beside her face while three queens were still waiting to be
// critiqued, and the rail announced the result several steps before the call.
//
// It was `_tvState`-gated and never showed an un-critiqued queen, which is the
// guard CLAUDE.md asks for. It spoiled anyway: the leak was not the future, it
// was the ORDER of the present.
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

/** Build the critiques screen for an episode and hand back the rail panels. */
const rail = seed => {
  const out = playDragSeason({ cast: cast(14, 400 + seed), seed, config: { drFinale: 'top4' } });
  for (const row of out.rows) {
    if (!row.dr?.panel?.ranking?.length || !row.dr?.call?.win?.length) continue;
    window._drSidebar = {};
    for (const sc of dragScreens(row)) {
      if (sc.id === 'dr-critiques') {
        const panels = window._drSidebar.critiques;
        if (panels && panels.length > 2) return { panels, row };
      }
    }
  }
  return null;
};

describe('the running panel rail', () => {
  it('never shows a placing, on any step', () => {
    /* NOT "not until the end" -- never. An earlier fix held the ranking back
       until the last critique, which still put the answer on screen before
       the host opened his mouth. The viewer is here to be told. */
    const r = rail(3);
    expect(r, 'no critiques screen was built').toBeTruthy();
    for (const [i, panel] of r.panels.entries()) {
      expect(panel, `step ${i} shows a placing`).not.toMatch(/dr-chip dr-c-safe">\s*[0-9]/);
      expect(panel).toContain('Nobody has been placed yet');
    }
  });

  it('lists them in the order they were critiqued, never reordered', () => {
    const { panels } = rail(3);
    const names = p => [...p.matchAll(/class="dr-nm">([^<]+)</g)].map(m => m[1]);
    const early = names(panels[0]);
    for (let i = 1; i < panels.length; i++) {
      // each step appends one queen and never moves the ones above her
      expect(names(panels[i]).slice(0, early.length)).toEqual(early);
      expect(names(panels[i]).length).toBe(i + 1);
    }
  });

  it('does not put the eventual winner top, on the last step or any other', () => {
    /* It was 94% before. Critique order has nothing to do with the result, so
       this should sit near chance for a field of this size. */
    let checked = 0; let topIsWinner = 0;
    for (let seed = 0; seed < 40; seed++) {
      const r = rail(seed);
      if (!r) continue;
      for (const panel of r.panels) {
        const first = [...panel.matchAll(/class="dr-nm">([^<]+)</g)].map(m => m[1])[0];
        checked++;
        if (r.row.dr.call.win.includes(first)) topIsWinner++;
      }
    }
    expect(checked, 'no panels were examined').toBeGreaterThan(30);
    expect(topIsWinner / checked, `top slot was the winner ${topIsWinner}/${checked}`)
      .toBeLessThan(0.4);
  });
});
