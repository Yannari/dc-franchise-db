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
import { getPerceivedBond } from '../bonds.js';
import { aptitude, makePicker, clamp } from '../bb-comps/_shared.js';

const beat = (text, players, badgeText, badgeClass = 'gold') =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass });

/** What the game of skill asks for. Not the same shape as an HOH comp. */
const COIN_MIX = { mental: 0.34, physical: 0.24, temperament: 0.22, intuition: 0.20 };

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

/**
 * Run the Coin.
 *
 * @returns {object|null} the act, or null when nobody bought in
 */
export function runCoinOfDestiny({ week, house, hoh, nominees = [], rng = Math.random } = {}) {
  const room = (house || []).filter(Boolean);
  if (room.length < 5) return null;
  const say = makePicker(rng);
  const beats = [];

  // ── who pays ──
  //
  // Buying in is an announcement, so the people who do it are the people who
  // cannot afford not to: the block, the exposed, and the bold. A comfortable
  // houseguest keeps their name off the list.
  const buyers = [];
  const declined = [];
  for (const name of room) {
    if (name === hoh) continue;                 // the HOH has the week already
    const st = pStats(name);
    const onBlock = nominees.includes(name);
    const pull = 0.16 + (st.boldness || 5) * 0.035 + (onBlock ? 0.42 : 0)
      - (st.temperament || 5) * 0.012;
    if (rng() < clamp(pull, 0.05, 0.9)) buyers.push(name);
    else declined.push(name);
  }
  if (!buyers.length) return null;

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
    type: 'coin-of-destiny', week: week?.num || 0, secret: true,
    buyers: [...buyers], declined: [...declined], winner,
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
export function coinNominations({ act, house, hoh, untouchable = [], rng = Math.random }) {
  if (!act?.calledRight) return null;
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
