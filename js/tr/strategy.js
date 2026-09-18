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
// * NO GAME rng DRAW. Everything here runs on the CASTLE stream (the same
//   technique `alibiEvidence` and the mission evidence use), so a season with
//   circles in it draws the identical game numbers as one without and the
//   calibration bands keep describing the engine rather than this file.
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
import { learn } from '../knowledge.js';
import { alignmentAt, alignmentFactId, livingTraitors } from './roles.js';
import { suspicionBoard } from './deduction.js';
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
/** What a circle thinks of a leader who did it all without them. */
export const FREELANCE_DOUBT = 0.22;
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
  const blocs = computeAlliances(ep).filter(b => (b.members || []).length >= CIRCLE_MIN);
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
export function findTest(actor, ep, rng) {
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
  // The ceiling is what keeps this a signature move rather than a procedure:
  // measured at roughly one test every other season, against about 1.2 nights
  // a season where the ingredients (a live Shield, somebody who knows about
  // it, and a suspicion worth gambling on) are all present at once.
  if (rng() > Math.max(0.05, Math.min(0.88, nerve * (0.6 + top.score * 2.4)))) return null;
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
    const plan = findTest(actor, ep, rng);
    if (!plan) continue;
    spent[actor] = ep;
    const circle = plan.circle;
    // DID THEY TELL THEIR OWN PEOPLE? Peter did not, and it is why the wiki
    // sentence about him ends the way it does. A leader who is bold and not
    // especially loyal keeps it to themselves.
    const st = pStats(actor);
    const shared = !circle ? false
      : rng() < Math.max(0.1, Math.min(0.9, (st.loyalty || 5) / 10 * 0.9
        - ((st.boldness || 5) - 5) / 25));
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
        // THE PRICE OF THE BOLD PLAN. They were not asked, and the person who
        // did not ask them turns out to have been running the castle's biggest
        // move alone. It costs the bond and it costs a little of their name.
        addBond(n, p.by, -1);
        const doubt = learn(n, alignmentFactId(p.by), {
          source: 'ran that on their own and told none of us',
          sourceType: 'rumor', confidence: FREELANCE_DOUBT, ep, rng,
        });
        if (doubt) formed.push({ observer: n, subject: p.by, ep, kind: 'went-alone' });
      }
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
  if (!circles.length && !plans.length) return null;
  return { circles, plans };
}
