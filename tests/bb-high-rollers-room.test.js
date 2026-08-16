// The room. Paying is not winning, and the door only opens once per game.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { credit, balance } from '../js/bb/bb-bucks.js';
import { openRoom, hasPlayed, ROOM_GAMES } from '../js/bb/high-rollers-room.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { resolveBBCampaignAct } from '../js/bb/shared-strategy.js';
import { runRoulette } from '../js/bb/chopping-block-roulette.js';
import { buildVPScreens } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'hero', 'schemer', 'floater', 'villain', 'goat', 'underdog', 'hothead'][i],
}));

// Deterministic rng; callers pass their own sequence.
const seq = values => { let i = 0; return () => values[i++ % values.length]; };

// A real mid-season house, not a rich one. The tiers pay 26/20/14 a week, so
// these are a houseguest the audience has been paying well — enough for exactly
// one game — and one it has not, who is short of the door. That spread is the
// whole limiter: there is no seat cap in this room, and there does not need to
// be one. Written as literals rather than derived from `PAYOUT_TIERS`, because
// what these two numbers have to be is "over 125" and "under 125" and a rescale
// must not silently turn the broke half of this house into buyers.
const SAVER = 160;    // comfortably over the 125 price
const BROKE = 90;     // comfortably under it

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

// ── THE CHIP STANDINGS ──────────────────────────────────────────────────
//
// Written because a viewer could not tell what anybody had: "im not sure what
// everyone has week by week cause theres not a table saying the money of every
// active houseguest".
//
// The in-world rule does not move — no houseguest and no transcript line learns
// a balance. What changes is that the VIEWER stops being treated as a
// houseguest, which is the same allowance `_bbPowerBand` already makes when it
// shows a secret power and labels it NOBODY KNOWS.
describe('the chip standings', () => {
  it('shows every houseguest in the week, with what they were holding', () => {
    withSeededRandom(31, () => {
      season([]);
      simulateBBEpisode();
      const ep = gs.episodeHistory[gs.episodeHistory.length - 1];
      const html = (buildVPScreens(ep) || []).map(s => s.html || '').join('');
      expect(html).toContain('CHIP STANDINGS');
      for (const l of ep.bucksLedger || []) {
        expect(html, `${l.name} is missing from the standings`).toContain(l.name);
      }
      expect((ep.bucksLedger || []).length).toBeGreaterThan(0);
    });
  });

  it('shows a replayed week the money THAT week had, not the season\'s final total', () => {
    withSeededRandom(31, () => {
      season([]);
      for (let i = 0; i < 4; i++) simulateBBEpisode();
      const first = gs.episodeHistory[0];
      const last = gs.episodeHistory[gs.episodeHistory.length - 1];
      // Compare ONE houseguest across the two weeks, not the totals: the ledger
      // covers the house as it stood that week, and the house shrinks, so the
      // season total FALLS while every individual balance climbs.
      // And pick somebody who SAVED. A houseguest who bought a seat is 125
      // poorer four weeks later, which is the engine working, not a bug — the
      // first version of this test picked one of them and failed.
      const early = new Map((first.bucksLedger || []).map(l => [l.name, l.balance]));
      const stillIn = (last.bucksLedger || [])
        .find(l => early.has(l.name) && l.balance > early.get(l.name));
      expect(stillIn, 'nobody who was here in week one got richer').toBeTruthy();

      // The week-one screen must not be showing week-four money.
      const html = (buildVPScreens(first) || []).map(s => s.html || '').join('');
      expect(html, 'a replayed week one is showing a later balance')
        .not.toContain(`>${stillIn.balance}<`);
    });
  });

  it('draws no standings on a season with no economy', () => {
    withSeededRandom(31, () => {
      seedGame(HOUSE_CAST, { episode: 0, eliminated: [], namedAlliances: [] });
      Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
        ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
      Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
        bbHaveNots: 'off', bbSafetyMode: 'off', theme: 'none' });
      seasonConfig.twistSchedule = [];
      simulateBBEpisode();
      const ep = gs.episodeHistory[gs.episodeHistory.length - 1];
      const html = (buildVPScreens(ep) || []).map(s => s.html || '').join('');
      expect(html).not.toContain('CHIP STANDINGS');
    });
  });
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
  //
  // Counting ACTS is not enough here, twice over. Entry is a `spendPull` roll,
  // so a run where nobody walks to the door passes `n <= 1` while testing
  // nothing — hence the `opened` guard the siblings carry. And double-NARRATING
  // is only the symptom: the harm is double-CHARGING, so the ledger is
  // reconciled to the last chip.
  it('opens once on a week-in-one double, whose second cycle is NOT compressed', () => {
    let opened = 0;
    for (let seed = 1; seed <= 5; seed++) {
      const weeks = play(seed * 11, [...ROOM_WEEK,
        { episode: 1, type: 'bb-double-eviction', deStyle: 'week-in-one' }]);
      const acts = roomActs();
      expect(acts.length, `seed ${seed}: the door opened ${acts.length} times on one night`)
        .toBeLessThanOrEqual(1);
      if (acts.length === 1) opened++;
      expectLedgerCharged(weeks);
    }
    expect(opened, 'the room never opened on a week-in-one night — the gate is untested')
      .toBeGreaterThan(0);
  });
});

/**
 * Every houseguest's balance, reconciled from what they were given, what the
 * audience paid them and what the room took.
 *
 * This is the assertion that actually guards the double-charge: a second cycle
 * that opens the door again bills somebody a second 125 and the arithmetic
 * stops closing. Reading it off the acts rather than off a hard-coded number
 * means it keeps working when the tiers are rescaled again.
 */
function expectLedgerCharged(weeks) {
  const acts = (weeks || []).flatMap(w => w.acts || []);
  const paid = {};
  for (const a of acts.filter(x => x.type === 'bb-bucks')) {
    for (const p of a.payouts || []) paid[p.name] = (paid[p.name] || 0) + p.amount;
  }
  const spent = {};
  const roomSpent = {};
  for (const a of acts.filter(x => x.type === 'high-rollers-room')) {
    for (const e of a.entries || []) {
      spent[e.name] = (spent[e.name] || 0) + e.price;
      roomSpent[e.name] = (roomSpent[e.name] || 0) + e.price;
    }
  }
  // The cheap table moves money too. Without this the reconciliation read a
  // ten-buck stake as a second room charge and reported a double-bill that had
  // not happened — the arithmetic has to know about every till, not just one.
  // Stakes leave on the placement act; winnings arrive on the SETTLEMENT act,
  // which is a separate act pushed after the eviction so the pre-vote screen
  // cannot spoil it. Reading the payout off the placement act under-counted by
  // the whole winnings and reported a phantom double-bill.
  for (const a of acts.filter(x => x.type === 'side-bet')) {
    for (const b of a.bets || []) spent[b.name] = (spent[b.name] || 0) + b.stake;
  }
  for (const a of acts.filter(x => x.type === 'side-bet-settled')) {
    for (const r of a.results || []) {
      if (r.won) paid[r.name] = (paid[r.name] || 0) + (r.delta + a.stake);
    }
  }
  for (const name of HOUSE_NAMES) {
    expect(balance(name), `${name}'s ledger does not reconcile — somebody was billed twice`)
      .toBe(500 + (paid[name] || 0) - (spent[name] || 0));
    // And nobody bought the same seat twice, however many cycles ran.
    //
    // Counted off the ROOM only. `spent` reconciles every till — the door and
    // the rail both — so folding the side bet into it made a 125 seat plus a
    // 10 stake read as 135 of seat and reported a double-charge that had not
    // happened. Two tills, two questions.
    expect(roomSpent[name] || 0, `${name} paid for more than one seat in one night`)
      .toBeLessThanOrEqual(ROOM_GAMES[0].price);
  }
}

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

  it('records the wheel as a route off the block, like every other one', () => {
    const w = winningWeek();
    expect(w).toBeTruthy();
    // `winningWeek` returns the moment it finds one, so `gs` is still that
    // season. The veto, the mystery veto, the Block Buster and the emptied
    // America's chair all credit this; the wheel has to as well, or a career
    // record under-counts every houseguest the room ever pulled down.
    expect(gs.bb.stats[w.rouletteSwap.down].timesSaved,
      'the houseguest the wheel took down was never credited with the save')
      .toBeGreaterThanOrEqual(1);
  });

  // ── the half of the power that is never conditional ──
  //
  // The catalog `desc`, the twist announcement and the game's own beats all say
  // the winner is safe for the week. For one revision the engine wrote down the
  // NOMINEE'S safety and nothing else, so a non-nominee could pay 125, take an
  // ally off the block, and be named as the replacement an hour later. Asserted
  // over every winning week thirty seeds produce, spent and void alike, rather
  // than off one — the void branch is the one that had nothing in it at all.
  it('makes the winner safe on every branch, spent or void', () => {
    let seen = 0;
    for (let seed = 1; seed <= 30; seed++) {
      for (const w of play(seed * 7)) {
        const act = (w.acts || []).find(a => a.type === 'high-rollers-room');
        const win = ((act?.entries) || []).find(e => e.won);
        if (!win) continue;
        seen++;
        expect(w.rouletteSafe || [],
          `week ${w.num}: ${win.name} won the Roulette and entered no protection list`)
          .toContain(win.name);
        // A winner who WAS a nominee and whose block change did not happen
        // stays on the block BY RULE — the removal and the spin are one power
        // and they happen together or not at all. The copy says exactly that
        // now, so the case is asserted rather than skipped: the wheel must not
        // have touched the block at all.
        if ((w.initialNominees || []).includes(win.name)) {
          if (!w.rouletteSwap) {
            expect(w.rouletteBlock,
              `${win.name}: the wheel moved the block on a week it had no chair to fill`)
              .toBeUndefined();
            expect(w.initialNominees,
              `${win.name} was a nominee and the wheel had nothing to land on — they stay up`)
              .toContain(win.name);
          }
          continue;
        }
        // And a winner who was never on the block must not be able to arrive on
        // it — the failure that started all of this.
        expect(w.finalNominees || [],
          `${win.name} bought the chair protection and the ceremony seated them anyway`)
          .not.toContain(win.name);
      }
    }
    expect(seen, 'no seed in thirty produced a Roulette winner').toBeGreaterThan(0);
  });

  // ── the invariant that decided the rule above ──
  //
  // A nominee-winner whose week hits `NO CHAIR TO FILL` stays on the block, and
  // that is the RULE rather than a gap: the removal and the spin are one power.
  //
  // The alternative — empty the chair the way BB15's America's Nominee does —
  // was implemented and measured, and it takes the episode down. This pins WHY,
  // so the next person to reach for that fix finds the reason instead of
  // rediscovering it: a one-name block is refused outright, and America's
  // Nominee only survives it by emptying a chair off a block of THREE.
  // The season sweep above cannot reach this: a twelve-person house always has
  // somebody eligible for the chair, so a nominee-winner there always gets the
  // swap. The rule is driven directly instead — a house of three where the
  // winner, the HOH and the nominees are everybody, which is exactly the board
  // that empties the wheel.
  it('leaves a nominated winner on the block when no chair can be filled, and says so', () => {
    // Swept across the narration pools rather than sampled once: the draws are
    // [score, WON pick, NO_CHAIR pick], so varying the second and third walks
    // every variant of both. A promise the mechanics do not keep is a defect in
    // ANY variant, and this whole round exists because one of them carried it.
    let checked = 0;
    for (const v of [0, 0.2, 0.4, 0.6, 0.8, 0.99]) {
      const out = runRoulette({
        entrants: ['Bowie'], house: ['Bowie', 'Chase', 'Ripper'],
        nominees: ['Bowie', 'Chase'], hoh: 'Ripper', rng: seq([0, v, v]),
      });
      expect(out.winner, 'the entrant did not clear the standard — pick a kinder roll').toBe('Bowie');
      // Rule 3: the removal and the spin are one power, and neither happens.
      expect(out.removed).toBeNull();
      expect(out.replacement).toBeNull();

      // No beat anywhere in this night may claim a week of safety.
      for (const b of out.beats) {
        expect(b.text, `a beat still promises safety for the week: ${b.text}`)
          .not.toMatch(/safe for the week|does not have to survive|off every list/i);
      }

      const chair = out.beats.find(b => b.badgeText === 'NO CHAIR TO FILL');
      expect(chair, 'no beat narrated the empty board').toBeTruthy();
      // It must say the winner is still on the block...
      expect(chair.text, `variant ${v} does not say the nominated winner stays up`)
        .toMatch(/included|still on it|still nominated|as nominated|sits back down/i);
      // ...and name what they DID buy.
      expect(chair.text, `variant ${v} never states the replacement-chair protection`)
        .toMatch(/replacement/i);
      checked++;
    }
    expect(checked).toBe(6);
  });

  // ── THE OTHER FALSE PROMISE: A BLOCK THAT HAS NOT MOVED YET ────────────
  //
  // The sweep above only walks the NO-CHAIR pools, because that is the board it
  // drives. The WINNING board has the same defect class and had it in shipped
  // copy: these beats ride out on the ROOM act, which is the night the door
  // opens — after nominations, before the veto competition. The engine does not
  // move the block until the veto ceremony (`js/bb/week.js`), and it can VOID
  // the swap entirely when a name has stopped being legal by then, which is
  // routine rather than rare because the spun replacement can go on to win the
  // veto.
  //
  // So the removal and landing beats may not narrate the block as already
  // moved. The pinned form is: the WHEEL HAS DECIDED, the CEREMONY PERFORMS IT.
  // Every variant of both pools is swept, because a promise the mechanics do
  // not keep is a defect in any one of them.
  it('never says the block has already moved — the ceremony performs it', () => {
    let checked = 0;
    for (const v of [0, 0.2, 0.4, 0.6, 0.8, 0.99]) {
      const out = runRoulette({
        entrants: ['Bowie'], house: NAMES, nominees: ['Chase', 'Ripper'],
        hoh: 'Scary', rng: seq([0, v, v, v, v]),
      });
      expect(out.winner, 'the entrant did not clear the standard — pick a kinder roll').toBe('Bowie');
      expect(out.removed, 'this board has an eligible chair; the swap should exist').toBeTruthy();
      expect(out.replacement).toBeTruthy();

      for (const b of out.beats) {
        // The banned promise, in every form three fix rounds removed it in.
        expect(b.text, `a beat still promises safety for the week: ${b.text}`)
          .not.toMatch(/safe for the week|safe for the rest of the week|no way back up|does not have to survive|off every list/i);
      }

      // The removal and the landing must both name the event that performs
      // them. "Thursday" is the week's horizon (how long the replacement-chair
      // protection lasts), never the thing that moves the block — the ceremony
      // is the veto meeting and the vote is Thursday.
      const off = out.beats.find(b => b.badgeText === 'OFF THE BLOCK');
      const up = out.beats.find(b => b.badgeText === 'THE WHEEL DECIDES');
      expect(off, 'no beat narrated the removal').toBeTruthy();
      expect(up, 'no beat narrated the spin').toBeTruthy();
      expect(off.text, `variant ${v}: the removal beat does not defer to the ceremony`)
        .toMatch(/ceremony/i);
      expect(up.text, `variant ${v}: the landing beat does not defer to the ceremony`)
        .toMatch(/ceremony/i);
      checked++;
    }
    // And the same over a NOMINEE winner, which is the only board that reaches
    // `REMOVED_SELF` — the pool the swept board above cannot touch.
    for (const v of [0, 0.2, 0.4, 0.6, 0.8, 0.99]) {
      const out = runRoulette({
        entrants: ['Chase'], house: NAMES, nominees: ['Chase', 'Ripper'],
        hoh: 'Scary', rng: seq([0, v, v, v, v]),
      });
      expect(out.winner).toBe('Chase');
      expect(out.removed, 'a nominee winner takes themselves down').toBe('Chase');
      for (const b of out.beats) {
        expect(b.text, `a beat still promises safety for the week: ${b.text}`)
          .not.toMatch(/safe for the week|safe for the rest of the week|no way back up|does not have to survive|off every list/i);
      }
      const off = out.beats.find(b => b.badgeText === 'OFF THE BLOCK');
      expect(off, 'no beat narrated the self-removal').toBeTruthy();
      expect(off.text, `variant ${v}: the self-removal beat does not defer to the ceremony`)
        .toMatch(/ceremony/i);
      checked++;
    }
    expect(checked).toBe(12);
  });

  it('refuses a one-name block, which is why the chair is not emptied', () => {
    expect(() => resolveBBCampaignAct({
      nominees: ['Bowie'], ballots: ['Chase', 'Ripper'], house: NAMES, rng: seq([0.5]),
    })).toThrow(/at least two nominees/);
    // And the shape that IS supported, so this is not asserting a broken import.
    expect(() => resolveBBCampaignAct({
      nominees: ['Bowie', 'Chase'], ballots: ['Ripper', 'Scary'], house: NAMES, rng: seq([0.5]),
    })).not.toThrow();
  });
});
