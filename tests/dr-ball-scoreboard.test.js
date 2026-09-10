// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-ball-scoreboard.test.js — the scoreboard is the score
// ══════════════════════════════════════════════════════════════════════
//
// Reported from a played Ball: the placement list had Paige Turner first on a
// scoreboard total of 40, with Gigi Cherie third on 73 — and Paige won the
// night. A viewer watched a number climb for eight minutes and then watched
// it not matter.
//
// The paddles were invented by the viewing party: `_derivePaddleScores` built
// them from her look score plus a hash of her NAME, and nothing downstream
// read them. The week was decided by `judgeViews`, which weighs performance
// alongside risk, polish, the seat's style bias, what it remembers and the
// night's form. The two were free to disagree completely, and did.
//
// They come from `panel.views` now — each judge's own placing of that queen,
// which is what a paddle is.
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
const ball = seed => {
  const out = playDragSeason({
    cast: cast(14, 400 + seed), seed,
    config: { drSchedule: [{ episode: 5, maxiId: 'ball' }], drFinale: 'top4' },
  });
  const row = out.rows[4];
  if (row?.dr?.challenge?.id !== 'ball') return null;
  window._drSidebar = {};
  dragScreens(row);
  const panels = window._drSidebar.ball;
  return panels && panels.length ? { row, panels } : null;
};
const boardOrder = panel =>
  [...panel.matchAll(/class="dr-nm">([^<]+)</g)].map(m => m[1]);

describe('the ball scoreboard', () => {
  it('ends on the order the panel actually reached', () => {
    let checked = 0; let agrees = 0;
    for (let seed = 0; seed < 40; seed++) {
      const b = ball(seed);
      if (!b) continue;
      const top = boardOrder(b.panels[b.panels.length - 1])[0];
      checked++;
      if (b.row.dr.panel.ranking[0].name === top) agrees++;
    }
    expect(checked, 'no balls were built').toBeGreaterThan(20);
    // Not 100%: the HOST may still move somebody after the panel has spoken,
    // and a board that tracked his bend would be spoiling the call.
    expect(agrees / checked, `board top matched the panel ${agrees}/${checked}`)
      .toBeGreaterThan(0.9);
  });

  it('is not a hash of her name — the control arm', () => {
    /* The old derivation used only `look.score` and the letters of her name,
       so it produced the same paddles for the same queen and look whatever
       the judges thought. Two different panels judging the same looks must
       now produce different boards. */
    const a = ball(3); const b = ball(11);
    expect(a && b).toBeTruthy();
    expect(boardOrder(a.panels[a.panels.length - 1]).join())
      .not.toBe(boardOrder(b.panels[b.panels.length - 1]).join());
  });

  it('still moves between looks, so a better look scores better', () => {
    const b = ball(3);
    const nums = p => [...p.matchAll(/dr-c-\w+">(\d+)</g)].map(m => Number(m[1]));
    const first = nums(b.panels[1]);
    const last = nums(b.panels[b.panels.length - 1]);
    expect(last.some((v, i) => v !== first[i]), 'the board never moved').toBe(true);
  });
});
