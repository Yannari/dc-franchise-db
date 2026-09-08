// ══════════════════════════════════════════════════════════════════════
// tests/dr-franchise.test.js — a queen is an alumna like anybody else
// ══════════════════════════════════════════════════════════════════════
//
// The point of a shared franchise layer is that adding a fourth show costs
// nothing: a queen with a published season should reach the ledger, the
// alumni pool, the social archive and the life layer through the same code
// that carries a houseguest or a camper, WITHOUT anybody writing a show list.
//
// So most of what is checked here is the absence of one. A hardcoded
// `['total-drama', 'big-brother']` anywhere on a casting path does not throw,
// does not fail a test, and silently excludes every show added after it —
// which is the bug class docs/ADDING-A-SHOW.md exists for.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SHOWS, DRAG_FORMAT } from '../js/shows.js';
import { buildDragSeasonDocument, dragSeasonDetails } from '../js/dr/export.js';
import { playDragSeason } from '../js/dr/season.js';
import { alumniPool } from '../js/alumni.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

function cast(n, seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
    archetype: 'hero', age: 25,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

const OUT = playDragSeason({ cast: cast(12, 1400), seed: 1 });
const doc = buildDragSeasonDocument(OUT.rows, {
  seasonNumber: 1, congeniality: OUT.congeniality,
});

describe('no casting path holds a show list', () => {
  /* THE FILES A NEW SHOW HAS TO REACH. Read as source rather than executed,
     because the failure is a list that quietly omits this show — which runs
     perfectly and simply never casts a queen. */
  const PATHS = ['js/alumni.js', 'js/franchise-meta.js', 'js/tr/state.js',
    'js/social/archive.js', 'js/life-hook.js'];

  for (const f of PATHS) {
    it(`${f} derives its shows from the registry`, () => {
      let src;
      try { src = readFileSync(f, 'utf8'); } catch { return; }
      // A literal pair or triple of slugs is the tell.
      const lists = src.match(/\[\s*'(?:total-drama|big-brother|traitors|drag-race)'(?:\s*,\s*'[a-z-]+')+\s*\]/g) || [];
      expect(lists, `${f} enumerates shows: ${lists.join(' ')}`).toEqual([]);
    });
  }

  it('the registry knows this show', () => {
    expect(Object.keys(SHOWS)).toContain('drag-race');
    expect(DRAG_FORMAT).toBe('drag-race');
  });
});

describe('an appearance carries what the ledger asks for', () => {
  it('every placement is a complete row', () => {
    for (const p of doc.placements) {
      expect(p.name, 'a placement with no name').toBeTruthy();
      expect(p.playerSlug, `${p.name} has no slug`).toBeTruthy();
      expect(p.placement, `${p.name} has no placement`).toBeTruthy();
      expect(p.status, `${p.name} has no status`).toBeTruthy();
    }
    expect(doc.format).toBe('drag-race');
    expect(doc.seasonId).toBe('dr-1');
    expect(doc.placements.length).toBe(12);
  });

  it('carries the drag record a returnee would be cast on', () => {
    const d = dragSeasonDetails(OUT.rows, 1, doc.winner.name);
    expect(d.format).toBe('drag-race');
    expect(d.placement).toBe(1);
    expect(d.dr, 'no drag record on the appearance').toBeTruthy();
    for (const k of ['wins', 'highs', 'lows', 'bottoms', 'lipsyncWins', 'congeniality']) {
      expect(typeof d.dr[k], `dr.${k} missing`).toBe('number');
    }
  });

  it('exports no jury and no vote record, because the show has neither', () => {
    expect(doc.votingHistory).toBeUndefined();
    expect(doc.juryVotes).toBeUndefined();
    expect(doc.winner.vote).toBe('');
  });
});

/* SET BEFORE THE FIRST CALL, not before the import. `alumniDatabase()`
   memoises on its first invocation, so a dynamic re-import does not reset it —
   the cache-busting version of this read an empty database and reported that
   queens are uncastable when they are not. */
globalThis.PLAYERS_DB = null;

describe('the alumni pool', () => {
  /* A QUEEN HAS TO BE CASTABLE, and this has to be able to fail. The first
     version of these two passed by never running: it handed `alumniPool` a
     `_players` option that does not exist, got an empty pool back, and
     returned early on the empty check. An unfailable guard is worse than no
     guard — it reports that a path works while never walking it.
     `alumniDatabase()` reads `globalThis.PLAYERS_DB`, which the page sets, so
     a test sets it too and then asks the real question. */
  const players = doc.placements.map(p => ({
    name: p.name,
    slug: p.playerSlug,
    seasons: [1],
    seasonDetails: [dragSeasonDetails(OUT.rows, 1, p.name)],
  }));

  it('casts a queen onto another show with no per-show branch', () => {
    globalThis.PLAYERS_DB = players;
    const pool = alumniPool;
    /* `minNative: 6`, NOT 0. The guard is `native.length >= minNative`, so
       zero means "no natives is already enough" and the function returns the
       empty native list without ever topping up — the opposite of what the
       number reads like. A test asking for 0 gets an empty pool and would
       report that queens are uncastable when they are not. Real callers ask
       for six. */
    const cast4 = pool({ format: 'traitors', minNative: 6 });
    expect(cast4.length, 'no queen is castable anywhere else').toBeGreaterThan(0);
    const q = cast4.find(x => x.name === doc.winner.name);
    expect(q, 'the winner of a season is not in the alumni pool').toBeTruthy();
    // AND SHE IS LABELLED BY THE REGISTRY, not by a string somebody typed.
    expect(q.seasonName).toMatch(new RegExp(SHOWS[DRAG_FORMAT].name));
  });

  it('knows a queen is a guest on another show, not a native', () => {
    globalThis.PLAYERS_DB = players;
    const pool = alumniPool;
    const onDrag = pool({ format: DRAG_FORMAT, minNative: 6 });
    expect(onDrag.length, 'a queen is not native to her own show').toBeGreaterThan(0);
    // On her OWN show she is native; on somebody else's she is flagged a guest.
    expect(onDrag.every(x => x.native), 'a queen is a guest on her own show').toBe(true);
    const away = pool({ format: 'traitors', minNative: 6 });
    expect(away.every(x => !x.native), 'a queen counts as a Traitors native').toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
// The romance thread survives the franchise boundary
// ══════════════════════════════════════════════════════════════════════
describe('a pair reaches the life layer', () => {
  /* `js/life-hook.js` reads `showmance` off an APPEARANCE to decide who walked
     out of a season together — it is the one field that lets a relationship
     outlive the finale. Drag appearances carried none, so the romance thread
     worked in the werk room, on the screen and in the ratings signal, and
     stopped dead here.
     It has to be on the PLACEMENT ROW, not just on dragSeasonDetails: the
     publish path never calls that function, it builds each appearance from
     the document's placements. */
  function seasonWithPair() {
    for (let s = 0; s < 40; s++) {
      const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
      const out = playDragSeason({
        cast: cast(12, 800 + s), seed: s,
        bond: (a, b) => bonds[key(a, b)] || 0,
        addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
        popDelta: () => {},
      });
      if ((out.state.romances || []).length) return out;
    }
    return null;
  }

  it('puts the pair on both queens, in the shape the life layer reads', () => {
    const out = seasonWithPair();
    // The mechanism must be REACHED, or this passes by never running.
    expect(out, 'no romance in 40 seasons — nothing was tested').toBeTruthy();
    const d = buildDragSeasonDocument(out.rows, { seasonNumber: 1 });
    const [a, b] = out.state.romances[0];
    const rowA = d.placements.find(p => p.name === a);
    const rowB = d.placements.find(p => p.name === b);
    expect(rowA.showmance, `${a} lost her pair`).toBe(b);
    expect(rowB.showmance, `${b} lost her pair`).toBe(a);
    // The field the life layer actually branches on.
    expect(rowA.showmanceEnded).toBe('intact');
    // And a queen with no pair has no field at all — absent means "no pair",
    // never "this show does not do that".
    /* EVERY PAIRED QUEEN, not just the first pair. A season is capped at two
       pairings, and this excluded only `romances[0]` — so the moment a season
       actually produced its second pair, "a queen with no pair" picked
       somebody who had one and the assertion failed on a season that was
       behaving correctly. */
    const paired = new Set((out.state.romances || []).flat());
    const single = d.placements.find(p => !paired.has(p.name));
    expect(single, 'every queen in the season is paired').toBeTruthy();
    expect(single.showmance).toBeUndefined();
  });

  it('carries it through the merge onto the stored appearance', async () => {
    const out = seasonWithPair();
    const { mergeDragSeason } = await import('../js/stats-export.js');
    const doc = buildDragSeasonDocument(out.rows, { seasonNumber: 1 });
    // `{ players: [] }`, which is the shape it documents. Handing it `[]`
    // returns an array whose `.players` was set as a property, and a
    // shape-tolerant reader then picks the empty array and reports a failure
    // that is the test's own.
    const merged = mergeDragSeason({ players: [] }, doc);
    const arr = merged.players || [];
    const [a, b] = out.state.romances[0];
    const stored = arr.find(p => p.name === a);
    expect(stored, `${a} is not in the merged database`).toBeTruthy();
    const appearance = stored.seasonDetails.find(x => x.format === 'drag-race');
    expect(appearance.showmance, 'the merge dropped the pair').toBe(b);
  });
});
