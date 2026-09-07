// ══════════════════════════════════════════════════════════════════════
// tests/dr-audience.test.js — Miss Congeniality, and the ledger under it
// ══════════════════════════════════════════════════════════════════════
//
// The award has to be a VOTE on how the room was liked, not a second way of
// printing the placement chart. Both of those produce a name and a sash, and
// a test that only checks a name came out cannot tell them apart — so the
// checks here are on the SHAPE of the answer across many seasons: whether it
// lands at a spread of finishing positions, and whether audience standing
// tracks placement closely enough to be placement wearing another name.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { audienceStanding, audienceBoard } from '../js/audience.js';
import { buildDragSeasonDocument } from '../js/dr/export.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'social-butterfly'];

function cast(n, seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: ARCH[i % ARCH.length], age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

const gsFor = out => ({ popularity: out.state.popularity || {}, episodeHistory: out.rows });

function pearson(xs, ys) {
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const cov = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const sx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0));
  const sy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0));
  return sx && sy ? cov / (sx * sy) : 0;
}

describe('Miss Congeniality', () => {
  it('is awarded, is never the winner, and reaches the document', () => {
    for (let s = 0; s < 12; s++) {
      const out = playDragSeason({ cast: cast(12, 800 + s), seed: s });
      expect(out.state.congeniality, `season ${s} crowned nobody`).toBeTruthy();
      expect(out.state.congeniality, `season ${s}`).not.toBe(out.winner);
      const doc = buildDragSeasonDocument(out.rows,
        { seasonNumber: 1, congeniality: out.state.congeniality });
      expect(doc.congeniality).toBe(out.state.congeniality);
      const row = doc.placements.find(p => p.congeniality);
      expect(row, `season ${s} has no congeniality row`).toBeTruthy();
      expect(row.name).toBe(out.state.congeniality);
      expect(row.dr.congeniality, 'the career line must carry it too').toBe(1);
    }
  });

  /* THE TEST THAT SEPARATES A VOTE FROM A CHART. If the award simply went to
     whoever lasted longest it would still pass every check above — it would
     name somebody, they would not be the winner, and the sash would render.
     It would land on 2nd place nearly every season. */
  it('is not simply whoever lasted longest', () => {
    const spots = [];
    for (let s = 0; s < 25; s++) {
      const out = playDragSeason({ cast: cast(12, 900 + s), seed: s });
      const doc = buildDragSeasonDocument(out.rows,
        { seasonNumber: 1, congeniality: out.state.congeniality });
      spots.push(doc.placements.find(p => p.name === out.state.congeniality).placement);
    }
    const mean = spots.reduce((a, b) => a + b, 0) / spots.length;
    expect(mean, `congeniality is tracking placement (mean spot ${mean.toFixed(1)})`)
      .toBeGreaterThan(3);
    expect(new Set(spots).size, 'it always goes to the same finishing position')
      .toBeGreaterThan(3);
  });

  it('the vote reads the season it was given, not a module global', () => {
    // The bug this guards: runAudienceVote called audienceBoard WITHOUT
    // forwarding _gs, so every headless caller silently voted on an empty
    // popularity ledger — which produces a name, and looks like it worked.
    const out = playDragSeason({ cast: cast(12, 777), seed: 3 });
    const tally = out.state.congenialityTally || [];
    expect(tally.length, 'no tally means nobody was actually voted for').toBeGreaterThan(1);
    expect(tally[0].share, 'a flat tally is an empty ledger').toBeGreaterThan(0);
    const shares = tally.map(t => t.share);
    expect(Math.max(...shares) - Math.min(...shares),
      'every share identical — the board saw no popularity at all').toBeGreaterThan(0);
  });
});

describe('popularity is a ledger, not a ranking', () => {
  it('audienceStanding does not simply restate placement', () => {
    const rows = [];
    for (let s = 0; s < 15; s++) {
      const out = playDragSeason({ cast: cast(12, 950 + s), seed: s });
      const g = gsFor(out);
      const doc = buildDragSeasonDocument(out.rows, { seasonNumber: 1 });
      for (const p of doc.placements) {
        rows.push({ placement: p.placement, standing: audienceStanding(p.name, g) });
      }
    }
    const r = pearson(rows.map(x => x.standing), rows.map(x => x.placement));
    console.log(`audienceStanding vs placement: r=${r.toFixed(3)} over ${rows.length} queens`);
    expect(Math.abs(r), 'standing is placement measured twice').toBeLessThan(0.7);
  });

  it('the board ranks, and it is not the placement order', () => {
    const out = playDragSeason({ cast: cast(12, 999), seed: 4 });
    const board = audienceBoard({ eligible: out.state.castOrder, _gs: gsFor(out) });
    expect(board.length).toBe(12);
    const doc = buildDragSeasonDocument(out.rows, { seasonNumber: 1 });
    expect(board.map(b => b.name)).not.toEqual(doc.placements.map(p => p.name));
  });
});
