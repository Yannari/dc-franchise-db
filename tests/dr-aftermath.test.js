// ══════════════════════════════════════════════════════════════════════
// tests/dr-aftermath.test.js — what the season looked like, after it aired
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { buildDragAftermath } from '../js/dr/aftermath.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'schemer'];

function cast(n, seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: ARCH[i % ARCH.length], age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

const out = playDragSeason({ cast: cast(12, 1200), seed: 3 });
const a = buildDragAftermath(out.rows, {
  players: Object.fromEntries(out.state.castOrder.map(n => [n, { name: n }])),
});

describe('the aftermath', () => {
  it('counts screen time per queen and it is not uniform', () => {
    const vals = Object.values(a.screenTime).map(x => x.total);
    expect(vals.length).toBe(12);
    // A FLAT COUNT WOULD MEAN THE READER IS NOT READING. If every queen came
    // out with the same number the extractor found no names and fell back to
    // counting scenes — which produces a tidy table that says nothing.
    expect(Math.max(...vals)).toBeGreaterThan(Math.min(...vals) * 1.5);
  });

  it('screen time is per episode as well as total', () => {
    for (const [name, st] of Object.entries(a.screenTime)) {
      const summed = Object.values(st.byEpisode).reduce((x, y) => x + y, 0);
      expect(summed, `${name}'s episodes do not add up to her total`).toBe(st.total);
    }
  });

  it("collects the season's moments", () => {
    expect(Array.isArray(a.moments)).toBe(true);
    expect(a.moments.length, 'a whole season produced no moments').toBeGreaterThan(0);
    for (const m of a.moments) {
      expect(m.episode).toBeGreaterThan(0);
      expect(m.name).toBeTruthy();
      expect(m.kind).toBeTruthy();
    }
  });

  it('hands out awards that are not all the same person', () => {
    const names = Object.values(a.awards).map(x => x?.name).filter(Boolean);
    expect(names.length).toBeGreaterThanOrEqual(4);
    expect(new Set(names).size, 'one queen swept every award').toBeGreaterThan(1);
  });

  it('reports the arcs it followed', () => {
    expect(a.arcs.length).toBeGreaterThan(2);
    for (const arc of a.arcs) expect(arc.arc).toBeTruthy();
  });

  it('the most improved queen really improved', () => {
    const mi = a.awards.mostImproved;
    if (mi) {
      const rec = out.state.record[mi.name];
      const half = Math.ceil(rec.length / 2);
      const top = r => r === 'WIN' || r === 'HIGH';
      expect(rec.slice(half).filter(top).length)
        .toBeGreaterThanOrEqual(rec.slice(0, half).filter(top).length);
    }
  });

  /* THE AWARD THAT IS ALLOWED TO BE EMPTY. "Most improved" on a season where
     nobody improved is a lie with a name attached, and it is the easy bug
     here: sort by swing, take the top, and a field of declining queens still
     crowns whoever declined least. */
  it('gives most improved to nobody rather than to the least worsened', () => {
    for (let s = 0; s < 10; s++) {
      const o = playDragSeason({ cast: cast(12, 1300 + s), seed: s });
      const mi = buildDragAftermath(o.rows, { players: {} }).awards.mostImproved;
      if (!mi) continue;
      expect(mi.swing, `season ${s} awarded a swing of ${mi.swing}`).toBeGreaterThan(0);
    }
  });

  it('runs on any season without throwing', () => {
    for (const size of [8, 10, 13, 14]) {
      const o = playDragSeason({ cast: cast(size, 1400 + size), seed: size });
      const built = buildDragAftermath(o.rows, { players: {} });
      expect(Object.keys(built.screenTime).length, `cast of ${size}`).toBe(size);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════
// The edit layer, on a show that records no camp events and no ballots
// ══════════════════════════════════════════════════════════════════════
describe('the audience pulse reads a runway night', () => {
  it('bills screen time from scenes, and it is not flat', async () => {
    const { setGs } = await import('../js/core.js');
    const { updateEditLayer } = await import('../js/edit-layer.js');
    const o = playDragSeason({ cast: cast(12, 1500), seed: 6 });

    const gs = { edit: null, popularity: {}, episodeHistory: [], activePlayers: [] };
    setGs(gs);
    let last = null;
    for (const row of o.rows) {
      gs.activePlayers = [...(row.dr?.living || [])];
      gs.episodeHistory.push(row);
      last = updateEditLayer(row) || last;
    }

    const units = Object.values(last.units);
    expect(units.length, 'the pulse saw nobody').toBeGreaterThan(1);
    /* THE BUG THIS EXISTS FOR: _deriveScreenTime reads camp events, acts,
       ballots and challenge scores, and a runway night records none of them.
       Without a drag branch every queen scores zero, every read comes back
       "Invisible", and the pulse draws a season of blank bars — which looks
       like a rendering problem and is a reader that was never wired. */
    expect(Math.max(...units), 'every queen billed zero screen time')
      .toBeGreaterThan(0);
    const reads = new Set(Object.values(last.reads));
    expect(reads.size, `the whole cast read the same: ${[...reads]}`).toBeGreaterThan(1);
    expect(reads.has('invisible') && reads.size === 1).toBe(false);
  });

  /* THE FINALE BILLED NOBODY. Every ordinary week read correctly and the
     crowning — the biggest episode of the season — gave all four finalists
     zero, because a finale has no call, no maxi, and keeps its names one level
     down at `data.finalists` and `data.duel.a` where a flat key list could not
     see them. A per-episode check would have passed on eight rows out of nine. */
  it('bills the crowning, which has no call and no maxi', async () => {
    const { setGs } = await import('../js/core.js');
    const { updateEditLayer } = await import('../js/edit-layer.js');
    const o = playDragSeason({ cast: cast(12, 1600), seed: 8 });

    const gs = { edit: null, popularity: {}, episodeHistory: [], activePlayers: [] };
    setGs(gs);
    let finaleRec = null;
    for (const row of o.rows) {
      gs.activePlayers = [...(row.dr?.living || [])];
      gs.episodeHistory.push(row);
      const rec = updateEditLayer(row);
      if (row.dr?.finale) finaleRec = rec;
    }
    expect(finaleRec, 'no finale row was seen').toBeTruthy();
    const billed = Object.entries(finaleRec.units).filter(([, u]) => u > 0);
    expect(billed.length, 'the crowning billed nobody').toBeGreaterThanOrEqual(2);
    // And the queen who won it must not be billed below the queens who lost.
    const champ = o.winner;
    const others = billed.filter(([n]) => n !== champ).map(([, u]) => u);
    expect(finaleRec.units[champ], 'the winner was billed under a loser')
      .toBeGreaterThanOrEqual(Math.max(...others));
  });
});
