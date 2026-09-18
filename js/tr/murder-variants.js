// ══════════════════════════════════════════════════════════════════════
// tr/murder-variants.js — spec §7.4, and why a variant is not a wording
// ══════════════════════════════════════════════════════════════════════
//
// The show does not run the same night twice, and the catalogue is the reason
// one season is not the last one with different names in it. Seven shapes, and
// EXACTLY ONE of them per round — they are mutually exclusive by construction
// here rather than by convention at the call site, because "two twists landed
// on the same night" is the kind of state that is rare enough to survive every
// guard written over a population (Task 4's lesson, and Task 4's mutation
// survived precisely that way).
//
// ── THE DESIGN RULE THIS FILE IS BUILT ON ─────────────────────────────
//
// A variant that only changes the wording is not a variant. Each one must
// leave the room DIFFERENT EVIDENCE — a different subject set, reached by a
// different inference, at a different price — or it is a paint job on the
// standard night. The standard night's channel (`pushedThenDied`, in
// js/tr/deduction.js) indicts the people who named the victim at the table.
// Every variant below indicts somebody else, or nobody, or the same people
// wrongly:
//
//   standard      the pushers.                    (js/tr/deduction.js)
//   on-trial      the SPARED — names that were on the list and are still
//                 breathing. Enriched because the pact puts its own on the
//                 list as cover, which is the only reason this is evidence
//                 and not a false-positive generator.
//   plain-sight   PROXIMITY — who was within reach of the glass. There was no
//                 conclave, so there is also no conclave tension to trace and
//                 no overrule on the ledger: the one night the pact takes
//                 without arguing is the one night it costs them nothing.
//   face-to-face  THE VICTIM'S OWN READ, said out loud in the chapel. Public
//                 information nothing else in the game produces, because the
//                 dead do not otherwise speak.
//   dungeon       TWO channels at once and at different prices: the room
//                 suspects whoever walked back up the stair, and the person
//                 who walked back up it heard a voice — one private read,
//                 stat-gated and often wrong.
//   double        THE DEAD AGREEING. Two people are gone on the same night, and
//                 the room re-reads what BOTH of them had been saying out loud
//                 all season. A name they had both been pushing is two
//                 independent Faithful reads pointing at one person, and it
//                 can only be assembled from two bodies.
//   chalice       ONE NAME, AND IT IS THE RIGHT KIND OF NAME. No conclave: the
//                 pact has to FIND the poisoned chalice in the library first,
//                 and one of them pours it. The room remembers who handed the
//                 victim a drink — which is a single name rather than a set,
//                 and is how the show's own pourer was banished the next night.
//                 Sometimes nobody can recall it, and then the night says
//                 nothing at all.
//   hidden        NOTHING AT BREAKFAST. The victim and two decoys are kept
//                 away from the table, so the castle does not know who died
//                 until The Funeral that afternoon (js/tr/missions/funeral.js).
//                 The evidence is the funeral's: who was sure which coffin was
//                 the right one, and how.
//   death-match   THE ONE NIGHT THE PACT DOES NOT CHOOSE THE BODY. They choose
//                 FOUR, and a card game chooses which of the four. So the
//                 evidence is not about who was picked — it is about the two
//                 who were left at the end, sitting opposite each other, and
//                 the one who drew the life card in front of everybody. The
//                 room watched somebody beat the dead to it. That is the
//                 loudest coincidence in the format and it is usually just a
//                 coincidence, which is the whole scene.
//   name-your-own A TRAITOR DEATH THE ROOM MUST EXPLAIN. It emits nothing of
//                 its own: the ordinary channel fires and is systematically
//                 backwards, because the people who pushed the victim were
//                 the people who were right. The evidence a Faithful gets
//                 from this night is poison, and the pact pays for it in
//                 grudges instead.
//
// ── WHAT IT MAY NOT DO ────────────────────────────────────────────────
//
// * NO `public` AND NO `observed` ALIGNMENT WRITES. The three sanctioned
//   `public` writers (turret, reveal, a recruit shown the turret) and the
//   Seer's single `observed` are closed sets. Everything here is `deduced` or
//   `rumor`.
// * NOTHING CLEARS ANYBODY. Task 3's finding stands: `learn()` has no clearing
//   primitive outside the Seer's `observed` branch, and routing an exoneration
//   through `_assess` makes roughly seven readers in ten suspect the person it
//   clears. So a companion who comes back from the dungeon is SUSPECTED, never
//   cleared, and a victim's chapel plea accuses rather than absolves.
// * NOT ONE RNG DRAW. Selection, the list, the guest list at the dinner, the
//   companion, the sacrifice and every line are HASHED from state the season
//   already has (Task 6's technique, Task 5's default). A season in which
//   every round comes up `standard` therefore consumes exactly the draws the
//   engine consumed before this file existed, which is what makes the
//   equivalence arm in tests/tr-murder.test.js bit-identical rather than
//   merely close. Where a variant DOES fire it re-routes the stream, because
//   it kills a different number of people out of a different sized room — that
//   is the mechanism acting and it is the only thing that may move a band.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond } from '../bonds.js';
import { learn } from '../knowledge.js';
import { alignmentFactId, livingTraitors, livingFaithfuls } from './roles.js';
import { suspicionBoard } from './deduction.js';
import { lineFor, _lineHash } from './castle/lines.js';

/** A stable 0..1 from a string. No draw — see the header. */
const hash01 = (key) => _lineHash(key) / 4294967296;

/**
 * The catalogue, and the weights are a dramaturgical decision rather than a
 * measurement. Six twists at 5 apiece against a standard night at 70 puts
 * roughly two or three twisted nights in a nine-round season, which is the
 * shape the format actually runs — a twist every night is a format with no
 * baseline to twist away from.
 *
 * `needs` is a FEASIBILITY gate and not a weight: a double murder in a room of
 * six ends the season by arithmetic rather than by anybody playing, and a pact
 * of one cannot be made to name one of its own. The gates are written over the
 * living counts so they read the room at the moment the night starts.
 */
export const VARIANTS = [
  { id: 'standard', weight: 70, needs: () => true },
  // TWO NIGHTS AND A LIST OF THREE OR FOUR, so it wants a castle with names to
  // spare AND a season with a tomorrow in it: a list written on the last
  // mandated night has nothing to collect on, and an obligation the season
  // cannot keep is the twist promising a body it never delivers.
  { id: 'on-trial', weight: 5,
    needs: (l, t, f) => f >= 4 && l >= 6 && l > ((gs.tr?.endgameSize || 0) + 2) },
  { id: 'plain-sight', weight: 5,
    needs: (l, t, f) => l >= 5 && t >= 1 && f >= 2 },
  { id: 'face-to-face', weight: 5,
    needs: (l, t, f) => l >= 5 && f >= 2 },
  { id: 'dungeon', weight: 5,
    needs: (l, t, f) => l >= 6 && f >= 3 },
  // EIGHT AND NOT FIVE, and it is a reachability decision rather than a taste
  // one. The double's feasibility gate is by far the narrowest in the
  // catalogue — a room of eight with four Faithfuls and two Traitors in it
  // only exists in the first third of a season — so at a weight of five it
  // fired on 2.1% of rounds and the channel it leaves was live on 45 nights in
  // 400 seasons. That is the population size at which Task 4's mutation
  // survived. Eight buys the sample back without making the twist common.
  { id: 'double', weight: 8,
    needs: (l, t, f) => l >= 8 && f >= 4 && t >= 2 },
  // THREE LIVING TRAITORS AND NOT TWO, and it is the format rather than a
  // balance patch. The twist exists to THIN a pact that has got comfortable;
  // asking a pact of two to halve itself is a different mechanic, and it is
  // decisive rather than dramatic — at t >= 2 the Faithfuls' win rate went
  // 44.0 -> 57.0%, against 53.0% at t >= 3 on the same seeds.
  { id: 'name-your-own', weight: 5,
    needs: (l, t, f) => t >= 3 && l >= 5 },
  // A LIBRARY, A POURER AND A ROOM WITH DRINKS IN IT. Wants a pact that can
  // spare a lookout and a castle big enough that handing somebody a glass is
  // not the only thing that happened all evening.
  { id: 'chalice', weight: 5,
    needs: (l, t, f) => l >= 6 && t >= 1 && f >= 3 },
  // SEVEN, so that after the murder there are two decoys in coffins and at
  // least four people left to walk behind them. And only when The Funeral can
  // run the next afternoon: a hidden murder nobody ever reveals is not a twist.
  { id: 'hidden', weight: 5,
    needs: (l, t, f) => l >= 7 && f >= 3 && _funeralReady() },
  // FOUR CHAIRS AND A ROOM TO WATCH THEM. Four players go into the game and
  // three come out, so the castle needs enough people left over for the loss
  // to be a loss rather than a quarter of the cast; and the pact needs enough
  // Faithfuls to fill the four without being forced to seat itself.
  { id: 'death-match', weight: 5,
    needs: (l, t, f) => l >= 7 && f >= 4 && t >= 1 },
];

// WHETHER THE FUNERAL CAN RUN TOMORROW. js/tr/missions.js registers the probe
// (missions on, the bespoke catalogue on, and The Funeral in it); this file
// may not import the mission engine, which imports the murder engine.
let _funeralReady = () => false;
export function funeralReady() { return _funeralReady(); }
export function _setFuneralProbe(fn) { _funeralReady = typeof fn === 'function' ? fn : () => false; }

export const VARIANT_IDS = VARIANTS.map(v => v.id);

// Test seam. Nothing in the show may call this; it exists so the equivalence
// arm can play a season with the catalogue off and diff it byte-for-byte
// against the engine as it stood before this file. Same contract as
// `_setVoteSuspicionMult` and `evidence` in playTraitorsSeason.
let _enabled = true;
export function _setVariantsEnabled(on = true) {
  const prev = _enabled;
  _enabled = on !== false;
  return () => { _enabled = prev; };
}
export function variantsEnabled() { return _enabled; }

/**
 * The other seam, and it exists for the ablation Task 3 established as the
 * honest way to report a mechanic like this one: a variant changes BOTH what
 * happens (a second body, a Traitor's body, no conclave) and what the room is
 * told about it, and those two move the calibration bands for entirely
 * different reasons. With the reads off, the catalogue still runs and the
 * evidence channels are silent, which separates the two.
 */
let _reads = true;
export function _setVariantReadsEnabled(on = true) {
  const prev = _reads;
  _reads = on !== false;
  return () => { _reads = prev; };
}

/**
 * Which shape tonight takes. EXACTLY ONE, always, and returned as an id from
 * `VARIANT_IDS` — the mutual exclusion is this function's return type rather
 * than a rule somebody has to remember downstream.
 *
 * NIGHT ONE IS ALWAYS STANDARD. It has no Round Table behind it, so half the
 * catalogue has nothing to read and the other half would be leaving evidence
 * about a round that does not exist. The plan already records that night one
 * deliberately leaves no round record; this is the same fact seen from here.
 *
 * THE KEY DELIBERATELY EXCLUDES WHO THE TRAITORS ARE. A variant is a
 * production decision, and if the catalogue were a function of the pact's
 * identity then the shape of the night would itself be a tell — the room could
 * read the cast list backwards out of which twists the season ran. The episode
 * and the sorted living room are both things a viewer can see.
 *
 * AND IT EXCLUDES THE POT, which it did not on the first draft. The pot is
 * mission money, so keying on it made the twist calendar a function of whether
 * the missions ran — and took `tests/tr-missions.test.js`'s
 * missions-grant-nothing arm red on the first season it played, correctly.
 * That guard has now been narrowed four times and it is not going to be
 * narrowed a fifth for a salt that bought nothing: the living room already
 * diverges by seed from night two onward, because night one's murder does.
 */
export function pickVariant(ep, living = null) {
  const alive = [...(living || gs.activePlayers || [])].sort();
  if (!_enabled || ep < 2) return 'standard';
  const t = livingTraitors(ep).length;
  const f = livingFaithfuls(ep).length;
  // A DOUBLE MAY NOT OVERSHOOT THE FIRE ROUND. A Double takes two, so from a
  // room one above the endgame size it would leave the finale a person short of
  // what the author set (a "final four" opening on three). Held back here — for
  // a pinned Double too, since overshooting the set finale is never what "final
  // four" asked for — so the last banishment, not a Double, sets the finale.
  const egSize = (gs.tr && gs.tr.endgameSize) || 0;
  const doubleOvershoots = egSize > 0 && alive.length - 2 < egSize;
  // A SCHEDULED SHAPE WINS, when the living room can support it. The show
  // writes `gs.tr.murderSchedule` (episode -> variant id) from the
  // episode-format designer via js/tr-run.js; an entry here forces that
  // night's shape instead of rolling for one. A shape the room cannot support
  // (its own `needs` gate — a Double needs a full early castle) falls back to
  // a plain murder rather than being silently swapped for a different twist:
  // the author asked for that shape or for a standard night, never a surprise
  // third thing. Night one is already handled above and ignores the schedule.
  const scheduled = gs.tr && gs.tr.murderSchedule && gs.tr.murderSchedule[ep];
  if (scheduled) {
    const want = VARIANTS.find(v => v.id === scheduled);
    if (want && want.id === 'double' && doubleOvershoots) return 'standard';
    return (want && want.needs(alive.length, t, f)) ? want.id : 'standard';
  }
  // AUTO-DOUBLE CAN BE SWITCHED OFF. A Double is the one auto shape that
  // changes a night's body count (three leave, not two), so a viewer who plans
  // around the timeline gets surprised by it. With `gs.tr.noAutoDouble` set
  // (js/tr-run.js, from the Castle Options toggle) it is dropped from the
  // random pool — but a Double the author PINNED still runs, because the
  // schedule is honoured above this line.
  // ── NOTHING FIRES BY CHANCE THAT THE AUTHOR DID NOT TICK ───────────
  //
  // Reported twice, the second time as a question rather than a bug: "why is a
  // Traitor murdered?" The screen was narrating `name-your-own` correctly by
  // then — the pact told to name one of its own — and the answer was that it
  // had simply come up in the weighted draw, on 2.4% of nights and in about
  // one season in six. Which is exactly the objection: "forbid them from
  // randomly activating unless I checked them to do it."
  //
  // So the random pool is now OPT-IN, and empty by default. `gs.tr.randomMurderTwists`
  // is the list of shapes the author allowed to come up on their own; anything
  // not on it can still be PINNED to a night from the timeline, which is
  // handled above this line and is untouched. A season that ticks nothing
  // plays nothing but standard nights and whatever it scheduled.
  //
  // Not a weight change: a shape the author does want stays exactly as likely
  // as it was, because the weights are read off the same table.
  const allowed = (gs.tr && gs.tr.randomMurderTwists) || [];
  const noAutoDouble = !!(gs.tr && gs.tr.noAutoDouble);
  const pool = VARIANTS.filter(v => v.needs(alive.length, t, f)
    && (v.id === 'standard' || allowed.includes(v.id))
    && !(noAutoDouble && v.id === 'double')
    && !(v.id === 'double' && doubleOvershoots));
  const total = pool.reduce((s, v) => s + v.weight, 0);
  let roll = hash01(`murder-variant|${ep}|${alive.join(',')}`) * total;
  for (const v of pool) {
    roll -= v.weight;
    if (roll < 0) return v.id;
  }
  return 'standard';
}

// ══════════════════════════════════════════════════════════════════════
// THE PIECES EACH VARIANT NEEDS, all hashed and all pure
// ══════════════════════════════════════════════════════════════════════

/** Deterministic order over a set of names, keyed. Replaces a shuffle. */
function _hashOrder(names, key) {
  return [...names].sort((a, b) => hash01(`${key}|${a}`) - hash01(`${key}|${b}`));
}

/** How it was done, in public, at a table full of people. */
export const PLAIN_SIGHT_METHODS = [
  'a poisoned glass',
  'a kiss on the cheek',
  'an embrace at the door',
];

/**
 * Who was within reach when it happened. The actor is always in it — they had
 * to be — plus two other guests, so the room's read is one name in three
 * rather than a name.
 *
 * HASHED INTO THE SORTED ROOM AND NOT PER PLAYER, which is Task 5's finding
 * applied to a different draw: a per-player hash is fixed forever, so the same
 * names would sit at the poisoner's elbow in every season ever played, and any
 * name that survives to episode seven more often when wearing a cloak would
 * hand that correlation to this channel for nothing.
 */
export function dinnerNeighbours(ep, actor, victim) {
  const pool = (gs.activePlayers || []).filter(n => n !== actor && n !== victim).sort();
  const picked = [];
  for (let i = 0; i < 2 && pool.length; i++) {
    const idx = Math.floor(hash01(`dinner|${ep}|${victim}|${i}|${pool.join(',')}`) * pool.length);
    picked.push(pool.splice(Math.min(idx, pool.length - 1), 1)[0]);
  }
  return [actor, ...picked].sort();
}

/**
 * What the victim says in the chapel before it happens: the top of their own
 * suspicion board, or nothing at all.
 *
 * `null` IS A REAL AND COMMON ANSWER and the prose is keyed on it. A Faithful
 * murdered in episode three has usually formed no belief worth the name, and a
 * board of zeroes must not print as an accusation — that is this plan's
 * standing requirement, made unrepresentable rather than asserted after the
 * fact.
 */
export function chapelPlea(victim, ep) {
  const board = suspicionBoard(victim, ep).filter(e => e.score > 0);
  return board.length ? board[0].name : null;
}

/**
 * How often the second name down the dungeon stair is one of the pact's own.
 *
 * Same argument as `TRIAL_COVER_P` (js/tr/on-trial.js) and the same reason it
 * is not 1: sending a
 * fellow down and bringing them back up is the format's own cover move, and it
 * is what stops "who came back" being a channel that names only Faithfuls.
 */
const DUNGEON_COVER_P = 0.45;

/** The other name on the stair. Dies with nobody; comes back up at dawn. */
export function dungeonCompanion(ep, victim) {
  const fellows = livingTraitors(ep).filter(n => n !== victim);
  const others = (gs.activePlayers || []).filter(n => n !== victim && !fellows.includes(n));
  if (fellows.length && hash01(`dungeon-cover|${ep}|${victim}`) < DUNGEON_COVER_P) {
    return _hashOrder(fellows, `dungeon-fellow|${ep}|${victim}`)[0] || null;
  }
  return _hashOrder(others, `dungeon-other|${ep}|${victim}`)[0] || null;
}

/**
 * What the companion heard on the stair, and how often they got it right.
 *
 * Proportional to intuition and NEVER certain, because the alternative is a
 * second oracle in a game that has decided it will have exactly one. A wrong
 * read names a living player who was nowhere near the place, which is the same
 * shape of mistake the rest of the deduction engine makes and therefore
 * indistinguishable from one at the ballot.
 *
 * Returns `null` when the companion is themselves in the pact: they know
 * exactly what happened down there and have nothing to work out.
 */
export function dungeonVoice(ep, companion, victim) {
  if (!companion) return null;
  const traitors = livingTraitors(ep).filter(n => n !== companion && n !== victim);
  if (!traitors.length) return null;
  if (livingTraitors(ep).includes(companion)) return null;
  const st = pStats(companion);
  const right = hash01(`stair|${ep}|${companion}|${victim}`)
    < ((st.intuition || 5) / 10) * 0.5;
  if (right) return { name: _hashOrder(traitors, `stair-right|${ep}|${companion}`)[0], right: true };
  const wrong = (gs.activePlayers || [])
    .filter(n => n !== companion && n !== victim && !traitors.includes(n));
  if (!wrong.length) return null;
  return { name: _hashOrder(wrong, `stair-wrong|${ep}|${companion}`)[0], right: false };
}

/**
 * THE SEARCH FOR THE CHALICE, and whether they found it in time.
 *
 * The show's own pact lost most of the night to a shelf of Shakespeare. The
 * reader of the pact does the looking, and a pact with nobody bookish in it
 * can come back empty-handed — which is the one night the Traitors kill
 * nobody without a Shield being involved.
 */
export function chaliceSearch(ep, pact) {
  const searcher = [...pact].sort((a, b) =>
    ((pStats(b).mental || 5) - (pStats(a).mental || 5)) || (a < b ? -1 : 1))[0];
  if (!searcher) return { searcher: null, found: false };
  const p = Math.max(0, Math.min(1, 0.35 + ((pStats(searcher).mental || 5) / 10) * 0.55));
  return { searcher, found: hash01(`chalice-find|${ep}|${searcher}`) < p };
}

/**
 * WHO POURS IT. The one the room would not look at twice for carrying a glass:
 * the sociable one. That is also exactly who the room remembers afterwards.
 */
export function chalicePourer(ep, pact, searcher) {
  const others = pact.filter(n => n !== searcher);
  const pool = others.length ? others : pact;
  return [...pool].sort((a, b) =>
    ((pStats(b).social || 5) - (pStats(a).social || 5)) || (a < b ? -1 : 1))[0] || null;
}

/** Whether the room can put a face to the drink by morning. */
export function chaliceRemembered(ep, pourer, victim) {
  return hash01(`chalice-recall|${ep}|${pourer}|${victim}`) < 0.65;
}

/**
 * LAST NIGHT'S HIDDEN MURDER, or null: the round that just closed ran
 * `hidden`, and somebody died on it. The Funeral and the morning both read it.
 */
export function hiddenMurderFor(ep) {
  const rounds = gs.tr?.rounds || [];
  const r = rounds[rounds.length - 1];
  // A hidden night, or a chalice whose poison was the slow kind: both leave
  // the castle with coffins to open and nobody named.
  const hides = !!r && (r.variant === 'hidden'
    || (r.variant === 'chalice' && r.variantData?.slow));
  if (!r || r.ep !== ep - 1 || !hides || !r.variantData) return null;
  const victim = r.murdered || null;
  if (!victim) return null;
  return { victim, decoys: [...r.variantData.decoys], coffins: [...r.variantData.coffins] };
}

/**
 * The two people kept away from breakfast with the victim. Hashed out of the
 * sorted room, like the dinner guests, and a Traitor can be one of them: the
 * pact knows which coffin is empty, and that is the funeral's whole dilemma.
 */
export function hiddenDecoys(ep, victim) {
  const pool = (gs.activePlayers || []).filter(n => n !== victim).sort();
  // FOUR in a big castle, so the procession has clues to work through before
  // the coffins; TWO in a small one, which leaves at least four mourners.
  const want = pool.length >= 12 ? 5 : pool.length >= 10 ? 4 : 2;
  return _hashOrder(pool, `hidden-decoys|${ep}|${victim}|${pool.join(',')}`).slice(0, want);
}

/**
 * Made to name one of their own. The pact's loudest voice signs it and the
 * quietest relationship pays for it: the fellow with the weakest bond to the
 * decider, broken by a stable per-pair impression.
 *
 * NOT A DRAW, and not `formPreference` either — that function targets the
 * living Faithfuls by definition and cannot be pointed at the pact. The score
 * is bond-led on purpose: this is the one night the format asks the question
 * Task 6 asks at the endgame, and it should be answered by the same thing,
 * which is who these people can stand.
 */
export function chooseSacrifice(ep) {
  const pact = livingTraitors(ep);
  if (pact.length < 2) return { decider: null, victim: null };
  const decider = [...pact].sort((a, b) =>
    ((pStats(b).social || 5) - (pStats(a).social || 5)) || (a < b ? -1 : 1))[0];
  const fellows = pact.filter(n => n !== decider);
  const scored = fellows.map(n => ({
    name: n,
    score: getBond(decider, n) / 10 + (hash01(`sacrifice|${ep}|${decider}|${n}`) - 0.5),
  })).sort((a, b) => a.score - b.score);
  return { decider, victim: scored[0].name };
}

// ── THE DEATH MATCH ───────────────────────────────────────────────────
//
// From the wiki (thetraitors.fandom.com/wiki/Death_Match, UK3 / CZ2 / PL3 /
// NZ3 / IN2) rather than from memory: "The Traitors pick four people (this may
// include themselves) to play a game of cards... One of the players has a life
// card, which allows the player to leave the game... Play continues until there
// are two players left. At this point, all eight cards will be arranged
// face-down in a circle, and players take turns to draw until a contestant
// finds the Life Card, at which point the Traitors will murder the losing
// contestant face-to-face."
//
// THE PACT AIMS AND THE CARDS DECIDE, and that is the only murder in this
// engine where those are two different things. Three nights in four the person
// they wanted is still at breakfast — and somebody they had no quarrel with is
// not.

/**
 * How often the pact seats one of its own at the table.
 *
 * Lower than `TRIAL_COVER_P` (js/tr/on-trial.js) and it has to be: a name on a
 * list is a name the pact can simply decline to choose tomorrow, but a chair in
 * this game is a one-in-four chance of being murdered by your own side. A pact does it to look unafraid, and a pact that did it every
 * time would be a pact killing itself twice a season.
 */
const DM_COVER_P = 0.3;

/**
 * The four chairs. Returns `{ players, cover }` — `players` in the seating
 * order the castle sees, `cover` the fellow seated as cover, or null.
 *
 * The target is always in it; that is what the pact is buying. The other
 * chairs are filled the way the show fills them — with people nobody would
 * miss arguing about, which here means the names furthest from the pact's own
 * bonds, so a pact does not seat its closest ally by accident.
 */
export function buildDeathMatch(ep, target, pact = null) {
  const fellows = (pact || livingTraitors(ep)).filter(n => n !== target);
  const alive = (gs.activePlayers || []).filter(n => n !== target);
  const seated = [target];
  const wantCover = fellows.length && hash01(`dm-cover|${ep}|${target}`) < DM_COVER_P;
  if (wantCover) seated.push(_hashOrder(fellows, `dm-fellow|${ep}|${target}`)[0]);
  const others = alive.filter(n => !seated.includes(n) && !fellows.includes(n));
  const warmth = n => fellows.reduce((s, t) => s + Math.max(0, getBond(t, n)), 0);
  const fill = [...others].sort((a, b) =>
    (warmth(a) - warmth(b)) || (hash01(`dm-fill|${ep}|${a}`) - hash01(`dm-fill|${ep}|${b}`)));
  for (const n of fill) {
    if (seated.length >= 4) break;
    seated.push(n);
  }
  if (seated.length < 4) return { players: [], cover: null };
  return {
    players: _hashOrder(seated, `dm-seat|${ep}|${target}`),
    cover: wantCover ? seated[1] : null,
  };
}

/**
 * The game itself, hashed rather than drawn (see the header: not one rng draw
 * in this file). Returns `{ rounds, safe, finalists, loser }`.
 *
 * NEARLY ALL LUCK, AND THE REST IS WATCHING. The only thing a player brings to
 * a face-down card is whether they can read the person being made to offer it,
 * so intuition moves the odds by a few points and nothing else moves them at
 * all. A version where the sharp player survives would be a version where the
 * pact can aim after all, and then the twist is a murder with a longer scene
 * in front of it.
 */
export function playDeathMatch(ep, players) {
  const weight = n => {
    const st = pStats(n);
    return Math.max(0.35, 1 + ((st.intuition || 5) - 5) * 0.08 + ((st.boldness || 5) - 5) * 0.03);
  };
  const pickLucky = (pool, key) => {
    const total = pool.reduce((s, n) => s + weight(n), 0);
    let roll = hash01(`${key}|${pool.join(',')}`) * total;
    for (const n of pool) { roll -= weight(n); if (roll <= 0) return n; }
    return pool[pool.length - 1];
  };
  const rounds = [];
  const safe = [];
  let table = [...players];
  for (let r = 0; table.length > 2; r++) {
    const won = pickLucky(table, `dm-round|${ep}|${r}`);
    rounds.push({ players: [...table], won });
    safe.push(won);
    table = table.filter(n => n !== won);
  }
  // THE CIRCLE. Eight cards face down and one of them is the life card, so the
  // number turned over before it appears is the whole of the last scene: the
  // show's own final was won "with three cards to go".
  const won = pickLucky(table, `dm-final|${ep}`);
  // HOW MANY WERE STILL FACE DOWN when it turned up, which is how the show
  // says it: "Leon won with three cards to go."
  const toGo = 1 + Math.floor(hash01(`dm-draws|${ep}|${table.join(',')}`) * 7);
  rounds.push({ players: [...table], won, toGo });
  safe.push(won);
  return { rounds, safe, finalists: [...table], loser: table.find(n => n !== won) || null };
}

// ══════════════════════════════════════════════════════════════════════
// PROSE
// ══════════════════════════════════════════════════════════════════════
//
// EVERY POOL IS KEYED ON THE FACT ITS SENTENCES ASSERT. This plan's standing
// requirement has now caught the same defect class four times, always by
// somebody dumping seasons and reading them and never by an assertion, so the
// pools below are split wherever a sentence turns on a fact that is sometimes
// false: whether the chapel plea named anybody, whether the death list had one
// spared name or two, and whether the companion came back up the stair having
// worked anything out. A line may not be moved between two of these pools.
//
// No pronouns anywhere in them, deliberately: Task 4 shipped `{They}` to 100%
// of one pool's firings because `_render` had no capitalised forms, and a pool
// that substitutes only names cannot make that mistake.
export const VARIANT_LINES = {
  // ── ON TRIAL: TWO NIGHTS, AND FOUR FACTS TO KEEP STRAIGHT ──────────
  //
  // The pools are split on what actually happened, which here means: did the
  // list get written, did the day take it apart, did the pact get the name it
  // wrote the list around, and did the room empty it. A sentence about a plan
  // that survived the day may not be printed over one the table dismantled.
  'on-trial-named': [
    'Three names go down on paper and nobody goes anywhere. {a}, {b} and {c} will find out at breakfast that one of them has until tomorrow night.',
    'No murder tonight. A list instead — {a}, {b}, {c} — and a whole day for the three of them to live in front of everybody.',
    'The pact writes {a}, {b} and {c}, and then goes to bed. Every other bed in the castle is safe tonight, which is the part the room will not thank them for.',
    'Three names, one of whom does not see the night after this one. {a}, {b} and {c} get a day to work out which.',
  ],
  'on-trial-named-four': [
    'Four names and one night to sleep on them: {a}, {b}, {c} and {d}. The castle wakes up whole and finds out it has a list.',
    'Nobody is murdered. Instead the pact writes {a}, {b}, {c} and {d}, and hands the castle a day of arithmetic.',
    'The list runs to four — {a}, {b}, {c}, {d} — which is four people who now have to be interesting in front of a room that knows.',
    'They write {a}, {b}, {c} and {d}, and leave the choosing until tomorrow. It is the one night in this castle where a locked door means nothing.',
  ],
  'on-trial-taken': [
    'They wrote {victim} down last night and they come back for {victim} tonight. A day of it did not change a thing.',
    'The list had a day to be argued with. {victim} is still the name on it, and now {victim} is not on anything.',
    'Nothing the castle did all day moved the pact off {victim}. The list closes exactly where it opened.',
  ],
  'on-trial-settled': [
    'The name they wrote the list around is still at breakfast. {victim} is not, and was only ever on that paper to make three.',
    'The day took {aim} out of their reach, so the pact settled for {victim} — which is what a list is for.',
    'They wanted {aim}. They got {victim}, because those were the names left, and a list is a promise you have to keep.',
    'The room saved {aim} without ever knowing it had. {victim} paid for it.',
  ],
  // THERE IS NO `on-trial-emptied` POOL, and the absence is a decision. The
  // branch exists in js/tr/murder.js (a list with nothing takeable left on it)
  // and it is unreachable by construction: one banishment happens between the
  // two nights, a list is three or four names, and a pact wiped out overnight
  // never reaches the collection at all because `_night` returns above it.
  // Measured at 0 firings in 159 trials. Writing four sentences for it would
  // be this project's signature bug — content written, registered, and never
  // once printed — so the branch takes the night with no line rather than
  // carrying a pool nobody will ever read.
  // NOTE THE SHAPE OF THESE FOUR. `{method}` is never sentence-initial, because
  // the methods are written lower case ('a poisoned glass') and two of the
  // first drafts printed 'an embrace at the door, in a room of people
  // laughing' with a lower-case opening on 100% of their firings. And none of
  // them says the victim TRUSTED the hand: the conclave penalises murdering
  // somebody you are warm with, so the victim usually does not, and the
  // sentence would have been false far more often than true. Both found by
  // dumping seasons and reading them, neither by an assertion.
  'plain-sight': [
    'No conclave, no cloaks, no candle. {who} was at the dinner table with everybody else, and {victim} accepts {method} without a second thought.',
    'It was {method}, in a room of people laughing, and nobody in it will admit to having watched.',
    'It happened at the table: {method}, passed across in front of the whole castle, and the castle saw nothing.',
    'The pact did not meet tonight. {who} did not need it — {method}, and {victim} said thank you.',
  ],
  // THE FIRST LINE OF EACH CHAPEL POOL USED TO SAY ONE NAME THREE AND FOUR
  // TIMES: "They take B to the chapel and let B speak first. B has nothing to
  // say. B never worked any of it out." Swept over 1,200 seasons it was 4x in
  // 18 sentences and 3x in 34 more, across these two templates and no others.
  // `{vObj}`/`{vSub}`/`{vSubCap}` are the victim's pronouns, expanded by
  // `variantLine` AFTER the pool has been chosen — see the note there, the
  // choice must not move.
  'chapel-named': [
    'They take {victim} to the chapel and let {vObj} speak first. The last thing {vSub} says is a name, and the name is {plea}.',
    'A candle, a locked door, and one sentence allowed. {victim} spends it on {plea}.',
    '{victim} is given the courtesy of a last word and does not waste it: {plea}, said clearly, in front of everybody.',
    'The chapel door shuts on {victim} and the castle hears {plea} through it.',
  ],
  'chapel-silent': [
    'They take {victim} to the chapel and let {vObj} speak first. {vSubCap} has nothing to say, and never worked any of it out.',
    'A candle, a locked door, and one sentence allowed — and {victim} cannot think of a single name to put in it.',
    '{victim} is given a last word and gives it back. There was never a read to hand on.',
    'The chapel door shuts on {victim} in silence. Whatever {victim} knew, it was not a name.',
  ],
  'dungeon-back': [
    'Two went down. {companion} came back up.',
    '{victim} and {companion} were taken to the dungeon and only one set of footsteps came back. They were {companion}\'s.',
    'The stair takes two and returns one, and the one it returns is {companion}, who is asked about it all morning.',
    '{companion} spent the night underground beside {victim} and is at breakfast. {victim} is not.',
  ],
  // EVERY ONE OF THESE ASSERTS THE SAME FACT -- that the pact wanted two
  // different people and got both -- and the fact is guaranteed by
  // construction rather than by a pool key, because the second name IS the
  // overruled Traitor's own target and a night with no overrule runs standard
  // instead (see `_shapeNight`). The first draft had a second pool for the
  // unanimous case; it fired three times in eight hundred seasons and reached
  // two of its four lines, which is a pool written for a state that does not
  // happen. Removing the state was the fix, not lowering the coverage bar.
  'double': [
    'Two chairs, and the castle counts them twice before it believes it.',
    '{a} and {b}, in one night. The Traitors did not have to choose and it shows.',
    'The pact wanted two different people dead and was told it could have both.',
    'Two names, one night. Nobody in the room has to be argued out of anything.',
  ],
  // {a}, {b} and {c} are the three coffins in their funeral order, so no line
  // says which of them is the body. The audience saw the conclave; the line is
  // about the castle not knowing.
  'hidden': [
    'Three places are empty at breakfast: {a}, {b} and {c}. Only one of them is dead, and nobody at the table is told which.',
    '{a}, {b} and {c} do not come down. Two of them are alive somewhere in the castle, and the room will not find out which two until the funeral.',
    'The castle counts three empty chairs and one murder, and has to eat breakfast without knowing whose chair is whose.',
    'Nobody is named this morning. {a}, {b} and {c} are simply not there, and the host will not say more until the afternoon.',
  ],
  // The slow kind: the drink works over a day, so the castle is not told.
  'chalice-slow': [
    'No conclave. {finder} finds the chalice among the Shakespeare, {who} pours it, and {victim} drinks it without looking up. It is the slow kind, and the castle will not be told until the funeral.',
    'They never meet. {who} hands {victim} a fizzy glass at the end of the evening. Nobody falls down; it takes a day, and the room will find out at a graveside.',
    '{finder} turns the library over and comes out with the chalice. {who} pours, {victim} says thank you, and the poison takes its time.',
    'It is done with a drink and a smile. {victim} will not be at breakfast, and neither will the others whose chairs are turned over, because nobody is being told who drank what.',
  ],
  // The chalice: found, poured, and drunk without a second thought.
  'chalice': [
    'No conclave. {finder} finds the chalice behind a row of Shakespeare, {who} fills it with something fizzy, and {victim} takes it without looking at it.',
    'They never meet. {finder} turns the library over for it, {who} pours at the end of the evening, and {victim} says thank you.',
    'The pact spends the night among the books. {finder} comes out with the chalice, {who} carries it across to {victim}.',
    'It is done with a drink and a smile: {finder} found it, {who} poured it, and {victim} drank it in a room full of people.',
  ],
  // The night the pact loses to a bookshelf.
  'chalice-lost': [
    'The pact turns the library over twice and never finds the chalice. Nobody is murdered, and nobody can be told why.',
    'A shelf of Shakespeare, an hour of pulling books out, and no poison in any of them. The castle wakes up whole.',
    '{who} is still looking for it when the candles burn down. There is no murder tonight and no explanation for it.',
    'The chalice stays where it was hidden. The pact goes to bed with nothing done.',
  ],
  // Five missing: the procession will clear some of them before the coffins.
  'hidden-many': [
    '{n} places are empty at breakfast. One of them is dead, and nobody at the table is told which.',
    'The castle counts {n} empty chairs and one murder. The rest of the missing are alive somewhere, waiting.',
    'Nobody is named this morning. {n} people are simply not there, and the host will say nothing until the funeral.',
    '{n} cups turned over at one breakfast, and only one of them means what it usually means.',
  ],
  // NO ERA CLAIM IN ANY OF THESE, and that is the second design this line went
  // through. The first draft said "{victim} was in the turret with {decider}
  // on the first night" -- false of a recruit, which is the same sentence
  // Task 5 had to key its Seer pool on, and the defect was found here the same
  // way, by dumping seasons and reading them. Keying it produced a
  // `name-your-own-turned` pool that fired FOUR TIMES IN EIGHT HUNDRED
  // SEASONS: recruitment only opens when the pact is thin, and this variant
  // needs three living Traitors, so a pact of three containing a recruit
  // barely exists. A four-line pool for a state that does not happen is the
  // defect one paragraph up, so the claim was removed instead of keyed. What
  // is left is true of an original and a recruit alike.
  'name-your-own': [
    'The pact is made to write one of its own names down, and {decider} is the one holding the pen.',
    '{decider} signs for it, and has to look at {victim} while doing it.',
    'They are told the murder must come from inside the cloaks. {victim} is the answer, and the room will spend a week getting it wrong.',
    'A Traitor dies tonight, and the castle will read it as a Faithful and reason accordingly.',
  ],
  // THREE POOLS AND THE SPLIT IS THE FACT EACH ONE ASSERTS, which on this
  // night is the same fact three ways: whether the cards agreed with the pact.
  // A line about a plan that worked may not be printed over a night the pact
  // lost, and the `missed` pool is the common case rather than the exception —
  // the target sits down with three other people and walks away three times in
  // four.
  'death-match-aimed': [
    'Four chairs, eight cards, and the one the Traitors came for is the one who runs out of them. {victim} loses the last draw to {winner} and does not see the morning.',
    'The cards went exactly where the pact wanted them to go. {winner} turns over the life card, {victim} turns over nothing, and the castle calls it bad luck.',
    '{victim} and {winner} played the circle down to the last few cards. It was the right name, arrived at the wrong way, and it counts the same.',
    'They seated four and needed one. {victim} was the one, and the deck did not have to be asked twice.',
  ],
  'death-match-missed': [
    'The pact picked four and the cards picked one of the other three. {victim} loses to {winner} on the last draw, having never been the point of the evening.',
    '{winner} finds the life card and {victim} does not, and somewhere behind a mask a Traitor is watching the wrong person walk away.',
    'Four sat down. The one the Traitors wanted is at breakfast, and {victim} is not.',
    'It was a game and games do not take instructions. {victim} goes, {winner} stays, and the plan goes in the fire with the cards.',
  ],
  'death-match-fellow': [
    'They seated one of their own to look brave about it. The deck took {victim} at the last card, and the pact has to murder {victim} in front of everybody or explain why not.',
    'A cloak sat down at that table for cover and got the cover it asked for. {winner} wins the circle, and the Traitors kill one of themselves to keep the game honest.',
    'The pact lost a member to eight pieces of card tonight, and will spend the rest of the season being congratulated for the murder.',
    '{victim} was seated as decoration. The castle will read that body as a Faithful, and the pact will let it.',
  ],
};

/**
 * The sentence for tonight, and the POOL KEY alongside it.
 *
 * The key is returned and recorded because a prose guard that only reads the
 * rendered sentence can be made to agree with itself. Measured: a mutation
 * forcing every chapel scene through the `chapel-named` pool was GREEN — with
 * no name to substitute, `{plea}` rendered as the empty string, the sentence
 * still contained no wrong name, and no assertion over the text could see that
 * a silent chapel had just been narrated as an accusation. That is Task 5's
 * "a prose guard that only agreed with itself" in a new place.
 *
 * What actually binds is that each pool asserts a DIFFERENT FACT and the key
 * must agree with the fact it asserts. So the key travels with the line onto
 * the round record, the guard checks the key against season state, and it
 * checks the rendered line really came out of that pool — which is what stops
 * the key becoming a label nobody honours.
 *
 * Consumes no rng — see `lineFor`.
 *
 * THE VICTIM'S PRONOUNS ARE EXPANDED AFTER THE POOL IS READ, and the order is
 * the whole point. `lineFor` folds every sub VALUE into the hash that picks the
 * line, so handing it three more entries would have chosen a different sentence
 * for every chapel, dungeon and dinner table in every season ever played — a
 * pool-wide redistribution wearing the clothes of a prose fix, which is the
 * exact trap js/tr/castle/lines.js was written to avoid. Passing them
 * separately afterwards leaves the choice bit-identical and changes only the
 * words inside the two templates that asked for them.
 */
export function variantLine(kind, ep, subs) {
  const pool = VARIANT_LINES[kind];
  if (!pool) return null;
  let text = lineFor(pool, `murder-variant|${kind}|${ep}`, subs);
  if (subs?.victim && /\{v(Sub|Obj|SubCap)\}/.test(text)) {
    const p = pronouns(subs.victim);
    text = text.split('{vObj}').join(p.obj)
      .split('{vSubCap}').join(p.Sub)
      .split('{vSub}').join(p.sub);
  }
  return { key: kind, text };
}

// ══════════════════════════════════════════════════════════════════════
// THE EVIDENCE — the point of the whole file
// ══════════════════════════════════════════════════════════════════════

/**
 * Prices, and every one of them is below the ceiling on purpose.
 *
 * `pushedThenDied` — the standard night's channel — is priced AT
 * ALIGNMENT_CRED_CEILING and earned it with a dose-response sweep against a
 * matched noise arm. Nothing here has been swept like that, so nothing here is
 * allowed to shout as loudly as the thing that has. These sit at the `rumor`
 * tier except the two that are genuinely sharper than a room-wide murmur: the
 * intersection of two victims' pushers, which is a much smaller set arrived at
 * by the same inference the ceiling was bought for, and the voice on the
 * dungeon stair, which is one person who was actually there.
 */
const V = {
  spared: 0.30,        // you were on the list and you are still here
  proximity: 0.28,     // you were within reach of the glass
  poured: 0.42,        // you put that glass in their hand, and the room saw
  plea: 0.34,          // the dead named you
  companion: 0.30,     // you went down and you came back
  stair: 0.55,         // you heard it yourself — one person, one read
  dyingAgreement: 0.40,// two of the dead had been naming you, independently
  lastCard: 0.26,      // you were the other chair, and you got up from it
};

/**
 * Every name `who` publicly accused or voted for, across the WHOLE season.
 *
 * Public record only — accusations and banishment ballots — because the room
 * assembling this after two funerals has never had access to anything else.
 * The whole season rather than a window: the point of the channel is that two
 * complete records are being laid over each other, and a two-round window
 * leaves nothing to overlap.
 */
function _namedBy(who) {
  const set = new Set();
  for (const r of (gs.tr?.rounds || [])) {
    for (const a of (r.accusations || [])) if (a.accuser === who) set.add(a.target);
    for (const b of (r.ballots || [])) {
      if (b.channel === 'banishment' && b.voter === who) set.add(b.voted);
    }
  }
  return set;
}

function _room(exclude = []) {
  return (gs.activePlayers || []).filter(n => !exclude.includes(n));
}

/**
 * One belief per living observer about `subject`, at `price`.
 *
 * THE SUBJECT MUST STILL BE IN THE CASTLE, and this is not tidiness — it was
 * measured. The double murder's channel reads two dead players' season-long
 * public records, and without this filter most of the names it indicted were
 * people who had already been banished or murdered. Over 1,200 seasons that
 * dropped it from 43.2% Traitor to 23.8% against a room of 21.6% — a channel
 * that looked like chance and was in fact a real channel wrapped in noise
 * (z = 0.88 becomes z = 3.70 with the filter on).
 *
 * It is applied HERE, to every channel in the file, rather than in the branch
 * where it was found. The same defect is latent in all of them: a spared name,
 * a dinner guest and a dungeon companion can all have left the castle by the
 * following breakfast, and a room that starts suspecting the departed is a
 * room diluting its own board. Fixing the instance would not have fixed the
 * class.
 */
function _tellRoom(subject, price, source, ep, rng, formed, kind, roundEp) {
  if (!subject) return;
  if (!(gs.activePlayers || []).includes(subject)) return;
  for (const observer of _room([subject])) {
    const belief = learn(observer, alignmentFactId(subject), {
      source, sourceType: price >= 0.5 ? 'deduced' : 'rumor', confidence: price, ep, rng,
    });
    if (belief) formed.push({ observer, subject, ep: roundEp, kind });
  }
}

/**
 * Evidence source 5 — what the SHAPE of last night tells the room.
 *
 * Runs beside `murderEvidence` and under the same once-guard, for the same
 * reason and with the same equality rather than `>=`: `round.ep >= ep` stops a
 * same-episode re-read and then happily re-emits an old round every round for
 * the rest of the season, which is the re-walk Plan 2 deleted from
 * ballotEvidence for 0.20-0.23x of lift. That bug has been shipped once in
 * this engine already. It is not being shipped again.
 *
 * A BLOCKED NIGHT EMITS NOTHING, on every channel here. All six of these read
 * from something the castle can see happening to a body, and on a blocked
 * night there is no body — the chairs are all full, which is its own
 * (differently handled) piece of information.
 */
export function variantEvidence(ep, rng = Math.random) {
  if (!_reads) return [];
  const rounds = gs.tr?.rounds || [];
  const round = rounds[rounds.length - 1];
  if (!round || round.ep !== ep - 1) return [];
  const v = round.variant;
  const d = round.variantData;
  if (!v || v === 'standard' || !d) return [];
  const blocked = (gs.tr?.blockedMurders || []).some(b => b.ep === round.ep);
  if (blocked) return [];
  const formed = [];
  const victim = round.murderTarget ?? round.murdered;

  if (v === 'on-trial') {
    // THE SURVIVORS OF THE LIST, and only on the night it was collected. The
    // naming night says nothing at all — being written down is something that
    // happened TO you, and the castle knows it happened to four people; what
    // it cannot let go of is the three who were on it and are still eating
    // breakfast. Enriched above room density only because the pact writes one
    // of its own onto the list as cover (TRIAL_COVER_P, and the wiki's "The
    // Traitors may put themselves on trial also"), which is the only reason
    // this is evidence rather than a machine for suspecting Faithfuls.
    if (d.phase !== 'taken' || !victim) return formed;
    for (const name of (d.names || [])) {
      if (name === victim) continue;
      _tellRoom(name, V.spared, `was on the list with ${victim} and is still here`,
        ep, rng, formed, 'spared-from-the-list', round.ep);
    }
  } else if (v === 'chalice') {
    // ONE NAME. Not a set of neighbours: the room is trying to remember who
    // put a glass in somebody's hand, and that is either a person or nobody.
    if (d.remembered && d.pourer) {
      // On a SLOW night the castle has not been told who drank it yet — the
      // funeral does that this afternoon — so the memory is of the pouring
      // alone, with no name attached to the glass.
      const what = d.slow
        ? 'poured a drink for somebody at the end of the evening'
        : `poured the drink ${victim} was holding`;
      _tellRoom(d.pourer, V.poured, what, ep, rng, formed, 'poured-the-drink', round.ep);
    }
  } else if (v === 'plain-sight') {
    // PROXIMITY. One of these three did it — the room does not know which, and
    // that is a stronger starting position than it has ever had and still not
    // an answer.
    for (const name of (d.nearby || [])) {
      _tellRoom(name, V.proximity, `was within reach of ${victim} at the table`,
        ep, rng, formed, 'in-plain-sight', round.ep);
    }
  } else if (v === 'face-to-face') {
    // THE DEAD SPEAKING. The only public information in the game sourced from
    // somebody who is no longer in it, and worth exactly what the victim's own
    // board was worth — which is measurably better than chance and a long way
    // short of certain.
    if (d.plea) {
      _tellRoom(d.plea, V.plea, `${victim} named them from the chapel`,
        ep, rng, formed, 'chapel-plea', round.ep);
    }
  } else if (v === 'dungeon') {
    // TWO CHANNELS AT TWO PRICES, which no other variant has. The room murmurs
    // about the person who came back; the person who came back has a read of
    // their own, and it is often wrong.
    _tellRoom(d.companion, V.companion, `went down with ${victim} and came back alone`,
      ep, rng, formed, 'came-back-up', round.ep);
    if (d.voice && d.companion && (gs.activePlayers || []).includes(d.companion)) {
      const belief = learn(d.companion, alignmentFactId(d.voice.name), {
        source: 'heard a voice on the dungeon stair',
        sourceType: 'deduced', confidence: V.stair, ep, rng,
      });
      if (belief) formed.push({ observer: d.companion, subject: d.voice.name,
        ep: round.ep, kind: 'voice-on-the-stair' });
    }
  } else if (v === 'death-match') {
    // THE OTHER CHAIR, and only that one. Every one of the four was picked by
    // the Traitors and three of them lived, so "was in the game" says nothing
    // — it is the most public set in the format and the least informative.
    // What the room cannot let go of is the last two: somebody sat opposite
    // the dead and got up instead of them.
    //
    // THE CHEAPEST CHANNEL IN THE FILE, and priced there on purpose. It is
    // enriched only by the pact seating its own (DM_COVER_P), and a cover
    // Traitor reaches this chair about as often as anybody else does, so most
    // of what this writes is a room convicting a Faithful of winning a card
    // game. That is the scene the show gets out of it; it is not a read, and
    // it may not be priced like one.
    const winner = (d.finalists || []).find(n => n !== victim);
    if (winner) {
      _tellRoom(winner, V.lastCard, `sat opposite ${victim} and drew the life card`,
        ep, rng, formed, 'won-the-death-match', round.ep);
    }
  } else if (v === 'double') {
    // THE DEAD AGREEING, and it is not the intersection of who PUSHED THEM.
    //
    // That was the first design and it was measured dead: the conclave scores
    // `- heat * 1.3`, so a murder victim is chosen partly BECAUSE the table
    // was not pushing them, and the people who pushed both of two such victims
    // on one round were 1 night in 400 seasons. A channel reachable once in a
    // sample is Task 4's surviving mutation waiting to happen, and no price
    // rescues a set that is empty.
    //
    // What two bodies actually give the room is two complete PUBLIC records to
    // lay over each other. A name both victims had accused or voted for is two
    // Faithful reads agreeing, assembled after the fact by people who can no
    // longer be argued with. Live on 69% of double nights, against an
    // intersection-of-pushers that was live on 1.5%.
    const [a, b] = d.victims || [];
    if (a && b) {
      const A = _namedBy(a), B = _namedBy(b);
      for (const name of A) {
        if (!B.has(name) || name === a || name === b) continue;
        _tellRoom(name, V.dyingAgreement,
          `${a} and ${b} had both been saying their name, and both are gone`,
          ep, rng, formed, 'the-dead-agreed', round.ep);
      }
    }
  }
  // 'hidden' emits nothing at breakfast either: nobody has been told who died.
  // Its evidence comes out of The Funeral that afternoon.
  // 'name-your-own' emits NOTHING here, and the absence is the design. See the
  // header: the ordinary channel fires over a Traitor's body and indicts the
  // people who were reading the room correctly. Adding a second channel would
  // be handing back with one hand what the variant exists to take with the
  // other.
  return formed;
}
