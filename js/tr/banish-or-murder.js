// ══════════════════════════════════════════════════════════════════════
// js/tr/banish-or-murder.js — the deal at the dinner
// ══════════════════════════════════════════════════════════════════════
//
// THE RULE, OFF THE WIKI (thetraitors.fandom.com/wiki/Banishment) RATHER THAN
// OFF MEMORY:
//
//   "Some versions offer the players a deal at the Dinner Party, where they
//    may vote to EITHER banish a player or have the Traitors murder a player
//    as normal. Banishment this time comes with a catch: the banishment will
//    award the players money if they correctly banish a Traitor, and deduct
//    the same amount if they banish a Faithful. Additionally, the vote for
//    Banishment must be unanimous — if one player votes to murder, no
//    banishment is held."
//
// Three things make it the best twist in the catalogue and all three are in
// that paragraph:
//
//   1. THE VOTE IS PUBLIC. Everything else in this format is a secret ballot
//      or a private room. Here everybody watches everybody choose.
//   2. ONE VOICE IS ENOUGH. A Traitor can stop the banishment single-handed —
//      and be the person who stopped it, in front of the room.
//   3. THE MONEY CUTS BOTH WAYS. A room that is sure of itself is being
//      offered a prize; a room that is guessing is being offered a bill.
//
// So the Traitor's choice is not "do I want a banishment" (they never do). It
// is "is tonight's banishment worse for me than being seen to prevent it" —
// which is only true when the room is about to take one of the pact. That is
// the rule the vote below implements, and it is why a pact mostly votes to
// banish: standing up for the murder when the table was going to miss anyway
// is the most expensive thing a Traitor can do with an evening.
//
// ── WHAT A REFUSED DEAL DOES TO THE NIGHT ────────────────────────────
//
// No banishment is held. That is a night this engine had never produced —
// `runRoundTable` banishes somebody every time it is called — so the refusal
// path does not call it at all, and the round it records has `banished: null`.
// Every reader of `gs.tr.rounds` that could not survive that was checked
// before this shipped; the ones that already filtered on truthiness
// (`peopleLost`, `murderCount`, `ballotEvidence`, which reads ballots and a
// refused night has none) needed nothing.
import { gs } from '../core.js';
import { pStats } from '../players.js';
import { getBond } from '../bonds.js';
import { alignmentAt, alignmentFactId } from './roles.js';
import { learn } from '../knowledge.js';
import { suspicionBoard } from './deduction.js';
import { _lineHash } from './castle/lines.js';

// The same hashed-not-drawn rule the murder catalogue uses, and the same
// one-line implementation (js/tr/murder-variants.js).
const hash01 = key => _lineHash(key) / 4294967296;

/**
 * WHAT THE BANISHMENT IS WORTH TONIGHT, and it is the same number either way.
 *
 * A share of the ceiling rather than a constant, so the stake reads the same
 * on a long season as on a short one: at the standard ceiling this is a little
 * over a mission's worth of money, which is the weight the show gives it.
 */
export const STAKE_SHARE = 0.08;
export function stakeFor() {
  return Math.round(((gs.tr?.potCeiling || 0) * STAKE_SHARE) / 500) * 500;
}

/** The price the room puts on having watched somebody vote for the murder. */
export const VOTED_FOR_THE_MURDER = 0.5;

let _schedule = null;
/** Pin the episodes this runs on. Null means the hashed choice below. */
export function _setBanishOrMurderSchedule(eps) {
  _schedule = Array.isArray(eps) ? [...eps] : null;
}

/**
 * Is tonight the dinner?
 *
 * ONE NIGHT A SEASON, mid-run: early enough that the room still has people to
 * be wrong about, late enough that it has reasons. Hashed off the season seed
 * rather than drawn, for `pickVariant`'s reason — a twist that consumes an rng
 * draw on the nights it does not fire re-rolls every season downstream of it.
 */
export function banishOrMurderTonight(ep) {
  if (!gs.tr?.banishOrMurder) return false;
  // A PIN OVERRIDES THE CHOICE OF NIGHT AND NOT THE SIZE OF THE ROOM. The
  // size window below is not a taste; it is what makes the vote mean anything
  // (see it). Asking seventeen people to be unanimous is asking nobody
  // anything, and a pinned night that did it would hand an author a twist
  // whose refusals are Faithful noise — measured at a refusal rate BELOW the
  // room's own Traitor share, which is the signal pointing backwards.
  if (_schedule) return _schedule.includes(ep) && _roomFits();
  // A ROOM SMALL ENOUGH FOR UNANIMITY TO MEAN SOMETHING. Seventeen people
  // asked to agree on anything agree on nothing, and at that size the deal is
  // refused by arithmetic rather than by anybody's decision — measured at 31
  // refusals in 35 before this gate existed. The show runs it at a dinner
  // party, late, with the table already short.
  if (ep < 4 || !_roomFits()) return false;
  // Once, and the first eligible night that the hash picks out of five.
  if ((gs.tr.rounds || []).some(r => r.banishOrMurder)) return false;
  return hash01(`bom|${ep}|${[...(gs.activePlayers || [])].sort().join(',')}`) < 0.22;
}

function _roomFits() {
  const living = (gs.activePlayers || []).length;
  return living >= 6 && living <= 13;
}

/**
 * How sure this player is of their own top read, 0-1.
 *
 * The board is a private thing and this is the only thing the vote takes off
 * it: not WHO, only HOW SURE. A room that is sure of itself takes the money.
 */
function _confidence(voter, ep) {
  const living = gs.activePlayers || [];
  const board = suspicionBoard(voter, ep, living.filter(n => n !== voter));
  const top = board[0];
  return Math.max(0, Math.min(1, (top?.score || 0) * 1.6));
}

/**
 * Who the room is about to take, as far as this Traitor can tell.
 *
 * Read off the pact's own view of the table rather than off any oracle: a
 * Traitor watching the debate can see who is being named, and that is what
 * decides whether tonight's banishment is worth breaking cover over.
 */
function _roomsLikelyName(ep) {
  const living = gs.activePlayers || [];
  const counts = {};
  for (const a of (gs.tr?._tableAccusations || [])) {
    if (a?.target) counts[a.target] = (counts[a.target] || 0) + 1;
  }
  let best = null;
  for (const n of living) if (!best || (counts[n] || 0) > (counts[best] || 0)) best = n;
  return (counts[best] || 0) > 0 ? best : null;
}

/**
 * One player's vote: `'banish'` or `'murder'`, and the reason on the record.
 *
 * FAITHFULS ARE DECIDING WHETHER THEY TRUST THEMSELVES. Confidence in their
 * own read is most of it; nerve is some of it; and a pot with a lot in it
 * makes a wrong guess cost more than it did an hour ago, which is exactly the
 * hesitation the show gets out of the deal.
 *
 * TRAITORS ARE DECIDING WHETHER TO BE SEEN. They want the murder every night
 * of the week, and on most of those nights they vote to banish anyway, because
 * the table was going to take a Faithful and being the one who stopped it is
 * worth more to the room than the banishment was worth to the pact.
 */
export function choose(voter, ep, rng = Math.random) {
  const st = pStats(voter);
  const traitor = alignmentAt(voter, ep) === 'traitor';
  if (!traitor) {
    // THE BASE RATE IS NEARLY ONE, and that is the twist rather than a tuning
    // choice. A room offered money to do the thing it came here to do says yes;
    // what the show gets out of the deal is the ONE person who does not, and a
    // Faithful only becomes that person when they know they are guessing and
    // there is a lot of money on the table to lose.
    const pot = (gs.tr?.pot || 0) / Math.max(1, gs.tr?.potCeiling || 1);
    const p = 0.985 + _confidence(voter, ep) * 0.012 + ((st.boldness || 5) - 5) / 400
      - pot * 0.04;
    return rng() < Math.max(0.93, Math.min(0.997, p))
      ? { vote: 'banish', why: 'backs the room to get it right' }
      : { vote: 'murder', why: 'will not gamble the pot on a guess' };
  }
  // THE PACT. `exposed` is the fellow (or the voter) the room is about to
  // take; without one, a murder vote buys the pact nothing and costs the voter
  // everything.
  // AT RISK IS TWO THINGS, and the second one is the panic. The room being
  // about to take a Traitor is the obvious case; being NAMED at this table,
  // more than once, is the one that actually drives it — a Traitor who has
  // been accused twice tonight is not going to sit through a banishment and
  // find out. Without it the refusals were measured at 21% Traitor against a
  // room of 29%: a tell pointing backwards, because the only people refusing
  // were nervous Faithfuls.
  const name = _roomsLikelyName(ep);
  const accusers = (gs.tr?._tableAccusations || [])
    .filter(a => a && a.target === voter).length;
  const atRisk = (!!name && (name === voter || alignmentAt(name, ep) === 'traitor'))
    || accusers >= 2;
  if (!atRisk) {
    return { vote: 'banish', why: 'has nothing to lose at this table tonight' };
  }
  // Their own skin is worth more than a fellow's, and a fellow they like is
  // worth more than one they do not.
  const mine = name === voter || accusers >= 2;
  const stake = mine ? 1 : 0.45 + Math.max(0, getBond(voter, name)) / 20;
  const nerve = ((st.boldness || 5) / 10) * 0.5 + ((st.strategic || 5) / 10) * 0.3;
  const p = Math.max(0.05, Math.min(0.95, stake * (0.45 + nerve * 0.5)));
  return rng() < p
    ? { vote: 'murder', why: mine ? 'is the name at this table' : 'will not watch that one go' }
    : { vote: 'banish', why: 'would rather be seen agreeing' };
}

/**
 * The deal, taken or refused.
 *
 * Returns the record the night is built on: `{ ballots, unanimous, stake }`.
 * NOTHING IS DECIDED HERE — headless.js reads `unanimous` and either runs the
 * table with money on it or skips the table and lets the pact work.
 */
export function runTheDeal(ep, rng = Math.random) {
  const living = [...(gs.activePlayers || [])];
  const ballots = living.map(voter => ({ voter, ...choose(voter, ep, rng) }));
  const refusers = ballots.filter(b => b.vote === 'murder').map(b => b.voter);
  return {
    ep,
    ballots,
    refusers,
    unanimous: refusers.length === 0,
    stake: stakeFor(),
  };
}

/**
 * EVIDENCE SOURCE: who the room watched refuse.
 *
 * The only public, unambiguous, everybody-saw-it act in the format, and priced
 * accordingly — level with the strongest channel the murder catalogue has.
 * It is still not proof, and deliberately so: a Faithful who would not gamble
 * the pot on a guess raised their hand for exactly the same thing, and the
 * room cannot tell those two apart. That is the whole scene.
 */
export function refusalEvidence(deal, ep, rng = Math.random) {
  const formed = [];
  if (!deal || !deal.refusers?.length) return formed;
  const living = gs.activePlayers || [];
  for (const subject of deal.refusers) {
    if (!living.includes(subject)) continue;
    for (const observer of living) {
      if (observer === subject) continue;
      const belief = learn(observer, alignmentFactId(subject), {
        source: 'voted to let the murder happen rather than banish anybody',
        sourceType: 'deduced', confidence: VOTED_FOR_THE_MURDER, ep, rng,
      });
      if (belief) formed.push({ observer, subject, ep, kind: 'refused-the-deal' });
    }
  }
  return formed;
}

/**
 * The money, applied after the table has banished somebody.
 *
 * MAY NOT TAKE THE POT BELOW ZERO — the same floor `payPot` keeps for the
 * missions (js/tr/missions/contract.js). A room that is broke cannot be fined.
 */
export function settleTheStake(deal, banished, wasTraitor) {
  if (!gs.tr || !deal?.unanimous) return null;
  const before = gs.tr.pot || 0;
  const delta = wasTraitor ? deal.stake : -Math.min(deal.stake, before);
  gs.tr.pot = Math.max(0, Math.min(gs.tr.potCeiling ?? Infinity, before + delta));
  return { banished, wasTraitor, delta, potBefore: before, potAfter: gs.tr.pot };
}
