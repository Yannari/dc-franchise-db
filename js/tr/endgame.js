// ══════════════════════════════════════════════════════════════════════
// tr/endgame.js — banish, or end the game
// ══════════════════════════════════════════════════════════════════════
//
// Spec §8. After the final mandated Round Table the format stops asking the
// room to find a Traitor and starts asking each of them a private question:
// is there anybody left in here you still want gone? One "banish" forces
// another Round Table. Only a room that answers "no" with one voice ends it.
//
// THREE THINGS MAKE THIS DIFFERENT FROM EVERY EARLIER TABLE.
//
// 1. NOBODY IS REVEALED. `runRoundTable` is called with `reveal: false`, so
//    `revealCascade` does not run: a player banished in the finale walks out
//    without saying what they were. That is the format's rule and it is also
//    the mechanic — every earlier table converted a round of meaningless
//    ballots into evidence, and the last two do not. The survivors carry on
//    with exactly the beliefs they walked in with, which is why the endgame
//    is played on nerve instead of on deduction.
//
// 2. THE CHOICE READS BELIEFS, NOT GROUND TRUTH. A Faithful ends the game
//    when they BELIEVE the room is clean, which is precisely the moment they
//    are most often wrong — that error is the whole drama of the format, and
//    reading `alignmentAt` here would delete it by making every Faithful an
//    oracle. The one thing anybody is allowed to read about themselves is
//    their OWN role, which is the same exemption the castle layer has.
//
// 3. THE MONEY IS DECIDED HERE AND NOWHERE ELSE. `gs.tr.pot` has been
//    accumulating since Plan 6 Task 1 with no reader anywhere in the engine.
//    This file is its reader: if only Faithfuls are left standing they split
//    it; if a single Traitor is still in the room, the Traitors take all of
//    it and every Faithful who reached the end goes home with nothing.
import { gs } from '../core.js';
import { pStats } from '../players.js';
import { alignmentAt, livingTraitors } from './roles.js';
import { suspicion, knowsAlignmentOf, potShare } from './deduction.js';
import { runRoundTable } from './roundtable.js';
import { settleDaggers, openSeer } from './powers.js';
import { lineFor, _lineHash } from './castle/lines.js';

/** A stable 0..1 from a string. No rng draw — see the note on the choice. */
function hash01(key) { return _lineHash(key) / 4294967296; }

// ── HOW MUCH SUSPICION IS TOO MUCH TO WALK AWAY FROM ──────────────────
//
// A Faithful's strongest read on anybody still in the room runs 0.06 (10th
// percentile) to 0.44 (90th) at the field the mandated season leaves behind,
// with a median of 0.36 — measured over 200 seasons at the moment the last
// mandated table closes. A single shared threshold anywhere inside that range
// would therefore make the whole room answer the same way on the same
// evidence, and a room that answers as one is unanimous on the first ask or
// never: the interesting states (three end it, one does not) would not exist.
//
// So the threshold is PERSONAL and re-asked each time the question is put.
// The floor is the calmest nerve in the castle and the span reaches the most
// paranoid; where a given player sits is hashed from their name and the round,
// so the same season replays the same way and no draw is taken off the game's
// stream to get it.
const END_NERVE_FLOOR = 0.34;
const END_NERVE_SPAN = 0.34;
// Nerve is not evenly distributed. A bold player pushes for one more
// banishment on a read a cautious one would let go, so their threshold sits
// lower in the band; `boldness` is the stat the Round Table already uses for
// "speaks anyway" and it is the right one here too.
const END_NERVE_BOLD = 0.10;

// ── WHAT A TRAITOR IS DECIDING INSTEAD ────────────────────────────────
//
// A Traitor left in the room at the end wins whatever happens, so the only
// reason they have to keep the game running is a FELLOW: the pot is taken by
// the Traitors who are standing, and every one of them is a divisor. That is
// the whole of the calculation, and it is why spec §8's endgame is where the
// format's betrayals happen rather than an incidental risk of one.
//
// Against it sits the room. Every player they do not know to be a Traitor is
// somebody who may write THEIR name down at the table they are about to force,
// and a Traitor who pushes one table too far ends the season with nothing.
// `strangers` is a belief-side count — the living, minus themselves, minus the
// fellows they were shown in the turret — and never a headcount of Faithfuls.
const GREED_BASE = 0.62;
/** How much a full pot is worth pushing for. */
const GREED_POT = 0.40;
/** What each unknown face in the room costs their nerve. */
const GREED_EXPOSURE = 0.14;

// THE POT IS READ HERE, WHICH NARROWS THE MISSIONS GUARD A FOURTH TIME.
//
// tests/tr-missions.test.js plays forty seasons with the money on and off and
// demands they come back bit-identical. Task 6 made `gs.tr.pot` a reader at the
// ballot and narrowed that guard by running both arms blind to the money; this
// file is the SECOND reader, and a private copy of the calculation here would
// have left the endgame seeing a pot the rest of the engine could not — the
// arms diverged on `survivors` the first time this was written that way, which
// is how the shared reader came to be extracted into deduction.js. `potShare`
// is imported from there so the hold-out is a property of the reader and one
// switch blinds every caller of it.

/**
 * One survivor's secret choice: `'end'` or `'banish'`.
 *
 * EXPORTED AND HOOKED because this is where the rule lives. Task 4 of this
 * plan shipped a guard a mutation survived, because the state it forbade was
 * reachable in 22 seasons out of 400 and a season-level assertion could not
 * see it break. An endgame is rare by construction too — one phase per season,
 * a handful of asks — so the guards for this file assert HERE, on the decision
 * itself, every time one is made, and carry a coverage floor proving the
 * sample contained the case at all.
 *
 * The returned record is the whole basis of the decision, so a test can read
 * the value under test instead of recomputing it (Task 2's rule: a duplicate
 * copy of a rule inside a test drifts away from the real one and goes green).
 */
export function endgameChoice(name, living, ep) {
  const room = (living || []).filter(n => n !== name);
  // THE ONE PIECE OF GROUND TRUTH ANYBODY MAY READ IS THEIR OWN ROLE.
  const iAmTraitor = alignmentAt(name, ep) === 'traitor';

  if (iAmTraitor) {
    // Belief-side, not `alignmentAt`: `knowsAlignmentOf` is true only of a
    // `public`-credibility alignment belief, and among the LIVING the only
    // writer of one is the turret. So this is "the fellows I was shown",
    // which is what a Traitor actually has, and it is exactly the reader the
    // castle layer uses to condition on the pact without touching truth.
    const fellows = room.filter(n => knowsAlignmentOf(name, n, ep));
    const strangers = room.length - fellows.length;
    const appetite = Math.max(0, Math.min(1,
      GREED_BASE + GREED_POT * potShare() - GREED_EXPOSURE * strangers));
    const roll = hash01(`endgame-greed|${name}|${ep}`);
    const choice = fellows.length && roll < appetite ? 'banish' : 'end';
    return { name, choice, role: 'traitor', fellows, strangers, appetite, roll,
      top: null, topName: null, threshold: null };
  }

  const board = room.map(n => ({ name: n, score: suspicion(name, n, ep) }))
    .sort((a, b) => b.score - a.score);
  const top = board.length ? board[0].score : 0;
  const bold = (pStats(name).boldness || 5) / 10;
  const threshold = END_NERVE_FLOOR
    + END_NERVE_SPAN * hash01(`endgame-nerve|${name}|${ep}`)
    - END_NERVE_BOLD * bold;
  return { name, choice: top >= threshold ? 'banish' : 'end', role: 'faithful',
    fellows: [], strangers: room.length, appetite: null, roll: null,
    top, topName: board.length ? board[0].name : null, threshold };
}

// The hook the guards assert through. Same contract as `_setPactWatch` in
// tr/deduction.js: test-only, and nothing in the show may ever set it.
let _watch = null;
export function _setEndgameWatch(fn = null) {
  const prev = _watch;
  _watch = fn;
  return () => { _watch = prev; };
}

/** Everybody's secret choice, in room order. */
export function secretBallot(living, ep) {
  const choices = (living || []).map(n => endgameChoice(n, living, ep));
  if (_watch) for (const c of choices) _watch({ ...c, ep, living: [...(living || [])] });
  return choices;
}

// ── THE MONEY ───────────────────────────────────────
//
// Spec §8, and it is one sentence with no special cases: any Traitor standing
// takes it all. A season that ends with two Traitors in the room splits it two
// ways between them, and the Faithfuls beside them get nothing at all.
//
// FOUR POOLS AND NOT ONE, because of the standing requirement this plan added
// after Task 1: a sentence asserting a fact about season state must agree with
// that state. The first draft of this file had a single pool and printed
// "Beardo were in the turret" over a lone winner and "the Faithfuls beside them
// get nothing" over a castle that had no Faithful left in it — both found the
// way every prose defect in this project has been found, by dumping seasons and
// reading them. The number of takers and whether anybody is standing beside
// them are the two facts these sentences turn on, so they choose the pool
// rather than being asserted inside one. That makes the contradiction
// unrepresentable instead of asserted-against after the fact.
const POT_LINES = {
  // No cloaks left. One survivor, or several splitting it.
  'faithfuls-solo': [
    '{takers} is the last one standing in a castle with no cloak left in it, and takes the whole {pot}.',
    'Nobody was lying, and nobody else is left. {pot}, all of it, to {takers}.',
    'The last Faithful in the castle. {takers} takes {pot} out through the front door alone.',
    'An empty table and one chair filled. {takers} leaves with {pot}.',
  ],
  'faithfuls-split': [
    '{takers} leave the castle with the pot split between them — {share} each.',
    'The money is divided where they stand: {share} apiece to {takers}.',
    '{takers} split {pot} between them, and not one of them was lying.',
    'A clean castle. {takers} take {share} each out of the door.',
  ],
  // A Traitor is standing. `-alone` means nobody else is: there is no Faithful
  // in the room to be robbed, so no line here may say there is.
  'traitors-solo': [
    '{takers} was in the turret the whole time, and the whole {pot} goes out of the door with them.',
    'Every credit of it — {pot} — leaves with {takers}, and the room never knew.',
    'The game ends on a Traitor. {takers} takes all {pot}.',
    'A cloak they never saw. {takers} walks out with {pot}.',
  ],
  // NO VERB MAY AGREE WITH {losers}. There can be one of them or four, and the
  // first draft printed "Brick take none of it" over a single survivor — the
  // same shape of defect as the plural verb over a lone taker, one clause
  // further along. Past tense and verbless clauses are safe for both.
  'traitors-solo-robbed': [
    '{takers} was in the turret the whole time, and there is nothing at the end of it for {losers}.',
    'Every credit of it — {pot} — leaves with {takers}. Nothing for {losers}.',
    'The room ended the game on a Traitor: all of it to {takers}, none of it to {losers}.',
    '{takers} walks out with {pot}. {losers} spent the season earning it and will not see a credit.',
  ],
  'traitors-split': [
    'Two cloaks and nobody else. {takers} split {pot} — {share} each.',
    'The pact held to the last table. {takers} divide {pot} between them.',
    '{takers} were in the turret together and they leave together, {share} apiece.',
    'Nobody broke first. {takers} take {share} each.',
  ],
  'traitors-split-robbed': [
    '{takers} were in the turret together the whole time. {share} each to them, and nothing to {losers}.',
    'The pact held. {takers} divide {pot} between them, and there is none of it for {losers}.',
    '{takers} split {pot} — {share} apiece — in front of {losers}, who earned it.',
    'Cloaks at the last table. {takers} take {share} each; nothing to {losers}.',
  ],
};

/** "A", "A and B", "A, B and C" — so a five-way split does not read as a chant. */
function listOf(names) {
  if (names.length <= 1) return names[0] || '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Who takes the money, and the sentence that says so.
 *
 * Ground truth IS legitimate here and only here: the game is over, the cloaks
 * come off, and this is the reveal. Everything upstream of this line — every
 * choice, every ballot — was decided on belief.
 */
export function resolvePot(ep) {
  const survivors = [...(gs.activePlayers || [])];
  const traitors = livingTraitors(ep);
  const pot = gs.tr?.pot || 0;
  const takers = traitors.length ? [...traitors] : survivors;
  const winner = traitors.length ? 'traitors' : 'faithfuls';
  const losers = survivors.filter(n => !takers.includes(n));
  // Integer credits, and the remainder is dropped rather than fudged: the
  // per-head figure the line prints has to be a number the pot can actually
  // pay out, because a sentence asserting a fact about season state must
  // agree with that state.
  const share = takers.length ? Math.floor(pot / takers.length) : 0;
  const key = `${winner}-${takers.length === 1 ? 'solo' : 'split'}`
    + (winner === 'traitors' && losers.length ? '-robbed' : '');
  const line = takers.length
    ? lineFor(POT_LINES[key], `endgame-pot|${ep}|${key}`,
      { takers: listOf(takers), losers: listOf(losers),
        share: share.toLocaleString('en-US'), pot: pot.toLocaleString('en-US') })
    : 'An empty castle. Nobody is left to take it.';
  return { winner, survivors, takers, losers, pot, share, line, lineKey: key };
}

/**
 * The whole endgame: ask, banish, ask again, until the answer is unanimous.
 *
 * Returns the phase record. `rounds` are Round Tables in every respect except
 * the reveal, and they are recorded on `gs.tr.rounds` like any other — but
 * they are handed back SEPARATELY from the mandated season's rounds by
 * `playTraitorsSeason`, because the calibration bands are population
 * measurements of the deduction engine over the mandated season and a finale
 * table is a different game: three or four people, no reveal to reason from,
 * and a question that is not "who is the Traitor".
 */
export function runEndgame(startEp, rng = Math.random, { reveal = false } = {}) {
  const rounds = [];
  const ballots = [];
  let ep = startEp;
  // THE SEER'S GATE, AND IT IS STATE RATHER THAN AN ARGUMENT. `openSeer` reads
  // this and nothing else to decide whether the game is in its endgame, so the
  // mandated loop cannot open one by passing the right flag — there is no flag
  // to pass, and nothing but this line ever writes the field.
  gs.tr.endgameFrom = startEp;
  // The loop terminates on its own — every table removes somebody, so the room
  // shrinks monotonically — but a season is not a place to rely on that alone.
  let guard = (gs.activePlayers || []).length + 2;
  while (guard-- > 0) {
    const living = [...(gs.activePlayers || [])];
    // One person cannot banish anybody, so the question has only one answer.
    if (living.length < 2) break;
    // ASKED EVERY TIME, AND ANSWERED YES EXACTLY ONCE (spec 7.3). It is put
    // here, before the ask, because that is what the power is for: a private
    // meeting whose one certain answer is spent on the question the room is
    // about to be asked. Re-offering it on every table is deliberate — a rule
    // decided once a season is a rule no sampled assertion can catch breaking
    // (Task 4's mutation survived for precisely that reason), so the refusal
    // runs as often as the grant and the guards assert on both.
    openSeer(ep);
    // THE ROOM KNOWS WHEN IT HAS ALREADY WON. Mandated banishments are revealed,
    // so once the last Traitor is banished the whole castle has SEEN it — and a
    // room that knows it is clean ends the game rather than banishing each other
    // on stale suspicion. Without this a Faithful's residual (now wrong) read
    // sent paranoid survivors banishing their own reveal-less in a room of a
    // dozen: the reported "finale at episode five, nine still in, five banished
    // at once". This is not an oracle read of hidden alignments — it is the
    // public reveals the room already watched. The Seer is still offered above,
    // so a clean sweep still gets its one meeting; it just does not banish.
    const alreadyWon = !livingTraitors(ep).length;
    const choices = alreadyWon
      ? living.map(n => ({ name: n, choice: 'end', role: 'faithful' }))
      : secretBallot(living, ep);
    ballots.push({ ep, choices, living });
    if (alreadyWon || !choices.some(c => c.choice === 'banish')) break;
    // `reveal` is the author's Castle Option (spec §8's rule is the default:
    // OFF, nobody turned over). ON plays the endgame like Ireland S1 — every
    // banished player is revealed at the table, the same as any earlier one.
    const r = runRoundTable(ep, rng, { reveal });
    if (!r) break;                    // an empty castle has nobody to banish
    rounds.push({ ...r, endgame: true });
    ep++;
  }
  // A Dagger still reading 'held' has to mean "unspent, and its owner is still
  // standing" — the same reason headless.js settles them after every night.
  settleDaggers(ep);
  const result = resolvePot(ep);
  return { ...result, rounds, ballots, endEp: ep, reveal,
    // The one private meeting of the season, or null if the endgame never had
    // a room big enough to hold one. Handed back rather than left on `gs`
    // because the next season replaces `gs` wholesale.
    seer: gs.tr?.seer || null,
    banished: rounds.map(r => r.banished) };
}
