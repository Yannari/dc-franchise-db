// ══════════════════════════════════════════════════════════════════════
// dr-storylines.test.js — five arcs cast, two earned
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { ARCS, assignStorylines, storylineNeed, recordBeat, arcSummary } from '../js/dr/storylines.js';
import { AGENDAS, LABELS, ARC_FAMILIES, pickVariant, allVariants } from '../js/dr/arcs.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}, over = {}) => ({
  name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag },
  ...over,
});

const CAST = [
  mk('Star', { acting: 9, comedy: 9, dance: 9, design: 9, runway: 9, lipsync: 9, singing: 9 }),
  mk('Mouse', {}, { archetype: 'floater' }),
  mk('Snake', {}, { archetype: 'villain', stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), boldness: 10 } }),
  mk('Foe', {}, { archetype: 'wildcard' }),
  mk('Sis', {}), mk('Kid', {}),
];
const state = () => ({
  record: Object.fromEntries(CAST.map(p => [p.name, []])),
  star: { Star: 9, Mouse: 2, Snake: 8, Foe: 7, Sis: 5, Kid: 4 },
  lipsyncRecord: Object.fromEntries(CAST.map(p => [p.name, []])),
  out: [],
});
const bonds = { 'Foe|Snake': -8, 'Kid|Sis': 8 };
const bond = (a, b) => bonds[[a, b].sort().join('|')] || 0;
const base = () => assignStorylines({ cast: CAST, state: state(), bond, rng: rngFor(1) });

describe('assignStorylines', () => {
  const sl = base();

  it('casts the five opening arcs and neither of the two that must be earned', () => {
    const arcs = sl.map(s => s.arc);
    for (const a of ['frontrunner', 'underdog', 'villain', 'relationship']) {
      expect(arcs, a).toContain(a);
    }
    // A season that hands these out at episode one decided its story before
    // anybody performed.
    expect(arcs).not.toContain('performance');
    expect(arcs).not.toContain('robbed');
    expect(arcs).not.toContain('shock');
    for (const a of arcs) expect(ARCS).toContain(a);
  });

  it('picks the right people', () => {
    expect(sl.find(s => s.arc === 'frontrunner').players).toEqual(['Star']);
    expect(sl.find(s => s.arc === 'villain').players).toEqual(['Snake']);
    const rel = sl.filter(s => s.arc === 'relationship');
    expect(rel.find(s => s.variantId === 'rivalry').players.sort()).toEqual(['Foe', 'Snake']);
    expect(rel.find(s => s.variantId !== 'rivalry').players.sort()).toEqual(['Kid', 'Sis']);
  });

  it('names a variant on every arc it casts', () => {
    for (const s of sl) {
      expect(s.variantId, s.arc).toBeTruthy();
      expect(s.variantName, s.arc).toBeTruthy();
    }
  });

  it('never gives one queen two solo agendas', () => {
    const seen = {};
    for (const s of sl.filter(x => AGENDAS.includes(x.arc) && x.players.length === 1)) {
      for (const n of s.players) seen[n] = (seen[n] || 0) + 1;
    }
    for (const [n, c] of Object.entries(seen)) expect(c, `${n} holds ${c} agendas`).toBe(1);
  });

  it('but lets the villain also be half of the rivalry', () => {
    // The taxonomy files Villain and Rivalry under one family for a reason:
    // blocking this would throw away the most natural story in the room.
    const rel = sl.find(s => s.arc === 'relationship' && s.variantId === 'rivalry');
    const villain = sl.find(s => s.arc === 'villain');
    expect(rel.players).toContain(villain.players[0]);
  });

  it('layers labels on top of an agenda, because a real edit does', () => {
    const stacked = sl.filter(s => LABELS.includes(s.arc));
    expect(stacked.length, 'no label arcs at all').toBeGreaterThan(0);
  });

  it('every family in the catalogue resolves to a variant', () => {
    for (const f of Object.keys(ARC_FAMILIES)) {
      const v = pickVariant(f, { player: CAST[0] });
      expect(v, f).toBeTruthy();
      expect(v.family, f).toBe(f);
    }
    // No two variants inside one family share an id, or the screens cannot
    // tell them apart.
    for (const [f, fam] of Object.entries(ARC_FAMILIES)) {
      const ids = fam.variants.map(x => x.id);
      expect(new Set(ids).size, `${f} repeats a variant id`).toBe(ids.length);
    }
    expect(allVariants().length).toBeGreaterThan(35);
  });

  it('keeps agendas rare and labels common', () => {
    // The whole safety argument for a fifteen-family catalogue.
    expect(AGENDAS.length).toBeLessThan(LABELS.length);
  });

  it('casts no relationship arc in a room with no strong feelings', () => {
    const flat = assignStorylines({ cast: CAST, state: state(), bond: () => 0, rng: rngFor(1) });
    const arcs = flat.map(s => s.arc);
    expect(arcs).not.toContain('relationship');
    expect(arcs).toContain('frontrunner');
  });
});

describe('storylineNeed', () => {
  it('is bounded and only ever names a living queen', () => {
    const need = storylineNeed(base(), {
      living: ['Star', 'Mouse', 'Snake'], episode: 3, totalEpisodes: 10, state: state(),
    });
    for (const [n, v] of Object.entries(need)) {
      expect(['Star', 'Mouse', 'Snake']).toContain(n);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('wants the frontrunner up early and the underdog up at the turn', () => {
    const living = CAST.map(p => p.name);
    const early = storylineNeed(base(), { living, episode: 2, totalEpisodes: 10, state: state() });
    const mid = storylineNeed(base(), { living, episode: 6, totalEpisodes: 10, state: state() });
    expect(early.Star).toBeGreaterThan(0);
    expect(mid.Mouse).toBeGreaterThan(early.Mouse);
  });

  it('stops pushing the underdog once she has actually won', () => {
    const living = CAST.map(p => p.name);
    const st = state();
    const hungry = storylineNeed(base(), { living, episode: 6, totalEpisodes: 10, state: st });
    st.record.Mouse = ['WIN'];
    const fed = storylineNeed(base(), { living, episode: 6, totalEpisodes: 10, state: st });
    expect(hungry.Mouse).toBeGreaterThan(0);
    expect(fed.Mouse).toBe(0);
  });

  it('turns on the villain in the back half instead of protecting her forever', () => {
    const living = CAST.map(p => p.name);
    const early = storylineNeed(base(), { living, episode: 2, totalEpisodes: 10, state: state() });
    const late = storylineNeed(base(), { living, episode: 9, totalEpisodes: 10, state: state() });
    expect(early.Snake).toBeGreaterThan(0);
    expect(late.Snake).toBeLessThan(0);
  });

  it('asks nothing at all for the robbed queen', () => {
    // She is a label the audience applies. An arc lobbying for its own
    // robbery would stop being one.
    const sl = [{ id: 'r', arc: 'robbed', players: ['Sis'], since: 1, beats: [], alive: true }];
    const need = storylineNeed(sl, {
      living: ['Sis'], episode: 5, totalEpisodes: 10, state: state(),
    });
    expect(need.Sis).toBe(0);
  });
});

describe('recordBeat', () => {
  const row = over => ({
    num: 1,
    dr: {
      call: { win: [], high: [], safe: [], low: [], bottom: [] },
      bend: [], lipsync: null, events: [], ...over,
    },
  });

  it('earns the performance arc after two lip syncs survived', () => {
    const st = state();
    st.lipsyncRecord.Kid = ['W', 'W'];
    const sl = recordBeat(base(), { episode: 4, row: row({}), state: st });
    expect(sl.find(s => s.arc === 'performance')?.players).toEqual(['Kid']);
  });

  it('does not earn it after one', () => {
    const st = state();
    st.lipsyncRecord.Kid = ['W'];
    expect(recordBeat(base(), { episode: 4, row: row({}), state: st })
      .find(s => s.arc === 'performance')).toBeUndefined();
  });

  it('earns the robbed queen after two snubs: topped the panel, did not win', () => {
    let sl = base();
    const st = state();
    for (const ep of [2, 3]) {
      sl = recordBeat(sl, {
        episode: ep, state: st,
        row: row({
          bend: [{ name: 'Sis', panelRank: 1, finalRank: 2 }],
          call: { win: ['Kid'], high: ['Sis'], safe: [], low: [], bottom: [] },
        }),
      });
    }
    expect(sl.find(s => s.arc === 'robbed')?.players).toEqual(['Sis']);
  });

  it('also counts the panel loving her and the host calling nobody', () => {
    let sl = base();
    const st = state();
    for (const ep of [2, 3]) {
      sl = recordBeat(sl, {
        episode: ep, state: st,
        row: row({
          bend: [{ name: 'Sis', panelRank: 2, finalRank: 2 }],
          call: { win: ['Kid'], high: ['Foe'], safe: ['Sis'], low: [], bottom: [] },
        }),
      });
    }
    expect(sl.find(s => s.arc === 'robbed')?.players).toEqual(['Sis']);
  });

  it('is not robbery when the panel had her top and she actually won', () => {
    let sl = base();
    const st = state();
    for (const ep of [2, 3, 4]) {
      sl = recordBeat(sl, {
        episode: ep, state: st,
        row: row({
          bend: [{ name: 'Sis', panelRank: 1, finalRank: 1 }],
          call: { win: ['Sis'], high: [], safe: [], low: [], bottom: [] },
        }),
      });
    }
    expect(sl.find(s => s.arc === 'robbed')).toBeUndefined();
  });

  it('nor when the panel never rated her in the first place', () => {
    let sl = base();
    const st = state();
    for (const ep of [2, 3, 4]) {
      sl = recordBeat(sl, {
        episode: ep, state: st,
        row: row({
          bend: [{ name: 'Sis', panelRank: 8, finalRank: 8 }],
          call: { win: ['Kid'], high: [], safe: ['Sis'], low: [], bottom: [] },
        }),
      });
    }
    expect(sl.find(s => s.arc === 'robbed')).toBeUndefined();
  });

  it('flips the villain when she helps somebody AND lands on top', () => {
    const sl = recordBeat(base(), {
      episode: 5, state: state(),
      row: row({
        call: { win: ['Snake'], high: [], safe: [], low: [], bottom: [] },
        events: [{ type: 'help', players: ['Snake', 'Kid'] }],
      }),
    });
    const v = sl.find(s => s.arc === 'villain');
    expect(v.flipped).toBe('redeemed');
    expect(v.beats.some(b => b.kind === 'redemption')).toBe(true);
  });

  it('and not for a good week alone, or a kind act alone', () => {
    const goodWeek = recordBeat(base(), {
      episode: 5, state: state(),
      row: row({ call: { win: ['Snake'], high: [], safe: [], low: [], bottom: [] } }),
    });
    expect(goodWeek.find(s => s.arc === 'villain').flipped).toBeFalsy();

    const kindOnly = recordBeat(base(), {
      episode: 5, state: state(),
      row: row({ events: [{ type: 'help', players: ['Snake', 'Kid'] }] }),
    });
    expect(kindOnly.find(s => s.arc === 'villain').flipped).toBeFalsy();
  });

  it('records villainy when she does something the room can see', () => {
    const sl = recordBeat(base(), {
      episode: 3, state: state(),
      row: row({ events: [{ type: 'sabotage', players: ['Snake', 'Kid'] }] }),
    });
    expect(sl.find(s => s.arc === 'villain').beats.some(b => b.kind === 'villainy')).toBe(true);
  });

  it('kills an arc when its queen goes home, and keeps her beats', () => {
    const st = state();
    st.out = ['Star'];
    const sl = recordBeat(base(), {
      episode: 6, state: st,
      row: row({ call: { win: [], high: [], safe: [], low: [], bottom: ['Star', 'Kid'] } }),
    });
    const f = sl.find(s => s.arc === 'frontrunner');
    expect(f.beats.some(b => b.kind === 'stumble')).toBe(true);
    expect(f.alive).toBe(false);
  });

  it('does not mutate the storylines it was handed', () => {
    const before = base();
    const snapshot = JSON.stringify(before);
    recordBeat(before, {
      episode: 2, state: state(),
      row: row({ call: { win: ['Star'], high: [], safe: [], low: [], bottom: [] } }),
    });
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it('stays serialisable, because it goes into the save', () => {
    const sl = recordBeat(base(), {
      episode: 2, state: state(),
      row: row({ call: { win: ['Star'], high: [], safe: [], low: [], bottom: [] } }),
    });
    expect(JSON.parse(JSON.stringify(sl))).toEqual(sl);
  });

  it('summarises for a screen', () => {
    const s = arcSummary(base());
    expect(s.length).toBeGreaterThan(3);
    for (const x of s) {
      expect(x.arc).toBeTruthy();
      expect(Array.isArray(x.players)).toBe(true);
    }
  });
});
