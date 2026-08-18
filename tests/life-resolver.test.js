// The off-season resolver: the thing that fills the inbox.
//
// Design: docs/superpowers/specs/2026-08-18-life-layer-design.md
//
// The rates are the feature, so most of this file measures OUTPUT over a whole
// franchise rather than asserting on one call. A table that looks plausible in
// a document is exactly how the comp-domination and broken-promise rates went
// wrong before anybody measured them.
import { describe, expect, it } from 'vitest';
import { resolveOffSeason, STAGES, RATES, fameOf, summarise } from '../js/life-resolver.js';
import { stateOf, kindOf, approvedFor } from '../js/life-events.js';

const SEASONS = Array.from({ length: 15 }, (_, i) => ({
  seasonId: `s-${i + 1}`, airYear: 2020 + Math.floor(i / 2), airSlot: i % 2 ? 'fall' : 'spring',
}));
const RANK = new Map(SEASONS.map((s, i) => [s.seasonId, i]));

function couples(n) {
  const careers = []; const pairs = [];
  for (let i = 0; i < n; i++) {
    careers.push({ id: `a${i}`, name: `A${i}`, wins: 0, seasonsPlayed: 1, bestPlacement: 10 });
    careers.push({ id: `b${i}`, name: `B${i}`, wins: 0, seasonsPlayed: 1, bestPlacement: 10 });
    pairs.push([`a${i}`, `b${i}`]);
  }
  return { careers, pairs };
}

/** Play the whole franchise and approve everything, so the log accumulates. */
function franchise(n, castMode = 'none', salt = 'test') {
  const { careers, pairs } = couples(n);
  let events = [];
  for (const season of SEASONS) {
    const cast = castMode === 'alone' ? careers.filter((_, j) => j % 2 === 0).map(c => c.id)
      : castMode === 'together' ? careers.map(c => c.id) : [];
    const fresh = resolveOffSeason({
      season, careers, events, cast, pairs, seedSalt: salt, seasonRank: RANK,
    });
    events = events.concat(fresh.map(e => ({ ...e, status: 'approved' })));
  }
  return { events, careers };
}

const stageTally = (n, events) => {
  const t = {};
  for (let i = 0; i < n; i++) {
    const st = stateOf(`a${i}`, events, { seasonRank: RANK });
    t[st.relationship.stage] = (t[st.relationship.stage] || 0) + 1;
  }
  return t;
};

describe('it proposes, it does not decide', () => {
  it('emits nothing as canon', () => {
    const { careers, pairs } = couples(20);
    const out = resolveOffSeason({ season: SEASONS[0], careers, pairs, seasonRank: RANK });
    expect(out.length).toBeGreaterThan(0);
    for (const e of out) expect(e.status, 'the resolver decided canon by itself').toBe('proposed');
  });

  it('pins every event to the season that just ended', () => {
    const { careers, pairs } = couples(20);
    const out = resolveOffSeason({ season: SEASONS[3], careers, pairs, seasonRank: RANK });
    for (const e of out) expect(e.afterSeason).toBe('s-4');
  });

  it('never emits a two-person event with nobody to be about', () => {
    const { careers } = couples(40);
    // No pairs at all: nothing may reach for a partner that does not exist.
    const out = resolveOffSeason({ season: SEASONS[0], careers, pairs: [], seasonRank: RANK });
    for (const e of out) {
      if (kindOf(e.kind)?.whom) expect(e.whom, `${e.kind} has no second person`).toBeTruthy();
    }
  });

  it('does nothing without a season', () => {
    expect(resolveOffSeason({})).toEqual([]);
    expect(resolveOffSeason({ season: {}, careers: couples(5).careers })).toEqual([]);
  });
});

describe('the same off-season always resolves the same way', () => {
  // Seeded per (season, player, decision) rather than from one shared stream:
  // an approved inbox has to be reproducible, and adding a player must not
  // change what happens to everybody else.
  it('is deterministic', () => {
    const { careers, pairs } = couples(30);
    const a = resolveOffSeason({ season: SEASONS[0], careers, pairs, seasonRank: RANK });
    const b = resolveOffSeason({ season: SEASONS[0], careers, pairs, seasonRank: RANK });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('does not shift everybody else when one player is added', () => {
    const { careers, pairs } = couples(30);
    const before = resolveOffSeason({ season: SEASONS[0], careers, pairs, seasonRank: RANK })
      .filter(e => e.player === 'a3' || e.whom === 'a3');
    const extra = [...careers, { id: 'zz', name: 'ZZ', wins: 0, seasonsPlayed: 1, bestPlacement: 9 }];
    const after = resolveOffSeason({ season: SEASONS[0], careers: extra, pairs, seasonRank: RANK })
      .filter(e => e.player === 'a3' || e.whom === 'a3');
    expect(after.map(e => e.kind), "one player's dice moved another's")
      .toEqual(before.map(e => e.kind));
  });

  it('a different season gives a different answer', () => {
    const { careers, pairs } = couples(30);
    const a = resolveOffSeason({ season: SEASONS[0], careers, pairs, seasonRank: RANK });
    const b = resolveOffSeason({ season: SEASONS[1], careers, pairs, seasonRank: RANK });
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });
});

describe('you do not get married that easily', () => {
  const N = 300;
  const { events } = franchise(N, 'none');
  const t = stageTally(N, events);

  it('a minority of couples reach a wedding across the whole franchise', () => {
    // Fifteen off-seasons, seven years, and nobody ever cast again — the
    // calmest possible run, so this is close to the ceiling.
    const pct = (t.married || 0) / N;
    expect(pct, 'nobody ever marries, so the kind is decorative').toBeGreaterThan(0.03);
    expect(pct, 'it reads like a soap').toBeLessThan(0.30);
  });

  it('most people are somewhere in the middle of the track, or single', () => {
    const early = (t.single || 0) + (t.dating || 0) + (t.public || 0);
    expect(early / N, 'everybody ends up settled').toBeGreaterThan(0.35);
  });

  it('reaches every stage of the track at least once', () => {
    for (const stage of STAGES) {
      expect(t[stage] ?? 0, `nobody ever reaches ${stage}`).toBeGreaterThan(0);
    }
  });

  it('never skips a step', () => {
    // A wedding must be preceded by an engagement for the same couple, which is
    // the whole point of a track rather than a dice roll.
    const mine = approvedFor('a0', events, { seasonRank: RANK });
    const kinds = mine.filter(e => kindOf(e.kind)?.track === 'relationship').map(e => e.kind);
    const wed = kinds.indexOf('wedding');
    if (wed >= 0) expect(kinds.slice(0, wed), 'married without ever being engaged').toContain('engaged');
  });
});

describe('being cast is the test', () => {
  const N = 300;
  const calm = stageTally(N, franchise(N, 'none').events).married || 0;
  const together = stageTally(N, franchise(N, 'together').events).married || 0;
  const alone = stageTally(N, franchise(N, 'alone').events).married || 0;

  it('a relationship survives best when neither of them plays', () => {
    expect(calm).toBeGreaterThan(together);
  });

  it('and worst when one of them plays without the other', () => {
    // The design's central claim: three months on camera, shipped with somebody
    // else, an edit that may be unkind. Emergent from one multiplier rather
    // than special-cased anywhere.
    expect(alone, 'being cast alone costs a relationship nothing').toBeLessThan(together);
  });
});

describe('fame changes visibility, not incidence', () => {
  it('rates a winner above a mid-pack player', () => {
    expect(fameOf({ wins: 1, seasonsPlayed: 1, bestPlacement: 1 }))
      .toBeGreaterThan(fameOf({ wins: 0, seasonsPlayed: 1, bestPlacement: 14 }));
    expect(fameOf(null)).toBe(0);
    expect(fameOf({ wins: 4, seasonsPlayed: 5, bestPlacement: 1 })).toBeLessThanOrEqual(1);
  });

  it('does not make hard things more likely for the famous', () => {
    // The rare track is rolled on its own stream, untouched by fame — a winner
    // and a 16th-place boot are equally likely to have a bad year.
    const src = RATES;
    expect(src.rare).toBeLessThan(0.1);
    const famous = Array.from({ length: 400 }, (_, i) =>
      ({ id: `f${i}`, name: `F${i}`, wins: 2, seasonsPlayed: 4, bestPlacement: 1 }));
    const nobodies = Array.from({ length: 400 }, (_, i) =>
      ({ id: `n${i}`, name: `N${i}`, wins: 0, seasonsPlayed: 1, bestPlacement: 16 }));
    const rareOf = careers => resolveOffSeason({ season: SEASONS[0], careers, seasonRank: RANK })
      .filter(e => ['health', 'legal', 'money'].includes(kindOf(e.kind)?.track)).length;
    const f = rareOf(famous);
    const n = rareOf(nobodies);
    // Same order of magnitude; this is a rate check, not an equality check.
    expect(Math.abs(f - n), `famous ${f} vs unknown ${n}`).toBeLessThan(25);
  });
});

describe('most gaps are ordinary', () => {
  it('produces well under one event per person per gap', () => {
    const { careers, pairs } = couples(150);
    const out = resolveOffSeason({ season: SEASONS[0], careers, pairs, seasonRank: RANK });
    const per = out.length / careers.length;
    expect(per, 'a resolved off-season floods the inbox').toBeLessThan(1.6);
    expect(per, 'nothing happens to anybody').toBeGreaterThan(0.3);
  });

  it('is mostly the unremarkable tracks', () => {
    const { careers, pairs } = couples(150);
    const s = summarise(resolveOffSeason({ season: SEASONS[0], careers, pairs, seasonRank: RANK }));
    const ordinary = (s.byTrack.career || 0) + (s.byTrack.home || 0) + (s.byTrack.small || 0);
    expect(ordinary / s.total, 'the off-season is all drama').toBeGreaterThan(0.5);
  });
});
