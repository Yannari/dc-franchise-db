// The room. Paying is not winning, and the door only opens once per game.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { credit, balance } from '../js/bb/bb-bucks.js';
import { openRoom, hasPlayed, ROOM_GAMES } from '../js/bb/high-rollers-room.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'hero', 'schemer', 'floater', 'villain', 'goat', 'underdog', 'hothead'][i],
}));

// Deterministic rng; callers pass their own sequence.
const seq = values => { let i = 0; return () => values[i++ % values.length]; };

// A real mid-season house, not a rich one. The tiers pay 18/14/10 a week, so by
// the time the room opens a top-tier darling has saved enough for exactly one
// game and a floor houseguest has not. That spread is the whole limiter: there
// is no seat cap in this room, and there does not need to be one.
const SAVER = 160;    // ~nine weeks at the top of the vote
const BROKE = 90;     // ~nine weeks on the floor — short of the 125 price

beforeEach(() => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { ...(gs.bb || {}), weeks: [], bucks: {}, roomPlays: {}, seasonSalt: 7 };
  NAMES.forEach((n, i) => credit(n, i % 2 ? BROKE : SAVER));
});

const held = () => NAMES.reduce((sum, n) => sum + balance(n), 0);
const STAKED = NAMES.reduce((sum, n, i) => sum + (i % 2 ? BROKE : SAVER), 0);

// The room opens past halfway, which is when anybody can afford it.
const open = (rng = seq([0.1, 0.9, 0.4, 0.6])) => openRoom({
  week: { num: 9 }, house: NAMES, hoh: 'Bowie', nominees: ['Chase', 'Ripper'], rng,
});

describe('the price of a seat', () => {
  it('takes the money on ENTRY, not on winning', () => {
    const act = open(seq([0.01]));            // everybody keen
    const paid = act.entries.reduce((sum, e) => sum + e.price, 0);
    expect(act.entries.length).toBeGreaterThan(0);
    expect(held()).toBe(STAKED - paid);
    // and at least somebody paid without winning, or the format is a vending machine
    expect(act.entries.some(e => !e.won)).toBe(true);
  });

  it('never seats somebody who cannot afford the game', () => {
    gs.bb.bucks = Object.fromEntries(NAMES.map(n => [n, 10]));
    expect(open(seq([0.01])).entries).toHaveLength(0);
  });

  it('never lets a balance go negative', () => {
    open(seq([0.01]));
    NAMES.forEach(n => expect(balance(n)).toBeGreaterThanOrEqual(0));
  });
});

describe('one seat per game per season', () => {
  it('refuses a second entry to the same game', () => {
    const first = open(seq([0.01]));
    const played = first.entries.map(e => e.name);
    expect(played.length).toBeGreaterThan(0);
    played.forEach(n => expect(hasPlayed(n, 'chopping-block-roulette')).toBe(true));
    // Make everybody rich, so money is no longer what keeps anybody out and the
    // one-seat rule is the only thing left standing between them and the wheel.
    // Without this the second room seats nobody and the assertion below is
    // vacuous — it would pass on an engine with no such rule at all.
    NAMES.forEach(n => credit(n, 400));
    const second = open(seq([0.01]));
    expect(second.entries.length).toBeGreaterThan(0);
    second.entries.forEach(e => expect(played).not.toContain(e.name));
  });

  it('records the play even when they lost', () => {
    const act = open(seq([0.01]));
    const loser = act.entries.find(e => !e.won);
    expect(loser).toBeTruthy();
    expect(hasPlayed(loser.name, loser.gameId)).toBe(true);
  });

  it('survives a JSON round trip, because saves do', () => {
    open(seq([0.01]));
    const revived = JSON.parse(JSON.stringify(gs.bb.roomPlays));
    expect(Object.keys(revived).length).toBeGreaterThan(0);
  });
});

describe('who walks in', () => {
  it('a nominee is likelier to pay than a comfortable houseguest', () => {
    let nomEntries = 0, safeEntries = 0;
    for (let s = 0; s < 40; s++) {
      // Everybody able to afford exactly one game, so money is not what is
      // being measured here — willingness is.
      gs.bb.bucks = Object.fromEntries(NAMES.map(n => [n, SAVER]));
      gs.bb.roomPlays = {};
      const act = openRoom({ week: { num: 9 }, house: NAMES, hoh: 'Bowie',
        nominees: ['Chase', 'Ripper'], rng: seq([(s % 10) / 10, ((s * 3) % 10) / 10]) });
      for (const e of act?.entries || []) {
        if (['Chase', 'Ripper'].includes(e.name)) nomEntries++; else safeEntries++;
      }
    }
    expect(nomEntries / 2).toBeGreaterThan(safeEntries / 6);
  });

  it('the HOH does not buy a week they already own', () => {
    for (let s = 0; s < 20; s++) {
      gs.bb.roomPlays = {};
      const act = open(seq([(s % 10) / 10]));
      expect((act?.entries || []).map(e => e.name)).not.toContain('Bowie');
    }
  });

  it('returns null when nobody enters', () => {
    gs.bb.bucks = {};
    expect(open(seq([0.99]))).toBeNull();
  });
});

describe('the menu', () => {
  it('is frozen, so nothing can retune canon prices by accident', () => {
    expect(Object.isFrozen(ROOM_GAMES)).toBe(true);
    expect(ROOM_GAMES.find(g => g.id === 'chopping-block-roulette').price).toBe(125);
  });

  it('never states a balance in a beat', () => {
    credit('Zee', 4242);
    const act = open(seq([0.01]));
    expect((act.beats || []).some(b => b.text.includes('4242'))).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE ROOM IN A REAL WEEK
// ══════════════════════════════════════════════════════════════════════
//
// Everything above tests the door in isolation. These run a whole season
// through `simulateBBEpisode` and assert the three placement decisions the
// wiring IS: when the door opens, that it opens once per CALENDAR week rather
// than once per cycle, and that a Roulette win actually rewrites the block and
// keeps the person it took down off it for the rest of the week.
//
// The money is credited straight onto the ledger rather than earned over nine
// weeks of payouts: what is under test is the wiring, and a season long enough
// for anybody to afford the 125 honestly would cost a minute a case.

const HOUSE_NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const HOUSE_ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const HOUSE_CAST = HOUSE_NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: HOUSE_ARCH[i],
}));

const ROOM_WEEK = [{ episode: 1, type: 'bb-high-rollers-room' }];

function season(schedule = ROOM_WEEK, { rich = 500 } = {}) {
  seedGame(HOUSE_CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', theme: 'high-rollers' });
  seasonConfig.twistSchedule = schedule;
  HOUSE_NAMES.forEach(n => credit(n, rich));
}

/** Every room act anywhere in the season, across BOTH cycles of a double night. */
const roomActs = () => (gs.bb.weeks || [])
  .flatMap(w => (w.acts || []).filter(a => a.type === 'high-rollers-room'));

/** Run one episode on a fixed seed and hand back the week records. */
const play = (seed, schedule = ROOM_WEEK) => withSeededRandom(seed, () => {
  season(schedule);
  simulateBBEpisode();
  return gs.bb.weeks || [];
});

describe('the room opens once, on the night after nominations', () => {
  it('emits exactly one room act on an ordinary week', () => {
    let opened = 0;
    for (let seed = 1; seed <= 5; seed++) {
      play(seed * 11);
      const n = roomActs().length;
      expect(n, `seed ${seed}: the door opened ${n} times in one week`).toBeLessThanOrEqual(1);
      if (n === 1) opened++;
    }
    expect(opened, 'the room never opened at all — the twist is not wired').toBeGreaterThan(0);
  });

  // The whole reason the gate is on `week.segment` rather than on `!compressed`.
  it('opens once on a fast-forward double eviction, not once per cycle', () => {
    let opened = 0;
    for (let seed = 1; seed <= 5; seed++) {
      const weeks = play(seed * 11, [...ROOM_WEEK,
        { episode: 1, type: 'bb-double-eviction', deStyle: 'fast-forward' }]);
      expect(weeks.length, 'a double eviction should still run two cycles').toBe(2);
      const n = roomActs().length;
      expect(n, `seed ${seed}: the door opened ${n} times on one night`).toBeLessThanOrEqual(1);
      if (n === 1) opened++;
    }
    expect(opened, 'the room never opened on a double night').toBeGreaterThan(0);
  });

  // The sharp one: a `week-in-one` double runs its SECOND cycle UNCOMPRESSED, so
  // a `!compressed` guard opens the room twice in one night and charges the
  // house twice.
  it('opens once on a week-in-one double, whose second cycle is NOT compressed', () => {
    for (let seed = 1; seed <= 5; seed++) {
      play(seed * 11, [...ROOM_WEEK,
        { episode: 1, type: 'bb-double-eviction', deStyle: 'week-in-one' }]);
      const n = roomActs().length;
      expect(n, `seed ${seed}: the door opened ${n} times on one night`).toBeLessThanOrEqual(1);
    }
  });
});

describe('the Roulette rewrites the block at the veto ceremony', () => {
  // One winning week, found by seed, and then every consequence asserted off it.
  // Winning is meant to be uncommon — that is the format — so the search is
  // wide, and the failure message says so rather than reading as a wiring bug.
  const winningWeek = () => {
    for (let seed = 1; seed <= 30; seed++) {
      const weeks = play(seed * 7);
      const w = weeks.find(x => x.rouletteSwap);
      if (w) return w;
    }
    return null;
  };

  it('takes the winner\'s nominee down and seats the name the wheel spun', () => {
    const w = winningWeek();
    expect(w, 'no seed in thirty produced a Roulette winner').toBeTruthy();
    const { down, up } = w.rouletteSwap;
    expect(down, 'the wheel spun the same name it took off the block').not.toBe(up);
    // It has to have been an INITIAL nominee. The room is handed the block as
    // the nomination ceremony left it; removing a replacement is not the rule.
    expect(w.initialNominees, 'the removed name was never an initial nominee').toContain(down);
    expect(w.rouletteBlock, 'the removed nominee is still on the block').not.toContain(down);
    expect(w.rouletteBlock, 'the spun replacement never reached the block').toContain(up);
  });

  it('keeps the removed nominee safe for the REST of the week', () => {
    const w = winningWeek();
    expect(w).toBeTruthy();
    const { down } = w.rouletteSwap;
    // The gap this closes: without the name in the veto ceremony's protection
    // list the replacement chooser can put them straight back up, and the power
    // buys nothing at all.
    expect(w.finalNominees, 'the veto ceremony re-nominated the person the wheel saved')
      .not.toContain(down);
  });
});
