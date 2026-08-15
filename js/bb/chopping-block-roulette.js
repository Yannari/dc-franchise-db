// ══════════════════════════════════════════════════════════════════════
// bb/chopping-block-roulette.js — the replacement nobody chose
// ══════════════════════════════════════════════════════════════════════
//
// The first game you can buy a seat at in the High Roller's Room, and the only
// competition in this engine whose result is decided by nothing at all.
//
// Win it and this is what you have bought, stated exactly, because a promise
// wider than the mechanic is the bug this file has already had once:
//
//   1. NOBODY CAN NAME YOU AS A REPLACEMENT NOMINEE for the rest of the week.
//      Unconditional — the same cover a Golden Key holder has at the chair —
//      and it is the only half that never fails.
//   2. IF you were on the block AND somebody is eligible for the empty chair,
//      you come down, and you are safe from the block for the rest of the week.
//      One initial nominee comes down either way, yours or somebody else's, and
//      they cannot be put back up as the replacement.
//   3. THEN you SPIN, and the replacement is drawn from every eligible
//      houseguest with equal odds. Chosen by nobody. Including you.
//
// And when no eligible chair exists, 2 and 3 do not happen at all: nobody comes
// down, nobody goes up, and a winner who was already nominated STAYS nominated
// with only (1) to show for the money. See NO_CHAIR below — that outcome is
// narrated rather than smoothed over, because it is the format's own cruelty.
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
// ── IT IS A COMPETITION, AND AT MOST ONE PERSON WINS IT ─────────────────
//
// The wiki: "In Week 7, Alyssa was the only person to play in the Chopping
// Block Roulette competition and scored higher than 0, winning her the
// competition." She won it alone because she was the only one who PAID, not
// because the game hands a pass to everybody who clears a bar.
//
// So the Roulette resolves over the whole week's field at once. Everybody who
// bought a seat plays, the scores are compared, and the highest score takes it
// — provided that score clears the standard at all. Everybody else loses,
// having paid.
//
// The contrast with the Veto Derby (a later plan) is the reason this is a real
// rule and not a simplification: the Derby pays out to anyone who scored "higher
// than 0 AND landed in the top six", up to six winners in a night. These two
// games genuinely resolve differently and the difference is load-bearing — do
// not fold one into the other when the Derby lands.
//
// ── PAYING IS NOT WINNING ───────────────────────────────────────────────
//
// `high-rollers-room.js` charges the 125 on the way in and never refunds it, so
// the standard has to be genuinely unclearable or the room is a vending
// machine. The score is `mental`/`intuition`-weighted (reading a board and
// knowing when to call it) with real noise, and the bar is set against a FIELD
// rather than against one player: the best of three clears a fixed bar far more
// often than one player does, so a bar tuned on a single entrant would make
// "nobody won it" impossible the moment two people paid.
//
// Measured over 4000 fields per size, drawn from a spread of archetypes: NO
// WINNER on 55% of one-entrant nights, 29% of two, 14% of three, 7% of four. So
// a lone entrant is more likely than not to walk out with nothing — which is
// the format's whole thesis about the price — while a crowded room nearly
// always produces a champion, which is what a competition should do. A room
// full of people paying and leaving with nothing between them stays a real
// night, and that is the only reason the 125 means anything.
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

// The standard sits just ABOVE an average house's read, because this is judged
// against a field: a bar an average player clears half the time is a bar a
// field of three clears almost always, and "nobody won it" would stop
// happening. Raise it and the room stops being worth 125 to anybody; lower it
// and safety becomes a purchase, which is the failure mode the whole format
// exists to avoid.
const STANDARD = 4.0;

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
//
// ── AND NOTHING IN HERE SAYS "SAFE FOR THE WEEK" ────────────────────────
//
// It used to, in this pool and in the NO_CHAIR one below, and in the catalog
// entry and the twist announcement as well. The engine does not deliver it:
// what a win actually buys is that NOBODY CAN NAME YOU AS A REPLACEMENT
// NOMINEE for the rest of the week — the protection a Golden Key holder has at
// the chair — plus the block change, which is conditional on there being a
// legal name for the wheel to land on.
//
// The gap that exposed it: a winner who was already a nominee, on a week with
// no eligible chair. `runRoulette` returns before `chooseRemoval`, so they do
// not come down, and the copy was cheerfully telling them they were safe on
// their way to the vote. Emptying the chair instead was tried and measured and
// the engine refuses a one-name block (`js/bb/shared-strategy.js:1251` —
// 21 of 120 seeded episodes died on it), so the COPY is what changed.
//
// The rule these beats now state, and the only one they may state:
//   1. the winner cannot be named as a replacement nominee this week;
//   2. if they were on the block AND somebody is eligible for the empty chair,
//      they come down;
//   3. if no eligible chair exists the block does not move at all — nobody
//      down, nobody up — and a winner who was already nominated stays nominated.

const WON = [
  (n, p) => `The wheel comes up for ${n}. No ceremony this week can write ${p.posAdj} name into an empty chair, ${p.sub} is holding the block in ${p.posAdj} hands, and ${p.sub} has not chosen a single thing about what happens next.`,
  (n, p) => `${n} wins the Chopping Block Roulette. Nobody can name ${p.obj} as a replacement nominee between now and Thursday, and ${p.sub} is the one person in this house who gets to take somebody off that block.`,
  (n, p) => `It lands. ${n} bought a seat at a wheel and the wheel paid — a name no replacement chair can be filled with, and the power to empty one.`,
  (n, p) => `${n} clears it. ${p.Sub} came in with a hundred and twenty-five and comes out untouchable at the replacement chair, whatever else this week decides to do to ${p.obj}.`,
  (n, p) => `The Roulette goes ${n}'s way. Whoever comes down today it will not be ${p.obj} going up in their place — and ${p.sub} is about to rearrange the block for a house that did not ask ${p.obj} to.`,
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

// The cruellest night this game has, and it is stated rather than softened.
// `onBlock` is the whole reason these take a third argument: a winner who was
// already nominated does NOT come down here — the two halves of the power
// happen together or not at all — and a beat that let that pass in silence is
// the exact defect this pool was rewritten for.
const NO_CHAIR = [
  (n, p, onBlock) => `${n} wins it — and there is nobody left to spin for. Everybody still in this house is the winner, the Head of Household or already on the block, so the wheel has no names on it. Nobody comes down and nobody goes up${onBlock ? `, ${n} included` : ''}. What ${p.sub} keeps is this: no replacement chair this week can be filled with ${p.posAdj} name.`,
  (n, p, onBlock) => `The Roulette pays ${n} and then runs out of house. There is no eligible replacement, so the removal does not happen either — the two halves come together or not at all${onBlock ? `, and ${p.sub} sits back down in the chair ${p.sub} paid to get out of` : ''}. ${p.Sub} cannot be named as a replacement nominee this week, and that is the whole of what the money bought.`,
  (n, p, onBlock) => `Won, and all but unusable. The chair cannot be filled — there is not one houseguest left who is allowed to sit in it — so the block stands exactly as it was${onBlock ? `, ${n} still on it` : ''}. The hundred and twenty-five bought one thing: no ceremony between now and Thursday can put ${n} up as a replacement.`,
  (n, p, onBlock) => `${n} is safe from the replacement chair, and with this few people left that is all ${p.sub} gets. Taking somebody down would leave a seat no legal name could fill, so the rules make the decision and nothing moves${onBlock ? ` — ${n} goes to the vote exactly as nominated as ${p.sub} was this morning` : ''}.`,
];

const LOST = [
  (n, p) => `The wheel does not stop anywhere good for ${n}. ${p.Sub} paid to sit down at it and gets up with nothing but the walk back.`,
  (n, p) => `Nothing. ${n} watches it slow down past every good outcome ${p.sub} had imagined and come to rest on none of them.`,
  (n) => `${n} loses the Chopping Block Roulette. The block does not move, the week does not change, and the money is not coming back.`,
  (n, p) => `It goes against ${n}. ${p.Sub} does the maths on the walk out and it comes to a hundred and twenty-five for a story ${p.sub} will be telling against ${p.ref} for the rest of the season.`,
  (n, p) => `${n} comes up short at the wheel. That seat is burned now — the room only sells it once — and ${p.sub} is exactly as exposed as ${p.sub} was this morning.`,
];

// Everybody paid, nobody cleared the standard. The best night this room has.
const NOBODY_CLEARED = [
  (n, field) => `${n} people paid to play the Chopping Block Roulette tonight and not one of them scored above zero. The block does not move. The money does not come back. ${field[0]} and ${field[field.length - 1]} do not look at each other on the way out.`,
  (n) => `Nobody wins it. All ${n} of them cleared the door and none of them cleared the standard, and the Head of Household goes to bed with the same block ${n === 2 ? 'both' : 'all'} of them paid to break.`,
  (n, field) => `The wheel takes ${n} entries and pays out nothing. ${field.join(', ')} — every one of them out of pocket, every one of them exactly as exposed as they were this morning, and every one of them now known to have been frightened enough to try.`,
  (n) => `${n} seats sold, no winner. That is what the room is; it is not a shop and it never promised anybody anything except a chance.`,
];

// The people who paid to be beaten by somebody else.
const BEATEN = [
  (w, beaten, n) => `${beaten.join(' and ')} paid the same price as ${w} and ${n === 1 ? 'gets' : 'get'} none of what ${w} got. One winner. That is the game.`,
  (w, beaten) => `${beaten.join(', ')} came second, and second at this wheel is identical to last: no safety, no power, no refund.`,
  (w, beaten, n) => `${n === 1 ? 'The other entrant scores' : `The other ${n} entrants score`} under ${w} and walk out of that room with a hundred and twenty-five gone and a house that watched them go in.`,
  (w, beaten) => `${beaten.join(' and ')} lose it to ${w} by a margin nobody in the house will ever be told, which does not stop anybody guessing at it for a week.`,
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
 * Run the Chopping Block Roulette over a whole week's field.
 *
 * THIS IS A COMPETITION, NOT A TURNSTILE. Everybody who bought a seat plays,
 * the scores are compared, and AT MOST ONE person wins it: the highest score,
 * and only if that score clears the standard. Everybody else loses, having
 * already paid, which is the format working rather than the format failing.
 *
 * Everything returned is a plain string, boolean, number or array of plain
 * objects: the caller stores this on `gs` and `gs` goes through
 * `JSON.stringify` every week.
 *
 * @param {string[]} entrants       everybody who paid to sit down, in the order
 *                                  they walked in
 * @param {string[]} house          everybody still playing
 * @param {string[]} nominees       the INITIAL nominees
 * @param {string}   hoh            the Head of Household
 * @param {string[]} protectedNames everybody the week has already made safe —
 *                                  the same list the veto ceremony builds
 * @param {function} rng            seeded; never Math.random
 * @returns {{winner:(string|null), removed:(string|null), replacement:(string|null),
 *            results:object, beats:object[]}}
 *          `results` is keyed by entrant: `{won, score, removed, replacement}`.
 *
 * `removed` and `replacement` are ALWAYS either a real name or null, never
 * undefined. Task 3 feeds them straight into the ceremony, and the ceremony
 * reads `gs.bb.stats[replacement]` — which blows up on an undefined name and
 * has crashed a real season doing it.
 */
export function runRoulette({ entrants = [], house = [], nominees = [], hoh = null,
  protectedNames = [], rng } = {}) {
  const draw = typeof rng === 'function' ? rng : Math.random;
  const field = (entrants || []).filter(Boolean);
  const room = (house || []).filter(Boolean);
  const noms = (nominees || []).filter(Boolean);
  const beats = [];
  const results = {};
  if (!field.length) return { winner: null, removed: null, replacement: null, results, beats };

  // ── everybody plays, and the scores are compared ──
  //
  // One draw each, in entry order, so a seeded season replays identically. The
  // score is the margin over the standard: at or below zero is not a low
  // placing, it is a nothing. Canon — "scored higher than 0, winning her the
  // competition" — and it is why a room full of people can all pay and all
  // leave with nothing between them.
  const scored = field.map(name => ({ name, score: rollScore(name, draw) }));
  for (const s of scored) {
    results[s.name] = { won: false, score: s.score, removed: null, replacement: null };
  }

  // Highest score above the standard takes it. Ties break on entry order, which
  // is the order they walked through the door — arbitrary, but fixed, and a
  // float tie here is theoretical anyway.
  let best = null;
  for (const s of scored) if (s.score > 0 && (!best || s.score > best.score)) best = s;

  if (!best) {
    // NOBODY WON IT, AND THAT HAS TO STAY POSSIBLE.
    // A field that all falls short is the sharpest night this room has: three
    // people paid 125 each, the house watched all three walk in, and the block
    // does not move an inch. The standard is tuned to keep this a real outcome
    // at the small fields the price actually produces — see STANDARD above.
    beats.push(field.length === 1
      ? beat(pick(LOST, draw)(field[0], pron(field[0])), [field[0]], 'LOST THE SPIN', 'bad')
      : beat(pick(NOBODY_CLEARED, draw)(field.length, field), [...field], 'NOBODY CLEARS IT', 'bad'));
    return { winner: null, removed: null, replacement: null, results, beats };
  }

  const name = best.name;
  const p = pron(name);
  results[name].won = true;
  beats.push(beat(pick(WON, draw)(name, p), [name], 'WON THE ROULETTE', 'gold'));

  // The people who paid to be beaten. One beat for the field rather than one
  // per loser — the room already narrates each entry on its own, and this is
  // the line about what the night cost the room collectively.
  const beaten = field.filter(n => n !== name);
  if (beaten.length) {
    beats.push(beat(pick(BEATEN, draw)(name, beaten, beaten.length), [...beaten, name], 'OUTSCORED', 'bad'));
  }

  // ── the board, before anybody is taken down ──
  //
  // Computed first on purpose. Every nominee is barred from the chair either
  // way, so this pool does not depend on who comes down — which means the empty
  // board can be caught BEFORE the ceremony has been half-performed and left in
  // a state where somebody is off the block and no name exists to replace them.
  const eligible = eligibleForChair({ name, house: room, nominees: noms, hoh,
    protectedNames: (protectedNames || []).filter(Boolean) });

  if (!eligible.length || !noms.length) {
    // The same rule the veto ceremony already applies: if the chair cannot be
    // filled, the power is not used and the block stands — which means a winner
    // who was already a nominee STAYS one, because this returns before
    // `chooseRemoval` and their self-removal never runs. The beat says so.
    // What survives unconditionally is the replacement-chair protection, which
    // is the one thing the ceremony can still give them.
    beats.push(beat(pick(NO_CHAIR, draw)(name, p, noms.includes(name)), [name], 'NO CHAIR TO FILL', 'grey'));
    return { winner: name, removed: null, replacement: null, results, beats };
  }

  // ── the removal ──
  const removed = chooseRemoval({ name, nominees: noms, rng: draw });
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
    beats.push(beat(pick(NO_CHAIR, draw)(name, p, noms.includes(name)), [name], 'NO CHAIR TO FILL', 'grey'));
    return { winner: name, removed: null, replacement: null, results, beats };
  }
  beats.push(beat(pick(LANDED, draw)(replacement, pron(replacement), name, hoh || 'the Head of Household'),
    [replacement, name], 'THE WHEEL DECIDES', 'bad'));

  // Exactly one entry carries the two names. Every other entrant this week is a
  // loss, and `results` says so for each of them.
  results[name].removed = removed;
  results[name].replacement = replacement;
  return { winner: name, removed, replacement, results, beats };
}

/**
 * One entrant, for callers that have only one — a field of one.
 *
 * A lone entrant is exactly Alyssa's week: she was the only person who paid,
 * she cleared the standard, and that won her the competition. Nothing about
 * the rule is different for a field of one, so this is a thin wrapper and not a
 * second implementation of the game.
 */
export function playRoulette({ name, house = [], nominees = [], hoh = null,
  protectedNames = [], rng } = {}) {
  const out = runRoulette({ entrants: [name], house, nominees, hoh, protectedNames, rng });
  return {
    won: !!out.results[name]?.won,
    removed: out.removed,
    replacement: out.replacement,
    beats: out.beats,
  };
}

/**
 * The room's resolver, in the shape `openRoom` calls it.
 *
 * `resolvesField` is the flag the room reads: it means "do not call me once per
 * entrant, call me once with all of them". The room hands over the seated field
 * and gets back a per-name result map plus the night's beats.
 */
export function rouletteResolver({ entrants = [], house = [], nominees = [], hoh = null,
  protectedNames = [], rng } = {}) {
  const room = house.length ? house : (players || []).map(pl => pl.name);
  return runRoulette({ entrants, house: room, nominees, hoh, protectedNames, rng });
}
rouletteResolver.resolvesField = true;
