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
  desc: 'Every houseguest takes hold of their own pole and holds on. Nothing swings, tilts or sprays, and the pole never moves. They may change grips or rest one arm at a time, but once both hands leave the pole they are eliminated. The last houseguest still holding on wins.',
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
  desc: 'A single rope is strung between two platforms above a safety net, and each houseguest has to cross it. There is nothing to hold and nothing to lean on, and no way over but along the rope itself. A fall costs the whole trip rather than a few seconds: anybody who touches the net climbs back to the platform they started from and begins the crossing again from nothing. The first houseguest to reach the far side wins, which is why hurrying is the most expensive thing anybody does out there.',
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
  desc: 'Each houseguest receives a rope tied with six knots. They must untie every knot by hand without tools, and pulling the wrong strand can tighten the rope further. The first person to free all six knots wins.',
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
      mix: this.roles.hands, swingBy: this.roles.patience, luck: 2.6, context, rng,
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

    /* Every houseguest is resolved by a specific card, so the ropes on screen
       open in step with the log instead of all at once at the end. Walked from
       the WORST up, because this competition is watched through the people it
       is beating. */
    const revealAt = {};
    const worst = [...entries].reverse();
    const CARDED = Math.min(4, Math.max(1, worst.length - 2));
    worst.forEach((e, i) => {
      const p = pronouns(e.name);
      if (e.threw) {
        revealAt[e.name] = beats.length;
        beats.push(beat(say(THROW_LINES)(e.name), [e.name], 'THREW IT', 'grey'));
        return;
      }
      // Only the back of the field gets a card of its own, or the log is
      // twenty cards of rope. Everybody else resolves against the last one.
      if (i < CARDED) {
        revealAt[e.name] = beats.length;
        beats.push(beat(say(KNOT_TIGHTEN)(e.name, p), [e.name], 'TIGHTER', 'red'));
      } else {
        revealAt[e.name] = Math.max(0, beats.length - 1);
      }
    });

    const [winner, runnerUp] = entries;
    if (runnerUp) {
      revealAt[runnerUp.name] = beats.length;
      beats.push(beat(
        `${runnerUp.name} is loosening the final knot when ${winner.name} finishes.`,
        [runnerUp.name], 'ONE SHORT', 'blue'));
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
  desc: 'Tiles showing evicted houseguests are scattered along the bottom of each water tank. Players retrieve one tile per dive and arrange the faces in eviction order on a board beside the tank. The first correct board wins.',
  // The only competition in the library where the body and the memory compete
  // for the same lungful of air, so both carry real weight.
  stats: { mental: 0.38, endurance: 0.26, physical: 0.20, intuition: 0.16 },
  roles: {
    recall: { mental: 0.40, endurance: 0.27, physical: 0.21, intuition: 0.12 },
    breath: { endurance: 1 },
  },
  weight: () => 1,
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, {
      mix: this.roles.recall, swingBy: this.roles.breath, luck: 2.7, context, rng,
    });
    const say = makePicker(rng);
    const gone = (context.house || []).length;
    const beats = [beat(
      `Eviction tiles sit at the bottom of each tank. The houseguests must retrieve them one at a time and arrange them in the correct order.`,
      participants.slice(0, 3), 'INTO THE WATER')];

    const worst = [...entries].reverse();
    worst.slice(0, Math.min(3, Math.max(1, worst.length - 2))).forEach(e => {
      const p = pronouns(e.name);
      if (e.threw) {
        beats.push(beat(say(THROW_LINES)(e.name), [e.name], 'THREW IT', 'grey'));
        return;
      }
      beats.push(beat(say(DIP_BAD)(e.name, p), [e.name], 'WRONG TILE', 'red'));
    });

    const [winner, runnerUp] = entries;
    beats.push(beat(say(DIP_GOOD)(winner.name, pronouns(winner.name)), [winner.name], 'IN ORDER', 'gold'));
    if (runnerUp) {
      beats.push(beat(
        `${runnerUp.name} returns with the final tile just after ${winner.name} completes the board.`,
        [runnerUp.name], 'ONE DIVE SHORT', 'blue'));
      api.popDelta(runnerUp.name, 1);
    }
    // Tiles laid in the right order, dives spent getting them, and the ones
    // brought up wrong. Dives always exceed tiles — that is the competition.
    const TILES = 8;
    const placed = quantise(entries, { top: TILES, floor: 0, jitter: 0.7, rng });
    const wrong = quantise([...entries].reverse(), { top: 5, floor: 0, jitter: 0.8, rng });
    return toResult(entries, { beats, breakdown, variant: 'memory-dip',
      detail: {
        tiles: TILES,
        runs: entries.map(e => {
          const good = Math.min(TILES, Math.round(placed[e.name]));
          const bad = Math.round(wrong[e.name]);
          return { name: e.name, placed: good, wrong: bad, dives: good + bad, threw: e.threw };
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
  desc: 'Houseguests balance a growing stack of boxes against their bodies while a new box is added at every signal. They may use their arms, shoulders, chin or knees, but no box may touch the deck. Dropping any box eliminates them; the last player holding a complete stack wins.',
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
  desc: 'Each houseguest must recreate a displayed pattern with dominoes. Any section knocked over early must be rebuilt. Once the pattern is complete, they tip the first domino; the first player whose full chain falls cleanly wins.',
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
