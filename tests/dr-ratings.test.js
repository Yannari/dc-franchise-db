// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-ratings.test.js — eleven signals read off a night with no vote in it
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { readSignals } from '../js/ratings.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 12, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f',
    archetype: ['hero', 'villain', 'wildcard', 'floater'][i % 4], age: 25,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}
function season(seed) {
  const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
  const pop = {};
  return {
    ...playDragSeason({
      cast: cast(12, 100 + seed), seed,
      bond: (a, b) => bonds[key(a, b)] || 0,
      addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
      popDelta: (n, d) => { pop[n] = (pop[n] || 0) + d; },
    }),
    pop,
  };
}
const SIGNALS = ['blindside', 'predictable', 'steamroll', 'powerShift', 'showmance',
  'twist', 'returns', 'likability', 'villainy', 'mess', 'strategy'];

function readAll(seed) {
  const { rows, pop } = season(seed);
  const out = []; let prev = null;
  for (const row of rows.filter(r => !r.dr.finale)) {
    const s = readSignals({ ...row, format: 'drag-race' }, prev, {
      format: 'drag-race', popularity: pop, house: row.dr.living,
      // The cast, so villainy is not read off the running app's globals.
      players: cast(12, 100 + seed),
    });
    out.push(s); prev = s;
  }
  return out;
}

describe('the placements reader', () => {
  const read = readAll(4);

  it('returns all eleven signals, in range, on every episode', () => {
    expect(read.length).toBeGreaterThan(5);
    for (const s of read) {
      for (const k of SIGNALS) {
        expect(Number.isFinite(s[k]), `${k} on episode ${s.ep} is not a number`).toBe(true);
        expect(s[k], `${k} on episode ${s.ep}`).toBeGreaterThanOrEqual(0);
        expect(s[k], `${k} on episode ${s.ep}`).toBeLessThanOrEqual(1);
      }
      expect(s.format).toBe('drag-race');
    }
  });

  it('DOES NOT READ A SEASON AS FLAT', () => {
    /* The failure this branch exists for. Every reader in ratings.js starts
       from a ballot — who flipped, who was named, which bloc decided — and a
       show with no vote returned eleven zeroes. The engine then scored a
       whole season as featureless, not because it was, but because nothing
       could see it. So: most signals must actually MOVE across a season. */
    const moving = SIGNALS.filter(k => {
      const vals = read.map(s => s[k]);
      return Math.max(...vals) - Math.min(...vals) > 0.05;
    });
    expect(moving.length, `only ${moving.join(', ')} ever moved`).toBeGreaterThanOrEqual(6);
    // And nothing may be pinned at zero for the whole season except `returns`.
    /* THREE HONEST ZEROES, each for a stated reason rather than a shrug:
       `returns` (a regular season has no returnees; the field is for All
       Stars), `showmance` (this show has no romance pipeline — measured, no
       scene kind matches), and `twist` (a season played with no pinned
       twists has none). Everything else must fire. */
    const ALLOWED_ZERO = new Set(['returns', 'showmance', 'twist']);
    const dead = SIGNALS.filter(k => !ALLOWED_ZERO.has(k) && read.every(s => s[k] === 0));
    expect(dead, `never once fired: ${dead.join(', ')}`).toEqual([]);
  });

  it('reads the HOST OVERRULING THE PANEL as this show\'s surprise', () => {
    // There is no flipped vote to find. The bend is the equivalent, and a
    // season where the host never moves anybody should read as unsurprising.
    const { rows } = season(4);
    const bentEp = rows.find(r => (r.dr.bend || []).some(b => b.panelRank !== b.finalRank));
    expect(bentEp, 'the host never moved anybody').toBeTruthy();
    const s = readSignals({ ...bentEp, format: 'drag-race' }, null, { format: 'drag-race' });
    expect(s.blindside).toBeGreaterThan(0);

    const flat = { ...bentEp, dr: { ...bentEp.dr, bend: (bentEp.dr.bend || []).map(b => ({ ...b, finalRank: b.panelRank })) } };
    expect(readSignals(flat, null, { format: 'drag-race' }).blindside).toBe(0);
  });

  it("VILLAINY IS READ FROM THE CALLER'S CAST, not a global", () => {
    /* `archetypeOf` reads the module-global `players` — the running app's
       cast, and empty in a headless season, a test, or a replay of a
       published document. So villainy read zero for every drag season ever
       measured, and would have read zero in the ratings tool too. */
    expect(read.some(s => s.villainy > 0), 'villainy never fired').toBe(true);
  });

  it('RETURNS IS AN HONEST ZERO, not a missing read', () => {
    // A regular season has no returnees. The field exists for All Stars and
    // says zero rather than being left undefined for a reader to guess at.
    for (const s of read) expect(s.returns).toBe(0);
    expect(read[0]).toHaveProperty('returns');
  });

  it('carries next week\'s memory, so steamroll can accumulate', () => {
    for (const s of read) {
      expect(Array.isArray(s.topThree), `episode ${s.ep}`).toBe(true);
      expect(Array.isArray(s.bottom), `episode ${s.ep}`).toBe(true);
    }
    // The same three at the top twice running must read higher than once.
    const rising = read.some((s, i) => i > 0 && s.steamroll > read[i - 1].steamroll);
    expect(rising, 'steamroll never accumulated across a season').toBe(true);
  });

  it('is stable across seasons — no signal is pinned or wild', () => {
    const all = [4, 9, 13].flatMap(readAll);
    for (const k of SIGNALS) {
      if (['returns', 'showmance', 'twist'].includes(k)) continue;
      const vals = all.map(s => s[k]);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      expect(mean, `${k} sits at ${mean.toFixed(2)} across three seasons`).toBeGreaterThan(0.01);
      expect(mean, `${k} is pinned near the ceiling`).toBeLessThan(0.97);
    }
  });

  /* A MEAN INSIDE THE RANGE IS NOT A SIGNAL. `strategy` came out at exactly
     0.70 on every episode of all forty seasons measured — min equal to max —
     and passed the test above without complaint, because 0.70 is a perfectly
     respectable mean. A constant wearing a signal's name is worse than a zero:
     a zero is visibly not reading, a constant looks like it is.
     The cause was `(s.beats || []).length || 1` over `dr.storylines`, where
     `beats` is a cumulative COUNT and not an array, so the fallback scored one
     per ARC — and a season carries 15 to 28 arcs, which saturates any norm
     from episode one. So the guard is on the SPREAD, not the average. */
  it('every signal actually moves — min must differ from max', () => {
    const all = [4, 9, 13].flatMap(readAll);
    for (const k of SIGNALS) {
      if (['returns', 'showmance', 'twist'].includes(k)) continue;
      const vals = all.map(s => s[k]);
      const spread = Math.max(...vals) - Math.min(...vals);
      expect(spread, `${k} is constant at ${vals[0].toFixed(2)} — it reads nothing`)
        .toBeGreaterThan(0.1);
    }
  });
});
