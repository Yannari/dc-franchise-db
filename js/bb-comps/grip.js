// ══════════════════════════════════════════════════════════════════════
// bb-comps/grip.js — Get A Grip, Tightrope, Feeling Knotty,
//                    Memory Dip, Ship Til You Drop, Domino Effect
// ══════════════════════════════════════════════════════════════════════
//
// Six more off the wiki, and the same rule the library has held to since the
// stamina batch: a competition earns its place by FAILING differently from
// everything already here. Six comps that all resolve into "the highest
// endurance wins" would be six names for one competition.
//
//   GET A GRIP (wiki: "be the last one to hold onto your pole to win") — the
//   purest hold in the game, and the one where nothing attacks you. Nobody is
//   knocked off, nothing tilts, nothing sprays: your hand simply opens, on its
//   own schedule, and everybody watches it happen.
//
//   TIGHTROPE (wiki: "reach one end of a tightrope to another without
//   falling") — the only competition here you can lose ALL of, repeatedly. A
//   fall is not a lost second, it is the whole crossing again from the start,
//   which is why the fastest crosser regularly finishes last.
//
//   FEELING KNOTTY (wiki: "untie a series of knots") — the failure is that
//   your own effort makes it worse. Pull the wrong strand and the knot is
//   tighter than it was, and the houseguest who is trying hardest is the one
//   sabotaging themselves.
//
//   MEMORY DIP (wiki: "houseguests dive into tanks of water, collect pieces of
//   a puzzle, and assemble or move them to meet a condition — HOH each week,
//   order of evictions") — the only one where the body and the memory are in
//   direct competition for the same lungful of air. A strong swimmer surfaces
//   with the wrong piece; a good memory runs out of breath reaching it.
//
//   SHIP TIL YOU DROP (wiki: "balance boxes with your bodies while
//   continuously adding boxes to the stack") — the load GROWS. Every other
//   hold in the library is constant and you fail when you run out; here the
//   thing you are holding gets heavier until it beats you, so the question is
//   never whether it ends but how far you get first.
//
//   DOMINO EFFECT (wiki: "set up dominos in a certain way in order to achieve
//   a certain task") — the failure is early SUCCESS. Everything you have built
//   can go at once, from a knee, a breath, a nudge, and the closer you are to
//   done the more there is to lose.
//
//
// ── ON THE DESCRIPTIONS ──
//
// The wiki documents these six in one line each and nothing more: the pages
// carry an infobox, a season table and a photo. That one line is the RULE, and
// it is the part a description is not allowed to improvise around — a comp
// whose stated win condition was invented is a comp the viewer is being lied
// to about.
//
// So the wiki sentence governs, verbatim in substance, and everything else in
// the description is staging that follows from it: what is in the yard, what a
// houseguest is physically doing, and what going wrong looks like. Where the
// wiki is silent on scoring, the description says the simplest thing the rule
// implies rather than inventing a points system.
//
// Two of these were wrong on the first pass and are corrected here. Tightrope
// is "reach one end of a tightrope to another without falling" — one crossing,
// not a lap count, and the falling is the whole competition. Domino Effect is
// "set up dominos in a certain way in order to achieve a certain task" — a
// pattern to match, not a route with ramps and gates that nobody documented.
//
// Stat mixes are declared once in `stats` and read through scoreField, which is
// what the profile-drift guard is for: a hand-written second mix inside
// simulate() means the bars on the screen and the maths behind them describe
// different competitions.
import { pronouns } from '../players.js';
import { aptitude, beat, makePicker, scoreField, toResult, vb, THROW_LINES } from './_shared.js';

/**
 * A readable quantity per houseguest, in the order they actually finished.
 *
 * THE SCREENS NEED SOMETHING TO DRAW. A signature screen is not a table of
 * scores — Caged Eggs draws six eggs whole or cracked, the Wall draws people
 * still on it — so every competition that wants one has to publish what
 * HAPPENED, not just who won. These six published nothing but an ordering,
 * which is why they were falling back to the generic board.
 *
 * Derived from the finishing order rather than rolled separately, so the number
 * on the screen can never disagree with the result underneath it: the winner
 * always has the most, and the gaps come from the real scores.
 */
function quantise(entries, { top, floor, jitter = 0, rng = null }) {
  const best = entries[0]?.score ?? 0;
  const worst = entries[entries.length - 1]?.score ?? best;
  const span = Math.max(0.001, best - worst);
  const out = {};
  entries.forEach((e, i) => {
    const share = (e.score - worst) / span;
    const wobble = rng && jitter ? (rng() - 0.5) * jitter : 0;
    // Placement decides the order; the score decides the gaps. Clamped so a
    // long tail of ties cannot push anybody below the floor.
    const v = floor + (top - floor) * share + wobble;
    out[e.name] = Math.max(floor, Math.round(v * 10) / 10);
    // A tie in the raw value must still read as a placement, or two
    // houseguests draw identically and the screen looks broken.
    if (i > 0) {
      const above = out[entries[i - 1].name];
      if (out[e.name] > above) out[e.name] = above;
    }
  });
  return out;
}

/**
 * How much of the body's limit a houseguest actually spends.
 *
 * THE PROBLEM THIS SOLVES. In a pure hold, endurance and physical say how long
 * somebody CAN hang there — and that was the whole competition, which left
 * boldness and temperament sitting on the bars at 13% and 9% doing nothing a
 * viewer could point at. "Why does boldness matter here" had no answer.
 *
 * It matters because a hold is not lost when the arm fails. It is lost when
 * somebody DECIDES the arm is going to fail, and those are minutes apart. So
 * capacity is the ceiling and willingness is the fraction of it they are
 * prepared to spend: a bold, level houseguest rides theirs out and a little
 * past it; a timid or volatile one steps down with real time left in the arm,
 * which everybody watching can see and nobody can prove.
 *
 * Returns a multiplier around 1, so it re-orders the field without ever
 * replacing it — the strongest arms still tend to win, and now they can be
 * beaten by somebody who wanted it more.
 */
function willingnessOf(name, mix) {
  const w = aptitude(name, mix);
  return { willing: Math.round(w * 100) / 100, spend: 0.74 + (w / 10) * 0.40 };
}

// ══════════════════════════════════════════════════════════════════════
// Get A Grip
// ══════════════════════════════════════════════════════════════════════

const GRIP_HOLD = [
  (n, p) => `${n} settles into a steady breathing rhythm and stops reacting to the people below.`,
  (n, p) => `${n} switches hands again, flexes the free one twice, and locks back onto the pole.`,
  (n, p) => `The conversation dies out around ${n}. ${p.sub === 'they' ? 'They are' : p.sub === 'he' ? 'He is' : 'She is'} too focused to restart it.`,
  (n, p) => `${n} drops lower on the pole and hooks an elbow around it, taking some pressure off ${p.posAdj} hands.`,
];

const GRIP_GO = [
  (n, p) => `${n}'s right hand slips. The left holds for half a second longer before ${n} drops to the mat.`,
  (n, p) => `${n} exhales, gives the pole one last squeeze, and lets go.`,
  (n, p) => `${n} reaches to change grips, misses the pole on the way back, and is out.`,
  (n, p) => `${n} finally drops and immediately starts stretching a cramped forearm.`,
];

export const getAGrip = {
  id: 'bb-grip-pole',
  name: 'Get A Grip',
  category: 'endurance',
  types: ['hoh', 'veto', 'tiebreaker'],
  desc: 'Every houseguest takes hold of their own pole and holds on. That is the entire competition: nothing swings at them, nothing tilts and nothing sprays, and the pole does not move. They may change grip and rest whichever arm they like, but letting go ends their night on the spot and there is no way back into it. The last houseguest still holding their pole wins, which by the end is usually settled by a conversation between the final two rather than by an arm giving out.',
  // The purest hold in the library, so endurance carries most of it. Physical
  // is grip strength rather than size; boldness is the willingness to keep
  // hanging after it has started to hurt.
  stats: { endurance: 0.52, physical: 0.26, boldness: 0.13, temperament: 0.09 },
  roles: {
    // What the arm can do.
    capacity: { endurance: 0.68, physical: 0.32 },
    // Whether they spend it. See willingnessOf.
    willingness: { boldness: 0.58, temperament: 0.42 },
    steadiness: { temperament: 1 },
  },
  weight: () => 1,
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, {
      /* WIDER THAN THE OTHER HOLDS, BECAUSE WILLINGNESS COMPOUNDS.
         Capacity and willingness are multiplied, not added, so an all-rounder
         gets both and the advantages stack — measured over 120 runs at luck
         2.3 this was the tightest of the six at four distinct winners and 51%
         for the top one, which is a competition close to being owned. The
         noise widens to pay for the compounding rather than the multiplier
         being softened, because the multiplier is the interesting part. */
      mix: this.roles.capacity, swingBy: this.roles.steadiness, luck: 3.1, context, rng,
    });
    /* THE ARM SETS THE CEILING; THE PERSON DECIDES WHAT TO SPEND OF IT.
       Applied after the field is scored and before it is ranked, so a
       houseguest who wanted it more can genuinely beat a stronger one — and
       the Debug tab gets both numbers, because "had more in them" is the most
       interesting thing this competition produces and it was invisible. */
    for (const e of entries) {
      const { willing, spend } = willingnessOf(e.name, this.roles.willingness);
      const held = e.score * spend;
      breakdown[e.name].willingness = willing;
      breakdown[e.name].spend = Math.round(spend * 100) / 100;
      breakdown[e.name].ceiling = Math.round(e.score * 100) / 100;
      breakdown[e.name].score = Math.round(held * 100) / 100;
      e.score = held;
    }
    entries.sort((a, b) => b.score - a.score);
    const say = makePicker(rng);
    const beats = [beat(
      'Each houseguest takes a pole. Once both hands leave it, the competition is over.',
      participants.slice(0, 3), 'TAKE YOUR POLE')];

    /* EVERY HOUSEGUEST IS RESOLVED BY A SPECIFIC CARD, AND THE SCREEN NEEDS TO
       KNOW WHICH ONE. Without this the poles and the board can only be gated
       all-or-nothing — which is what shipped: a wall of dashes that stayed a
       wall of dashes until the last card, then filled in at once. Recording the
       beat index that puts each person on the mat lets the yard empty in front
       of the viewer, one hand at a time, exactly as the log reads. */
    const revealAt = {};
    const order = [...entries].reverse();
    order.slice(0, Math.max(1, order.length - 2)).forEach((e, i) => {
      const p = pronouns(e.name);
      if (e.threw) {
        revealAt[e.name] = beats.length;
        beats.push(beat(say(THROW_LINES)(e.name), [e.name], 'THREW IT', 'grey'));
        return;
      }
      revealAt[e.name] = beats.length;
      beats.push(beat(say(GRIP_GO)(e.name, p), [e.name], i === 0 ? 'FIRST DOWN' : 'DROPS'));
      // Hanging on long past comfort buys nothing but the room's respect.
      if (i > order.length - 5) api.popDelta(e.name, 1);
    });

    const [winner, runnerUp] = entries;
    if (runnerUp) {
      const p = pronouns(runnerUp.name);
      beats.push(beat(say(GRIP_HOLD)(runnerUp.name, p), [runnerUp.name, winner.name], 'THE LAST TWO', 'gold'));
      revealAt[runnerUp.name] = beats.length;
      beats.push(beat(
        `${runnerUp.name} lets go, leaving ${winner.name} as the last person on a pole. The house immediately starts debating whether exhaustion or a deal ended it.`,
        [runnerUp.name, winner.name], 'AND DOWN', 'gold'));
    }
    // The winner is only known once everybody else is off.
    revealAt[winner.name] = beats.length - 1;
    // Minutes on the pole, longest first — what the screen draws as a hand
    // sliding down a pole rather than as a number in a column.
    const held = quantise(entries, { top: 74, floor: 6, jitter: 3, rng });
    return toResult(entries, { beats, breakdown, variant: 'get-a-grip',
      detail: {
        runs: entries.map(e => ({
          name: e.name, minutes: held[e.name], threw: e.threw,
          // The card that puts them on the mat, so the yard empties in step
          // with the log instead of resolving all at once at the end.
          revealAt: revealAt[e.name] ?? 0,
          // What the arm could have done against what they spent of it. A gap
          // here is the houseguest who stepped down with time left.
          willing: breakdown[e.name]?.willingness ?? null,
          spend: breakdown[e.name]?.spend ?? null,
        })),
      } });
  },
};

// ══════════════════════════════════════════════════════════════════════
// Tightrope
// ══════════════════════════════════════════════════════════════════════

const ROPE_FALL = [
  (n, p) => `${n} makes it two-thirds across before a foot rolls off the rope. It is back to the starting platform.`,
  (n, p) => `${n} glances down, loses balance, and lands in the net.`,
  (n, p) => `${n} rushes the final few steps and falls just short of the far platform.`,
  (n, p) => `${n} fights through one wobble, overcorrects on the next, and drops into the net.`,
];

const ROPE_GOOD = [
  (n, p) => `${n} slows down, waits for the rope to settle after every step, and starts making real progress.`,
  (n, p) => `${n} keeps both arms wide and ${p.posAdj} eyes fixed on the far platform.`,
  (n, p) => `${n} crosses without rushing, barely giving the rope time to swing.`,
];

export const tightrope = {
  id: 'bb-grip-tightrope',
  name: 'Tightrope',
  category: 'balance',
  types: ['hoh', 'arena', 'tiebreaker'],
  desc: 'A single rope is strung between two platforms above a net, and each houseguest has to get from one end of it to the other without falling. There is nothing to hold and nothing to lean on, and no way across but along the rope. A fall costs the whole trip rather than a few seconds: anybody who touches the net climbs back to the platform they started from and begins the crossing again from nothing. The first houseguest to reach the far platform wins, which is why hurrying is the most expensive thing anybody does out there.',
  // Balance under nerve. Intuition is the constant micro-correction, boldness
  // is being willing to commit to a step at all, and temperament is what stops
  // a wobble becoming a fall.
  stats: { intuition: 0.34, physical: 0.24, boldness: 0.22, temperament: 0.20 },
  roles: {
    poise: { intuition: 0.38, physical: 0.27, boldness: 0.25, temperament: 0.10 },
    nerve: { temperament: 1 },
  },
  weight: () => 1,
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, {
      // The swingiest of the six, and it should be. A fall does not cost a
      // second here, it costs the entire crossing — so a single bad trip
      // rewrites the whole result, and the best balance in the house does not
      // get to own this competition. Measured: at 2.9 the top houseguest took
      // 75% of forty runs, which is somebody owning it outright.
      mix: this.roles.poise, swingBy: this.roles.nerve, luck: 5.2, context, rng,
    });
    const say = makePicker(rng);
    const beats = [beat(
      'A tightrope connects the two platforms above a safety net. Falling means returning to the start and trying the entire crossing again.',
      participants.slice(0, 3), 'ONE ROPE')];

    // Crossings, read off the finishing order so the narration and the result
    // can never disagree — and the falls belong to the people who had them.
    const worst = [...entries].reverse();
    worst.slice(0, Math.min(3, Math.max(1, worst.length - 2))).forEach(e => {
      const p = pronouns(e.name);
      if (e.threw) {
        beats.push(beat(say(THROW_LINES)(e.name), [e.name], 'THREW IT', 'grey'));
        return;
      }
      beats.push(beat(say(ROPE_FALL)(e.name, p), [e.name], 'IN THE NET', 'red'));
    });

    const [winner, runnerUp] = entries;
    if (runnerUp) {
      const p = pronouns(runnerUp.name);
      beats.push(beat(say(ROPE_GOOD)(runnerUp.name, p), [runnerUp.name], 'STEADY', 'blue'));
      api.popDelta(runnerUp.name, 1);
    }
    beats.push(beat(
      `${winner.name} plants both feet on the far platform and wins the competition.`,
      [winner.name], 'ACROSS', 'gold'));
    /* ONE CROSSING, NOT A LAP COUNT.
       The wiki rule is "reach one end of a tightrope to another without
       falling", so what this publishes is how far along the rope each
       houseguest got on their best attempt and how many times they went in the
       net getting there — not a score. The winner is the one who reached the
       far platform; everybody else has a distance and a fall count, which is
       exactly what the screen needs to draw a rope with people strung along it. */
    const LENGTH = 12;
    const reach = quantise(entries, { top: LENGTH, floor: 1, jitter: 0.7, rng });
    const falls = quantise([...entries].reverse(), { top: 6, floor: 0, jitter: 0.8, rng });
    return toResult(entries, { beats, breakdown, variant: 'tightrope',
      detail: {
        length: LENGTH,
        runs: entries.map((e, i) => ({
          name: e.name,
          // Only the winner is across. Everybody else stopped where they stopped.
          metres: i === 0 ? LENGTH : Math.min(LENGTH - 1, Math.round(reach[e.name])),
          across: i === 0,
          falls: Math.round(falls[e.name]),
          threw: e.threw,
        })),
      } });
  },
};

/**
 * How hard somebody pulls when a knot will not come.
 *
 * The mirror of willingnessOf, pointed at the opposite behaviour. In a hold,
 * nerve buys you time; on a rope it costs you the rope. The wiki rule is only
 * "untie a series of knots", but the trap is in the material: force tightens a
 * knot instead of opening it, so the houseguest who gets angry at one is
 * actively making it harder than it was handed to them.
 *
 * That makes temperament THE stat here rather than a spread term — the thing a
 * viewer can point at and say why it decided the competition. A level
 * houseguest works the knot; a volatile one fights it and loses to a rope.
 */
function patienceOf(name, mix) {
  const t = aptitude(name, mix);
  return {
    patience: Math.round(t * 100) / 100,
    // Up to about a third of the run lost to pulling, at the bottom of the scale.
    cost: 1 - ((10 - t) / 10) * 0.34,
  };
}

// ══════════════════════════════════════════════════════════════════════
// Feeling Knotty
// ══════════════════════════════════════════════════════════════════════

const KNOT_FIRST = [
  (n, p) => `${n} has the first one open before most of the yard has finished reading the rope, and holds it up without saying anything.`,
  (n, p) => `The first knot in the yard goes to ${n}, who does not celebrate it and does not stop moving either.`,
  (n, p) => `${n} gets one open early. Four people look over at the same time and then very deliberately look back down.`,
];

const KNOT_PROGRESS = [
  (n, p) => `${n} is through the second and into the third, working with two fingers and no shoulders at all.`,
  (n, p) => `Another one gives for ${n}. Whatever ${p.sub} ${vb(p, 'is', 'are')} doing, ${p.sub} ${vb(p, 'has', 'have')} stopped doing anything else.`,
  (n, p) => `${n} finds the load-bearing strand first every time now, which is the difference between this and the four people still fighting.`,
  (n, p) => `${n} has the rhythm of it: find the slack, follow it, do not pull. It is going quickly.`,
];

const KNOT_STALL = [
  (n, p) => `${n} has been on the same knot long enough to have tried three different approaches and gone back to the first one.`,
  (n, p) => `${n} stops, shakes out ${p.posAdj} hands, and starts again from the other end of the same knot.`,
  (n, p) => `${n} is not making it worse, which at this stage is most of what can be asked, but ${p.sub} ${vb(p, 'is', 'are')} not making it better either.`,
];

const KNOT_ROOM = [
  () => `The yard has gone almost silent. Seventeen people working rope makes less noise than one conversation.`,
  () => `Somebody at the back says "do not pull it" to nobody in particular, and two people stop pulling.`,
  () => `There is a stretch in the middle where nothing happens to anybody, and it goes on long enough to be uncomfortable.`,
  () => `A knot gives somewhere and half the yard looks up to see whose it was.`,
];

const KNOT_LEAD = [
  (a, b) => `${a} goes past ${b} without either of them looking up, and the order of this competition changes without a word said about it.`,
  (a, b) => `${b} has been in front since the first knot. ${a} is not any more slower than ${b} and has stopped making mistakes, which is enough.`,
  (a, b) => `The lead changes hands. ${a} is on the last one; ${b} is still on the fifth and now knows it.`,
];

const KNOT_TIGHTEN = [
  (n, p) => `${n} pulls the wrong end and cinches the knot tighter.`,
  (n, p) => `${n} rushes through the loose strands, tangles two together, and has to undo the extra mess first.`,
  (n, p) => `${n} loses patience and yanks the rope. The knot tightens immediately.`,
  (n, p) => `${n} is still working on the same knot while the stations on either side move ahead.`,
];

const KNOT_GOOD = [
  (n, p) => `${n} pushes slack into the knot, loosens the centre, and pulls the strand free.`,
  (n, p) => `${n} finds the strand holding the knot together and opens it in seconds.`,
  (n, p) => `${n} works slowly with both thumbs, loosening each knot before pulling anything through.`,
];

export const feelingKnotty = {
  id: 'bb-grip-knots',
  name: 'Feeling Knotty',
  category: 'precision',
  types: ['veto', 'arena', 'tiebreaker'],
  desc: 'Each houseguest is given a length of rope with a series of knots tied into it and has to untie every one of them by hand. There are no tools and nothing to cut with. The trap is that force works against them: pulling on the wrong strand tightens a knot instead of opening it, so a houseguest who hurries ends up holding something harder than they were handed. The first houseguest to untie every knot on their rope wins, and most of the field is beaten by their own hands rather than by the clock.',
  // Patience with fingers. Temperament is the whole trap of this one — the
  // person who gets angry at a knot makes it worse — and mental is reading
  // which strand is load-bearing before touching anything.
  // Temperament leads because it is the TRAP, not because a knot cares how calm
  // you are: force tightens it, so the volatile houseguest spends the
  // competition making their own rope worse. See patienceOf.
  stats: { temperament: 0.34, intuition: 0.28, mental: 0.24, physical: 0.14 },
  roles: {
    // Reading which strand is load-bearing, and the fingers to work it.
    hands: { intuition: 0.42, mental: 0.36, physical: 0.22 },
    patience: { temperament: 1 },
  },
  weight: () => 1,
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, {
      /* WIDER, FOR THE SAME REASON GET A GRIP IS.
         Patience MULTIPLIES the hands score rather than adding to it, so a
         houseguest who reads rope well and stays calm collects both and the
         advantages compound — measured at 63% for the top houseguest against a
         ceiling of 62%, which is one player owning a competition. The noise
         pays for the compounding; the multiplier is the point and stays. */
      mix: this.roles.hands, swingBy: this.roles.patience, luck: 3.3, context, rng,
    });
    /* THE ROPE ANSWERS FORCE WITH FORCE.
       Applied after the hands are scored and before the field is ranked, so a
       calm pair of average hands genuinely beats a clever pair of angry ones —
       which is the competition the wiki describes, and was not the one being
       simulated while temperament was only widening a spread. */
    for (const e of entries) {
      const { patience, cost } = patienceOf(e.name, this.roles.patience);
      const worked = e.score * cost;
      breakdown[e.name].patience = patience;
      breakdown[e.name].forceCost = Math.round(cost * 100) / 100;
      breakdown[e.name].ceiling = Math.round(e.score * 100) / 100;
      breakdown[e.name].score = Math.round(worked * 100) / 100;
      e.score = worked;
    }
    entries.sort((a, b) => b.score - a.score);

    const say = makePicker(rng);
    const beats = [beat(
      'Six knots each, and one rule: nothing sharp. The ropes are the same length and tied the same way, which is the last thing about this competition that is going to be fair.',
      participants.slice(0, 3), 'SIX KNOTS')];

    /* ── THE LOG HAS AN ARC, NOT A LIST ──
       Seven cards for a house of seventeen is a summary: four people fail, one
       comes second, one wins, and the fourteen minutes in the middle where the
       competition was actually decided never happened. So the yard is watched
       the way it would be watched — an early lead, the back of the field
       coming apart, the room going quiet, somebody going past somebody — and
       every card that names a houseguest also RESOLVES their rope, which is
       what keeps the bench opening in step with it. */
    const [winner, runnerUp] = entries;
    const revealAt = {};
    const worst = [...entries].reverse();
    const strugglers = worst.filter(e => e.name !== winner.name && e.name !== runnerUp?.name);
    const field = entries.length;

    // Early: somebody is first, and it matters who.
    const early = entries[Math.min(1, entries.length - 1)] || winner;
    beats.push(beat(say(KNOT_FIRST)(early.name, pronouns(early.name)), [early.name], 'FIRST OPEN', 'blue'));

    // The back of the field comes apart, spread through the log rather than
    // stacked at the top of it.
    /* A THROWN COMPETITION IS NOT A STORY ABOUT ROPE.
       The cards come off the back of the field, and throwers sit at the back
       by construction — they take a scoring penalty — so a straight slice
       produced five THREW IT cards out of six and a log in which almost
       nobody was described untying anything. Throwing is real here (the veto
       has its own read, see throwRead) and it is worth a card or two, but it
       cannot be the competition. Two at most; the rest are people the rope
       actually beat. */
    const CARDED = Math.max(2, Math.min(6, Math.round(field * 0.35)));
    const threw = strugglers.filter(e => e.threw);
    const tried = strugglers.filter(e => !e.threw);
    const carded = [...threw.slice(0, 2), ...tried.slice(0, Math.max(0, CARDED - Math.min(2, threw.length)))]
      // Back in finishing order, so the log still empties the yard from the
      // bottom up rather than listing the quitters first.
      .sort((a, b) => strugglers.indexOf(a) - strugglers.indexOf(b));
    carded.forEach((e, i) => {
      const p = pronouns(e.name);
      revealAt[e.name] = beats.length;
      if (e.threw) {
        beats.push(beat(say(THROW_LINES)(e.name), [e.name], 'THREW IT', 'grey'));
      } else {
        beats.push(beat(say(KNOT_TIGHTEN)(e.name, p), [e.name], 'TIGHTER', 'red'));
      }
      // The room, between failures, so the log breathes.
      if (i === 0 || i === Math.floor(CARDED / 2)) {
        beats.push(beat(say(KNOT_ROOM)(), participants.slice(0, 3), 'THE YARD', 'grey'));
      }
      // And somebody near the front getting on with it, so the competition is
      // not narrated entirely through the people losing it.
      const mover = entries[Math.min(2 + i, Math.max(0, field - 1))];
      if (mover && mover.name !== e.name && mover.name !== winner.name) {
        revealAt[mover.name] = beats.length;
        beats.push(beat(say(KNOT_PROGRESS)(mover.name, pronouns(mover.name)), [mover.name], 'ANOTHER GIVES', 'blue'));
      }
    });

    // Somebody stuck in the middle of the pack, which is where most of a house
    // spends this competition.
    // Somebody the log has not already used. Picking by position alone cast
    // the same houseguest twice — once for tightening a knot and again for
    // being stuck on one — which reads as the screen losing track of the yard.
    const used = new Set(carded.map(e => e.name));
    const stuck = entries.slice(Math.floor(field / 2)).find(e =>
      !used.has(e.name) && e.name !== winner.name && e.name !== runnerUp?.name)
      || entries.find(e => !used.has(e.name) && e.name !== winner.name && e.name !== runnerUp?.name);
    if (stuck) {
      revealAt[stuck.name] = beats.length;
      beats.push(beat(say(KNOT_STALL)(stuck.name, pronouns(stuck.name)), [stuck.name], 'STILL ON IT', 'grey'));
    }

    // The lead changes, which is the moment the competition turns.
    if (runnerUp) {
      beats.push(beat(say(KNOT_LEAD)(winner.name, runnerUp.name),
        [winner.name, runnerUp.name], 'THE LEAD', 'gold'));
      api.popDelta(winner.name, 1);
    }

    // Anybody the log never named resolves here, so no rope is left hanging.
    for (const e of entries) {
      if (revealAt[e.name] == null && e.name !== winner.name && e.name !== runnerUp?.name) {
        revealAt[e.name] = beats.length;
      }
    }

    if (runnerUp) {
      revealAt[runnerUp.name] = beats.length;
      beats.push(beat(
        `${runnerUp.name} is loosening the final knot when ${winner.name} finishes.`,
        [runnerUp.name], 'ONE SHORT', 'blue'));
      api.popDelta(runnerUp.name, 1);
    }
    revealAt[winner.name] = beats.length;
    beats.push(beat(say(KNOT_GOOD)(winner.name, pronouns(winner.name)), [winner.name], 'IT OPENS', 'gold'));
    // Six knots each: how many opened, and how many were pulled tighter on
    // the way. The screen draws the rope, so it needs both.
    const KNOTS = 6;
    const opened = quantise(entries, { top: KNOTS, floor: 0, jitter: 0.7, rng });
    return toResult(entries, { beats, breakdown, variant: 'feeling-knotty',
      detail: {
        knots: KNOTS,
        runs: entries.map((e, i) => {
          // Only the winner clears the rope. Everybody else stopped on a knot.
          const clear = i === 0 ? KNOTS : Math.min(KNOTS - 1, Math.round(opened[e.name]));
          const pat = breakdown[e.name]?.patience ?? 5;
          // Knots pulled tighter comes off temperament rather than out of a
          // second roll, so the screen and the maths agree: the houseguest the
          // rope beat is the one who fought it.
          /* NOT CAPPED BY WHAT IS LEFT ON THE ROPE.
             It was min(KNOTS - clear, ...), which collapsed the whole range:
             anybody one knot short reported exactly one tightened whatever
             their temperament, so a patient houseguest and a furious one drew
             identically and the stat the competition is built on became
             invisible at the only place it is shown. A knot you pulled tighter
             is damage you did whether or not you later got it open. */
          const fought = Math.max(0, Math.min(4, Math.round((10 - pat) / 2.2)));
          return {
            name: e.name, opened: clear, tightened: fought, threw: e.threw,
            patience: pat, revealAt: revealAt[e.name] ?? 0,
          };
        }),
      } });
  },
};

// ══════════════════════════════════════════════════════════════════════
// Memory Dip
// ══════════════════════════════════════════════════════════════════════

const DIP_FIRST = [
  (n, p) => `${n} is in the water before the sentence finishes and comes up with a tile nobody else had thought to look for yet.`,
  (n, p) => `The first tile on any board belongs to ${n}, who does not stop to enjoy it.`,
  (n, p) => `${n} goes down knowing what ${p.sub} ${vb(p, 'wants', 'want')}, which is the difference between a dive and a search.`,
];

const DIP_PROGRESS = [
  (n, p) => `${n} surfaces, places it without checking the board twice, and is back under before the water has settled.`,
  (n, p) => `Another one for ${n}. ${p.Sub} ${vb(p, 'has', 'have')} stopped coming up for anything except air.`,
  (n, p) => `${n} has worked out the order backwards, from the most recent eviction, and has stopped having to think about it at all.`,
  (n, p) => `${n} is taking longer under than anybody and coming up with exactly the tile ${p.sub} went for.`,
];

const DIP_BREATH = [
  (n, p) => `${n} is spending more of every dive getting back to the surface than getting to the bottom.`,
  (n, p) => `${n} hangs on the ladder for a long moment before going again. The arithmetic of that is not good.`,
  (n, p) => `${n} knows exactly which tile it is and cannot stay down long enough to reach it, which is the cruellest version of this competition.`,
];

const DIP_ROOM = [
  () => `Somebody laughs at the wrong moment and it carries across the water further than they meant it to.`,
  () => `The tanks are the only thing making noise in the yard. Everybody has stopped narrating their own board.`,
  () => `A tile goes back into the water somewhere down the row and three people flinch.`,
  () => `Every board in the yard is somebody's own season, laid out wrong.`,
];

const DIP_LEAD = [
  (a, b) => `${a} places one that ${b} is still in the water looking for, and the boards stop being level.`,
  (a, b) => `${b} has been ahead since the first dive. ${a} has not been faster, only wrong less often, and that is now the whole gap.`,
  (a, b) => `The lead goes to ${a}. ${b} surfaces, sees the board, and goes straight back down without saying anything.`,
];

const DIP_BAD = [
  (n, p) => `${n} surfaces with a tile, checks the board, and realizes it belongs four spots earlier.`,
  (n, p) => `${n} turns back before reaching the bottom and comes up empty-handed.`,
  (n, p) => `${n} points to the correct space on the board, then dives into the wrong section of the tank.`,
  (n, p) => `${n} tries to carry two tiles up at once and drops one halfway to the surface.`,
];

const DIP_GOOD = [
  (n, p) => `${n} studies the empty space before diving and comes back with the exact tile ${p.sub} ${vb(p, 'needs', 'need')}.`,
  (n, p) => `${n} builds backward from the most recent eviction and quickly fills the final spaces.`,
  (n, p) => `${n} places the tile immediately, takes one breath, and dives for the next.`,
];

export const memoryDip = {
  id: 'bb-grip-memory-dip',
  name: 'Memory Dip',
  category: 'memory',
  types: ['hoh', 'veto'],
  desc: 'A row of water tanks holds puzzle tiles at the bottom, one houseguest to a tank, and every tile carries the face of somebody who has already left this house. They dive, bring up one tile at a time, and lay them out on the board at the side of the tank in the exact order those houseguests were evicted. Air is the whole problem: a dive spent on the wrong tile is a dive nobody gets back, and a tile placed in the wrong slot has to be lifted and re-laid before anything after it counts. The first houseguest to finish their board in the correct order wins.',
  // The only competition in the library where the body and the memory compete
  // for the same lungful of air, so both carry real weight.
  // Two separate jobs competing for one lungful of air, so they are two
  // separate mixes: knowing WHICH tile, and being able to get to it. Kept
  // additive rather than multiplied — see the note in simulate.
  stats: { mental: 0.34, intuition: 0.28, endurance: 0.22, physical: 0.16 },
  roles: {
    // Which tile, and where in the order it goes.
    recall: { mental: 0.55, intuition: 0.45 },
    // How many dives there are to spend at all.
    breath: { endurance: 0.58, physical: 0.42 },
  },
  weight: () => 1,
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, {
      mix: this.roles.recall, luck: 2.7, context, rng,
    });
    /* AIR IS ADDED, NOT MULTIPLIED, AND THAT IS DELIBERATE.
       Two competitions here have already had to be widened because a second
       stat was applied as a MULTIPLIER: capacity times willingness on the
       poles, hands times patience on the rope. A multiplier compounds, so
       whoever is good at both collects both and drifts toward owning the
       competition. Breath is a flat swing of about plus or minus three
       instead, which is the difference between a strong swimmer getting more
       dives and a strong swimmer winning by default — and it keeps the two
       halves of this competition genuinely in tension rather than stacked. */
    for (const e of entries) {
      const air = aptitude(e.name, this.roles.breath);
      const recall = aptitude(e.name, this.roles.recall);
      const bonus = (air - 5) * 0.55;
      breakdown[e.name].air = Math.round(air * 100) / 100;
      breakdown[e.name].recall = Math.round(recall * 100) / 100;
      breakdown[e.name].airBonus = Math.round(bonus * 100) / 100;
      breakdown[e.name].score = Math.round((e.score + bonus) * 100) / 100;
      e.score += bonus;
    }
    entries.sort((a, b) => b.score - a.score);

    const say = makePicker(rng);
    const gone = (context.house || []).length;
    const beats = [beat(
      `Faces at the bottom of the water, in an order this house made itself over ${gone ? 'the last few weeks' : 'the season'}. Everybody looks at the tanks for a second longer than they need to.`,
      participants.slice(0, 3), 'INTO THE WATER')];

    /* The same arc the rope has, for the same reason: a competition narrated
       through three failures and a winner is a summary of one. Every card that
       names somebody resolves their board too, so the tanks fill in step with
       the log. */
    const [winner, runnerUp] = entries;
    const revealAt = {};
    const field = entries.length;
    const worst = [...entries].reverse();
    const strugglers = worst.filter(e => e.name !== winner.name && e.name !== runnerUp?.name);

    const early = entries[Math.min(1, field - 1)] || winner;
    beats.push(beat(say(DIP_FIRST)(early.name, pronouns(early.name)), [early.name], 'FIRST TILE', 'blue'));

    // Throwers are capped at two — see the note on the rope. The rest of the
    // back of the field is people the water beat.
    const CARDED = Math.max(2, Math.min(6, Math.round(field * 0.35)));
    const threw = strugglers.filter(e => e.threw);
    const tried = strugglers.filter(e => !e.threw);
    const carded = [...threw.slice(0, 2), ...tried.slice(0, Math.max(0, CARDED - Math.min(2, threw.length)))]
      .sort((a, b) => strugglers.indexOf(a) - strugglers.indexOf(b));

    carded.forEach((e, i) => {
      const p = pronouns(e.name);
      revealAt[e.name] = beats.length;
      if (e.threw) {
        beats.push(beat(say(THROW_LINES)(e.name), [e.name], 'THREW IT', 'grey'));
      } else {
        // Out of air or out of memory — the two ways to lose this, told apart
        // by which of the two this houseguest actually had.
        const shortOfAir = (breakdown[e.name]?.air ?? 5) < (breakdown[e.name]?.recall ?? 5);
        beats.push(shortOfAir
          ? beat(say(DIP_BREATH)(e.name, p), [e.name], 'OUT OF AIR', 'red')
          : beat(say(DIP_BAD)(e.name, p), [e.name], 'WRONG TILE', 'red'));
      }
      if (i === 0 || i === Math.floor(CARDED / 2)) {
        beats.push(beat(say(DIP_ROOM)(), participants.slice(0, 3), 'THE ROW', 'grey'));
      }
      const mover = entries[Math.min(2 + i, Math.max(0, field - 1))];
      if (mover && mover.name !== e.name && mover.name !== winner.name) {
        revealAt[mover.name] = beats.length;
        beats.push(beat(say(DIP_PROGRESS)(mover.name, pronouns(mover.name)), [mover.name], 'PLACED', 'blue'));
      }
    });

    const used = new Set(carded.map(e => e.name));
    const stalled = entries.slice(Math.floor(field / 2)).find(e =>
      !used.has(e.name) && e.name !== winner.name && e.name !== runnerUp?.name);
    if (stalled) {
      revealAt[stalled.name] = beats.length;
      beats.push(beat(say(DIP_BREATH)(stalled.name, pronouns(stalled.name)),
        [stalled.name], 'ON THE LADDER', 'grey'));
    }

    if (runnerUp) {
      beats.push(beat(say(DIP_LEAD)(winner.name, runnerUp.name),
        [winner.name, runnerUp.name], 'THE LEAD', 'gold'));
      api.popDelta(winner.name, 1);
    }

    for (const e of entries) {
      if (revealAt[e.name] == null && e.name !== winner.name && e.name !== runnerUp?.name) {
        revealAt[e.name] = beats.length;
      }
    }

    if (runnerUp) {
      revealAt[runnerUp.name] = beats.length;
      beats.push(beat(
        `${runnerUp.name} finishes the board a tile later and spends the rest of the night working out which dive it was.`,
        [runnerUp.name], 'ONE DIVE SHORT', 'blue'));
      api.popDelta(runnerUp.name, 1);
    }
    revealAt[winner.name] = beats.length;
    beats.push(beat(say(DIP_GOOD)(winner.name, pronouns(winner.name)), [winner.name], 'IN ORDER', 'gold'));
    // Tiles laid in the right order, dives spent getting them, and the ones
    // brought up wrong. Dives always exceed tiles — that is the competition.
    const TILES = 8;
    const placed = quantise(entries, { top: TILES, floor: 0, jitter: 0.7, rng });
    return toResult(entries, { beats, breakdown, variant: 'memory-dip',
      detail: {
        tiles: TILES,
        runs: entries.map((e, i) => {
          // Only the winner finishes the board.
          const good = i === 0 ? TILES : Math.min(TILES - 1, Math.round(placed[e.name]));
          const rec = breakdown[e.name]?.recall ?? 5;
          const air = breakdown[e.name]?.air ?? 5;
          // Wasted dives come off RECALL and nothing else, so the screen and
          // the maths say the same thing: the houseguest who did not know
          // which tile it was is the one who spent air finding out.
          const bad = Math.max(0, Math.min(5, Math.round((10 - rec) / 2.1)));
          return {
            name: e.name, placed: good, wrong: bad, dives: good + bad, threw: e.threw,
            air: Math.round(air * 10) / 10, recall: Math.round(rec * 10) / 10,
            revealAt: revealAt[e.name] ?? 0,
          };
        }),
      } });
  },
};

// ══════════════════════════════════════════════════════════════════════
// Ship Til You Drop
// ══════════════════════════════════════════════════════════════════════

const SHIP_GO = [
  (n, p) => `${n} accepts another box, shifts the stack too far left, and loses the entire load.`,
  (n, p) => `${n} pins the boxes between a knee and ${p.posAdj} chin until the bottom one slides free.`,
  (n, p) => `${n} adds a box above eye level, takes a blind step, and sends the stack onto the deck.`,
  (n, p) => `${n}'s arms hold, but the stack tilts forward and cannot be recovered.`,
];

const SHIP_HOLD = [
  (n, p) => `${n} spreads the next boxes across ${p.posAdj} forearms instead of making the stack any taller.`,
  (n, p) => `${n} braces the stack against ${p.posAdj} chest and keeps both feet planted.`,
  (n, p) => `${n} wedges the bottom box between ${p.posAdj} forearms and uses ${p.posAdj} shoulder to steady the top.`,
];

export const shipTilYouDrop = {
  id: 'bb-grip-ship',
  name: 'Ship Til You Drop',
  category: 'endurance',
  types: ['hoh', 'tiebreaker'],
  desc: 'The houseguests stand on the deck holding a box against their body, and then another, and then another, added at a steady rate that never slows down for anybody. They may balance them any way they can manage — arms, chin, shoulder, hip — but the boxes have to be held by the body, and the ground cannot take any of the weight. The moment a box drops, that houseguest is finished. Whoever is still standing under their stack when everybody else has lost theirs wins, and the load is built to beat every single person eventually.',
  // A hold that gets heavier. Physical carries more here than in the other
  // endurance comps because the load genuinely grows; endurance is how long
  // the arms answer once it has.
  stats: { physical: 0.36, endurance: 0.34, temperament: 0.17, boldness: 0.13 },
  roles: {
    carry: { physical: 0.39, endurance: 0.37, boldness: 0.14, temperament: 0.10 },
    balance: { intuition: 1 },
  },
  weight: () => 1,
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, {
      mix: this.roles.carry, swingBy: this.roles.balance, luck: 2.5, context, rng,
    });
    const say = makePicker(rng);
    const beats = [beat(
      'The houseguests begin with one box. Another is added at every signal, and dropping any part of the stack means elimination.',
      participants.slice(0, 3), 'STACK UP')];

    const order = [...entries].reverse();
    order.slice(0, Math.max(1, order.length - 2)).forEach((e, i) => {
      const p = pronouns(e.name);
      if (e.threw) {
        beats.push(beat(say(THROW_LINES)(e.name), [e.name], 'THREW IT', 'grey'));
        return;
      }
      beats.push(beat(say(SHIP_GO)(e.name, p), [e.name], i === 0 ? 'FIRST TO DROP' : 'THE STACK GOES', 'red'));
    });

    const [winner, runnerUp] = entries;
    if (runnerUp) {
      beats.push(beat(say(SHIP_HOLD)(runnerUp.name, pronouns(runnerUp.name)),
        [runnerUp.name, winner.name], 'THE LAST TWO', 'gold'));
      api.popDelta(runnerUp.name, 1);
    }
    beats.push(beat(
      `${winner.name} keeps the full stack off the deck after everyone else has dropped theirs.`,
      [winner.name], 'STILL STANDING', 'gold'));
    // Boxes still against the body when the stack went. The screen draws the
    // stack, so this is the whole picture: a number and a shape at once.
    const boxes = quantise(entries, { top: 17, floor: 2, jitter: 1.2, rng });
    return toResult(entries, { beats, breakdown, variant: 'ship-til-you-drop',
      detail: {
        runs: entries.map(e => ({ name: e.name, boxes: Math.round(boxes[e.name]), threw: e.threw })),
      } });
  },
};

// ══════════════════════════════════════════════════════════════════════
// Domino Effect
// ══════════════════════════════════════════════════════════════════════

const DOM_GO = [
  (n, p) => `${n}'s knuckle clips a tile near the end of the route, knocking down most of the pattern.`,
  (n, p) => `${n} kneels on the edge of the mat. The surface shifts, and an entire row falls.`,
  (n, p) => `${n} reaches across a finished section, brushes one tile with a sleeve, and has to rebuild it.`,
  (n, p) => `${n} turns too quickly and catches the route with an elbow. The collapse runs through both corners.`,
];

const DOM_GOOD = [
  (n, p) => `${n} leaves safety gaps between sections, limiting each mistake to a few tiles.`,
  (n, p) => `${n} places the final tile, checks both turns, and carefully moves clear of the mat.`,
  (n, p) => `${n} builds at a steady pace and reaches the end without triggering a collapse.`,
];

export const dominoEffect = {
  id: 'bb-grip-dominoes',
  name: 'Domino Effect',
  category: 'precision',
  types: ['veto', 'arena'],
  desc: 'Each houseguest gets a mat, a crate of dominoes and the pattern they have been told to build, and they stand every tile themselves. Nothing may be propped, glued or blocked. The cruelty is that the run only counts once it is set off deliberately at the end: a tile knocked early takes everything after it down too, and all of those have to be stood back up before another one can be added. The first houseguest to finish their pattern and topple it in one clean run wins.',
  // Hands and nerve, with mental reading the route before building it. Nothing
  // physical about it beyond keeping still, which is temperament's job here.
  stats: { intuition: 0.34, temperament: 0.30, mental: 0.24, physical: 0.12 },
  roles: {
    steady: { intuition: 0.37, mental: 0.27, temperament: 0.24, physical: 0.12 },
    calm: { temperament: 1 },
  },
  weight: () => 1,
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, {
      mix: this.roles.steady, swingBy: this.roles.calm, luck: 2.8, context, rng,
    });
    const say = makePicker(rng);
    const beats = [beat(
      'Each houseguest must copy the displayed domino pattern. An early collapse has to be rebuilt before they can continue.',
      participants.slice(0, 3), 'THE ROUTE')];

    const worst = [...entries].reverse();
    worst.slice(0, Math.min(3, Math.max(1, worst.length - 2))).forEach(e => {
      const p = pronouns(e.name);
      if (e.threw) {
        beats.push(beat(say(THROW_LINES)(e.name), [e.name], 'THREW IT', 'grey'));
        return;
      }
      beats.push(beat(say(DOM_GO)(e.name, p), [e.name], 'IT GOES EARLY', 'red'));
    });

    const [winner, runnerUp] = entries;
    beats.push(beat(say(DOM_GOOD)(winner.name, pronouns(winner.name)), [winner.name], 'BUILT', 'blue'));
    beats.push(beat(
      `${winner.name} tips the first domino. The chain continues through the full pattern and knocks down the final tile.`,
      [winner.name], 'CLEAN RUN', 'gold'));
    if (runnerUp) {
      beats.push(beat(
        `${runnerUp.name} has three tiles left to place when ${winner.name}'s final marker falls.`,
        [runnerUp.name], 'THREE SHORT', 'blue'));
    }
    // Tiles standing at the end and how many times the run went early. A
    // houseguest with a high count and two collapses built it three times.
    const stood = quantise(entries, { top: 120, floor: 12, jitter: 6, rng });
    const collapses = quantise([...entries].reverse(), { top: 4, floor: 0, jitter: 0.8, rng });
    return toResult(entries, { beats, breakdown, variant: 'domino-effect',
      detail: {
        route: 120,
        runs: entries.map(e => ({
          name: e.name,
          tiles: Math.round(stood[e.name]),
          collapses: Math.round(collapses[e.name]),
          threw: e.threw,
        })),
      } });
  },
};

export const GRIP_COMPS = [
  getAGrip, tightrope, feelingKnotty, memoryDip, shipTilYouDrop, dominoEffect,
];
