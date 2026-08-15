// ══════════════════════════════════════════════════════════════════════
// bb/chopping-block-roulette.js — the replacement nobody chose
// ══════════════════════════════════════════════════════════════════════
//
// The first game you can buy a seat at in the High Roller's Room, and the only
// competition in this engine whose result is decided by nothing at all.
//
// Win it and three things happen at once:
//
//   1. you are safe for the week;
//   2. you take ONE initial nominee down, and they are safe for the rest of the
//      week — they cannot be put back up as the replacement;
//   3. you SPIN, and the replacement is drawn from every eligible houseguest
//      with equal odds. Chosen by nobody. Including you.
//
// ── WHY THE THIRD ONE IS THE WHOLE POINT ────────────────────────────────
//
// Every other route onto the block in this codebase has a hand behind it. An
// HOH nominates from a plan; a veto holder saves from a read of the house; a
// Roadkill winner fills their own chair. Every one of those produces a name
// somebody can be blamed for, and blame is what drives the next four weeks.
//
// This produces a nominee nobody can be blamed for. The Head of Household
// watches their target walk off the block and gets a stranger in the chair, and
// there is not one person in that house they can point at for it — not even the
// person who paid to make it happen, because the winner did not choose either.
// The HOH loses the block and gains nobody to blame. That is the drama, and it
// only exists if the draw is genuinely blind.
//
// So: `spinReplacement` is the one place in this codebase where a decision must
// NOT read stats, bonds, targets, threat, or anything else. No weighting of any
// kind, however tempting, however "realistic". `Math.floor(rng() * n)` and
// nothing else. A test proves uniformity over 4000 draws precisely so a future
// edit that quietly makes the wheel prefer a good story gets caught.
//
// ── PAYING IS NOT WINNING ───────────────────────────────────────────────
//
// `high-rollers-room.js` charges the 125 on the way in and never refunds it, so
// the win check here has to be genuinely losable or the room is a vending
// machine. It is a pass/fail against a fixed standard with real noise, weighted
// to `mental` and `intuition` (reading a board and knowing when to call it),
// tuned so roughly a third of entrants walk back out with nothing.
//
// Canon, and worth stating because it is the difference between a casino and a
// shop: score above zero or you have bought nothing.

import { players } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getPerceivedBond } from '../bonds.js';

// ── the win check ───────────────────────────────────────────────────────
//
// Proportional throughout: every stat scales its term, and there is not a
// single `if (stat >= n)` anywhere in the scoring. Thresholds appear exactly
// once in this file, at the bottom, and only to choose which sentence to print.
//
// The weighting is a wheel-and-board game, not a footrace: `mental` reads it,
// `intuition` calls it, and `boldness` is a small term because leaving the
// wheel spinning one more beat is a nerve thing. Nothing else is in here.
const W_MENTAL = 0.34;
const W_INTUITION = 0.30;
const W_BOLDNESS = 0.06;

// The standard sits just under an average house's read, which is what makes the
// loss rate land near a third rather than near a coin flip. Raise it and the
// room stops being worth 125 to anybody; lower it and safety becomes a
// purchase, which is the failure mode the whole format exists to avoid.
const STANDARD = 3.53;

// How wide the night swings. Wide enough that a sharp houseguest still loses
// and a dim one still wins — a wheel that always paid the cleverest person in
// the house would not be a wheel.
const SPREAD = 3.6;

const stat = (st, key) => st?.[key] ?? 5;

/**
 * The score, and the standard it has to clear.
 *
 * Returns the margin. Above zero is a win; at or below it, the money is gone
 * and the week is exactly where they left it.
 */
function rollScore(name, rng) {
  const st = pStats(name) || {};
  const read = stat(st, 'mental') * W_MENTAL
    + stat(st, 'intuition') * W_INTUITION
    + stat(st, 'boldness') * W_BOLDNESS;
  // Low rolls are kind and high rolls are cruel; the direction matters only in
  // that it is fixed, so a seeded season replays the same way every time.
  const swing = (0.5 - rng()) * SPREAD;
  return read + swing - STANDARD;
}

/**
 * The spin. Uniform. No weighting. Do not "improve" this.
 *
 * @param {string[]} eligible everybody legally able to take the chair
 * @param {function} rng      one draw, and only one
 * @returns {string|null}     a name, or null when the board is empty
 */
export function spinReplacement({ eligible = [], rng } = {}) {
  const pool = (eligible || []).filter(Boolean);
  if (!pool.length) return null;
  // Clamped because an rng that ever returns exactly 1 would index off the end
  // and hand the ceremony an undefined name, which is the crash described below.
  const idx = Math.min(pool.length - 1, Math.max(0, Math.floor(rng() * pool.length)));
  return pool[idx];
}

/**
 * Who is legally able to sit in the chair.
 *
 * Out: the winner (they just bought safety), the Head of Household (never
 * eligible for their own block), EVERY initial nominee — the one who came down
 * is barred by the rule and the one who stayed up is already there — and
 * anybody the week has already protected.
 *
 * Note that the removed nominee's exclusion is not a special case here: all
 * nominees are out either way, which is why this pool can be computed BEFORE
 * anybody is taken down. That ordering is what makes the empty board safe.
 */
function eligibleForChair({ name, house, nominees, hoh, protectedNames }) {
  const barred = new Set([name, hoh, ...nominees, ...protectedNames].filter(Boolean));
  return house.filter(n => n && !barred.has(n));
}

/**
 * Which nominee comes down.
 *
 * If the winner is themselves on the block, their own safety does it — there is
 * no decision to make. Otherwise they take down the one they most want safe,
 * read off `getPerceivedBond` (what they BELIEVE the relationship is, which is
 * the number every other decision in this engine acts on), with noise so a
 * season does not keep making the same call from the same numbers.
 */
function chooseRemoval({ name, nominees, rng }) {
  if (nominees.includes(name)) return name;
  let best = null;
  let bestScore = -Infinity;
  for (const nom of nominees) {
    let bond = 0;
    try { bond = getPerceivedBond(name, nom); } catch { bond = 0; }
    const score = bond + (rng() - 0.5) * 4;
    if (score > bestScore) { bestScore = score; best = nom; }
  }
  return best;
}

// ── narration ──────────────────────────────────────────────────────────
//
// Four-plus variants per category, this project's standard. Nothing in here
// names a balance — the room's own canon, and the price is the only figure the
// house is entitled to know.

const WON = [
  (n, p) => `The wheel comes up for ${n}. ${p.Sub} is safe, ${p.sub} is holding the block in ${p.posAdj} hands, and ${p.sub} has not chosen a single thing about what happens next.`,
  (n, p) => `${n} wins the Chopping Block Roulette. Safe for the week, and now the one person in this house who gets to take somebody off it.`,
  (n) => `It lands. ${n} bought a seat at a wheel and the wheel paid — safety, and the power to empty a chair.`,
  (n, p) => `${n} clears it. ${p.Sub} came in with a hundred and twenty-five and comes out with a week ${p.sub} does not have to survive.`,
  (n, p) => `The Roulette goes ${n}'s way. ${p.Sub} is off every list that mattered this morning, and ${p.sub} is about to rearrange the block for a house that did not ask ${p.obj} to.`,
];

const REMOVED_SELF = [
  (n, p, w) => `${n} takes ${p.ref} down. ${p.Sub} was on that block an hour ago and now ${p.sub} is the one thing on it nobody can touch.`,
  (n, p, w) => `The first name off the block is ${n}'s own. ${w} put ${p.obj} there on Sunday and does not get to put ${p.obj} back.`,
  (n, p) => `${n} steps off ${p.posAdj} own block. It is the shortest walk anybody has made all week and the loudest.`,
  (n, p, w) => `${n} comes down. ${w} watches it happen from six feet away, which is as close as ${w} will get to having a say in any of this.`,
];

const REMOVED_OTHER = [
  (n, p, saved, w) => `${n} takes ${saved} off the block. ${saved} is safe for the rest of the week — no chair, no ceremony, no way back up — and ${w} has to stand there for it.`,
  (n, p, saved) => `${n} says ${saved}'s name. That is ${saved} done with the block until Thursday, and done with it for good.`,
  (n, p, saved, w) => `The chair ${saved} was sitting in is empty. ${n} emptied it, and ${w} did not get asked.`,
  (n, p, saved) => `${n} pulls ${saved} down. ${p.Sub} does not explain it, and by the time anybody asks, the wheel is already turning again.`,
  (n, p, saved, w) => `${saved} comes off the block. ${n} bought the right to do that, and ${w} spends the rest of the ceremony working out what it cost ${p.obj} in ${w === n ? 'money' : 'goodwill'}.`,
];

const LANDED = [
  (r, rp, n) => `The wheel slows, and it stops on ${r}. Nobody put ${rp.obj} there. Not ${n}, not the Head of Household, not a plan anybody made — the room did it, and the room does not explain itself.`,
  (r, rp) => `It lands on ${r}. ${rp.Sub} is a replacement nominee, chosen by nothing, and there is not one person in this house ${rp.sub} can be angry at for it.`,
  (r, rp, n) => `${r}. ${rp.Sub} has been sitting on the sofa all afternoon with nothing to do with any of this, and now ${rp.sub} is on the block, and ${n} is as surprised as ${rp.sub} is.`,
  (r, rp) => `The wheel picks ${r}. No hand on it, no name whispered, no deal behind it. Just a chair that needed filling and a house full of people who all had exactly the same odds.`,
  (r, rp, n, w) => `${r} goes up. ${w} has spent all week building a plan around who sits in that chair, and the chair was filled by a wheel.`,
];

const NO_CHAIR = [
  (n) => `${n} wins it — and there is nobody left to spin for. Everybody still in this house is the winner, the Head of Household or already on the block, so the wheel has no names on it. The power does nothing but keep ${n} safe.`,
  (n, p) => `The Roulette pays ${n} and then runs out of house. There is no eligible replacement, so nobody comes down and nobody goes up; ${p.sub} keeps ${p.posAdj} safety and the block stands exactly as it was.`,
  (n) => `Won, and unusable. The chair cannot be filled — there is not one houseguest left who is allowed to sit in it — so the block does not move.`,
  (n, p) => `${n} is safe, and that is all ${p.sub} gets. With this few people left, taking somebody down would leave a chair no legal name can fill, so the rules make the decision and the block stays.`,
];

const LOST = [
  (n, p) => `The wheel does not stop anywhere good for ${n}. ${p.Sub} paid to sit down at it and gets up with nothing but the walk back.`,
  (n, p) => `Nothing. ${n} watches it slow down past every good outcome ${p.sub} had imagined and come to rest on none of them.`,
  (n) => `${n} loses the Chopping Block Roulette. The block does not move, the week does not change, and the money is not coming back.`,
  (n, p) => `It goes against ${n}. ${p.Sub} does the maths on the walk out and it comes to a hundred and twenty-five for a story ${p.sub} will be telling against ${p.ref} for the rest of the season.`,
  (n, p) => `${n} comes up short at the wheel. That seat is burned now — the room only sells it once — and ${p.sub} is exactly as exposed as ${p.sub} was this morning.`,
];

const pick = (pool, rng) => pool[Math.floor(rng() * pool.length) % pool.length];

const beat = (text, who, badgeText, badgeClass) => ({
  type: 'chopping-block-roulette',
  text,
  players: [...who].filter(Boolean),
  badgeText,
  badgeClass,
});

const pron = name => {
  try { return pronouns(name); } catch { return { sub: 'they', obj: 'them', pos: 'theirs', posAdj: 'their', ref: 'themselves', Sub: 'They', Obj: 'Them', PosAdj: 'Their' }; }
};

/**
 * Play the Chopping Block Roulette.
 *
 * Everything returned is a plain string, boolean or array of plain objects: the
 * caller stores this on `gs` and `gs` goes through `JSON.stringify` every week.
 *
 * @param {string}   name           who bought the seat
 * @param {string[]} house          everybody still playing
 * @param {string[]} nominees       the initial nominees
 * @param {string}   hoh            the Head of Household
 * @param {string[]} protectedNames everybody the week has already made safe —
 *                                  the same list the veto ceremony builds
 * @param {function} rng            seeded; never Math.random
 * @returns {{won:boolean, removed:(string|null), replacement:(string|null), beats:object[]}}
 *
 * `removed` and `replacement` are ALWAYS either a real name or null, never
 * undefined. Task 3 feeds them straight into the ceremony, and the ceremony
 * reads `gs.bb.stats[replacement]` — which blows up on an undefined name and
 * has crashed a real season doing it.
 */
export function playRoulette({ name, house = [], nominees = [], hoh = null,
  protectedNames = [], rng } = {}) {
  const draw = typeof rng === 'function' ? rng : Math.random;
  const room = (house || []).filter(Boolean);
  const noms = (nominees || []).filter(Boolean);
  const p = pron(name);
  const beats = [];

  // ── did they win it at all ──
  if (rollScore(name, draw) <= 0) {
    beats.push(beat(pick(LOST, draw)(name, p), [name], 'LOST THE SPIN', 'bad'));
    return { won: false, removed: null, replacement: null, beats };
  }

  beats.push(beat(pick(WON, draw)(name, p), [name], 'WON THE ROULETTE', 'gold'));

  // ── the board, before anybody is taken down ──
  //
  // Computed first on purpose. Every nominee is barred from the chair either
  // way, so this pool does not depend on who comes down — which means the empty
  // board can be caught BEFORE the ceremony has been half-performed and left in
  // a state where somebody is off the block and no name exists to replace them.
  const eligible = eligibleForChair({ name, house: room, nominees: noms, hoh,
    protectedNames: (protectedNames || []).filter(Boolean) });

  if (!eligible.length || !noms.length) {
    // The same rule the veto ceremony already applies (`js/bb/week.js:3957`):
    // if the chair cannot be filled, the power is not used and the block
    // stands. The winner keeps their safety — that half was never conditional.
    beats.push(beat(pick(NO_CHAIR, draw)(name, p), [name], 'NO CHAIR TO FILL', 'grey'));
    return { won: true, removed: null, replacement: null, beats };
  }

  // ── the removal ──
  const removed = chooseRemoval({ name, nominees: noms, rng: draw });
  const rp = pron(removed);
  beats.push(removed === name
    ? beat(pick(REMOVED_SELF, draw)(name, p, hoh || 'the Head of Household'), [name, hoh], 'OFF THE BLOCK', 'gold')
    : beat(pick(REMOVED_OTHER, draw)(name, p, removed, hoh || 'the Head of Household'), [name, removed, hoh], 'OFF THE BLOCK', 'gold'));

  // ── the spin ──
  const replacement = spinReplacement({ eligible, rng: draw });
  if (!replacement) {
    // Belt and braces. `eligible` was non-empty a moment ago, so this cannot
    // fire today — but an undefined name reaching the ceremony is the exact
    // failure this module is written to make impossible, and a guard is cheaper
    // than a dead season.
    beats.push(beat(pick(NO_CHAIR, draw)(name, p), [name], 'NO CHAIR TO FILL', 'grey'));
    return { won: true, removed: null, replacement: null, beats };
  }
  const repP = pron(replacement);
  beats.push(beat(pick(LANDED, draw)(replacement, repP, name, hoh || 'the Head of Household'),
    [replacement, name], 'THE WHEEL DECIDES', 'bad'));

  return { won: true, removed, replacement, beats };
}

/**
 * The room's resolver, in the shape `openRoom` injects.
 *
 * `openRoom` hands its resolver `{ name, game, week, rng }` plus the week's
 * board; this unpacks that and returns the full result object rather than the
 * bare boolean the fallback returns, because the ceremony needs the two names.
 */
export function rouletteResolver({ name, week, house = [], nominees = [], hoh = null,
  protectedNames = [], rng } = {}) {
  const room = house.length ? house : (players || []).map(pl => pl.name);
  return playRoulette({ name, house: room, nominees, hoh, protectedNames, rng, week });
}
