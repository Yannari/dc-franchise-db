// ══════════════════════════════════════════════════════════════════════
// bb/side-bet.js — the cheap table, open every week
// ══════════════════════════════════════════════════════════════════════
//
// INVENTED, NOT CANON. BB23 had no side bets. It exists because this simulator
// pays out every week from week one while the broadcast only paid for three, so
// without something to do with money before the room opens, the first half of a
// season is a number going up and nothing else. A viewer said exactly that:
// "money is useless till mid-season?"
//
// The rule is one line: stake a little on who you think is going home.
//
// Three things make it worth having rather than decoration.
//
// IT IS A READ, NOT A COIN FLIP. A bet is placed from what that houseguest
// BELIEVES about the week, not from what the engine knows. The house's real
// sentiment towards each nominee is a number; each bettor observes it through
// noise scaled by their own intuition and social read. A well-connected
// houseguest bets well. One who is certain they are in the majority and is not
// finds out here, at a price. Nothing in this file may read the eviction
// result — the bet is placed before the vote and must be beatable.
//
// THE FLOOR KEEPS AN EDGE. A correct bet pays less than true odds, so betting
// is on average a losing move. That is the theme's own thesis (the owner never
// loses) and it is also load-bearing on the economy: the season is tuned so a
// whole season's income buys roughly one thing, and a positive-expectation bet
// would quietly undo that tuning. Money gambled in July is money that cannot
// buy a spin in September, which is the tension the theme wanted all along.
//
// IT COSTS SOMETHING SOCIALLY. A houseguest with a good read can work out who
// backed their eviction, and takes it personally. A bet that only moved numbers
// would not meet this project's bar for an event.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getPerceivedBond, addBond } from '../bonds.js';
import { balance, spend, credit } from './bb-bucks.js';
import { stableRng } from './knowledge.js';

/**
 * The price of a flutter and what it returns.
 *
 * `payout` is the multiplier on a CORRECT bet, inclusive of the stake — so 1.25
 * means a correct 10 comes back as 12, a profit of 2, and a wrong one loses 10.
 *
 * THE NUMBER IS MEASURED, NOT GUESSED, AND THE FIRST GUESS WAS BADLY WRONG.
 * It shipped at 1.7 on the assumption houseguests would be right about half the
 * time. Over 2,574 bets across casts of sixteen and twenty they were right
 * **73-76%** of the time — because the read is genuinely good: a house does
 * evict the person it is least bonded to, and `houseSentiment` sees that.
 * At 1.7 the table paid out 25-30% MORE than it took, which would have quietly
 * undone the economy tuning the room depends on.
 *
 * The fix is odds, not noise. A strong read SHOULD win often; what a floor does
 * with an obvious favourite is shorten the price.
 *
 * REPRICED AGAIN once the read stopped being a herd. Averaging the room's
 * sentiment instead of summing it let a bettor's own position actually compete
 * with it, and the measured hit rate fell from 74% to **68.3%** over 1,152
 * bets. At 1.25 that is a 15% edge, which is a fleecing rather than a table, so
 * the price moved out to 1.4: break-even is 1/0.683 ≈ 1.46, leaving the floor
 * about 4%. Enough that betting all season loses money, little enough that a
 * good read is worth having.
 *
 * With `Math.floor`, a 10 stake returns 14.
 */
export const SIDE_BET = Object.freeze({ stake: 10, payout: 1.4 });

const beat = (text, players, badgeText, badgeClass = 'gold') =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass });

const PLACED = [
  (n) => `${n} goes to the rail and puts something down, and does not say on whom.`,
  (n) => `${n} bets. The room sees ${n} bet; the room does not see the slip.`,
  (n) => `${n} pays for an opinion about Thursday, which is a thing you can do here.`,
  (n) => `${n} stakes a little on a name. Everybody watches ${n} do it and learns nothing.`,
];
const WON = [
  (n) => `${n} called Thursday correctly and the floor pays out. It is not a fortune. It is a fortune compared to being wrong.`,
  (n) => `${n} read the room right and gets paid for it — the only week that read has ever been worth money.`,
  (n) => `The slip ${n} handed over was right. ${n} collects, quietly, and puts it away.`,
  (n) => `${n} bet on the eviction and won it. Knowing where the votes are turns out to be worth something.`,
];
const LOST = [
  (n) => `${n} bet on the wrong name and the floor keeps it. That is a seat at the room ${n} no longer has.`,
  (n) => `${n} was sure. ${n} was wrong, and the stake is gone, and there is nobody to complain to about it.`,
  (n) => `The floor collects from ${n}, who has just paid to learn ${pronouns(n).sub} did not know the house as well as ${pronouns(n).sub} thought.`,
  (n) => `${n} loses the bet. It is a small amount of money and a large amount of information, none of it comforting.`,
];
const CAUGHT = [
  (a, b) => `${b} works out that ${a} had money on ${b} leaving. Neither of them mentions it again, and neither of them forgets it.`,
  (a, b) => `Somebody tells ${b} that ${a} bet on ${b}'s eviction. ${b} says it is only a game. ${b} does not mean it.`,
  (a, b) => `${b} puts it together: ${a} was at the rail on Wednesday, and ${b} was the name on the slip.`,
  (a, b) => `${a} backed ${b} to go home and ${b} finds out. There is no rule against it, which is not the same as no cost.`,
];

/**
 * How badly the house wants each nominee gone, as a number.
 *
 * The signal a bettor is trying to read. Deliberately built from PERCEIVED
 * bonds across the standing house rather than from the vote, because the vote
 * has not happened yet and a bet that could see it would not be a bet.
 */
function houseSentiment(house, nominees) {
  const out = new Map();
  for (const nom of nominees) {
    let against = 0;
    let voters = 0;
    for (const voter of house) {
      if (voter === nom || nominees.includes(voter)) continue;
      // A weak or hostile relationship is a vote waiting to happen.
      against += -getPerceivedBond(voter, nom);
      voters++;
    }
    // AVERAGED, NOT SUMMED, AND THIS IS THE WHOLE FIX FOR THE HERD.
    //
    // Summed, this ran to about ±100 in a full house while a personal bond
    // runs ±10 — so the room's opinion outweighed the bettor's own by an order
    // of magnitude and no amount of weighting or noise could be heard over it.
    // Every bettor reached the same conclusion and half the tables came back
    // unanimous. On the same scale as a bond, where they belong, the two terms
    // actually compete.
    out.set(nom, voters ? against / voters : 0);
  }
  return out;
}

/**
 * Run the week's table.
 *
 * @returns {object|null} the act, or null when nobody bet
 */
export function runSideBets({ week, house = [], nominees = [], rng } = {}) {
  const room = house.filter(Boolean);
  const noms = nominees.filter(Boolean);
  // Two names to choose between, or there is nothing to have an opinion about.
  if (room.length < 4 || noms.length < 2) return null;
  const draw = rng || stableRng('side-bet', gs?.bb?.seasonSalt || 0, week?.num || 0);

  const sentiment = houseSentiment(room, noms);
  const bets = [];
  const beats = [];

  for (const name of room) {
    if (!balance(name) || balance(name) < SIDE_BET.stake) continue;
    const st = pStats(name);
    // Who bothers. Bold and strategic houseguests play; a nominee has better
    // things to think about than the odds on their own eviction.
    const onBlock = noms.includes(name);
    const pull = 0.10 + (st.boldness || 5) * 0.030 + (st.strategic || 5) * 0.022
      - (onBlock ? 0.18 : 0);
    if (draw() > Math.max(0.02, Math.min(0.55, pull))) continue;

    // ── THE READ ──
    //
    // THIS IS A PERSONAL READ, NOT A SHARED ORACLE, AND THE FIRST VERSION GOT
    // THAT WRONG. It scored every nominee on one global sentiment number and
    // blurred it per bettor, so six houseguests reading the same number reached
    // the same conclusion: a real week produced six slips with the identical
    // name on all six, which reads as the house being psychic rather than
    // observant. Reported straight off a screen — "are they always betting on
    // the right person too??"
    //
    // A houseguest's real read is dominated by where THEY stand. Somebody tight
    // with a nominee does not back that nominee to go, whatever the rest of the
    // room thinks, and somebody who wants them gone believes the votes are
    // there because they want them to be. So the room's sentiment is only part
    // of it, weighted by how well this person reads a room, and their own
    // relationship is the rest. Picks spread, the hit rate falls to something a
    // person could plausibly manage, and being close to somebody costs you
    // money — which is the right kind of wrong to be.
    // All three terms are on the same ±10 scale now, so they genuinely trade
    // against each other: what the room wants, what I want, and how wrong I am.
    const sharp = ((st.intuition || 5) + (st.social || 5)) / 20;   // 0..1
    const noiseBand = 10 * (1 - sharp) + 3;
    let best = null;
    let bestScore = -Infinity;
    for (const nom of noms) {
      if (nom === name) continue;              // nobody bets on their own exit
      // What the room seems to want, seen through this person's eyes...
      const room = (sentiment.get(nom) || 0) * (0.5 + sharp * 0.9);
      // ...plus what THEY want, which is the half that makes two houseguests
      // at the same rail write different names.
      const mine = -getPerceivedBond(name, nom);
      const seen = room + mine + (draw() - 0.5) * noiseBand;
      if (seen > bestScore) { bestScore = seen; best = nom; }
    }
    if (!best) continue;
    if (!spend(name, SIDE_BET.stake)) continue;
    bets.push({ name, on: best, stake: SIDE_BET.stake });
  }

  if (!bets.length) return null;

  for (const b of bets.slice(0, 4)) {
    beats.push(beat(PLACED[Math.floor(draw() * PLACED.length)](b.name),
      [b.name], 'AT THE RAIL', 'gold'));
  }

  return {
    type: 'side-bet', week: week?.num || 0, secret: false,
    stake: SIDE_BET.stake, payout: SIDE_BET.payout,
    bets: bets.map(b => ({ ...b })),
    results: [], settled: false, beats,
  };
}

/**
 * Settle the week's bets once the house has actually voted.
 *
 * ── RETURNS ITS OWN ACT, AND THAT IS THE WHOLE POINT ──────────────────
 *
 * The first version mutated the placement act: it pushed the slips before the
 * vote and then wrote the results into the same object. The screen still sat in
 * its pre-eviction slot and rendered the FINAL state, so a viewer watching in
 * order was shown who had been paid, and therefore who had gone home, before
 * the eviction happened. Reported off a real screen: "i feel like its telling
 * me the results of the bet before the eviction happen".
 *
 * Placing a bet and collecting on it are two scenes on two different nights.
 * They are two acts now, and the caller pushes this one AFTER the eviction.
 */
export function settleSideBets(act, evicted, { rng } = {}) {
  if (!act || act.settled || !evicted) return null;
  const draw = rng || stableRng('side-bet-settle', gs?.bb?.seasonSalt || 0, act.week || 0);
  const settlement = {
    type: 'side-bet-settled', week: act.week, secret: false,
    stake: act.stake, payout: act.payout, evicted,
    results: [], beats: [],
  };

  for (const b of act.bets || []) {
    const won = b.on === evicted;
    // FLOOR, not round. `Math.round(10 * 1.25)` is 13, which pays 1.3 on a
    // price of 1.25 and measured the edge down from -5% to -1.2% on a cast of
    // twenty — the floor handing back a penny it never advertised. A house
    // rounds in its own favour, which is both the correct arithmetic and the
    // correct character.
    const back = won ? Math.floor(b.stake * SIDE_BET.payout) : 0;
    if (back) credit(b.name, back);
    settlement.results.push({ name: b.name, on: b.on, won, delta: back - b.stake });
    const pool = won ? WON : LOST;
    settlement.beats.push(beat(pool[Math.floor(draw() * pool.length)](b.name),
      [b.name], won ? 'PAID OUT' : 'THE FLOOR KEEPS IT', won ? 'gold' : 'grey'));
  }

  // ── THE SOCIAL COST ──
  //
  // Betting on somebody's eviction is not a secret you can keep from a
  // houseguest who is paying attention. The people who stayed are the ones who
  // can still make you pay for it, so only live names are read.
  const live = (gs.activePlayers || []);
  for (const b of act.bets || []) {
    if (!live.includes(b.on) || b.on === b.name) continue;
    const st = pStats(b.on);
    const catchOdds = Math.min(0.45, 0.06 + (st.intuition || 5) * 0.035);
    if (draw() > catchOdds) continue;
    try { addBond(b.name, b.on, -2); } catch { /* bonds are not load-bearing here */ }
    settlement.beats.push(beat(CAUGHT[Math.floor(draw() * CAUGHT.length)](b.name, b.on),
      [b.name, b.on], 'READ THE RAIL', 'red'));
  }

  act.settled = true;
  return settlement;
}
