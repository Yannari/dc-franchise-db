// The Twin Twist — one name in the roster is two people.
//
// From the wiki, BB5: "identical twins... would swap places every few days,
// playing as Adria. If the two made it to week 5 without being discovered or
// evicted, they would both enter the game as individuals." BB17 ran it again
// and the house DID work it out, and they both entered anyway — the rule they
// had to beat was the calendar, not the gossip.
//
// The thing worth asserting is that the swap is REAL. It is implemented by
// writing the active twin's stats onto the shared identity, which is what lets
// competitions, threat reads and nomination plans all feel it without any of
// them knowing the twist exists — so the tests check the stat line moves, that
// somebody eventually notices, and that beating the calendar physically grows
// the roster.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, setRelationships,
  kinshipBetween, kinshipPairs, familyPairs, tensePairs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { installTwinTwist, swapTwins, twinTells, checkTwinEntry, twinEvicted,
  twinState, isTwinIdentity, twinExposure } from '../js/bb/twin-twist.js';
import { BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = n => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((n * 7 + i * 3) % 10)]));
const NAMES = ['Julia', 'Bowie', 'Wayne', 'Raj', 'Eli', 'Fern',
  'Gus', 'Hicks', 'Iris', 'Jae', 'Kit', 'Lex'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater', gender: i % 2 ? 'f' : 'm',
  sexuality: 'straight', stats: spread(i + 1) }));

function house(config = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  globalThis.gs = gs; globalThis.players = players;
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'disabled', ...config });
  seasonConfig.twistSchedule = [];
  gs.bb = { weeks: [], stats: {} };
}

const aWeek = (over = {}) => ({ num: 2, houseAtStart: [...NAMES], ...over });

beforeEach(() => house());

describe('the twist itself', () => {
  it('is a season twist the house is never told about', () => {
    const contract = BB_TWIST_CONTRACTS['bb-twin-twist'];
    expect(contract).toBeTruthy();
    expect(contract.layer).toBe('season');
    // No announcement, unlike the Saboteur. BB5 and BB17 both ran it with the
    // room having to work it out on its own, so there is nothing to read out.
    expect(contract.acquisition.secrecy).toBe('secret');
    expect(contract.announcement ?? null).toBeNull();
  });

  it('gives the two of them measurably different stat lines', () => {
    const st = installTwinTwist(NAMES, { rng: Math.random });
    expect(st).toBeTruthy();
    expect(isTwinIdentity(st.front)).toBe(true);
    // Two up, two down, by a margin somebody could actually notice. A pair who
    // differ by noise is a pair nobody can ever catch.
    const diffs = STAT_KEYS.map(k => Math.abs(st.statsA[k] - st.statsB[k])).filter(Boolean);
    expect(diffs.length).toBeGreaterThan(2);
    expect(Math.max(...diffs)).toBeGreaterThan(1);
  });

  it('can be cast by hand', () => {
    const st = installTwinTwist(NAMES, { rng: Math.random, pick: 'Kit' });
    expect(st.front).toBe('Kit');
  });
});

describe('a twin the cast declared', () => {
  // The Relationships tab carries HOW two houseguests know each other as a
  // separate axis from how they feel about each other, so a season can say
  // "these two are twins" and the twist can stop guessing.
  it('seats the declared pair and brings the real person in', () => {
    house();
    // Kit is in the house. Kit's twin is cast but does not walk through the
    // door on night one — which is the actual shape of it: Adria and Natalie
    // were both cast and only one of them entered.
    players.push({ name: 'Kip', slug: 'kip', gender: 'f', sexuality: 'straight',
      archetype: 'floater', stats: spread(20) });
    setRelationships([{ id: 'r1', a: 'Kit', b: 'Kip', type: 'unbreakable', bond: 10, kin: 'twins' }]);
    globalThis.relationships = relationships;

    const st = installTwinTwist(NAMES, { rng: Math.random });
    expect(st.declared).toBe(true);
    expect(st.front).toBe('Kit');
    expect(st.other).toBe('Kip');
    // Their own stat line, not a generated approximation of one.
    expect(st.statsB).toEqual(spread(20));

    gs.activePlayers = [...NAMES];
    checkTwinEntry(aWeek({ num: st.enterWeek }));
    expect(gs.activePlayers).toContain('Kip');
    // And they keep the roster record the cast already gave them.
    expect(players.filter(p => p.name === 'Kip').length).toBe(1);
    setRelationships([]);
  });

  it('reads the two axes apart', () => {
    setRelationships([
      { id: 'a', a: 'Kit', b: 'Lex', type: 'nemesis', bond: -8, kin: 'siblings' },
      { id: 'b', a: 'Gus', b: 'Iris', type: 'friend', bond: 5, kin: 'exes' },
      { id: 'c', a: 'Eli', b: 'Fern', type: 'ally', bond: 3 },
    ]);
    globalThis.relationships = relationships;
    // Siblings who hate each other is a thing the model has to be able to say.
    expect(kinshipBetween('Kit', 'Lex')).toBe('siblings');
    expect(kinshipBetween('Lex', 'Kit')).toBe('siblings');
    expect(kinshipBetween('Eli', 'Fern')).toBe('none');
    // What a family season draws from, and what Rivals draws from.
    expect(familyPairs().map(p => p.kin)).toEqual(['siblings']);
    expect(tensePairs().map(p => p.kin)).toEqual(['exes']);
    expect(kinshipPairs('exes')[0].label).toBe('Exes');
    setRelationships([]);
  });
});

describe('the swap', () => {
  it('actually changes who is in the house', () => {
    // The whole mechanic. If the stat line does not move, every system
    // downstream is playing against the same person and the twist is a costume.
    const st = installTwinTwist(NAMES, { rng: Math.random, pick: 'Kit' });
    const before = { ...pStats('Kit') };
    swapTwins(aWeek(), { rng: Math.random });
    const after = { ...pStats('Kit') };
    expect(after).not.toEqual(before);
    // And it is the other twin's line exactly, not a nudge.
    const other = st.active === 'a' ? st.statsA : st.statsB;
    for (const k of STAT_KEYS) expect(after[k]).toBe(other[k]);
  });

  it('swaps back', () => {
    installTwinTwist(NAMES, { rng: Math.random, pick: 'Kit' });
    const first = { ...pStats('Kit') };
    swapTwins(aWeek(), { rng: Math.random });
    swapTwins(aWeek({ num: 3 }), { rng: Math.random });
    expect({ ...pStats('Kit') }).toEqual(first);
  });
});

describe('the house noticing', () => {
  it('picks it up eventually, and never on the first thing it sees', () => {
    let anyTells = 0, exposedEarly = 0;
    for (let i = 0; i < 12; i++) {
      house();
      installTwinTwist(NAMES, { rng: Math.random });
      swapTwins(aWeek(), { rng: Math.random });
      const out = twinTells(aWeek(), { rng: Math.random });
      if (out) {
        anyTells++;
        // Three a week at most: eight people all noticing in the same seven
        // days is a wall of cards saying the same thing.
        expect(out.notices.length).toBeLessThan(4);
        for (const b of out.beats) expect(b.text).not.toMatch(/undefined|NaN|\[object/);
      }
      if (twinState().exposed) exposedEarly++;
    }
    expect(anyTells, 'nobody ever noticed anything').toBeGreaterThan(2);
    // One week of tells is never enough to have it said out loud.
    expect(exposedEarly).toBe(0);
  });

  it('being worked out does not end it', () => {
    // BB17: the house had it and they both entered anyway. Exposure is a target
    // painted on them, not a fail state.
    house();
    const st = installTwinTwist(NAMES, { rng: Math.random });
    st.exposed = true;
    const entry = checkTwinEntry(aWeek({ num: st.enterWeek }));
    expect(entry).toBeTruthy();
    expect(entry.exposed).toBe(true);
    expect(twinState().entered).toBe(true);
  });
});

describe('beating the calendar', () => {
  it('puts a whole extra houseguest in the house', () => {
    house();
    const st = installTwinTwist(NAMES, { rng: Math.random });
    gs.activePlayers = [...NAMES];
    const before = gs.activePlayers.length;

    expect(checkTwinEntry(aWeek({ num: st.enterWeek - 1 })), 'entered early').toBeNull();
    const entry = checkTwinEntry(aWeek({ num: st.enterWeek }));
    expect(entry).toBeTruthy();
    expect(gs.activePlayers.length).toBe(before + 1);
    expect(gs.activePlayers).toContain(st.other);
    // A real houseguest: their own roster entry, their own stats, their own
    // competition record.
    const entry2 = players.find(p => p.name === st.other);
    expect(entry2).toBeTruthy();
    expect(entry2.stats).not.toEqual(pStats(st.front));
    expect(gs.bb.stats[st.other]).toBeTruthy();
    // And the twist is over: no more swapping.
    expect(swapTwins(aWeek({ num: st.enterWeek + 1 }), { rng: Math.random })).toBeNull();
  });

  it('takes both of them out when the front is evicted first', () => {
    house();
    const st = installTwinTwist(NAMES, { rng: Math.random });
    swapTwins(aWeek(), { rng: Math.random });
    const out = twinEvicted(st.front, aWeek({ num: 3 }));
    expect(out).toBeTruthy();
    expect(out.swaps).toBeGreaterThan(0);
    expect(twinState().caught).toBe(true);
    // Nobody else's eviction does anything.
    house();
    installTwinTwist(NAMES, { rng: Math.random });
    const other = NAMES.find(n => n !== twinState().front);
    expect(twinEvicted(other, aWeek())).toBeNull();
  });
});

describe('a season with one running', () => {
  it('plays, and reaches the screen and the page', () => {
    house({ bbTwins: 'random', bbTwinsEnterWeek: 4 });
    let sawWeek = false, sawEnd = false;
    for (let w = 0; w < 5; w++) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      const acts = (ep.acts || []).filter(a => /^twin-/.test(a.type));
      if (acts.length) {
        const text = generateSummaryText(ep) || '';
        gs.episodeHistory = [ep];
        buildVPScreens(ep);
        Object.keys(_tvState).forEach(k => { if (_tvState[k]) _tvState[k].idx = 99; });
        const screens = (buildVPScreens(ep) || []).filter(s => /bb-twins/.test(s.id));
        expect(screens.length, 'a twin act with no screen').toBeGreaterThan(0);
        for (const s of screens) {
          expect(s.html.length).toBeGreaterThan(600);
          expect(s.html).not.toMatch(/undefined|NaN|\[object Object\]/);
        }
        for (const a of acts) {
          if (a.type === 'twin-week') sawWeek = true;
          if (a.type === 'twin-entry' || a.type === 'twin-out') sawEnd = true;
          for (const b of a.beats || []) {
            expect(text, 'a twin beat the transcript never wrote down')
              .toContain(b.text.replace(/<[^>]*>/g, '').slice(0, 40));
          }
        }
      }
      const st = twinState();
      if (st?.entered || st?.caught) break;
    }
    expect(sawWeek, 'no twin week ever played').toBe(true);
    expect(sawEnd, 'the twist never ended').toBe(true);
  });

  it('does nothing at all when the season did not ask for one', () => {
    house({ bbTwins: 'off' });
    const ep = simulateBBEpisode();
    expect(twinState()).toBeFalsy();
    expect((ep.acts || []).some(a => /^twin-/.test(a.type))).toBe(false);
  });
});
