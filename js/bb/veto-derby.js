// ══════════════════════════════════════════════════════════════════════
// bb/veto-derby.js — buy a slot on Sunday, spend it on Tuesday
// ══════════════════════════════════════════════════════════════════════
//
// BB23's cheapest room game, and the only one that pays out in somebody else's
// competition. The wiki:
//
//   "For 50 BB Bucks, houseguests can play in the Veto Derby. If they received
//    a score higher than 0 and landed in the top six, they would be able to bet
//    on one of the six Veto players. If the person they bet on ended up winning
//    the PoV Competition, they would earn a second Veto for themselves."
//
// ── WHY IT IS TWO STAGES HERE ─────────────────────────────────────────
//
// You bet on ONE OF THE SIX VETO PLAYERS, and in this engine the six do not
// exist when the room opens: the door is in the hallway on nomination night and
// the draw happens later in the week. So a seat buys a SLOT, and the slot is
// spent at the draw once there is something to bet on. Same rule, two nights,
// and the wait is better drama than the shortcut would have been — you pay
// before you know who you will be allowed to back.
//
// ── WHAT MAKES IT DIFFERENT FROM THE OTHER TWO GAMES ──────────────────
//
// The Roulette has at most one winner. The Derby has up to SIX, which is the
// wiki's own distinction ("higher than 0 AND in the top six") and the reason
// these two resolve differently rather than sharing an engine. And the Derby is
// the only game whose payoff is decided by somebody else: you can play it
// perfectly, back the strongest player in the draw, and get nothing because
// they lost a competition you were not in.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getPerceivedBond } from '../bonds.js';
import { stableRng } from './knowledge.js';

/** How many slots the board pays out. Canon: the top six. */
export const DERBY_SLOTS = 6;

const beat = (text, players, badgeText, badgeClass = 'gold') =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass });

const pick = (pool, rng) => pool[Math.floor(rng() * pool.length)];

const GUESSED = [
  (n, s) => `${n} writes a number down without letting anybody see it, and lands on ${s}.`,
  (n, s) => `${n} takes a long look at the board and commits to ${s}.`,
  (n, s) => `${n} does not agonise over it. ${s}, written fast, and the pen put down.`,
  (n, s) => `${n} counts something out under ${pronouns(n).posAdj} breath and settles on ${s}.`,
];
const SLOT = [
  (n) => `${n} is inside the top six, which buys the only thing this game sells: a name to back on Tuesday.`,
  (n) => `${n} makes the board. The slot is theirs, and it is worth exactly nothing until the draw.`,
  (n) => `${n} finishes high enough. Now ${pronouns(n).sub} just ${pronouns(n).sub === 'they' ? 'have' : 'has'} to pick the right person out of six.`,
  (n) => `${n} takes a slot. Somebody else's competition is about to be the most interesting thing in ${pronouns(n).posAdj} week.`,
];
const MISSED = [
  (n) => `${n} is outside the six. Fifty gone, and nothing to show anybody for it.`,
  (n) => `${n} does not make the board, which is the risk that was painted on the door.`,
  (n) => `${n} scores, and it is not enough. The floor keeps the fifty and the disappointment is free.`,
  (n) => `${n} misses the cut by a place ${pronouns(n).sub} will be told about later, at length.`,
];
const ZEROED = [
  (n) => `${n} scores nothing at all. Not last — nothing, which the board does not even rank.`,
  (n) => `${n} manages a zero, and there is no version of a zero that buys a slot.`,
  (n) => `The board gives ${n} nothing. Fifty for the experience of standing at it.`,
  (n) => `${n} comes away with a zero and the particular silence that follows one.`,
];
const BACKED = [
  (a, b) => `${a} backs ${b}, and does not explain why to anybody who asks.`,
  (a, b) => `${a}'s slip says ${b}. It is a read, a hope and fifty already spent.`,
  (a, b) => `${a} puts ${pronouns(a).posAdj} slot on ${b} and settles in to watch a competition ${pronouns(a).sub} cannot play.`,
  (a, b) => `${b} is the name ${a} wrote. ${b} has no idea, and will not be told.`,
];
const CASHED = [
  (a, b) => `${b} wins the veto, and ${a} — who backed ${b} two days ago — is holding one too.`,
  (a, b) => `${a} bet on ${b} and ${b} delivered. There are two vetoes in this house tonight.`,
  (a, b) => `${a} watched ${b} win and did not celebrate, which is how everybody will later work out what ${a} had.`,
  (a, b) => `${b} took the veto. ${a} took a veto with ${pronouns(b).obj}, without playing a single round.`,
];
const TORN = [
  (a, b) => `${a} backed ${b} and ${b} lost. The slip is worth nothing and the fifty is long gone.`,
  (a, b) => `${b} was ${a}'s pick and ${b} did not win it. That is the whole game, and it is over.`,
  (a, b) => `${a} tears the slip up small, which tells the room ${pronouns(a).sub} had one.`,
  (a, b) => `The wrong name. ${a} had ${b}, the veto went elsewhere, and nobody owes ${a} anything.`,
];

/**
 * The board: an "as close as you can" guess, scored on how close you got.
 *
 * A FIELD GAME — everybody who paid plays at once and the top six earn a slot,
 * which cannot be decided one entrant at a time. `resolvesField` tells the room
 * to call this once with the whole seated field.
 *
 * A ZERO IS REACHABLE AND MUST BE. The wiki's rule is "higher than 0 and in the
 * top six", which is two separate ways to buy nothing: miss the cut, or miss
 * the board entirely. On a field of three, two people can still walk away with
 * nothing at all.
 */
export function runDerby({ entrants = [], rng, week, game } = {}) {
  const field = entrants.filter(Boolean);
  const results = {};
  const beats = [];
  if (!field.length) return { results, beats };
  const draw = rng || stableRng('veto-derby', gs?.bb?.seasonSalt || 0, week?.num || 0);

  // The number nobody can see. Guessing near it is the whole competition.
  const target = 20 + Math.floor(draw() * 60);

  const scored = field.map(name => {
    const st = pStats(name);
    // Reading a board is mental with a little nerve in it; the noise is what
    // makes it a competition rather than a stat lookup.
    const read = ((st.mental || 5) * 0.6 + (st.intuition || 5) * 0.4) / 10;   // 0..1
    // WIDE ENOUGH THAT A ZERO IS REACHABLE, which took a test to notice.
    // Scoring is `100 - error * 2.2`, so a zero needs an error of 46 or more.
    // The first version spread a poor reader by ±23 at worst, which put the
    // floor at a score of about 49 — nobody could ever score nothing, and the
    // canon rule "higher than 0 AND in the top six" was two rules of which one
    // could not fire. A bad reader can now miss the board entirely.
    const spread = 58 * (1 - read) + 8;
    const guess = Math.max(0, Math.round(target + (draw() - 0.5) * 2 * spread));
    // Falls off FAST, which is what "as close as you can" means and what makes
    // a zero reachable: at 3.2 a point, missing by 32 scores nothing at all.
    // A gentler curve put the worst plausible miss at a score of about 19 and
    // no houseguest could ever score zero, which quietly turned canon's "higher
    // than 0 AND in the top six" into one rule wearing two hats.
    const score = Math.max(0, 100 - Math.abs(guess - target) * 3.2);
    return { name, guess, score: Math.round(score) };
  }).sort((a, b) => b.score - a.score);

  const winners = scored.filter(s => s.score > 0).slice(0, DERBY_SLOTS);
  const slotted = new Set(winners.map(w => w.name));

  for (const s of scored) {
    beats.push(beat(pick(GUESSED, draw)(s.name, s.guess), [s.name], 'AT THE BOARD', 'blue'));
  }
  for (const s of scored) {
    const won = slotted.has(s.name);
    results[s.name] = { won, removed: null, replacement: null, score: s.score };
    beats.push(won
      ? beat(pick(SLOT, draw)(s.name), [s.name], 'TAKES A SLOT', 'gold')
      : beat(pick(s.score > 0 ? MISSED : ZEROED, draw)(s.name), [s.name],
        s.score > 0 ? 'OUTSIDE THE SIX' : 'SCORED NOTHING', 'grey'));
  }

  return { target, results, beats };
}
// The room calls this once with the whole field rather than once per entrant.
runDerby.resolvesField = true;

/**
 * Who holds an unspent slot this week.
 *
 * Read straight off the room's own act rather than kept as a second copy on
 * `gs`: the room already records who paid for what and who won, the act is
 * plain JSON that survives a save, and one source of truth cannot drift from
 * itself.
 */
export function derbySlotHolders(week) {
  return ((week?.highRollers?.entries) || [])
    .filter(e => e && e.gameId === 'veto-derby' && e.won)
    .map(e => e.name);
}

/**
 * The bet, placed once the six are drawn.
 *
 * A READ, NOT AN ORACLE. Who somebody backs comes from what they believe about
 * the six in front of them — who they rate, who they are close to — never from
 * the result, which has not happened. `resolveDerbyBets` is the only function
 * here that ever learns who won, and it runs afterwards.
 *
 * @returns {object|null} the act, or null when nobody holds a slot
 */
export function placeDerbyBets({ week, slots = [], vetoPlayers = [], rng } = {}) {
  const holders = slots.filter(Boolean);
  const six = vetoPlayers.filter(Boolean);
  if (!holders.length || six.length < 2) return null;
  const draw = rng || stableRng('derby-bet', gs?.bb?.seasonSalt || 0, week?.num || 0);

  const bets = [];
  const beats = [];
  for (const name of holders) {
    const st = pStats(name);
    const sharp = ((st.intuition || 5) + (st.mental || 5)) / 20;
    let best = null;
    let bestScore = -Infinity;
    for (const player of six) {
      const ps = pStats(player);
      // How likely they look to win it, as this houseguest reads them...
      const form = ((ps.mental || 5) + (ps.physical || 5) + (ps.endurance || 5)) / 3;
      // ...and how much they would like that person holding it, which is a
      // real part of who you back when the prize is somebody else's power.
      const want = player === name ? 3 : getPerceivedBond(name, player) * 0.35;
      const seen = form * (0.4 + sharp * 0.8) + want + (draw() - 0.5) * (12 * (1 - sharp) + 3);
      if (seen > bestScore) { bestScore = seen; best = player; }
    }
    if (!best) continue;
    bets.push({ name, on: best });
    beats.push(beat(pick(BACKED, draw)(name, best), [name, best], 'BACKS A PLAYER', 'gold'));
  }
  if (!bets.length) return null;

  return {
    type: 'derby-bet', week: week?.num || 0, secret: false,
    players: [...six], bets, settled: false, beats,
  };
}

/**
 * Settle the slips once the veto competition has a winner.
 *
 * Returns its OWN act, pushed after the competition — the same rule the side
 * bet had to learn: written back into the placement act, the result appears on
 * a screen drawn before the event that decided it.
 */
export function resolveDerbyBets(act, vetoWinner, { rng } = {}) {
  if (!act || act.settled || !vetoWinner) return null;
  const draw = rng || stableRng('derby-bet-settle', gs?.bb?.seasonSalt || 0, act.week || 0);
  const settlement = {
    type: 'derby-bet-settled', week: act.week, secret: false,
    vetoWinner, results: [], holders: [], beats: [],
  };

  for (const b of act.bets || []) {
    const won = b.on === vetoWinner;
    settlement.results.push({ name: b.name, on: b.on, won });
    if (won) settlement.holders.push(b.name);
    settlement.beats.push(beat(pick(won ? CASHED : TORN, draw)(b.name, b.on),
      [b.name, b.on], won ? 'A SECOND VETO' : 'THE WRONG NAME', won ? 'gold' : 'grey'));
  }

  act.settled = true;
  return settlement;
}
