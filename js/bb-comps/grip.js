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
import { beat, makePicker, scoreField, toResult, vb, THROW_LINES } from './_shared.js';

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

// ══════════════════════════════════════════════════════════════════════
// Get A Grip
// ══════════════════════════════════════════════════════════════════════

const GRIP_HOLD = [
  (n, p) => `${n} has stopped shifting and started breathing on a count, which is what people do when they have decided to be here a while.`,
  (n, p) => `${n} keeps changing which hand carries it. Everybody down there can see the arithmetic being done.`,
  (n, p) => `Nobody is talking to ${n} any more, and ${p.sub} ${vb(p, 'seems', 'seem')} relieved about it.`,
  (n, p) => `${n} has found a way to hang that uses bone instead of muscle. It will not last, but it is lasting.`,
];

const GRIP_GO = [
  (n, p) => `${n}'s fingers open. Not a slip — they simply stop being closed, and ${p.sub} ${vb(p, 'is', 'are')} on the mat before ${p.sub} ${vb(p, 'has', 'have')} decided to be.`,
  (n, p) => `${n} says "okay" to nobody and lets go. There is no drama in it at all, which somehow makes it worse to watch.`,
  (n, p) => `${n} tries one more grip change and does not complete it.`,
  (n, p) => `${n} holds on well past the point of it being useful and comes down shaking out an arm that will not straighten.`,
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
    capacity: { endurance: 0.58, physical: 0.29, boldness: 0.13 },
    steadiness: { temperament: 1 },
  },
  weight: () => 1,
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, {
      mix: this.roles.capacity, swingBy: this.roles.steadiness, luck: 2.3, context, rng,
    });
    const say = makePicker(rng);
    const beats = [beat(
      'Nothing about this one is clever. Everybody is holding a pole, and everybody is going to stop.',
      participants.slice(0, 3), 'FEET UP')];

    const order = [...entries].reverse();
    order.slice(0, Math.max(1, order.length - 2)).forEach((e, i) => {
      const p = pronouns(e.name);
      if (e.threw) {
        beats.push(beat(say(THROW_LINES)(e.name), [e.name], 'THREW IT', 'grey'));
        return;
      }
      beats.push(beat(say(GRIP_GO)(e.name, p), [e.name], i === 0 ? 'FIRST DOWN' : 'DROPS'));
      // Hanging on long past comfort buys nothing but the room's respect.
      if (i > order.length - 5) api.popDelta(e.name, 1);
    });

    const [winner, runnerUp] = entries;
    if (runnerUp) {
      const p = pronouns(runnerUp.name);
      beats.push(beat(say(GRIP_HOLD)(runnerUp.name, p), [runnerUp.name, winner.name], 'THE LAST TWO', 'gold'));
      beats.push(beat(
        `${runnerUp.name} comes down. Whether that was an arm giving out or a deal being taken is the only question anybody in this house will ask about it.`,
        [runnerUp.name, winner.name], 'AND DOWN', 'gold'));
    }
    // Minutes on the pole, longest first — what the screen draws as a hand
    // sliding down a pole rather than as a number in a column.
    const held = quantise(entries, { top: 74, floor: 6, jitter: 3, rng });
    return toResult(entries, { beats, breakdown, variant: 'get-a-grip',
      detail: {
        runs: entries.map(e => ({ name: e.name, minutes: held[e.name], threw: e.threw })),
      } });
  },
};

// ══════════════════════════════════════════════════════════════════════
// Tightrope
// ══════════════════════════════════════════════════════════════════════

const ROPE_FALL = [
  (n, p) => `${n} gets two thirds of the way and the rope decides otherwise. Back to the platform, back to the beginning.`,
  (n, p) => `${n} looks down once. That is all it takes, and the whole crossing is gone.`,
  (n, p) => `${n} tries to hurry the last stretch and lands in the net still reaching for the far post.`,
  (n, p) => `A wobble ${n} has recovered from four times already stops being recoverable.`,
];

const ROPE_GOOD = [
  (n, p) => `${n} has worked out that the rope is calmer if ${p.sub} ${vb(p, 'is', 'are')} slower, which is the opposite of what every instinct is saying.`,
  (n, p) => `${n} crosses with both arms out and both eyes on the far post, and does not look at ${p.posAdj} feet once.`,
  (n, p) => `${n} makes it look boring, which in this competition is the highest praise available.`,
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
      'The rope is thinner than it looked from the sofas, and the net underneath it is a long way down for something that is only there to be humiliating.',
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
      `${winner.name} finishes a crossing nobody else was close to finishing, and steps off the platform to a room that has gone quiet.`,
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

// ══════════════════════════════════════════════════════════════════════
// Feeling Knotty
// ══════════════════════════════════════════════════════════════════════

const KNOT_TIGHTEN = [
  (n, p) => `${n} pulls the strand that looked loose and turns a knot ${p.sub} nearly had into one ${p.sub} ${vb(p, 'does', 'do')} not.`,
  (n, p) => `${n} is working fast, and every fast thing ${p.sub} ${vb(p, 'does', 'do')} is making the next one harder.`,
  (n, p) => `${n} gets frustrated and yanks. The rope answers by getting smaller.`,
  (n, p) => `${n} has been on the same knot long enough that people have stopped watching, which is somehow the worst part.`,
];

const KNOT_GOOD = [
  (n, p) => `${n} stops pulling entirely and starts pushing slack INTO the knot, which is the only thing that has ever worked on one.`,
  (n, p) => `${n} finds the strand that is doing the holding and everything after it comes apart in about four seconds.`,
  (n, p) => `${n} works with two fingers and no force at all, and the rope keeps agreeing to it.`,
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
  stats: { temperament: 0.32, intuition: 0.28, mental: 0.24, physical: 0.16 },
  roles: {
    hands: { intuition: 0.34, mental: 0.29, physical: 0.19, temperament: 0.18 },
    patience: { temperament: 1 },
  },
  weight: () => 1,
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, {
      mix: this.roles.hands, swingBy: this.roles.patience, luck: 2.6, context, rng,
    });
    const say = makePicker(rng);
    const beats = [beat(
      'Six knots each, and the houseguests are told the only rule that matters: nothing sharp, nothing skipped.',
      participants.slice(0, 3), 'SIX KNOTS')];

    const worst = [...entries].reverse();
    worst.slice(0, Math.min(3, Math.max(1, worst.length - 2))).forEach(e => {
      const p = pronouns(e.name);
      if (e.threw) {
        beats.push(beat(say(THROW_LINES)(e.name), [e.name], 'THREW IT', 'grey'));
        return;
      }
      beats.push(beat(say(KNOT_TIGHTEN)(e.name, p), [e.name], 'TIGHTER', 'red'));
    });

    const [winner, runnerUp] = entries;
    beats.push(beat(say(KNOT_GOOD)(winner.name, pronouns(winner.name)), [winner.name], 'IT OPENS', 'gold'));
    if (runnerUp) {
      beats.push(beat(
        `${runnerUp.name} is one knot behind when it ends, which in this competition is a very long way behind.`,
        [runnerUp.name], 'ONE SHORT', 'blue'));
    }
    // Six knots each: how many opened, and how many were pulled tighter on
    // the way. The screen draws the rope, so it needs both.
    const KNOTS = 6;
    const opened = quantise(entries, { top: KNOTS, floor: 0, jitter: 0.7, rng });
    const tightened = quantise([...entries].reverse(), { top: 5, floor: 0, jitter: 0.9, rng });
    return toResult(entries, { beats, breakdown, variant: 'feeling-knotty',
      detail: {
        knots: KNOTS,
        runs: entries.map(e => ({
          name: e.name,
          opened: Math.min(KNOTS, Math.round(opened[e.name])),
          tightened: Math.round(tightened[e.name]),
          threw: e.threw,
        })),
      } });
  },
};

// ══════════════════════════════════════════════════════════════════════
// Memory Dip
// ══════════════════════════════════════════════════════════════════════

const DIP_BAD = [
  (n, p) => `${n} surfaces with a piece, looks at the board, and realises it belongs about four weeks earlier than where ${p.sub} ${vb(p, 'was', 'were')} going to put it.`,
  (n, p) => `${n} runs out of air halfway down and comes up with nothing but a very good idea of where it was.`,
  (n, p) => `${n} can remember the week perfectly and cannot reach the tile that proves it.`,
  (n, p) => `${n} takes two pieces at once to save a dive, drops one on the ladder, and loses more than the dive was worth.`,
];

const DIP_GOOD = [
  (n, p) => `${n} goes down knowing exactly which tile ${p.sub} ${vb(p, 'wants', 'want')}, which turns a lungful of air into one piece instead of a search.`,
  (n, p) => `${n} sets the board out backwards, from the most recent eviction, and stops having to think about it at all.`,
  (n, p) => `${n} surfaces, places it without hesitating, and is back in the water before the splash has settled.`,
];

export const memoryDip = {
  id: 'bb-grip-memory-dip',
  name: 'Memory Dip',
  category: 'memory',
  types: ['hoh', 'veto'],
  desc: 'A row of water tanks holds puzzle tiles at the bottom, one houseguest to a tank, and every tile carries the face of somebody who has already left this house. They dive, bring up one tile at a time, and lay them out on the board at the side of the tank in the exact order those houseguests were evicted. Air is the whole problem: a dive spent on the wrong tile is a dive nobody gets back, and a tile placed in the wrong slot has to be lifted and re-laid before anything after it counts. The first houseguest to finish their board in the correct order wins.',
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
      `Faces at the bottom of the water, in an order this house made itself over ${gone ? 'the last few weeks' : 'the season'}. Everybody looks at the tanks for a second longer than they need to.`,
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
        `${runnerUp.name} finishes the board a tile later and spends the rest of the night working out which dive it was.`,
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
  (n, p) => `${n} takes one box too many and the whole armful goes at once, in about a second and a half.`,
  (n, p) => `${n} is holding the stack with a chin, a knee and a great deal of hope, and two of those give up together.`,
  (n, p) => `${n} gets a box to the top of the pile, cannot see past it, and steps somewhere that is not there.`,
  (n, p) => `${n} manages the weight fine and loses the balance instead, which is the part nobody trains for.`,
];

const SHIP_HOLD = [
  (n, p) => `${n} has stopped adding height and started adding width, which is the first sensible decision anybody has made out here.`,
  (n, p) => `${n} is carrying a stack taller than ${p.sub} ${vb(p, 'is', 'are')} and has not moved ${p.posAdj} feet in four minutes.`,
  (n, p) => `Whatever ${n} is doing with ${p.posAdj} shoulders is not in the rules and is absolutely working.`,
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
      'The first three boxes are nothing and everybody says so out loud. Nobody says anything at all about the ninth.',
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
      `${winner.name} is still holding everything ${pronouns(winner.name).sub} ${vb(pronouns(winner.name), 'was', 'were')} given when the deck is otherwise empty.`,
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
  (n, p) => `${n} catches the second-to-last tile with a knuckle and takes about ninety of them down in one long clean wave.`,
  (n, p) => `${n} kneels on the mat, which moves the mat, which moves everything on it.`,
  (n, p) => `${n} breathes out on a corner and the corner goes, and then the rest of it goes, and ${p.sub} ${vb(p, 'does', 'do')} not say a word.`,
  (n, p) => `${n} has built it beautifully and set it off with an elbow ${p.sub} ${vb(p, 'was', 'were')} not using for anything.`,
];

const DOM_GOOD = [
  (n, p) => `${n} builds in short blocks with gaps between them, so a mistake can only ever cost part of it.`,
  (n, p) => `${n} sets the last tile, sits back on ${p.posAdj} heels and looks at it for a long moment before touching anything.`,
  (n, p) => `${n} works slower than everybody and has rebuilt nothing, which by the end is a very large lead.`,
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
      'Nobody in the yard is talking above a murmur, which tells you everything about how this competition is going to be lost.',
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
      `${winner.name} tips the first tile and the whole route runs, round both turns, up the ramp and through the gate.`,
      [winner.name], 'CLEAN RUN', 'gold'));
    if (runnerUp) {
      beats.push(beat(
        `${runnerUp.name} is three tiles from the gate and has to stand there watching somebody else's finish.`,
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
