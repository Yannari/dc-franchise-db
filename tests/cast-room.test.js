import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';

// Regression: the room's display rule must be gated on the ACTIVE tab class —
// a bare `#tab-cast.cast-room-active { display:block }` outranks the global
// `.tab-content { display:none }` and kept the casting room (plus its Manage
// menu and drawer) visible on top of every other tab, Season Hub included.
describe('cast-room CSS tab gating', () => {
  it('only forces display while the cast tab is active', () => {
    const src = readFileSync(new URL('../js/cast-room.js', import.meta.url), 'utf8');
    expect(src).not.toMatch(/#tab-cast\.cast-room-active\s*\{\s*display/);
    expect(src).toMatch(/#tab-cast\.tab-content\.active\.cast-room-active\s*\{\s*display:\s*block/);
  });
});
import {
  castRoomFilter, balanceTribes, randomizeTribes, snakeDraft, castWarnings, renderCastRoom,
} from '../js/cast-room.js';
import { STATS, setPlayers, setRelationships, setSeasonConfig, defaultConfig } from '../js/core.js';

// ── helpers ───────────────────────────────────────────────────────────
let _uid = 0;
function mk(name, over = {}) {
  const base = {}; STATS.forEach(s => { base[s.key] = over.stat ?? 5; });
  return {
    id: 'p' + (_uid++), name, slug: name.toLowerCase(),
    gender: over.gender || 'nb', archetype: over.archetype || 'floater',
    tribe: over.tribe ?? '', isReturnee: !!over.isReturnee,
    stats: over.stats ? { ...base, ...over.stats } : base,
  };
}
// player whose total stats sum to `total` (spread evenly-ish across 9 stats)
function withTotal(name, total, over = {}) {
  const per = Math.max(1, Math.min(10, Math.round(total / 9)));
  const stats = {}; STATS.forEach(s => stats[s.key] = per);
  // nudge first stat so the sum is exact-ish
  stats[STATS[0].key] = Math.max(1, Math.min(10, per + (total - per * 9)));
  return mk(name, { ...over, stats });
}
const totalOf = p => STATS.reduce((t, s) => t + (p.stats[s.key] || 0), 0);
function tribeAvgSpread(players) {
  const g = {};
  players.filter(p => p.tribe).forEach(p => (g[p.tribe] ??= []).push(p));
  const avgs = Object.values(g).map(arr => arr.reduce((t, p) => t + totalOf(p), 0) / arr.length);
  return avgs.length < 2 ? 0 : Math.max(...avgs) - Math.min(...avgs);
}

// ── castRoomFilter ────────────────────────────────────────────────────
describe('castRoomFilter', () => {
  const cast = [
    mk('Bowie', { archetype: 'mastermind', tribe: 'Bass', gender: 'm', isReturnee: true }),
    mk('Julia', { archetype: 'schemer', tribe: 'Gophers', gender: 'f' }),
    mk('MK', { archetype: 'schemer', tribe: '', gender: 'f', isReturnee: true }),
    mk('Priya', { archetype: 'hero', tribe: 'Bass', gender: 'f' }),
  ];
  it('returns all with empty filters', () => {
    expect(castRoomFilter(cast, {}).length).toBe(4);
  });
  it('filters by name substring (case-insensitive)', () => {
    expect(castRoomFilter(cast, { search: 'iy' }).map(p => p.name)).toEqual(['Priya']);
    expect(castRoomFilter(cast, { search: 'BOW' }).map(p => p.name)).toEqual(['Bowie']);
  });
  it('filters by archetype', () => {
    expect(castRoomFilter(cast, { archetype: 'schemer' }).map(p => p.name).sort()).toEqual(['Julia', 'MK']);
  });
  it('filters by tribe and by No-tribe sentinel', () => {
    expect(castRoomFilter(cast, { tribe: 'Bass' }).map(p => p.name).sort()).toEqual(['Bowie', 'Priya']);
    expect(castRoomFilter(cast, { tribe: '__none__' }).map(p => p.name)).toEqual(['MK']);
  });
  it('filters by returnee status', () => {
    expect(castRoomFilter(cast, { returnee: 'returning' }).map(p => p.name).sort()).toEqual(['Bowie', 'MK']);
    expect(castRoomFilter(cast, { returnee: 'new' }).map(p => p.name).sort()).toEqual(['Julia', 'Priya']);
  });
  it('filters by gender', () => {
    expect(castRoomFilter(cast, { gender: 'm' }).map(p => p.name)).toEqual(['Bowie']);
  });
  it('filters by seasons played via injected seasonsOf', () => {
    const seasonsOf = n => (n === 'Bowie' ? 2 : n === 'Julia' ? 1 : 0);
    expect(castRoomFilter(cast, { seasons: '2+', seasonsOf }).map(p => p.name)).toEqual(['Bowie']);
    expect(castRoomFilter(cast, { seasons: '1', seasonsOf }).map(p => p.name)).toEqual(['Julia']);
    expect(castRoomFilter(cast, { seasons: '0', seasonsOf }).map(p => p.name).sort()).toEqual(['MK', 'Priya']);
  });
  it('combines filters (AND)', () => {
    expect(castRoomFilter(cast, { archetype: 'schemer', gender: 'f', tribe: 'Gophers' }).map(p => p.name)).toEqual(['Julia']);
  });
});

// ── balanceTribes ─────────────────────────────────────────────────────
describe('balanceTribes', () => {
  it('shrinks tribe average spread from an unbalanced start', () => {
    // 3 strong on A, 3 weak on B → huge spread
    const cast = [
      withTotal('A1', 90, { tribe: 'A' }), withTotal('A2', 84, { tribe: 'A' }), withTotal('A3', 78, { tribe: 'A' }),
      withTotal('B1', 45, { tribe: 'B' }), withTotal('B2', 40, { tribe: 'B' }), withTotal('B3', 36, { tribe: 'B' }),
    ];
    const before = tribeAvgSpread(cast);
    const after = balanceTribes(cast, ['A', 'B']);
    expect(tribeAvgSpread(after)).toBeLessThan(before);
    expect(after.every(p => p.tribe === 'A' || p.tribe === 'B')).toBe(true);
    // both tribes populated evenly (6 into 2)
    const g = {}; after.forEach(p => (g[p.tribe] = (g[p.tribe] || 0) + 1));
    expect(g.A).toBe(3); expect(g.B).toBe(3);
  });
  it('keeps a bond>=3 pair on the same tribe when preserve is on', () => {
    const cast = [
      withTotal('Hi1', 88), withTotal('Hi2', 86), withTotal('Lo1', 30), withTotal('Lo2', 28),
      withTotal('Pair1', 60), withTotal('Pair2', 20),
    ];
    const rels = [{ a: 'Pair1', b: 'Pair2', bond: 5 }];
    const out = balanceTribes(cast, ['A', 'B'], { preserve: true, relationships: rels });
    const t1 = out.find(p => p.name === 'Pair1').tribe;
    const t2 = out.find(p => p.name === 'Pair2').tribe;
    expect(t1).toBe(t2);
  });
  it('splits a bond>=3 pair freely when preserve is off', () => {
    const cast = [withTotal('P1', 90), withTotal('P2', 10), withTotal('X1', 50), withTotal('X2', 50)];
    const rels = [{ a: 'P1', b: 'P2', bond: 8 }];
    const out = balanceTribes(cast, ['A', 'B'], { preserve: false, relationships: rels });
    expect(out.length).toBe(4);
  });
});

// ── snakeDraft ────────────────────────────────────────────────────────
describe('snakeDraft', () => {
  it('places the two highest-threat players on different tribes', () => {
    const cast = [
      mk('Beast', { stats: { physical: 10, endurance: 10, mental: 8, social: 8, strategic: 8, loyalty: 6, boldness: 9, intuition: 8, temperament: 6 } }),
      mk('Brain', { stats: { physical: 8, endurance: 8, mental: 10, social: 9, strategic: 10, loyalty: 5, boldness: 8, intuition: 9, temperament: 6 } }),
      mk('Mid', { stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 } }),
      mk('Low', { stats: { physical: 2, endurance: 2, mental: 2, social: 2, strategic: 2, loyalty: 4, boldness: 2, intuition: 2, temperament: 4 } }),
    ];
    const out = snakeDraft(cast, ['A', 'B']);
    const t1 = out.find(p => p.name === 'Beast').tribe;
    const t2 = out.find(p => p.name === 'Brain').tribe;
    expect(t1).not.toBe(t2);
  });
});

// ── randomizeTribes ───────────────────────────────────────────────────
describe('randomizeTribes', () => {
  it('assigns everyone and keeps tribe sizes even', () => {
    const cast = Array.from({ length: 6 }, (_, i) => withTotal('R' + i, 45));
    const out = randomizeTribes(cast, ['A', 'B'], {}, () => 0.5);
    const g = {}; out.forEach(p => (g[p.tribe] = (g[p.tribe] || 0) + 1));
    expect(g.A + g.B).toBe(6);
    expect(Math.abs((g.A || 0) - (g.B || 0))).toBeLessThanOrEqual(1);
  });
});

// ── castWarnings ──────────────────────────────────────────────────────
describe('castWarnings', () => {
  it('returns [] for a clean, balanced cast', () => {
    const cast = [
      mk('a', { tribe: 'A', archetype: 'hero', stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 } }),
      mk('b', { tribe: 'A', archetype: 'schemer', stats: { physical: 6, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 } }),
      mk('c', { tribe: 'A', archetype: 'floater', stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 } }),
      mk('d', { tribe: 'B', archetype: 'hero', stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 } }),
      mk('e', { tribe: 'B', archetype: 'schemer', stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 } }),
      mk('f', { tribe: 'B', archetype: 'floater', stats: { physical: 6, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 } }),
    ];
    expect(castWarnings(cast, [])).toEqual([]);
  });
  it('flags a severe stat imbalance', () => {
    const cast = [
      withTotal('h1', 90, { tribe: 'A', archetype: 'hero' }), withTotal('h2', 88, { tribe: 'A', archetype: 'schemer' }),
      withTotal('l1', 20, { tribe: 'B', archetype: 'floater' }), withTotal('l2', 22, { tribe: 'B', archetype: 'goat' }),
    ];
    const w = castWarnings(cast, []);
    expect(w.some(x => /imbalance/i.test(x.text))).toBe(true);
  });
  it('flags unassigned players when others have a tribe', () => {
    const cast = [mk('a', { tribe: 'A', archetype: 'hero' }), mk('b', { tribe: 'A', archetype: 'schemer' }), mk('c', { tribe: '', archetype: 'floater' })];
    const w = castWarnings(cast, []);
    expect(w.some(x => /unassigned|no tribe/i.test(x.text))).toBe(true);
  });
  it('flags an empty configured tribe', () => {
    const cast = [mk('a', { tribe: 'A', archetype: 'hero' }), mk('b', { tribe: 'A', archetype: 'schemer' })];
    const w = castWarnings(cast, [], ['A', 'B']);
    expect(w.some(x => /"B"|empty|no members/i.test(x.text))).toBe(true);
  });
  it('flags archetype concentration (>=3 same in a tribe)', () => {
    const cast = [
      mk('a', { tribe: 'A', archetype: 'schemer' }), mk('b', { tribe: 'A', archetype: 'schemer' }),
      mk('c', { tribe: 'A', archetype: 'schemer' }), mk('d', { tribe: 'B', archetype: 'hero' }),
    ];
    const w = castWarnings(cast, []);
    expect(w.some(x => /schemer/i.test(x.text))).toBe(true);
  });
  it('flags overloaded relationships (a player in 3+ pairs)', () => {
    const cast = [mk('a', { tribe: 'A' }), mk('b', { tribe: 'A' }), mk('c', { tribe: 'B' }), mk('d', { tribe: 'B' }), mk('e', { tribe: 'B' })];
    const rels = [{ a: 'a', b: 'b', bond: 5 }, { a: 'a', b: 'c', bond: 5 }, { a: 'a', b: 'd', bond: 5 }];
    const w = castWarnings(cast, rels);
    expect(w.some(x => /relationship/i.test(x.text))).toBe(true);
  });
  it('flags uneven tribes (size diff >= 2)', () => {
    const cast = [
      mk('a', { tribe: 'A', archetype: 'hero' }), mk('b', { tribe: 'A', archetype: 'schemer' }),
      mk('c', { tribe: 'A', archetype: 'floater' }), mk('d', { tribe: 'A', archetype: 'goat' }),
      mk('e', { tribe: 'B', archetype: 'hero' }),
    ];
    const w = castWarnings(cast, []);
    expect(w.some(x => /uneven/i.test(x.text))).toBe(true);
  });
});

// ── renderCastRoom smoke (jsdom) ──────────────────────────────────────
function buildTab() {
  const tab = document.createElement('div');
  tab.id = 'tab-cast';
  tab.innerHTML = `
    <aside class="form-panel">
      <div id="form-title">Add Player</div>
      <div class="form-group"><input id="f-name"></div>
      <div class="form-group"><input id="f-slug"></div>
      <div class="form-group"><select id="f-tribe"></select></div>
      <div class="form-group"><select id="f-archetype"></select><div id="archetype-desc"></div><input type="checkbox" id="f-returnee"></div>
      <div id="stat-sliders"></div>
      <button id="submit-btn">Add Player</button>
      <div id="edit-actions" style="display:none"></div>
      <button onclick="clearCast()">Clear All</button>
    </aside>
    <main class="cast-panel"><div id="cast-grid"></div></main>`;
  document.body.appendChild(tab);
  return tab;
}

describe('renderCastRoom smoke', () => {
  beforeEach(() => {
    setSeasonConfig(defaultConfig());
    setRelationships([]);
    document.body.innerHTML = '';
    window._castRoomDisabled = false;
    window._crFilters = null;
    window._crView = 'grid';
    window._crKeepDrawerOpen = false;
  });
  it('does not throw when the cast DOM is absent', () => {
    setPlayers([]);
    expect(() => renderCastRoom()).not.toThrow();
  });
  it('renders portrait cards into a fabricated #tab-cast', () => {
    buildTab();
    setPlayers([
      mk('Bowie', { archetype: 'mastermind', tribe: 'Bass', isReturnee: true, stats: { physical: 6, endurance: 4, mental: 8, social: 10, strategic: 10, loyalty: 6, boldness: 7, intuition: 9, temperament: 6 } }),
      mk('Priya', { archetype: 'hero', tribe: 'Gophers', stats: { physical: 10, endurance: 8, mental: 10, social: 6, strategic: 8, loyalty: 6, boldness: 7, intuition: 8, temperament: 6 } }),
    ]);
    expect(() => renderCastRoom()).not.toThrow();
    const room = document.getElementById('cast-room');
    expect(room).toBeTruthy();
    expect(room.querySelectorAll('.cr-card').length).toBe(2);
    // adoption moved the form node into the drawer
    expect(document.querySelector('#cast-room #f-name')).toBeTruthy();
  });

  it('escape hatch: disabling after render removes the room, drops the class, and restores the legacy form', () => {
    buildTab();
    setPlayers([mk('Bowie', { archetype: 'mastermind', tribe: 'Bass' }), mk('Priya', { archetype: 'hero', tribe: 'Gophers' })]);
    renderCastRoom();
    expect(document.getElementById('cast-room')).toBeTruthy();
    expect(document.getElementById('tab-cast').classList.contains('cast-room-active')).toBe(true);
    expect(document.querySelector('#cast-room #f-name')).toBeTruthy(); // adopted into drawer

    window._castRoomDisabled = true;
    renderCastRoom();

    // room shell gone (not stacked on top of legacy UI), takeover class removed
    expect(document.getElementById('cast-room')).toBeNull();
    expect(document.getElementById('tab-cast').classList.contains('cast-room-active')).toBe(false);
    // legacy form restored into the legacy panel (adoption reversed)
    expect(document.querySelector('#tab-cast .form-panel #f-name')).toBeTruthy();
    expect(document.querySelector('#tab-cast .form-panel #edit-actions')).toBeTruthy();
  });

  it('persists filter state across a re-render (rebuilt filter bar reflects window._crFilters)', () => {
    buildTab();
    setPlayers([
      mk('Bowie', { archetype: 'mastermind', tribe: 'Bass' }),
      mk('Priya', { archetype: 'hero', tribe: 'Gophers' }),
      mk('Julia', { archetype: 'schemer', tribe: 'Bass' }),
    ]);
    renderCastRoom(); // creates room + filter bar
    // user sets a search + archetype filter
    window._crFilters = { search: 'Bow', archetype: 'mastermind', tribe: '', returnee: 'all', gender: '', seasons: '' };
    renderCastRoom(); // data-change re-render rebuilds the filter bar

    // rebuilt inputs reflect the persisted state
    expect(document.getElementById('cr-f-search').value).toBe('Bow');
    expect(document.getElementById('cr-f-arch').value).toBe('mastermind');
    // state object itself survives untouched
    expect(window._crFilters.search).toBe('Bow');
    // and the grid honors it (only Bowie shown)
    const cards = document.querySelectorAll('#cast-room .cr-card');
    expect(cards.length).toBe(1);
    expect(cards[0].querySelector('.cr-name').textContent).toContain('Bowie');
  });
});
