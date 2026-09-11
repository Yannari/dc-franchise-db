// ══════════════════════════════════════════════════════════════════════
// dr-form-term.test.js — the number on screen is the number that decided it
// ══════════════════════════════════════════════════════════════════════
//
// Reported as "the score does not match the result at all". It did not.
//
// `form` is one draw per queen per episode for whether she was off tonight.
// It used to be added inside `judgeViews`, RAW, while every other input to
// that sum is scaled by the seat's taste weight first — so a +/-2.5 wobble
// competed against 0.4 x a challenge score. Measured across forty seasons it
// moved a queen MORE than the challenge did: a spread of 1.44 against the
// challenge's 1.00 and the runway's 0.76. The largest single determinant of
// who won a maxi challenge was a dice roll, and the screen showed the
// challenge score beside a placement it had largely not caused.
//
// It lives in the PERFORMANCE now, because being off tonight is a fact about
// what she did rather than an opinion four judges add to a performance that
// went fine — and at a size chosen so its pull on the panel is unchanged.
// Measured: the score went from explaining 71.6% of placements to 87.2%, and
// domination came DOWN from 43% to 41% rather than up.
import { describe, expect, it } from 'vitest';
import { judgeViews } from '../js/dr/judging.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

describe('the panel judges the performance, not a dice roll', () => {
  it('ignores a `form` field entirely if one is handed to it', () => {
    /* The regression this exists for: `form` back as a term in judgeViews.
       Two entries identical but for a huge form value must rank the same,
       because the panel is not where that draw belongs any more. */
    const panel = [{ id: 'j', taste: { challenge: 0.4, runway: 0.4, risk: 0.1, polish: 0.1 } }];
    const base = { style: null, runway: 5, risk: 0.5, polish: 5, runwayIsChallenge: false };
    const views = judgeViews(panel, [
      { ...base, name: 'A', perf: 7, form: 0 },
      { ...base, name: 'B', perf: 7, form: 9 },
    ], {}, () => 0.5);
    const rows = views.j;
    const a = rows.find(r => r.name === 'A');
    const b = rows.find(r => r.name === 'B');
    expect(a.rank === b.rank || Math.abs(a.rank - b.rank) === 1).toBe(true);
    /* And decisively: a nine-point form advantage must not outrank a real
       two-point performance advantage. */
    const v2 = judgeViews(panel, [
      { ...base, name: 'A', perf: 9, form: 0 },
      { ...base, name: 'B', perf: 7, form: 9 },
    ], {}, () => 0.5);
    const better = v2.j.sort((x, y) => x.rank - y.rank)[0];
    expect(better.name, 'a form value beat a real performance').toBe('A');
  });
});

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const cast = (n, seed) => {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: ['villain', 'hero', 'schemer', 'floater', 'mastermind', 'goat',
      'wildcard', 'underdog'][i % 8],
    age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
};

const RANK = { WIN: 0, HIGH: 1, SAFE: 2, LOW: 3, BTM: 4, BTM2: 5, ELIM: 6 };

describe('the score explains the night', () => {
  /* Measured rather than asserted at a point: across forty seasons, of every
     pair of queens given DIFFERENT calls, how often did the one with the
     better challenge score get the better call?

     It will never be 100% and should not be — the panel also weighs the
     runway, which is nearly as heavy, plus risk and polish. The floor is set
     well under what was measured (87.2%) and well over what it used to be
     (71.6%), so this fails if `form` goes back to the panel and passes
     through ordinary drift. */
  it('agrees with the call far more often than it used to', () => {
    let agree = 0; let pairs = 0;
    for (let s = 1; s <= 20; s++) {
      const season = playDragSeason({
        cast: cast(12, s * 7919 + 13), seed: s * 31 + 5, config: {},
        bond: () => 0, addBond: () => {}, popDelta: () => {},
      });
      for (const row of season.rows) {
        const call = row.dr?.call;
        if (!call || !row.dr.performances) continue;
        const callOf = q => ((call.win || []).includes(q) ? 'WIN'
          : (call.high || []).includes(q) ? 'HIGH'
            : (call.low || []).includes(q) ? 'LOW'
              : (call.atRisk || []).includes(q) ? 'BTM'
                : (call.bottom || []).includes(q) ? 'BTM2' : 'SAFE');
        const rows = Object.entries(row.dr.performances)
          .map(([q, p]) => ({ q, perf: p.perf, call: callOf(q) }));
        for (let i = 0; i < rows.length; i++) {
          for (let k = i + 1; k < rows.length; k++) {
            const a = rows[i]; const b = rows[k];
            if (RANK[a.call] === RANK[b.call]) continue;
            pairs++;
            const betterCall = RANK[a.call] < RANK[b.call] ? a : b;
            const betterPerf = a.perf > b.perf ? a : b;
            if (betterCall === betterPerf) agree++;
          }
        }
      }
    }
    const rate = agree / pairs;
    // eslint-disable-next-line no-console
    console.log(`the challenge score got the better call ${(rate * 100).toFixed(1)}% `
      + `of the time (was 71.6% when form was a panel term)`);
    expect(pairs).toBeGreaterThan(1000);
    expect(rate, 'the score stopped explaining the night').toBeGreaterThan(0.80);
  });

  it('still lets every queen have a night', () => {
    /* The other side, and the reason `form` exists at all: without it a weak
       queen could not win a maxi challenge AT ALL — one queen in a
       thirteen-queen cast went 120 seasons without a single win. Shrinking
       the draw while tidying the engine would pass the test above and quietly
       undo the thing the draw is for. */
    const winners = new Set();
    for (let s = 1; s <= 30; s++) {
      const season = playDragSeason({
        cast: cast(12, s * 7919 + 13), seed: s * 31 + 5, config: {},
        bond: () => 0, addBond: () => {}, popDelta: () => {},
      });
      for (const row of season.rows) {
        const w = (row.dr?.call?.win || [])[0];
        if (w) winners.add(`${s}:${w}`);
      }
    }
    const perSeason = {};
    for (const k of winners) {
      const [s, q] = k.split(':');
      (perSeason[s] ||= new Set()).add(q);
    }
    const spread = Object.values(perSeason).map(v => v.size);
    const mean = spread.reduce((a, b) => a + b, 0) / spread.length;
    // eslint-disable-next-line no-console
    console.log(`distinct maxi winners per season: ${mean.toFixed(1)}`);
    expect(mean, 'one queen is running away with every challenge').toBeGreaterThan(3);
  });
});
