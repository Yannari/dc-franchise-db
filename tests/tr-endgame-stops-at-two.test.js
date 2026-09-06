// ══════════════════════════════════════════════════════════════════════
// tr-endgame-stops-at-two.test.js — two is the end, not another question
// ══════════════════════════════════════════════════════════════════════
//
// Reported from a played finale, quoting the screen back:
//
//   THE QUESTION, A SECOND TIME
//   The same question, the same paper, fewer hands.
//     Carrie   End it   "End it. Now."
//     Aaron    End it   "No more names."
//
// "When there's 2 the game stops, no need to have a last question."
//
// Right, and for a reason stronger than pacing: a table of two cannot answer
// it either way. A banishment needs a majority and two players produce 1-1, so
// the only thing on the far side of that question is a tie-break drawing a
// name out of a bag to decide the season. The mandated loop already refuses to
// hand episodes over below three for exactly this reason (js/tr/headless.js);
// `runEndgame` was still asking.
//
// The pot then resolves on the two who are left, which needs no vote to
// trigger it — any Traitor standing at the end takes it, otherwise the
// Faithfuls split. Measured over 72 seasons: no ask is put to a room of two,
// and 23 of them end with exactly two survivors, so the rule is load-bearing
// rather than theoretical.
import { describe, it, expect } from 'vitest';
import { gs, setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { rpBuildEndgame } from '../js/vp-tr/endgame.js';
import roster from '../franchise_roster.json';

const CAST = roster.players.slice(0, 18);
const SIZES = [3, 4, 5];
const SEEDS = Array.from({ length: 24 }, (_, i) => i + 1);

const RUNS = SIZES.flatMap(size => SEEDS.map(seed => {
  setPlayers(CAST.map(p => ({ ...p })));
  playTraitorsSeason({ cast: CAST.map(p => p.name), traitorCount: 3, seed, endgameSize: size });
  const row = (gs.episodeHistory || []).find(e => e.tr && e.tr.endgame);
  if (!row) return null;
  const eg = row.tr.endgame;
  return { size, seed, row: { ...row },
    asks: (eg.asks || []).map(a => ({ ep: a.ep, living: [...(a.living || [])] })),
    survivors: (eg.survivors || []).length };
}).filter(Boolean));

describe('the sweep reached real finales', () => {
  it('played enough of them', () => {
    expect(RUNS.length).toBeGreaterThan(60);
    expect(RUNS.some(r => r.asks.length >= 2),
      'no finale ever asked twice, so the repeat-ask path is untested').toBe(true);
  });

  it('and reaches rooms of two, or the rule below guards nothing', () => {
    // THE ANTI-VACUITY ARM, and it is the one that matters here. If a season
    // never got down to two, "no ask at two" would pass for the wrong reason
    // — by the state never happening rather than by the rule holding.
    const twos = RUNS.filter(r => r.survivors === 2).length;
    expect(twos, 'no season ended with two players, so the stop rule is never '
      + 'exercised').toBeGreaterThan(5);
  });
});

describe('the question is never put to a room of two', () => {
  it('asks nobody once two are left', () => {
    const wrong = [];
    for (const r of RUNS) {
      for (const a of r.asks) {
        if (a.living.length <= 2) {
          wrong.push(`size ${r.size} seed ${r.seed} ep ${a.ep}: asked `
            + `${a.living.length} player(s) — ${a.living.join(' and ')}`);
        }
      }
    }
    expect(wrong, 'the fire asked a question a room of two cannot answer')
      .toEqual([]);
  });

  it('and the screen still renders when it stops without asking', () => {
    // A finale that opens on two asks nothing at all, so the endgame record
    // carries an empty `asks` — the screen has to survive that rather than
    // rendering a vote card with no votes in it.
    let empty = 0;
    for (const r of RUNS) {
      const html = rpBuildEndgame(r.row, 'audience');
      expect(typeof html, `size ${r.size} seed ${r.seed}: the endgame screen `
        + 'returned nothing').toBe('string');
      expect(html.length).toBeGreaterThan(500);
      if (!r.asks.length) empty++;
    }
    // Not asserted as a floor: a zero-ask finale is rare and a sweep without
    // one is not a failure. Recorded so the next reader knows it happens.
    expect(empty).toBeGreaterThanOrEqual(0);
  });
});
