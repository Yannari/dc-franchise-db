// The pairs who knew each other before the door.
//
// The Relationships tab carries two axes — how they FEEL (the bond) and how
// they KNOW each other (the kinship) — and only two things ever read the
// second one: the Twin Twist looks for declared twins, and Rivals casts from
// the tense relations. Outside those twists a cast could declare an estranged
// father and daughter, a married couple and a pair of exes, and the house
// treated all three as "two people with a number between them".
//
// The tell that this layer works is that the SAME bond produces a completely
// different evening depending on the relation — and that several of these
// scenes are only possible at all because a pair now has three numbers instead
// of one: the shared bond, and what each of them privately makes of it.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, setRelationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, setBond, getPerceivedBond, bKey, bondLabel, feelsFor, setLean } from '../js/bonds.js';
import { KINSHIP_EVENTS } from '../js/bb-events/kinship.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = n => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((n * 7 + i * 3) % 10)]));
const NAMES = ['Gus', 'Iris', 'Wayne', 'Raj', 'Eli', 'Fern', 'Bowie', 'Kit',
  'Millie', 'Caleb', 'Axel', 'Zee'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater', gender: i % 2 ? 'f' : 'm',
  sexuality: 'straight', stats: spread(i + 1) }));

function house(rels = [], leans = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  globalThis.gs = gs; globalThis.players = players;
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, romance: 'enabled' });
  if (!Array.isArray(gs.tribes)) gs.tribes = [];
  gs.bb = { weeks: [], stats: {} };
  gs.bondLean = {};
  gs.showmances = []; gs.romanticSparks = []; gs.popularity = {};
  setRelationships(rels.map(r => ({ ...r })));
  globalThis.relationships = relationships;
  for (const [a, b, v] of leans) setLean(a, b, v);
}

const ev = id => KINSHIP_EVENTS.find(e => e.id === id);
const ctx = (num = 4) => ({ week: { num }, act: 'house-life', beat: 0 });

/** A throwaway api that records what an event did. */
function stubApi() {
  const log = [];
  return {
    log,
    addBond: (a, b, d) => log.push(['bond', a, b, d]),
    popDelta: (n, d) => log.push(['pop', n, d]),
    suspicion: (o, s, d) => log.push(['suspicion', o, s, d]),
    remember: (a, b, k, w, x) => log.push(['remember', a, b, k]),
    setTarget: (a, t, r) => log.push(['target', a, t]),
    showmance: (a, b, d) => { gs.showmances.push({ players: [a, b], phase: 'new' }); log.push(['showmance', a, b]); return true; },
  };
}

beforeEach(() => house());

describe('the family is registered', () => {
  it('is reachable from the house library', () => {
    expect(KINSHIP_EVENTS.length).toBeGreaterThan(8);
    for (const e of KINSHIP_EVENTS) {
      expect(typeof e.weight, `${e.id} has no weight`).toBe('function');
      expect(typeof e.fire, `${e.id} has no fire`).toBe('function');
      expect(e.category).toBeTruthy();
      // Unreachable from the registry is the state nineteen events sat in.
      expect(HOUSE_EVENTS, `${e.id} is not in the registry`).toContain(e);
    }
  });

  it('stays completely silent on a cast that declared nothing', () => {
    // Every weight has to be zero, or a season with no declared relations
    // starts producing scenes about relationships nobody wrote.
    house([]);
    for (const e of KINSHIP_EVENTS) {
      expect(e.weight(NAMES, ctx()), `${e.id} fired with no kinship declared`).toBe(0);
    }
  });
});

describe('the same bond, a different evening', () => {
  const BOND = 4;
  it('gives exes, siblings and colleagues different scenes at identical bonds', () => {
    const fired = new Set();
    for (const kin of ['exes', 'siblings', 'colleagues', 'married']) {
      house([{ id: 'r', a: 'Gus', b: 'Iris', type: 'ally', bond: BOND, kin }]);
      setBond('Gus', 'Iris', BOND);
      const live = KINSHIP_EVENTS.filter(e => e.weight(NAMES, ctx()) > 0).map(e => e.id);
      expect(live.length, `${kin} produced nothing at bond ${BOND}`).toBeGreaterThan(0);
      fired.add(live.sort().join(','));
    }
    // Four relations, four different sets of things that can happen.
    expect(fired.size, 'every relation produced the same events').toBeGreaterThan(2);
  });
});

describe('scenes that need the two numbers to disagree', () => {
  it('only aches when one of them is further in than the other', () => {
    const e = ev('kin-ex-unrequited');
    // Mutual, so nobody is carrying anything.
    house([{ id: 'r', a: 'Gus', b: 'Iris', type: 'ally', bond: 5, kin: 'exes' }]);
    setBond('Gus', 'Iris', 5);
    expect(e.weight(NAMES, ctx())).toBe(0);

    // He is not over her, she is finished — which is only sayable at all
    // because the lean exists.
    house([{ id: 'r', a: 'Gus', b: 'Iris', type: 'rival', bond: -3, kin: 'exes' }],
      [['Gus', 'Iris', 8]]);
    setBond('Gus', 'Iris', -3);
    expect(feelsFor('Gus', 'Iris')).toBe(5);
    expect(feelsFor('Iris', 'Gus')).toBe(-3);
    expect(e.weight(NAMES, ctx())).toBeGreaterThan(0);

    const api = stubApi();
    const beat = e.fire(NAMES, ctx(), api);
    expect(beat.players).toEqual(['Gus', 'Iris']);
    expect(beat.text).toContain('Gus');
    expect(beat.text).not.toMatch(/undefined|NaN|\[object|haves/);
    // It costs the person carrying it, which is the point of modelling it.
    expect(api.log.some(x => x[0] === 'bond')).toBe(true);
  });

  it('only ends a marriage when one of them has actually gone', () => {
    const e = ev('kin-partners-break');
    house([{ id: 'r', a: 'Millie', b: 'Caleb', type: 'ally', bond: 5, kin: 'married' }]);
    setBond('Millie', 'Caleb', 5);
    expect(e.weight(NAMES, ctx()), 'a happy marriage ended').toBe(0);

    house([{ id: 'r', a: 'Millie', b: 'Caleb', type: 'ally', bond: 4, kin: 'married' }],
      [['Caleb', 'Millie', -8]]);
    setBond('Millie', 'Caleb', 4);
    // From the outside this is a couple at +4. One of them is at -4.
    expect(getBond('Millie', 'Caleb')).toBe(4);
    expect(feelsFor('Caleb', 'Millie')).toBe(-4);
    expect(e.weight(NAMES, ctx(5))).toBeGreaterThan(0);
  });

  it('does not end one on the first night', () => {
    // A marriage that ends in week one ended before anybody walked in.
    const e = ev('kin-partners-break');
    house([{ id: 'r', a: 'Millie', b: 'Caleb', type: 'ally', bond: 4, kin: 'married' }],
      [['Caleb', 'Millie', -8]]);
    setBond('Millie', 'Caleb', 4);
    expect(e.weight(NAMES, ctx(1))).toBe(0);
    expect(e.weight(NAMES, ctx(2))).toBe(0);
    expect(e.weight(NAMES, ctx(3))).toBeGreaterThan(0);
  });

  it('lands an apology on how far the other one has come', () => {
    const e = ev('kin-exfriends-apology');
    house([{ id: 'r', a: 'Eli', b: 'Fern', type: 'neutral', bond: 1, kin: 'ex-friends' }]);
    setBond('Eli', 'Fern', 1);
    expect(e.weight(NAMES, ctx())).toBeGreaterThan(0);
    const api = stubApi();
    const beat = e.fire(NAMES, ctx(), api, () => 0.01);
    expect(beat.badgeText).toBe('PUT DOWN AT LAST');
    // And the same apology, to somebody who has not moved at all.
    house([{ id: 'r', a: 'Eli', b: 'Fern', type: 'neutral', bond: 1, kin: 'ex-friends' }],
      [['Fern', 'Eli', -9]]);
    setBond('Eli', 'Fern', 1);
    const cold = e.fire(NAMES, ctx(), stubApi(), () => 0.99);
    expect(cold.badgeText).toBe('AN APOLOGY THAT DOES NOT LAND');
  });
});

describe('the once-only ones happen once', () => {
  for (const id of ['kin-ex-relapse', 'kin-partners-break', 'kin-known-before',
    'kin-estranged-attempt', 'kin-exfriends-apology']) {
    it(`${id} never happens twice in a season`, () => {
      house([
        { id: 'r1', a: 'Gus', b: 'Iris', type: 'ally', bond: 5, kin: 'exes' },
        { id: 'r2', a: 'Millie', b: 'Caleb', type: 'ally', bond: 4, kin: 'married' },
        { id: 'r3', a: 'Axel', b: 'Zee', type: 'neutral', bond: 1, kin: 'old-friends' },
        { id: 'r4', a: 'Eli', b: 'Fern', type: 'nemesis', bond: -4, kin: 'estranged' },
        { id: 'r5', a: 'Bowie', b: 'Kit', type: 'neutral', bond: 1, kin: 'ex-friends' },
      ], [['Caleb', 'Millie', -8]]);
      setBond('Gus', 'Iris', 5); setBond('Millie', 'Caleb', 4);
      setBond('Axel', 'Zee', 1); setBond('Eli', 'Fern', -4); setBond('Bowie', 'Kit', 1);
      const e = ev(id);
      if (!e.weight(NAMES, ctx(4))) return;
      e.fire(NAMES, ctx(4), stubApi(), () => 0.5);
      // A new week, so the per-week lock is not what is being tested.
      expect(e.weight(NAMES, ctx(5)), `${id} came round again`).toBe(0);
    });
  }
});

describe('the weekly ones do not say the same thing twice', () => {
  it('cycles its lines before reusing any', () => {
    house([{ id: 'r', a: 'Gus', b: 'Iris', type: 'rival', bond: -3, kin: 'exes' }],
      [['Gus', 'Iris', 8]]);
    setBond('Gus', 'Iris', -3);
    const e = ev('kin-ex-unrequited');
    const said = [];
    for (let w = 1; w <= 4; w++) {
      setLean('Gus', 'Iris', 8);  // hold the situation still
      said.push(e.fire(NAMES, ctx(w), stubApi()).text);
    }
    // The ache between two exes printed the identical sentence three weeks
    // running when the variant was a hash of the week number.
    expect(new Set(said).size, `only ${new Set(said).size} distinct lines in four weeks`)
      .toBeGreaterThanOrEqual(3);
  });
});

describe('the prose', () => {
  it('never calls somebody "your married"', () => {
    // `label` names the RELATION and belongs on a form. What a houseguest says
    // is the person — your spouse, your sibling, your ex.
    house([
      { id: 'r1', a: 'Millie', b: 'Caleb', type: 'ally', bond: 4, kin: 'married' },
      { id: 'r2', a: 'Bowie', b: 'Kit', type: 'ally', bond: 5, kin: 'siblings' },
    ]);
    setBond('Millie', 'Caleb', 4); setBond('Bowie', 'Kit', 5);
    for (const e of KINSHIP_EVENTS) {
      if (!e.weight(NAMES, ctx(4))) continue;
      const beat = e.fire(NAMES, ctx(4), stubApi(), () => 0.5);
      const all = `${beat.text} ${beat.badgeText}`;
      expect(all, `${e.id}: ${all.slice(0, 90)}`)
        .not.toMatch(/your married|your siblings|YOUR MARRIED|YOUR SIBLINGS/);
      expect(all).not.toMatch(/undefined|NaN|\[object|haves\b/);
      expect(beat.players.length).toBeGreaterThan(0);
    }
  });
});
