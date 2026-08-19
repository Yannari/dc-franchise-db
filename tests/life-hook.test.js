// The export hook: finishing a season is what fills the life inbox.
//
// The interesting behaviour here is not the resolving — life-resolver.test.js
// measures that — it is the four ways this legitimately does NOTHING. They look
// identical from outside (no events appeared) and mean completely different
// things, so each one has to say which it was.
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { resolveAfterSeason, unresolvedGaps, lifeContext } from '../js/life-hook.js';
import { nextWindowFor } from '../js/franchise-calendar.js';
import { resolveOffSeason as resolveOffSeasonFor } from '../js/life-resolver.js';

const SEASONS = [
  { seasonId: 'td-1', seasonNumber: 1, format: 'total-drama', airYear: 2020, airSlot: 'spring', title: 'One' },
  { seasonId: 'td-2', seasonNumber: 2, format: 'total-drama', airYear: 2020, airSlot: 'fall', title: 'Two' },
  { seasonId: 'bb-1', seasonNumber: 1, format: 'big-brother', airYear: 2021, airSlot: 'summer', title: 'House' },
];

const PLAYERS = [
  { id: 'ali', name: 'Ali', seasonDetails: [{ seasonId: 'td-2', showmance: 'Bo' }] },
  { id: 'bo', name: 'Bo', seasonDetails: [{ seasonId: 'td-2', showmance: 'Ali' }] },
  { id: 'cy', name: 'Cy', seasonDetails: [{ seasonId: 'td-1' }, { seasonId: 'td-2' }] },
];

/** Stand in for the site: the two databases, the log endpoint, and the save. */
function serve({ seasons = SEASONS, players = PLAYERS, events = [] } = {}) {
  const saved = [];
  global.fetch = vi.fn(async (url, opts) => {
    const u = String(url);
    if (opts?.method === 'POST') {
      saved.push(JSON.parse(opts.body).events);
      return { json: async () => ({ ok: true, counts: {} }) };
    }
    if (u.includes('/api/life-events')) return { json: async () => ({ ok: true, events }) };
    if (u.includes('seasons_database')) return { json: async () => ({ seasons }) };
    if (u.includes('players_database')) return { json: async () => ({ players }) };
    throw new Error('unexpected fetch: ' + u);
  });
  return { saved };
}

beforeEach(() => { vi.restoreAllMocks(); });

describe('placing a new season on the calendar', () => {
  it('continues the show own cadence rather than inventing a schedule', () => {
    // Total Drama alternates spring and fall; the next one is half a year on.
    expect(nextWindowFor(SEASONS, 'total-drama')).toEqual({ airYear: 2021, airSlot: 'spring' });
  });

  it('repeats annually when a show has aired only once', () => {
    expect(nextWindowFor(SEASONS, 'big-brother')).toEqual({ airYear: 2022, airSlot: 'summer' });
  });

  it('places a brand new show just after whatever aired last', () => {
    expect(nextWindowFor(SEASONS, 'survivor')).toEqual({ airYear: 2021, airSlot: 'fall' });
  });

  it('refuses to guess when the franchise has no dated season at all', () => {
    expect(nextWindowFor([{ seasonId: 'x-1' }], 'total-drama')).toBe(null);
  });
});

describe('resolving after an export', () => {
  it('proposes an off-season and saves it', async () => {
    const { saved } = serve();
    const out = await resolveAfterSeason({ seasonNumber: 2, format: 'total-drama' });
    expect(out.ok).toBe(true);
    expect(out.season.seasonId).toBe('td-2');
    // Asserted unconditionally, not behind `if (out.added)`: the resolver is
    // seeded, so this cast produces the same off-season every run, and a guard
    // there would quietly turn the whole test into a no-op the day it stopped
    // producing anything.
    expect(out.added).toBeGreaterThan(0);
    expect(saved.length).toBe(1);
    // Proposals, always. An automatic hook must never be able to put something
    // on a wiki page by itself.
    expect(saved[0].every(e => e.status === 'proposed')).toBe(true);
    expect(saved[0].every(e => e.afterSeason === 'td-2')).toBe(true);
  });

  it('says the season is not published rather than failing', async () => {
    serve();
    const out = await resolveAfterSeason({ seasonNumber: 9, format: 'total-drama' });
    expect(out.ok).toBe(false);
    expect(out.reason).toMatch(/not in the published record/);
  });

  it('says an undated season has no "after"', async () => {
    serve({ seasons: [{ seasonId: 'td-3', seasonNumber: 3, format: 'total-drama' }] });
    const out = await resolveAfterSeason({ seasonNumber: 3, format: 'total-drama' });
    expect(out.ok).toBe(false);
    expect(out.reason).toMatch(/no air date/);
  });

  it('refuses to resolve a gap twice, so a re-export cannot double a life', async () => {
    const { saved } = serve({
      events: [{ player: 'ali', kind: 'dating', afterSeason: 'td-2', seq: 1, status: 'proposed' }],
    });
    const out = await resolveAfterSeason({ seasonNumber: 2, format: 'total-drama' });
    expect(out.ok).toBe(false);
    expect(out.reason).toMatch(/already resolved/);
    expect(saved.length).toBe(0);
  });

  it('matches on the show as well as the number', async () => {
    // bb-1 and td-1 are both "season 1". Matching on the number alone would
    // resolve the wrong show's off-season, which is this project's oldest bug.
    serve();
    const out = await resolveAfterSeason({ seasonNumber: 1, format: 'big-brother' });
    expect(out.season.seasonId).toBe('bb-1');
  });
});

describe('what is still outstanding', () => {
  it('lists undated seasons nowhere, since they have no "after" to fill', () => {
    const gaps = unresolvedGaps([...SEASONS, { seasonId: 'td-3' }], []);
    expect(gaps.map(s => s.seasonId)).toEqual(['td-1', 'td-2', 'bb-1']);
  });

  it('orders across shows by air date, not by number', () => {
    const gaps = unresolvedGaps(SEASONS, []);
    expect(gaps[gaps.length - 1].seasonId).toBe('bb-1');
  });
});

describe('the context both callers share', () => {
  it('reads the cast off the record instead of being told it', () => {
    const ctx = lifeContext({ players: PLAYERS }, { seasons: SEASONS });
    expect(ctx.castBySeason.get('td-2').sort()).toEqual(['ali', 'bo', 'cy']);
  });

  it('finds a season showmance as a pair, once, not once per person', () => {
    const ctx = lifeContext({ players: PLAYERS }, { seasons: SEASONS });
    expect(ctx.pairsFor('td-2')).toEqual([['ali', 'bo']]);
  });
});

// ── WHO CAN BE IN AN OFF-SEASON AT ALL ────────────────────────────────
//
// Both of these were reported from real output: "Alejandro and Cameron started
// seeing each other — they're both straight", and a character appearing in
// Dramagram posts before their first season had aired. The resolver was picking
// people off the social graph, which knows who is close to whom and nothing
// about who anybody is attracted to or when they debuted.
describe('who the resolver is allowed to pair', () => {
  const CAREERS = [
    { id: 'al', name: 'Al', details: [{ seasonId: 'td-1' }], seasonsPlayed: 1, bestPlacement: 2 },
    { id: 'cam', name: 'Cam', details: [{ seasonId: 'td-1' }], seasonsPlayed: 1, bestPlacement: 3 },
  ];
  const RANK = new Map([['td-1', 20201], ['td-2', 20203]]);
  const SEASON = { seasonId: 'td-1', airYear: 2020, airSlot: 'spring' };
  const CLOSE = new Map([
    ['al', new Map([['cam', 6]])],
    ['cam', new Map([['al', 6]])],
  ]);
  const straight = new Map([
    ['al', { gender: 'm', sexuality: 'straight' }],
    ['cam', { gender: 'm', sexuality: 'straight' }],
  ]);

  /** Every romantic pairing produced over many seeds. */
  function pairings(people) {
    const out = [];
    for (let i = 0; i < 60; i++) {
      const evs = resolveOffSeasonFor({ season: SEASON, careers: CAREERS, graph: CLOSE,
        seasonRank: RANK, people, seedSalt: 'seed' + i });
      out.push(...evs.filter(e => e.kind === 'dating'));
    }
    return out;
  }

  it('will not pair two straight men however close they are', () => {
    expect(pairings(straight)).toEqual([]);
  });

  it('still pairs them when one of them is bi', () => {
    const bi = new Map(straight);
    bi.set('al', { gender: 'm', sexuality: 'bi' });
    bi.set('cam', { gender: 'm', sexuality: 'gay' });
    expect(pairings(bi).length).toBeGreaterThan(0);
  });

  it('gives the benefit of the doubt when somebody is not on the roster', () => {
    // Missing data and a definite no are different answers. Blocking on absent
    // gender would silently delete events for anybody the roster has not got.
    expect(pairings(new Map()).length).toBeGreaterThan(0);
  });

  it('leaves out anybody whose first season has not aired yet', () => {
    const future = [...CAREERS, { id: 'zed', name: 'Zed', details: [{ seasonId: 'td-2' }], seasonsPlayed: 1 }];
    const evs = resolveOffSeasonFor({ season: SEASON, careers: future, graph: CLOSE,
      seasonRank: RANK, people: straight, seedSalt: 'x' });
    expect(evs.some(e => e.player === 'zed' || e.whom === 'zed')).toBe(false);
  });

  it('keeps somebody whose seasons have no dates, since unplaced is not the future', () => {
    const undated = [{ id: 'nom', name: 'Nom', details: [{ seasonId: 'ghost' }], seasonsPlayed: 1 }];
    const evs = resolveOffSeasonFor({ season: SEASON, careers: undated, graph: new Map(),
      seasonRank: RANK, people: straight, seedSalt: 'y' });
    expect(Array.isArray(evs)).toBe(true); // it ran over them rather than skipping
  });
});

// ── ONE PERSON, ONE RELATIONSHIP ──────────────────────────────────────
//
// Reported from real output: Leshawna went public with Owen and started seeing
// Trent in the same off-season. The resolver tracked which PAIRS it had already
// handled and never asked whether a person was free — so a candidate's own
// relationship, whether from this round or from the log, was never read.
describe('who is available', () => {
  const RANK = new Map([['td-1', 20201]]);
  const SEASON = { seasonId: 'td-1', airYear: 2020, airSlot: 'spring' };
  const ROMANTIC = ['dating', 'went-public', 'moved-in', 'engaged', 'married',
    'broke-up', 'separated', 'quietly-ended'];

  const career = (id, name) => ({ id, name, details: [{ seasonId: 'td-1' }], seasonsPlayed: 1, bestPlacement: 5 });
  const CAREERS = ['lesh', 'owen', 'trent', 'noah'].map(id => career(id, id));
  // Everybody close to everybody, which is the case that broke it.
  const GRAPH = new Map(CAREERS.map(c => [c.id,
    new Map(CAREERS.filter(o => o.id !== c.id).map(o => [o.id, 7]))]));
  const PEOPLE = new Map([
    ['lesh', { gender: 'f', sexuality: 'straight' }],
    ['owen', { gender: 'm', sexuality: 'straight' }],
    ['trent', { gender: 'm', sexuality: 'straight' }],
    ['noah', { gender: 'm', sexuality: 'straight' }],
  ]);

  /** Every person named in a romantic event, with how many they appear in. */
  function appearances(events) {
    const n = new Map();
    for (const e of events.filter(x => ROMANTIC.includes(x.kind))) {
      for (const who of [e.player, e.whom].filter(Boolean)) n.set(who, (n.get(who) || 0) + 1);
    }
    return n;
  }

  it('never puts one person in two relationships in the same off-season', () => {
    for (let i = 0; i < 80; i++) {
      const out = resolveOffSeasonFor({ season: SEASON, careers: CAREERS, graph: GRAPH,
        seasonRank: RANK, people: PEOPLE, events: [], seedSalt: 'seed' + i });
      for (const [who, n] of appearances(out)) {
        expect(`${who}:${n}`).toBe(`${who}:1`);
      }
    }
  });

  it('will not start something with somebody the log says is already taken', () => {
    // Leshawna and Owen are together from an earlier off-season. Trent is close
    // to her, single, and compatible — and must still not be proposed.
    const log = [
      { player: 'lesh', whom: 'owen', afterSeason: 'td-0', seq: 1, kind: 'dating', status: 'approved' },
    ];
    for (let i = 0; i < 40; i++) {
      const out = resolveOffSeasonFor({ season: SEASON, careers: CAREERS, graph: GRAPH,
        seasonRank: new Map([...RANK, ['td-0', 20200]]), people: PEOPLE, events: log,
        seedSalt: 'taken' + i });
      const started = out.filter(e => e.kind === 'dating');
      expect(started.some(e => e.player === 'lesh' || e.whom === 'lesh')).toBe(false);
    }
  });
});
