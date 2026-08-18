// ══════════════════════════════════════════════════════════════════════
// bb/coin-of-destiny.js — pay in, play, and call it in the dark
// ══════════════════════════════════════════════════════════════════════
//
// BB23's shape, and it is the Coup d'État turned inside out.
//
// Anybody may buy in, and buying in is PUBLIC — the house watches who wants
// it. They play a game of skill, and the winner is taken away and asked to
// call a coin toss where nobody can see. Call it right and they take the
// week's nominations off the Head of Household and make their own. Call it
// wrong and they have paid, played and lost in front of everybody, for nothing.
//
// The half that makes it worth building: the nominations change in public and
// the hand that changed them never does. A Coup leaves a dethroned Head of
// Household with somebody to hate. This leaves them with a list of everybody
// who bought in, one of whom did it, and no way to tell which.
//
// So the twist produces two facts the house may use — who paid, and that the
// block was rewritten — and one it may never have: by whom.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond, getPerceivedBond } from '../bonds.js';
import { aptitude, makePicker, clamp } from '../bb-comps/_shared.js';
import { stableRng } from './knowledge.js';
import { canAfford, spend } from './bb-bucks.js';
import { spendPull } from './powers.js';

const beat = (text, players, badgeText, badgeClass = 'gold') =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass });

/** What the game of skill asks for. Not the same shape as an HOH comp. */
const COIN_MIX = { mental: 0.34, physical: 0.24, temperament: 0.22, intuition: 0.20 };

// ── THE PRICE, AND WHY IT IS NOT CANON'S 250 ────────────────────────────
//
// BB23 sold this for 250 BB Bucks. Our economy cannot carry that number, and
// the arithmetic is not close: measured over 40,000 seasons at the tiers in
// `bb-bucks.js`, the richest houseguest at the Coin's week holds a mean of 98
// at a cast of twelve and 169 at a cast of sixteen, and NOBODY in any of those
// forty thousand cast-sixteen seasons ever reached 250. At canon's price the
// Coin is not an expensive product, it is a line of text — announced every
// season, bought in none of them, on every cast this simulator normally runs.
//
// So the price is set against the season the engine actually plays. Two things
// bind it and they pull in opposite directions:
//
//   1. It must stay ABOVE the Roulette's 125, because the Coin takes a whole
//      week and the wheel takes one chair. A premium product priced under the
//      cheap one inverts the menu.
//   2. It must be reachable by somebody on a normal cast, and reachable only
//      if they skipped the room. That gap — bank it or spend it in July — is
//      the choice the entire economy exists to force, and a price nobody can
//      pay deletes the choice just as thoroughly as a price everybody can.
//
// MEASURED, at the Coin's own week (`fromEnd: 5`), on the richest houseguest in
// the house. These are NO-SPENDING UPPER BOUNDS — the runs went through
// `simulateBBSeason`, the headless path, where the theme's arc never booked the
// room, so nobody had bought anything. That is the honest frame for the only
// question the price has to answer, which is what you can afford IF YOU SAVED:
//
//   cast 12 — mean 120, max 136. Nothing on this menu is reachable, ever.
//   cast 16 — mean 203. Buys the Coin outright; buys it after NOTHING else.
//   cast 20 — mean 285. Buys the Coin, or a 50 Derby seat and then the Coin.
//
// Which is the whole design landing: subtract the wheel's 125 and a cast-16
// house is on 78 and a cast-20 house on 160, both short. You get the spin or
// you get the Coin. Cast 12 reaching neither is an ANCHOR problem the room
// already has and documents — the nights are end-anchored onto a nine-week
// season — and not something a price can fix.
//
// 165 is the number those two constraints and those three rows leave. It is a
// DEVIATION FROM CANON and it is written down here as one so the next person to
// read 250 on the wiki does not quietly "fix" it back.
export const COIN_PRICE = 165;

/** The record of who has burned their one buy-in. Created on first touch. */
function seats() {
  if (!gs.bb) gs.bb = {};
  // A plain array of names. It goes through JSON.stringify with the save every
  // week, so no Set lives here however much a membership test wants one — a Set
  // serialises to `{}` and silently forgets the whole season.
  if (!Array.isArray(gs.bb.coinSeats)) gs.bb.coinSeats = [];
  return gs.bb.coinSeats;
}

/** Have they already sat down at this table? One per season, win or lose. */
export function hasBoughtCoin(name) {
  return seats().includes(name);
}

/**
 * How badly they want the week, 0..1.
 *
 * Deliberately NOT the room's `entryNeed`, which measures how exposed you are,
 * because the two products are not the same purchase. The room sells SAFETY —
 * a way off a chair you are already sitting in. The Coin sells the WEEK: the
 * power to put somebody else in that chair, with nobody able to trace the hand
 * that did it.
 *
 * So it reads two things. Being on the block is still a ceiling, because the
 * fastest way off a block is to rewrite it. Underneath that sits the thing the
 * room has no equivalent for: the person you have least use for and cannot
 * otherwise reach. A houseguest safe all season with one enemy they can never
 * get nominated is exactly who this table is for, and the room's need function
 * scores them at nearly zero.
 */
function coinNeed(name, { house = [], nominees = [] } = {}) {
  if (nominees.includes(name)) return 1;
  const others = house.filter(o => o && o !== name);
  if (!others.length) return 0;
  let worst = 0;
  let warmth = 0;
  for (const o of others) {
    let perceived = 0;
    let real = 0;
    try { perceived = getPerceivedBond(name, o); } catch { perceived = 0; }
    try { real = getBond(name, o); } catch { real = 0; }
    worst = Math.max(worst, -perceived);
    warmth += Math.max(0, real);
  }
  warmth /= others.length;
  // Five is a genuinely warm average across a whole house, the same reading
  // `entryNeed` uses, so warmth at or above it reads as somebody nobody is
  // coming for.
  const exposure = clamp(1 - warmth / 5, 0, 1);
  return clamp((worst / 10) * 0.6 + exposure * 0.35, 0, 1);
}

/**
 * Whether they are the sort of person who buys into a coin toss, 0..1.
 *
 * The same reading the room uses, and for the same reason: boldness is most of
 * it, temperament is the rest inverted, and it tilts rather than gates.
 */
function nerveFor(name) {
  const st = pStats(name) || {};
  return clamp(((st.boldness ?? 5) * 0.7 + (10 - (st.temperament ?? 5)) * 0.3) / 10, 0, 1);
}

const BUY_IN = [
  (n, p) => `${n} buys in without pretending to think about it, which tells the room something ${p.sub} cannot take back.`,
  (n, p) => `${n} pays, and does it late, after watching who else did — the last person to commit and the one who learned the most by waiting.`,
  (n, p) => `${n} buys in and spends the next ten minutes explaining why to people who had not asked.`,
  (n, p) => `${n} pays quietly and says nothing about it. Everybody saw anyway; that is the price and it is not refundable.`,
];
const DECLINED = [
  n => `${n} keeps their money and their reputation for not wanting anything, which is worth more to ${n} this week than a coin toss.`,
  (n, p) => `${n} does not buy in. ${p.Sub} ${p.sub === 'they' ? 'are' : 'is'} either safe or pretending to be, and the room will decide which.`,
];
// Walked up, counted, and could not. The most expensive thing on the menu is
// the one most people are watching somebody else buy.
const SHORT = [
  (n, p, price) => `${n} gets as far as the table and counts it out one more time. It is ${price} and ${p.sub} does not have ${p.pos}, and the counting is the part everybody watches.`,
  (n, p, price) => `The buy-in is ${price}. ${n} is short, and being short in front of a room is its own kind of nomination.`,
  (n, p) => `${n} wants this one and cannot pay for it. ${p.Sub} has been paid every week of this season and has nothing to show anybody for it.`,
  (n, p, price) => `${n} does the arithmetic on ${price}, comes up under, and walks back to the sofa with everybody's eyes on the walk.`,
];
// Nobody could pay. The floor's most expensive product, announced to a house
// that spent the money in July.
const EMPTY_FLOOR = [
  (price, n) => `${n === 1 ? 'One houseguest gets' : `${n} houseguests get`} as far as the table and not one of them can make ${price}. The Coin is offered to a house that spent it, and the offer simply expires.`,
  (price) => `The buy-in is ${price} and this house does not have ${price}. The game is announced, the table is set, and nobody sits down at it.`,
  (price) => `Nobody plays. The floor put its most expensive product on the table at ${price} and found out exactly what this season has been doing with its money.`,
];

/**
 * Run the Coin.
 *
 * @returns {object|null} the act, or null when nobody bought in
 */
export function runCoinOfDestiny({ week, house, hoh, nominees = [], price = COIN_PRICE,
  rng = stableRng('coin-of-destiny', gs?.bb?.seasonSalt || 0, week?.num || 0) } = {}) {
  const room = (house || []).filter(Boolean);
  if (room.length < 5) return null;
  const say = makePicker(rng);
  const beats = [];

  // ── WHO WALKS UP, AND ONLY THEN WHETHER THEY CAN PAY ──
  //
  // The order is the room's and it is load-bearing. Willingness is decided
  // first, so a houseguest who wanted the week and could not afford it is a
  // real, visible thing that happened in that house. Filtering the ledger first
  // would delete them and leave a quiet night in place of the loudest fact this
  // season produces about somebody's July.
  //
  // The Head of Household is excluded outright rather than modelled at zero:
  // the only thing on sale is a week they already own.
  const approached = [];
  const declined = [];
  const weeksLeft = Math.max(0, room.length - 3);
  for (const name of room) {
    if (name === hoh) continue;
    if (hasBoughtCoin(name)) continue;          // one seat a season, win or lose
    const need = coinNeed(name, { house: room, nominees });
    // `exposes: true` — buying in is the loudest thing anybody does all week,
    // which is the whole tension of the twist: the purchase is public and only
    // the result is not.
    const pull = spendPull({ need, weeksLeft, nerve: nerveFor(name), exposes: true });
    if (rng() < pull) approached.push({ name, need });
    else declined.push(name);
  }
  if (!approached.length) return null;

  // Whoever wants it most gets there first. With no seat cap this decides only
  // the order of the night, and it is still worth doing: the transcript should
  // open on the nominee who could not wait.
  approached.sort((a, b) => b.need - a.need);

  const buyers = [];
  const short = [];
  for (const { name } of approached) {
    const p = pronouns(name);
    // ── A PRICE OF ZERO IS A SEASON WITH NO CURRENCY, NOT A FREE GAME ──
    //
    // This twist is older than the money and is schedulable on any Big Brother
    // season. Only High Roller's declares an economy, and `week.js` passes the
    // price accordingly — so on every other season the buy-in stays what it has
    // always been: a public decision to play, with nothing to hand over. Gating
    // the twist on the currency instead would have quietly deleted it from
    // every season that is not this one theme.
    if (price > 0 && (!canAfford(name, price) || !spend(name, price))) {
      // `spend` returning false is the ledger's own last word on affordability
      // and is honoured as a closed door. No retry, no partial seat.
      short.push(name);
      beats.push(beat(say(SHORT)(name, p, price), [name], 'CANNOT PAY', 'grey'));
      continue;
    }
    // ── THE MONEY LEAVES HERE ──
    //
    // Before the game runs, and never refunded. Lose the game, or win it and
    // call the toss wrong, and the price is gone exactly the same.
    seats().push(name);
    buyers.push(name);
  }

  if (!buyers.length) {
    // The floor opened and nobody could sit down. A real event, and on this
    // theme the most loaded one available — so it is transcribed rather than
    // swallowed. `winner: null` is the flag every writer branches on.
    beats.push(beat(say(EMPTY_FLOOR)(price, short.length), short.slice(0, 3),
      'NOBODY COULD PAY', 'grey'));
    return {
      type: 'coin-of-destiny', week: week?.num || 0, secret: true, price,
      buyers: [], short: [...short], declined: [...declined], winner: null,
      calledRight: false, dethroned: null, nominees: [], hoh: hoh || null, beats,
    };
  }

  for (const name of buyers.slice(0, 4)) {
    beats.push(beat(say(BUY_IN)(name, pronouns(name)), [name], 'BOUGHT IN', 'gold'));
  }
  if (declined.length) {
    const who = declined[0];
    beats.push(beat(say(DECLINED)(who, pronouns(who)), [who], 'KEPT OUT OF IT', 'grey'));
  }

  // ── the game ──
  const scores = buyers.map(name => ({
    name,
    score: aptitude(name, COIN_MIX) + (rng() - 0.5) * 5.6,
  })).sort((a, b) => b.score - a.score);
  const winner = scores[0].name;
  beats.push(beat(
    `They go through one at a time, alone, and ${winner} comes out of it holding the coin. The house is `
      + 'not told that, and will not be told it later — the only thing the room saw for certain was who '
      + 'was willing to pay.',
    [winner], 'HOLDS THE COIN', 'gold'));

  // ── the call ──
  //
  // Fifty-fifty and nothing else. No stat, no read, no advantage — which is
  // what makes buying in a gamble rather than a purchase.
  const calledRight = rng() < 0.5;
  const act = {
    type: 'coin-of-destiny', week: week?.num || 0, secret: true, price,
    buyers: [...buyers], short: [...short], declined: [...declined], winner,
    calledRight, dethroned: calledRight ? (hoh || null) : null,
    nominees: [], hoh: hoh || null, beats,
  };
  if (!calledRight) {
    beats.push(beat(
      `${winner} calls it, and calls it wrong. ${pronouns(winner).Sub} ${pronouns(winner).sub === 'they' ? 'have' : 'has'} `
        + 'paid, played and lost, and the only thing the house will ever know for certain is that '
        + `${winner} wanted it badly enough to try.`,
      [winner], 'CALLED IT WRONG', 'red'));
  }
  return act;
}

/**
 * The nominations the coin's winner makes instead.
 *
 * Reads their own game rather than the Head of Household's, and cannot seat
 * the HOH — a dethroned Head of Household is still safe, which is the rule
 * that stops this being an execution.
 */
export function coinNominations({ act, house, hoh, untouchable = [],
  rng = stableRng('coin-noms', gs?.bb?.seasonSalt || 0, act?.week || 0) }) {
  if (!act?.calledRight || !act.winner) return null;
  const bond = (a, b) => { try { return getPerceivedBond(a, b); } catch { return 0; } };
  const blocked = [hoh, act.winner, ...untouchable].filter(Boolean);
  const pool = (house || []).filter(n => !blocked.includes(n));
  if (pool.length < 2) return null;
  // Whoever the winner has least use for, with enough noise that a season of
  // coins does not nominate the same two people every time.
  const named = [...pool]
    .sort((a, b) => (bond(act.winner, a) + rng() * 2.2) - (bond(act.winner, b) + rng() * 2.2))
    .slice(0, 2);
  act.nominees = [...named];
  act.beats.push(beat(
    `The keys turn and they are not the keys ${hoh} chose. ${named.join(' and ')} are nominated, `
      + `and ${hoh} finds out with everybody else — including the part where nobody will say who did it.`,
    named, 'THE BLOCK IS REWRITTEN', 'red'));
  return named;
}
