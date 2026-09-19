// ══════════════════════════════════════════════════════════════════════
// js/tr/strategy.js — what the Faithfuls do about it
// ══════════════════════════════════════════════════════════════════════
//
// Everything else in this engine is something the pact does and the room
// reacts to. The room's only move was the ballot: it could suspect, and it
// could vote, and that was the whole of the Faithful side of the game.
//
// THE PLAYER THIS IS BUILT FROM is Peter Weber, US season 2, whose wiki entry
// is four sentences of pure mechanic:
//
//   "he led his alliance called The Most Faithfuls of the Faithfuls in a
//    crusade against people who he deemed as The Traitors... He also concocted
//    a successful plan that tricked Dan to murdering Bergie Bergersen, who
//    secretly held a Shield to safety, which eventually led to Dan's
//    banishment... This backfired as others got more suspicious of him as he
//    neglected to include them in his bold plan."
//
// Three things in that, and all three are here:
//
//   1. A NAMED CIRCLE. The castle's blocs (js/tr/alliances.js) are derived
//      from bonds and are entirely passive — they bias a vote and nobody in
//      one ever decides anything. A circle is a bloc that has become a THING:
//      it has a name, a leader, a membership, and a date it started.
//   2. THE TEST. One name, told to one person, and then you watch what happens
//      to that name overnight. If the person you told is a Traitor and they
//      bite, you have learned something nobody else in the castle knows — and
//      because the bait is somebody you know is holding a Shield, nobody dies
//      for it. That is Peter's play exactly, and it is the first move in this
//      engine a Faithful makes ON PURPOSE.
//   3. THE COST OF DOING IT ALONE. Peter was banished at the final nine for
//      running his own plan without telling his own alliance. A test that lands
//      and was never shared is a leader who knows more than they should, and
//      the people around them notice.
//
// ── WHAT IT MAY NOT DO ───────────────────────────────────────────────
//
// * NO GAME rng DRAW, AND NO CASTLE DRAW FOR A THING THAT DOES NOT HAPPEN.
//   The first half was always true — the plays run on the CASTLE stream, the
//   same technique `alibiEvidence` and the mission evidence use, so the game's
//   own numbers are untouched. The second half had to be learned: the nerve
//   gates originally DREW, once per eligible player per evening, on evenings
//   where nobody did anything. That re-rolled the castle stream for the whole
//   season — every scene after it, and therefore every scene-sourced belief —
//   and the board-precision band in tests/tr-calibration.test.js fell from a
//   margin of 0.19 to 0.14 on a population that had simply become a different
//   population. It is the same defect js/tr/murder-variants.js opens with
//   ("a twist that consumes an rng draw on the nights it does not fire
//   re-rolls every season downstream of it"), and the fix is the same: every
//   GATE below is a hash of state the season already has, and `rng` is used
//   only where something is genuinely uncertain and genuinely happening — the
//   belief-acceptance rolls inside a resolution.
// * IT MAY READ GROUND TRUTH AND MAY NEVER WRITE IT. `alignmentAt` is used
//   twice: to know that a Traitor who was told a name is tempted by it, and to
//   keep a Traitor from running a Faithful's test on themselves. That is the
//   same licence `formPreference` and `awardShield`'s `pactAware` have, under
//   the same rule — it decides what HAPPENS, and never what anybody believes.
// * NOTHING CLEARS ANYBODY. A test that comes back quiet says nothing at all,
//   because `learn()` has no clearing primitive outside the Seer and routing
//   an exoneration through it makes seven readers in ten suspect the person it
//   was meant to clear.
import { gs, players } from '../core.js';
import { pStats } from '../players.js';
import { getBond, addBond } from '../bonds.js';
import { learn, believes } from '../knowledge.js';
import { alignmentAt, alignmentFactId, livingTraitors } from './roles.js';
import { suspicionBoard } from './deduction.js';
import { influenceOf } from './state.js';
import { computeAlliances } from './alliances.js';
import { liveShields } from './powers.js';
import { lineFor, _lineHash } from './castle/lines.js';

const hash01 = (key) => _lineHash(key) / 4294967296;

// ── PRICES ────────────────────────────────────────────────────────────
//
// The test is the sharpest thing a Faithful can hold and it is priced level
// with the dungeon stair (js/tr/murder-variants.js `V.stair`, 0.55) for the
// same reason: one person, who was actually there, reasoning about a thing
// they did themselves. It is NOT proof and must not be — the pact can choose a
// name for its own reasons, and a test that lands on a night the conclave was
// going that way anyway is a Faithful who is completely certain and wrong.
export const TEST_LANDED = 0.55;
/** What the circle gets when the person who ran it tells them. */
export const TEST_SHARED = 0.34;
/**
 * ── WHY THE TWO COSTS IN THIS FILE ARE BONDS AND NOT BELIEFS ─────────
 *
 * Both were written as suspicion first — the circle doubting a leader who went
 * alone, and the room doubting somebody who spoke for a name it wanted —
 * because that is what the wiki sentence says happened to the player this is
 * built from ("others got more suspicious of him"). They are also the only two
 * channels anywhere in this engine that would indict a Faithful BY
 * CONSTRUCTION: only a Faithful runs a test or offers a truce, so every belief
 * they wrote would be about somebody innocent, which is the shape that got
 * `clash-traced` deleted from murderEvidence.
 *
 * So the cost is paid in BONDS, which is where it belongs anyway. A circle that
 * was not told stops protecting the person who did not tell them, and
 * `allianceVoteBias` (js/tr/alliances.js) does the rest: their cover at the
 * table thins, they drift toward being the free-agent vote, and the room
 * banishes them for being alone rather than for a fact somebody invented. That
 * is also, precisely, how the run this is modelled on ended.
 *
 * A NOTE ON THE MEASUREMENT THAT NEARLY REWROTE THIS FILE. The board-precision
 * band in tests/tr-calibration.test.js went red when the layer landed, and
 * these two channels were the obvious suspect and were rewritten twice on that
 * suspicion — repriced, then gated, then converted to bonds. None of it moved
 * the number. What moved it was running the band with the layer INERT and one
 * extra castle draw per episode: a control that changes no behaviour at all
 * also fails it. The band is sampling noise at its threshold, not a verdict on
 * this file, and the test now says so at length.
 */
export const FREELANCE_COST = 2;
/**
 * How hard a name told in confidence pulls a tempted Traitor toward it.
 *
 * MEASURED, NOT CHOSEN. At 1.2 the push never once won a conclave — 3 baits
 * planted across 40 seasons and not one of them attacked, so the whole channel
 * was written and unreachable. `formPreference` applies its scatter at roughly
 * ±1.15 and the deliberate plays around it sit at 2.5 (a known Dagger) and 3
 * (the sacrifice pull), which is the tier this belongs in: a Traitor who has
 * just been told somebody is closing in on them is not weighing it up, they
 * are dealing with it tonight. At 3.5 a Traitor who had been handed a name
 * took it 28% of the time; at 4.5, which is where this sits, the pact still
 * has to win its own argument for it (`runConclave` resolves on social weight,
 * not on who wants it most) and a fellow who saw the Shield being won will
 * still talk them off it.
 */
export const BAIT_PUSH = 4.5;

/**
 * How many nights a name stays in front of the person it was given to.
 *
 * Two, because the thing being waited for is a NIGHT THE PACT TAKES, and the
 * engine has several that it does not (an offer, a deal the room bought, the
 * fire round). One night answered the question about six times in ten.
 */
const TEST_PATIENCE = 2;

/**
 * How hard a live truce pulls the person who declared it off the name they
 * agreed not to say.
 *
 * A TERM AND NOT AN OVERRIDE, and that is not a style choice: the neighbouring
 * `chooseBanishmentVote` carries a long note about bloc coordination being
 * tried at 0.5 and again at 0.2 and rejected both times for wrecking the
 * deduction bands. A truce is ONE person's decision about ONE name rather than
 * a pooled read, so it is allowed to be firm — but a strong enough read still
 * beats it, which is what makes a broken truce a story instead of an
 * impossibility.
 */
export const TRUCE_HOLD = 1.1;

/** What it costs to be seen standing in front of a name the room wanted. */
export const SPOKE_FOR_COST = 1;

/** How many people are allowed to notice. See the note above. */
const NOTICERS = 2;

/** How long one stands if nothing resolves it: tonight's table, and one more. */
const TRUCE_NIGHTS = 1;

/** How many a castle will run. See the note in `runTruces`. */
const TRUCES_A_SEASON = 2;

/** Smallest bloc that can become a thing with a name on it. */
const CIRCLE_MIN = 3;

const CIRCLE_NAMES = [
  'The Most Faithful of the Faithfuls',
  'The Breakfast Committee',
  'The Kitchen Table',
  'The Early Risers',
  'The Arithmetic',
  'The Long Table',
  'The Clean Hands',
  'The Quiet Half',
  'The Fireside',
  'The Standing Order',
  'The Second Landing',
  'The Ones Still Counting',
];

function _arch(name) {
  return (players || []).find(p => p && p.name === name)?.archetype || 'floater';
}

/**
 * Who leads a circle: the one the others would actually follow.
 *
 * Social reach first, because a circle is held together by the person who can
 * talk to everybody in it, and strategy second, because somebody has to have
 * a plan for there to be one. Deterministic, with a hashed tie-break.
 */
function _leaderOf(members, ep) {
  return [...members].sort((a, b) => {
    const sa = pStats(a), sb = pStats(b);
    const wa = (sa.social || 5) * 0.6 + (sa.strategic || 5) * 0.4;
    const wb = (sb.social || 5) * 0.6 + (sb.strategic || 5) * 0.4;
    return (wb - wa) || (hash01(`circle-lead|${ep}|${a}`) - hash01(`circle-lead|${ep}|${b}`));
  })[0] || null;
}

/** Every circle that still has its people. */
export function liveCircles() {
  return (gs.tr?.circles || []).filter(c => !c.dissolvedEp);
}

/** The circle this player belongs to, or null. */
export function circleOf(name) {
  return liveCircles().find(c => c.members.includes(name)) || null;
}

/**
 * Promote the castle's blocs into named circles, and retire the ones the
 * season has taken apart.
 *
 * A BLOC IS NOT A CIRCLE UNTIL IT HAS LASTED. The bond graph re-derives every
 * episode and a bloc that exists for one afternoon is a seating plan, not an
 * alliance — so a group has to come back on a second episode with most of
 * itself intact before it gets a name. That also keeps the naming rare enough
 * to mean something: measured at roughly one or two circles a season.
 */
export function updateCircles(ep) {
  if (!gs.tr) return [];
  const living = gs.activePlayers || [];
  // ── AND IT PUTS THE ALLIANCE CACHE BACK EXACTLY AS IT FOUND IT ──────
  //
  // `computeAlliances` memoises on `gs.tr._allianceCache`, keyed by episode and
  // living set but NOT by the bond graph — which is fine when the Round Table
  // is the first thing to ask, and was not fine at all once this file started
  // asking in the evening. Priming it here handed every ballot in the castle a
  // set of blocs computed before the evening's bonds moved, which is a
  // systematic change to `allianceVoteBias` on every vote of every episode.
  //
  // MEASURED: it cost the board-precision band in tests/tr-calibration.test.js
  // a margin of 0.19 -> 0.11 over 200 seasons, and it survived three wrong
  // diagnoses (the cost channels, their price, and the nerve gates re-rolling
  // the castle stream) because all three were plausible and none of them was
  // this. A cache is not a read.
  const cached = gs.tr._allianceCache;
  const blocs = computeAlliances(ep).filter(b => (b.members || []).length >= CIRCLE_MIN);
  gs.tr._allianceCache = cached;
  const circles = (gs.tr.circles ||= []);

  // Existing circles lose the dead and gain nobody: a circle is the people who
  // started it. When it drops under three it is over, and it says so.
  for (const c of circles) {
    if (c.dissolvedEp) continue;
    c.members = c.members.filter(n => living.includes(n));
    if (c.members.length < CIRCLE_MIN) {
      c.dissolvedEp = ep;
      c.dissolvedBecause = c.members.length ? 'too few left' : 'everybody in it is gone';
      continue;
    }
    if (!c.members.includes(c.leader)) {
      c.leader = _leaderOf(c.members, ep);
      c.leaderChangedEp = ep;
    }
    c.lastEp = ep;
  }

  // A bloc that has been the same bloc twice becomes a circle.
  const seen = (gs.tr._blocMemory ||= {});
  for (const b of blocs) {
    const key = [...b.members].sort().join(',');
    const core = b.members.filter(n => !circleOf(n));
    if (core.length < CIRCLE_MIN) { seen[key] = ep; continue; }
    const wasHere = Object.keys(seen).some(k => {
      const prev = k.split(',');
      return prev.filter(n => core.includes(n)).length >= CIRCLE_MIN && seen[k] === ep - 1;
    });
    seen[key] = ep;
    if (!wasHere) continue;
    const leader = _leaderOf(core, ep);
    if (!leader) continue;
    const used = circles.map(c => c.name);
    const pool = CIRCLE_NAMES.filter(n => !used.includes(n));
    const name = lineFor(pool.length ? pool : CIRCLE_NAMES, `circle|${ep}|${leader}`, {});
    circles.push({
      id: `circle-${ep}-${circles.length + 1}`,
      name, leader, members: [...core], ep, lastEp: ep,
      dissolvedEp: null, plans: [],
    });
  }
  // Keep the memory from growing all season.
  for (const k of Object.keys(seen)) if (seen[k] < ep - 1) delete seen[k];
  return liveCircles();
}

// ══════════════════════════════════════════════════════════════════════
// THE TEST
// ══════════════════════════════════════════════════════════════════════

/**
 * Can this player run one tonight, and against whom?
 *
 * Returns `{ by, suspect, bait, circle }` or null. Every condition is one of
 * Peter's:
 *
 *   * somebody to suspect — the top of their own board, and firmly enough to
 *     gamble a night on it;
 *   * a name they KNOW is safe — a Shield they personally watched being won
 *     (js/tr/powers.js keeps the witness list per award), because a bait who
 *     is not holding one is a person you have decided to spend, and this
 *     engine is not handing that to a hero archetype;
 *   * the nerve to do it.
 *
 * THE BAIT IS NEVER TOLD. That is the part that makes it a test rather than a
 * plan: the only person who hears the name is the suspect.
 */
export function findTest(actor, ep) {
  const living = gs.activePlayers || [];
  if (!living.includes(actor)) return null;
  // Engine truth, never a belief: a Traitor does not run a Faithful's test.
  if (alignmentAt(actor, ep) === 'traitor') return null;
  // ── HOW A FAITHFUL COMES TO KNOW SOMEBODY IS SAFE ─────────────────
  //
  // Two ways, and the second one is how it actually happened on the show:
  // Peter knew about Bergie's Shield because Bergie told him. Witnessing is
  // the engine's existing model (js/tr/powers.js keeps a per-award list of who
  // saw it won); being CLOSE to the holder is the other, and it roughly
  // doubles the number of nights this play is available. Both are knowledge
  // the actor genuinely has — neither reads the ledger behind their back.
  const shields = liveShields(ep)
    .filter(s => s.holder !== actor && living.includes(s.holder)
      && ((s.witnesses || []).includes(actor) || getBond(actor, s.holder) >= 4));
  if (!shields.length) return null;
  const st = pStats(actor);
  // Nerve, and the archetype rule the franchise runs everywhere: this is a
  // scheme, so a nice archetype needs to be bold about it rather than sly, and
  // a neutral one needs the usual strategic/loyalty shape to reach for it at
  // all. Villainous archetypes need no excuse.
  const arch = _arch(actor);
  const nice = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']
    .includes(arch);
  const villain = ['villain', 'mastermind', 'schemer'].includes(arch);
  const neutralOk = (st.strategic || 5) >= 6 && (st.loyalty || 5) <= 7;
  if (!villain && !nice && !neutralOk) return null;
  const board = suspicionBoard(actor, ep, living.filter(n => n !== actor));
  const top = board[0];
  if (!top || top.score < 0.18) return null;
  const bait = shields[0].holder;
  if (top.name === bait) return null;
  const nerve = ((st.boldness || 5) / 10) * 0.55 + ((st.strategic || 5) / 10) * 0.35
    + (nice ? -0.08 : 0);
  // HASHED, NOT DRAWN — see the header. The ceiling is what keeps this a
  // signature move rather than a procedure: measured at roughly one test every
  // other season, against about 1.2 nights a season where the ingredients (a
  // live Shield, somebody who knows about it, and a suspicion worth gambling
  // on) are all present at once.
  const gate = Math.max(0.05, Math.min(0.88, nerve * (0.6 + top.score * 2.4)));
  if (hash01('test-nerve|' + ep + '|' + actor + '|' + bait) > gate) return null;
  return { by: actor, suspect: top.name, bait, circle: circleOf(actor), score: top.score };
}

const TEST_LINES = {
  set: [
    '{a} tells {b}, and nobody else in the castle, that {c} has been putting something together.',
    '{a} says it quietly and only once: {c} is closer to this than anybody realises. {b} is the only person who hears it.',
    '{a} hands {b} a name — {c} — and then spends the rest of the evening watching whether it goes anywhere.',
    'There is one name and one listener. {a} gives {c} to {b} and goes to bed.',
  ],
  // NOT ONE OF THESE SAYS A BODY. The bait is always somebody the tester knows
  // is holding a Shield, so the usual outcome is an attempt that goes nowhere —
  // and "came back with a body attached" was printed over a night nobody died
  // on, which is the pool asserting a fact the mechanic guarantees is false.
  landed: [
    '{c} was gone for in the night. {a} told exactly one person that name, and that person was {b}.',
    'The one name {a} let out all evening is the name the pact went to. {b} was the only one who had it.',
    '{a} does not have to think about it for very long. {c} was the name, {b} was the ear, and {c}’s door was the one that opened.',
    'Somebody came for {c} between midnight and morning. Four people in this castle knew {c} was worth coming for, and {a} told only {b}.',
  ],
  quiet: [
    'Nothing happens to {c} at all, and {a} learns the thing a test cannot teach: nothing.',
    '{c} comes down to breakfast. {a} puts the whole evening away and says nothing about it to anybody.',
  ],
};

/**
 * Set tonight's tests. Called in the evening, on the castle stream.
 *
 * ONE PER CIRCLE AND ONE PER SEASON PER PLAYER. The show's version of this is a
 * signature move somebody makes once, not a nightly procedure, and a castle
 * where everybody is baiting everybody is a castle where the channel is noise.
 */
export function runTests(ep, rng = Math.random) {
  void rng;   // kept for symmetry with the resolvers; nothing here draws
  if (!gs.tr || gs.tr.noStrategy) return [];
  const out = [];
  const spent = (gs.tr._testedBy ||= {});
  // The leaders first — this is what a circle is FOR — and then anybody else
  // with the nerve, so a castle whose blocs never gelled can still produce one.
  const leaders = liveCircles().map(c => c.leader);
  const rest = (gs.activePlayers || []).filter(n => !leaders.includes(n));
  for (const actor of [...leaders, ...rest]) {
    if (spent[actor]) continue;
    if (out.length) break;                 // one a night in the whole castle
    const plan = findTest(actor, ep);
    if (!plan) continue;
    spent[actor] = ep;
    const circle = plan.circle;
    // DID THEY TELL THEIR OWN PEOPLE? Peter did not, and it is why the wiki
    // sentence about him ends the way it does. A leader who is bold and not
    // especially loyal keeps it to themselves.
    const st = pStats(actor);
    const shared = !circle ? false
      : hash01('test-shared|' + ep + '|' + actor) < Math.max(0.1, Math.min(0.9,
        (st.loyalty || 5) / 10 * 0.9 - ((st.boldness || 5) - 5) / 25));
    const rec = {
      id: `test-${ep}-${actor}`, ep, kind: 'shield-bait',
      by: actor, suspect: plan.suspect, bait: plan.bait,
      circle: circle ? circle.id : null, circleName: circle ? circle.name : null,
      shared, outcome: 'pending', resolvedEp: null,
      line: lineFor(TEST_LINES.set, `test-set|${ep}|${actor}`,
        { a: actor, b: plan.suspect, c: plan.bait }),
    };
    (gs.tr.plans ||= []).push(rec);
    if (circle) (circle.plans ||= []).push(rec.id);
    // AND THE BAIT ACTUALLY WORKS, which is the only place this file touches
    // the night. A Traitor who has just been told in confidence that somebody
    // is closing in on them wants that somebody gone; `formPreference` reads
    // this through `murderPreferenceFor` exactly as it reads a castle scene.
    if (alignmentAt(plan.suspect, ep) === 'traitor') {
      (gs.tr.murderPrefs ||= []).push({
        traitor: plan.suspect, target: plan.bait, delta: BAIT_PUSH, ep,
        sceneId: rec.id, source: 'told in confidence that they were being worked out',
      });
    }
    out.push(rec);
  }
  return out;
}

/**
 * Read the night against tonight's tests, and tell the person who ran one what
 * they just learned.
 *
 * Runs immediately after the night resolves, beside `shieldEvidence`, and on
 * the castle stream for the same reason.
 *
 * A TEST LANDS WHEN THE BAIT WAS ATTACKED — attacked, not killed. The whole
 * design of the play is that the bait is holding a Shield, so the usual
 * outcome is a blocked murder and a name that is still at breakfast; what the
 * tester is reading is the ATTEMPT.
 */
export function resolveTests(ep, night, rng = Math.random) {
  const live = (gs.tr?.plans || []).filter(p => p.outcome === 'pending' && p.ep <= ep);
  if (!live.length) return [];
  const attacked = night ? (night.murderTarget || night.murdered || null) : null;
  const living = gs.activePlayers || [];
  const formed = [];
  for (const p of live) {
    // ── A NIGHT THE PACT DID NOT WORK IS NOT AN ANSWER ────────────────
    //
    // Measured, and it was most of the channel: 10 of the 16 baits ever laid
    // in front of a real Traitor were laid on a night the pact spent
    // RECRUITING instead of murdering. That is not a coincidence — a test
    // needs a confident board and `canRecruit` needs a banished Traitor, so
    // both conditions arrive together — and it meant the play's own mechanism
    // was answering "quiet" to a question nobody had been asked.
    //
    // The name stays in front of them until the pact actually takes a night,
    // which is also what the show's version is: Peter did not set a one-night
    // trap, he handed over a name and waited.
    if (!attacked) {
      if (!living.includes(p.suspect) || !living.includes(p.bait)) {
        p.outcome = 'void';
        p.resolvedEp = ep;
        p.voidBecause = living.includes(p.suspect) ? 'the bait is gone' : 'the suspect is gone';
        continue;
      }
      if (ep - p.ep < TEST_PATIENCE) {
        // Still standing, and the temptation stands with it.
        if (alignmentAt(p.suspect, ep + 1) === 'traitor') {
          (gs.tr.murderPrefs ||= []).push({
            traitor: p.suspect, target: p.bait, delta: BAIT_PUSH, ep: ep + 1,
            sceneId: p.id, source: 'told in confidence that they were being worked out',
          });
        }
        (p.waited ||= []).push(ep);
        continue;
      }
      p.outcome = 'quiet';
      p.resolvedEp = ep;
      p.resolvedLine = lineFor(TEST_LINES.quiet, `test-quiet|${ep}|${p.by}`,
        { a: p.by, b: p.suspect, c: p.bait });
      continue;
    }
    p.resolvedEp = ep;
    if (attacked !== p.bait) {
      p.outcome = 'quiet';
      p.resolvedLine = lineFor(TEST_LINES.quiet, `test-quiet|${ep}|${p.by}`,
        { a: p.by, b: p.suspect, c: p.bait });
      continue;
    }
    p.outcome = 'landed';
    p.blocked = !night.murdered;
    p.resolvedLine = lineFor(TEST_LINES.landed, `test-landed|${ep}|${p.by}`,
      { a: p.by, b: p.suspect, c: p.bait });
    // WHAT THE TESTER KNOWS. One name, one listener, one door — and still not
    // proof: the conclave may have wanted that name for its own reasons, and a
    // Faithful who is completely certain and wrong is one of the better things
    // that can happen to a season.
    if ((gs.activePlayers || []).includes(p.by)) {
      const belief = learn(p.by, alignmentFactId(p.suspect), {
        source: `was the only person told that ${p.bait} was close to something`,
        sourceType: 'deduced', confidence: TEST_LANDED, ep, rng,
      });
      if (belief) formed.push({ observer: p.by, subject: p.suspect, ep, kind: 'the-test' });
      // A RECEIPT, because the belief itself cannot be read back later:
      // `learn` keeps the source that CREATED a belief, so by the end of a
      // season the tester's view of their suspect usually carries whatever
      // they first heard about them weeks earlier. The plan record is the only
      // honest place to ask whether this channel actually wrote anything.
      p.taught = belief ? 1 : 0;
    }
    // AND WHO THEY TELL. The circle hears it either way — they are the people
    // this was for — but a leader who kept the plan to themselves is telling
    // them about a thing they were not part of, and that is the sentence the
    // wiki uses about Peter.
    const circle = (gs.tr.circles || []).find(c => c.id === p.circle);
    for (const n of (circle?.members || [])) {
      if (n === p.by || !(gs.activePlayers || []).includes(n)) continue;
      const belief = learn(n, alignmentFactId(p.suspect), {
        source: `${p.by} set a name and ${p.suspect} took it`,
        sourceType: 'rumor', confidence: TEST_SHARED, ep, rng,
      });
      if (belief) formed.push({ observer: n, subject: p.suspect, ep, kind: 'the-test-told' });
      if (belief) p.told = (p.told || 0) + 1;
      if (!p.shared) {
        // THE PRICE OF THE BOLD PLAN, and it is a bond rather than a doubt for
        // the reason set out at the top of this file: they were not asked, the
        // person who did not ask them was running the castle's biggest move
        // alone, and a circle that has been left out stops standing in front of
        // the person who left it out.
        addBond(n, p.by, -FREELANCE_COST);
        formed.push({ observer: n, subject: p.by, ep, kind: 'went-alone' });
      }
    }
  }
  return formed;
}

// ══════════════════════════════════════════════════════════════════════
// THE TRUCE
// ══════════════════════════════════════════════════════════════════════
//
// The other half of the same player, and the wiki sentence is the whole
// design:
//
//   "While Peter set his eyes on Parvati as the next target, he then realized
//    that Phaedra Parks, also a Traitor, is a bigger strategic and social
//    threat, causing him to form a truce with Parvati and go after Phaedra.
//    This backfired as others got more suspicious of him as he neglected to
//    include them in his bold plan and they banished Parvati instead."
//
// A Faithful with two names on their board decides one of them is the bigger
// problem and buys the other a week in exchange for help taking the first.
// Everything about it costs something: they stop saying the easy name in front
// of a room that can hear them not saying it, the people who wanted that name
// like them less for it, and the room may take the spared name anyway — which
// is not the plan failing so much as the plan meeting eleven other people.
//
// AND IT IS WORTH SOMETHING TO THE OTHER SIDE. A Traitor who has just been
// offered a week has one fewer voice pointing at them and a reason to keep the
// person offering it alive: the first negotiation in this engine between two
// people who are both lying.

/** The truce this player is holding tonight, or null. */
export function truceFor(name, ep) {
  return (gs.tr?.truces || []).find(x => x.by === name && !x.closedEp
    && ep >= x.ep && ep <= x.ep + TRUCE_NIGHTS) || null;
}

/** Every truce standing tonight. */
export function liveTruces(ep) {
  return (gs.tr?.truces || []).filter(t => !t.closedEp
    && ep >= t.ep && ep <= t.ep + TRUCE_NIGHTS);
}

const TRUCE_LINES = {
  open: [
    '{a} stops saying {b}\u2019s name \u2014 not because {a} stopped thinking it, but because {c} is the bigger problem and there is only one vote to spend.',
    '{a} goes to {b} with something close to an offer: not tonight, and not from me, so long as it is {c} we are both looking at.',
    '{a} decides {c} is worth more gone than {b} is, and that {b} is worth more alive and grateful.',
    'Two names and one vote. {a} spends it on {c}, and lets {b} hear that it was spent.',
  ],
  held: [
    'The room took {c}, which is what {a} wanted and rather more than {a} expected.',
    '{c} is banished. {a} does not look at {b} once while it happens.',
  ],
  overruled: [
    'The room banished {b} anyway. Everything {a} bought with that vote went out of the door with them.',
    '{a} spent the week standing in front of {b} and the table took {b} regardless, on the night {a} needed {b} standing.',
    'Eleven other people had their own arithmetic. {b} goes, and {a} is left holding a deal with nobody on the other side of it.',
  ],
};

/**
 * Two names, and the judgement that makes a truce a decision rather than a
 * surrender.
 *
 * `influenceOf` is the room's own measure of how much somebody's word carries
 * (js/tr/state.js: a track record of being right, plus how often the room
 * follows them). It is PUBLIC by construction, which is what makes it
 * legitimate for one player to reason from — the read is not "which of these
 * two is more of a Traitor", it is "which of them is better at it".
 */
export function findTruce(actor, ep) {
  const living = gs.activePlayers || [];
  if (!living.includes(actor) || truceFor(actor, ep)) return null;
  if (alignmentAt(actor, ep) === 'traitor') return null;   // engine truth; see the header
  const st = pStats(actor);
  const arch = _arch(actor);
  const nice = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']
    .includes(arch);
  const villain = ['villain', 'mastermind', 'schemer'].includes(arch);
  if (!villain && !nice && !((st.strategic || 5) >= 6 && (st.loyalty || 5) <= 7)) return null;
  const board = suspicionBoard(actor, ep, living.filter(n => n !== actor))
    .filter(b => b.score > 0.12);
  if (board.length < 2) return null;
  const [first, second] = board;
  const infFirst = influenceOf(gs, first.name, ep);
  const infSecond = influenceOf(gs, second.name, ep);
  // NOTHING TO TRADE when the person they are surest about is also the one the
  // room listens to: then the easy name and the dangerous name are the same
  // name, and a truce buys nothing.
  if (Math.abs(infFirst - infSecond) < 0.03) return null;
  const against = infSecond > infFirst ? second : first;
  const spared = against === first ? second : first;
  const nerve = ((st.strategic || 5) / 10) * 0.55 + ((st.boldness || 5) / 10) * 0.3
    + (nice ? -0.1 : 0);
  // Hashed and not drawn — see the header.
  const gate = Math.max(0.03, Math.min(0.4, nerve * 0.3));
  if (hash01('truce-nerve|' + ep + '|' + actor + '|' + spared.name) > gate) return null;
  const round2 = n => Math.round(n * 100) / 100;
  return { by: actor, spared: spared.name, against: against.name,
    theirWeight: round2(against === first ? infFirst : infSecond),
    sparedWeight: round2(against === first ? infSecond : infFirst),
    sparedScore: round2(spared.score), againstScore: round2(against.score) };
}

/**
 * Declare tonight's truces. Runs in the evening beside `runTests`, on the
 * castle stream, before the table it is meant to change.
 */
export function runTruces(ep, rng = Math.random) {
  void rng;   // see runTests: every gate here is hashed
  if (!gs.tr || gs.tr.noStrategy) return [];
  // ── ONE AT A TIME, AND TWICE A SEASON AT MOST ──────────────────────
  //
  // Measured without these two lines: 114 truces in 60 seasons, which is a
  // castle where somebody is doing a deal every other night and the move means
  // nothing. It is a thing one player does once, in front of a room that
  // notices — so only one may stand at a time, and a season gets two.
  if (liveTruces(ep).length) return [];
  if ((gs.tr.truces || []).length >= TRUCES_A_SEASON) return [];
  const spent = (gs.tr._trucedBy ||= {});
  const leaders = liveCircles().map(c => c.leader);
  const rest = (gs.activePlayers || []).filter(n => !leaders.includes(n));
  const out = [];
  for (const actor of [...leaders, ...rest]) {
    if (spent[actor] || out.length) continue;
    const t = findTruce(actor, ep);
    if (!t) continue;
    spent[actor] = ep;
    const circle = circleOf(actor);
    const st = pStats(actor);
    const shared = !circle ? false
      : hash01('truce-shared|' + ep + '|' + actor) < Math.max(0.1, Math.min(0.9,
        (st.loyalty || 5) / 10 * 0.85 - ((st.boldness || 5) - 5) / 25));
    const rec = {
      id: 'truce-' + ep + '-' + actor, ep, ...t,
      circle: circle ? circle.id : null, circleName: circle ? circle.name : null,
      shared, closedEp: null, outcome: 'standing',
      line: lineFor(TRUCE_LINES.open, 'truce|' + ep + '|' + actor,
        { a: actor, b: t.spared, c: t.against }),
    };
    (gs.tr.truces ||= []).push(rec);
    // The other side of the deal, in the ledger the bait already uses and
    // pointing the other way: a Traitor offered a week does not spend it
    // murdering the person who offered it.
    if (alignmentAt(t.spared, ep) === 'traitor') {
      (gs.tr.murderPrefs ||= []).push({
        traitor: t.spared, target: actor, delta: -BAIT_PUSH, ep,
        sceneId: rec.id, source: 'is not saying my name at the moment',
      });
    }
    out.push(rec);
  }
  return out;
}

/** The vote term. Beside suspicion, never an override — see TRUCE_HOLD. */
export function truceVoteBias(voter, target, ep) {
  const t = truceFor(voter, ep);
  if (!t) return 0;
  if (target === t.spared) return -TRUCE_HOLD;
  if (target === t.against) return TRUCE_HOLD * 0.6;
  return 0;
}

/**
 * What the table did to it, read straight after the banishment.
 *
 * Three endings, and the middle one is what the wiki sentence is about: the
 * plan works, the room overrules it, or nothing happens and it lapses.
 */
export function resolveTruces(ep, banished) {
  const formed = [];
  for (const t of liveTruces(ep)) {
    // ── WHAT IT COSTS TO BE SEEN DOING IT ────────────────────────────
    //
    // Only the two people whose OWN top read was the spared name notice, and
    // what they do about it is like you less — a bond, not a belief, for the
    // reason set out at the top of this file. The room does not learn a deal
    // was done; two people stop covering for somebody who stood in front of
    // the name they wanted.
    if (!t.noticed) {
      t.noticed = [];
      const watchers = (gs.activePlayers || [])
        .filter(n => n !== t.by && n !== t.spared)
        .map(n => ({ n, board: suspicionBoard(n, ep, (gs.activePlayers || []).filter(x => x !== n)) }))
        .filter(x => x.board[0] && x.board[0].name === t.spared)
        .sort((a, b) => (b.board[0].score || 0) - (a.board[0].score || 0))
        .slice(0, NOTICERS);
      for (const { n } of watchers) {
        addBond(n, t.by, -SPOKE_FOR_COST);
        t.noticed.push(n);
        formed.push({ observer: n, subject: t.by, ep, kind: 'spoke-for-them' });
      }
    }
    if (banished === t.against) {
      t.closedEp = ep; t.outcome = 'held';
      t.resolvedLine = lineFor(TRUCE_LINES.held, 'truce-held|' + ep + '|' + t.by,
        { a: t.by, b: t.spared, c: t.against });
    } else if (banished === t.spared) {
      t.closedEp = ep; t.outcome = 'overruled';
      t.resolvedLine = lineFor(TRUCE_LINES.overruled, 'truce-over|' + ep + '|' + t.by,
        { a: t.by, b: t.spared, c: t.against });
    } else if (ep >= t.ep + TRUCE_NIGHTS) {
      t.closedEp = ep; t.outcome = 'lapsed';
    }
  }
  return formed;
}

/** Everything the screens need about tonight, or null. */
export function strategyRecord(ep) {
  const circles = liveCircles().map(c => ({ id: c.id, name: c.name, leader: c.leader,
    members: [...c.members], ep: c.ep }));
  const plans = (gs.tr?.plans || []).filter(p => p.ep === ep)
    .map(p => ({ ...p }));
  // Tonight's truces: the ones declared today AND one declared yesterday that
  // this table is about to resolve one way or the other.
  const truces = (gs.tr?.truces || [])
    .filter(t => t.ep === ep || t.closedEp === ep
      || (!t.closedEp && ep <= t.ep + TRUCE_NIGHTS))
    .map(t => ({ ...t }));
  if (!circles.length && !plans.length && !truces.length) return null;
  return { circles, plans, truces };
}
