// ══════════════════════════════════════════════════════════════════════
// bb/hacker.js — three anonymous authorities, three separate decisions
// ══════════════════════════════════════════════════════════════════════
//
// BB20's Hacker Competition. Everybody plays it alone, only the winner is
// told they won, and the winner is never named to the house. What they get is
// not one power but THREE, each of them optional, each of them exercised on a
// different night and each of them recorded separately:
//
//   1. hack the block   take one nominee down, name a replacement
//   2. hack the draw    put one houseguest into the veto competition
//   3. hack the vote    nullify one ballot before the count
//
// The rule that is easy to get wrong from memory, and that the wiki settles:
// the nominee the hacker takes down is NOT safe. They are a legal replacement
// at the veto ceremony three days later, and the only thing that saves them is
// the veto itself. The reprieve is temporary, which is why taking somebody down
// is a decision rather than a gift.
//
// Everything in this file is a DECISION — what a holder does with an authority
// they can also decline to use. The week engine owns the consequences; this
// owns the reasoning, and every function returns its reasoning as text so the
// screen, the transcript and the debug panel all quote the same sentence.
//
// The cost that shapes all three: EXPOSURE. Nobody knows who the hacker is,
// but everybody can see what the hack DID, and a hack that visibly serves one
// person is that person's signature on it. So each decision prices the move
// against how loudly it points home, scaled by how sharp the room is. A
// mastermind in a house of readers holds power that a mastermind in a house of
// sleepwalkers would spend.
import { gs } from '../core.js';
import { pStats } from '../players.js';
import { getPerceivedBond } from '../bonds.js';
import { chooseReplacement, explainReplacement } from './strategy.js';
import { getBBTarget } from './shared-strategy.js';

const _bond = (a, b) => { try { return getPerceivedBond(a, b); } catch { return 0; } };
const _stats = name => { try { return pStats(name); } catch { return {}; } };
const _target = name => { try { return getBBTarget(name); } catch { return null; } };

/**
 * How sharp this room is at reading a move — the multiplier on exposure.
 *
 * A hack lands in front of everybody. Whether it points at its author depends
 * on who is watching, so the house's own intuition is the price of using one.
 */
function roomSharpness(house = []) {
  const pool = house.filter(Boolean);
  if (!pool.length) return 1;
  const avg = pool.reduce((sum, n) => sum + (_stats(n).intuition || 5), 0) / pool.length;
  return Math.max(0.4, Math.min(1.8, avg / 5));
}

// ── 1. hack the block ─────────────────────────────────────────────────
/**
 * Whether the hacker rewrites the Head of Household's block, and how.
 *
 * Sitting on the block yourself is not a dilemma — it is the reason to want
 * this — so a nominated hacker takes themselves down essentially always, which
 * is what the canonical holders did. Everything else is proportional: an ally
 * in a chair is worth what the hacker thinks that ally is worth, a seatable
 * target is worth what the hacker's own strategy says it is, and both are
 * charged the exposure of a move with an obvious beneficiary.
 *
 * @returns {{use:boolean, down:string|null, up:string|null, why:string,
 *   reason:object}}
 */
export function chooseHackerBlockHack({ hacker, nominees = [], house = [], hoh, plan, rng, protectedNames = [] }) {
  const rand = typeof rng === 'function' ? rng : Math.random;
  const st = _stats(hacker);
  const sharp = roomSharpness(house);
  const myTarget = _target(hacker);
  const reason = { selfSave: false, ally: null, allyWorth: 0, targetSeatable: false, exposure: 0, pull: 0 };

  // The Head of Household won it. Everybody plays this competition — the wiki
  // is explicit that every houseguest competes — so an HOH holding the hack is
  // legal and does happen, and it is the ONE holder for whom the first
  // authority is worthless: this is their own block, made three days ago, out
  // of their own plan. Anonymously undoing it buys them nothing and hands the
  // house a mystery whose only honest answer is a person the house has already
  // ruled out, which is exactly how somebody ended up being accused of hacking
  // their own nominations. They keep the other two authorities, which are
  // about the veto field and the count and are worth having.
  if (hacker && hoh && hacker === hoh) {
    return { down: null, up: null, used: false, reason: { ...reason, ownBlock: true },
      why: `${hacker} is holding a power whose first use would be undoing ${hacker}'s own nominations. `
        + 'The block stands, because it is already the block they wanted.' };
  }

  let down = null;
  if (nominees.includes(hacker)) {
    down = hacker;
    reason.selfSave = true;
    reason.pull = 1;
  } else {
    const ally = [...nominees].sort((a, b) => _bond(hacker, b) - _bond(hacker, a))[0] || null;
    const allyWorth = Math.max(0, _bond(hacker, ally)) * 0.075;
    const targetSeatable = !!myTarget && myTarget !== hoh && myTarget !== hacker
      && !nominees.includes(myTarget) && house.includes(myTarget);
    // Pulling a close friend down in a sharp room is the loudest thing this
    // power can do: the house asks who benefits, and the answer is standing
    // next to the person who came off the block.
    const exposure = 0.045 * sharp * (Math.max(0, _bond(hacker, ally)) >= 4 ? 1 : 0.35)
      * Math.max(0.5, (10 - (st.boldness || 5)) / 5);
    const pull = allyWorth
      + (targetSeatable ? (st.strategic || 5) * 0.032 : 0)
      - exposure;
    Object.assign(reason, { ally, allyWorth, targetSeatable, exposure, pull });
    if (rand() < Math.min(0.8, pull)) down = ally;
  }
  if (!down) {
    return { use: false, down: null, up: null,
      why: `The hacker looks at the block, decides it is already pointing where they want it pointed, and leaves it alone. An unused hack is a hack nobody can trace.`,
      reason };
  }

  // Whoever goes up instead is chosen from the hacker's OWN read, not the
  // week's nomination plan — the whole point of an anonymous authority is that
  // it answers to somebody else's game.
  const blocked = [...new Set([hoh, hacker, down, ...nominees.filter(n => n !== down),
    ...protectedNames].filter(Boolean))];
  const chooserPlan = { target: myTarget || null, pawn: null, backdoorTarget: myTarget || null };
  let up = chooseReplacement(hacker, house, blocked, chooserPlan, rand);
  if (!up || !house.includes(up) || blocked.includes(up)) {
    up = house.find(n => !blocked.includes(n)) || null;
  }
  if (!up) {
    return { use: false, down: null, up: null,
      why: `There is nobody left the hacker is allowed to seat — the Head of Household, the block and the hacker account for the whole house — so the block stands.`,
      reason: { ...reason, blocked: true } };
  }
  let why = '';
  try {
    why = explainReplacement(hacker, up, house.filter(n => !blocked.includes(n)), chooserPlan, nominees);
  } catch { why = ''; }
  return {
    use: true, down, up, reason,
    why: why || (reason.selfSave
      ? `The hacker was sitting in one of those chairs and is not any more. ${up} is.`
      : `The hacker takes ${down} down and seats ${up} instead.`),
  };
}

// ── 2. hack the draw ──────────────────────────────────────────────────
/**
 * Who the hacker walks into the veto competition.
 *
 * The house SEES this one happen — a name is read out that nobody drew a chip
 * for — so it is the loudest of the three and the only one that arrives with a
 * witness list. Putting yourself in is the strongest play and the biggest tell,
 * which is exactly the trade a bold strategist takes and a careful one does not.
 *
 * The pick consumes a seat rather than adding one, so the competition is the
 * same size it always was.
 *
 * @returns {{pick:string|null, self:boolean, why:string, reason:object}}
 */
export function chooseHackerVetoHack({ hacker, house = [], playing = [], nominees = [], hoh, rng }) {
  const rand = typeof rng === 'function' ? rng : Math.random;
  const st = _stats(hacker);
  const sharp = roomSharpness(house);
  const eligible = house.filter(n => n && !playing.includes(n));
  if (!eligible.length) {
    return { pick: null, self: false, reason: { empty: true },
      why: 'Everybody eligible is already playing, so there is no seat for the hacker to fill.' };
  }

  // Self-interest first: a hacker who is on the block, or who wants the
  // medallion in their own hands, puts themselves in and pays for it in
  // visibility.
  const wantsIn = eligible.includes(hacker);
  const selfPull = wantsIn
    ? (nominees.includes(hacker) ? 0.9 : 0.18 + (st.boldness || 5) * 0.035) - 0.06 * sharp
    : 0;
  if (wantsIn && rand() < Math.min(0.92, selfPull)) {
    return { pick: hacker, self: true, reason: { selfPull, sharp },
      why: `The hacker puts themselves in the veto competition — a name in that draw that no chip accounts for, and the whole house watching it happen.` };
  }

  // Otherwise: whoever they most want holding the veto. Perceived bond, because
  // a hacker can absolutely pick somebody they are wrong about.
  const wanted = [...eligible].sort((a, b) => _bond(hacker, b) - _bond(hacker, a))[0];
  if (!wanted) return { pick: null, self: false, reason: {}, why: '' };
  const trust = _bond(hacker, wanted);
  // Spending it on somebody you are not sure of is worse than not spending it.
  if (trust < 1 && rand() < Math.min(0.7, (st.strategic || 5) * 0.07)) {
    return { pick: null, self: false, reason: { trust, held: true },
      why: `There is nobody in that house the hacker trusts to come back with the medallion, so the seat is left to the draw.` };
  }
  return { pick: wanted, self: false, reason: { trust },
    why: `The hacker walks ${wanted} into the veto competition — the person they believe is most likely to use it the way they need it used.` };
}

// ── 3. hack the vote ──────────────────────────────────────────────────
/**
 * Which ballot, if any, the hacker nullifies.
 *
 * The one authority with arithmetic attached. The hacker has somebody they
 * want to survive; the cancel is worth using when it changes who leaves, and a
 * strategist who cannot change the result would rather keep the power a secret
 * than spend it on a gesture — an unexplained missing vote with no consequence
 * is a free clue handed to the house.
 *
 * @param {Array} ballots  [{ voter, evict }] as they will actually be cast
 * @returns {{voter:string|null, saved:string|null, flips:boolean, why:string,
 *   reason:object}}
 */
export function chooseHackerVoteHack({ hacker, ballots = [], nominees = [], hoh, house = [], rng }) {
  const rand = typeof rng === 'function' ? rng : Math.random;
  const st = _stats(hacker);
  const live = ballots.filter(b => b && nominees.includes(b.evict));
  if (nominees.length < 2 || live.length < 2) {
    return { voter: null, saved: null, flips: false, reason: { thin: true },
      why: 'There is not enough of a vote left to hack.' };
  }
  // Who the hacker wants to keep: themselves if they are somehow still up,
  // otherwise whichever nominee they are closest to.
  const saved = nominees.includes(hacker) ? hacker
    : [...nominees].sort((a, b) => _bond(hacker, b) - _bond(hacker, a))[0];
  const rival = nominees.find(n => n !== saved) || null;
  if (!saved || !rival) {
    return { voter: null, saved: null, flips: false, reason: {}, why: '' };
  }
  const against = live.filter(b => b.evict === saved);
  if (!against.length) {
    return { voter: null, saved, flips: false, reason: { alreadySafe: true },
      why: `Nobody is voting to evict ${saved}, so there is nothing worth cancelling. The hack stays unused, and unused is untraceable.` };
  }
  const forSaved = against.length;                     // votes to evict the one they want kept
  const forRival = live.filter(b => b.evict === rival).length;
  // One vote can only ever move the count by one, so there are exactly two
  // shapes worth spending it on:
  //   the count is TIED  — cancelling makes the one they want kept strictly safe
  //   they are DOWN one  — cancelling levels it, and a level count goes to the
  //                        Head of Household's tiebreak, which is a chance
  //                        rather than a rescue
  // Anything further behind than that cannot be reached with one ballot.
  const after = forSaved - 1;
  const flips = forSaved >= forRival && after < forRival;
  const levels = after === forRival && forSaved > forRival;
  if (!flips && !levels) {
    // Cannot change the result. The sharper the hacker, the more likely they
    // hold it rather than announce their existence for nothing.
    const hold = Math.min(0.9, 0.25 + (st.strategic || 5) * 0.07);
    if (rand() < hold) {
      return { voter: null, saved, flips: false, reason: { forSaved, forRival, held: true },
        why: `The count does not move for one vote — ${saved} is going either way — so the hacker keeps the cancel and keeps the secret. A vote that vanishes for no reason is a clue with nothing to show for it.` };
    }
  }
  // Which ballot: the one the hacker trusts least, because silencing somebody
  // you were counting on is a worse trade than silencing an enemy.
  const voter = [...against].sort((a, b) => _bond(hacker, a.voter) - _bond(hacker, b.voter))[0]?.voter || null;
  if (!voter) return { voter: null, saved, flips: false, reason: {}, why: '' };
  return {
    voter, saved, flips, levels,
    reason: { forSaved, forRival, flips, levels },
    why: `${voter}'s vote is cancelled. ${flips
      ? `It is the vote the night turns on: ${saved} was leaving by one, and now is not.`
      : levels
        ? `It levels the count at ${forRival} apiece, which hands the whole thing to the Head of Household to break.`
        : `It does not change who leaves, which the hacker will have all week to think about.`}`,
  };
}

// ── who the house decides did it ──────────────────────────────────────
/**
 * A guess factory, shaped exactly like the Roadkill and Invisible-HOH ones.
 *
 * Intuition-proportional, allowed to be wrong, one guess per person per week
 * so every later reaction stays consistent with the first. The Head of
 * Household is the standing suspect and the one person it CANNOT have been —
 * their block is the thing that got rewritten — so they are excluded from the
 * pool, which is what makes the innocent names take the damage.
 */
export function makeHackerGuesser({ week, house = [], hoh, rng }) {
  const rand = typeof rng === 'function' ? rng : Math.random;
  return function hackerGuess(who) {
    if (!week?.hacker || !who) return null;
    week.hackerGuesses ||= [];
    const prior = week.hackerGuesses.find(g => g.who === who);
    if (prior) return prior.guess;
    const truth = week.hacker.winner;
    const st = _stats(who);
    const candidates = house.filter(n => n !== who && n !== hoh);
    const correct = rand() < Math.min(0.7, 0.16 + (st.intuition || 5) * 0.05);
    let guess = truth;
    if (!correct) {
      guess = candidates.filter(n => n !== truth)
        .sort((a, b) => _bond(who, a) - _bond(who, b))[0] || truth;
    }
    week.hackerGuesses.push({ who, guess, correct: guess === truth });
    return guess;
  };
}

/** The competition memory a hacker carries out of the week, for later reads. */
export function recordHackerWin(winner, week, hacks) {
  gs.bb ||= {};
  gs.bb.competitionMemories ||= {};
  (gs.bb.competitionMemories[winner] ||= []).push({
    type: 'hacker-win', competitionId: week.hacker?.competition?.id || null,
    week: week.num, detail: { ...hacks },
  });
}
