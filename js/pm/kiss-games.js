// ══════════════════════════════════════════════════════════════════════
// pm/kiss-games.js — night one's kissing games
// ══════════════════════════════════════════════════════════════════════
//
// Two real first nights where the islanders kiss before they couple up
// (user: "usually don't we have a challenge during the first coupling …
// like kiss people then decide who to couple up with"). From the wiki:
//
//   ICEBREAKERS (US 6, day 1): "the islanders took part in 'Icebreakers'
//   where they kissed each other first to see if they were compatible before
//   the first coupling. Islanders were instructed to break an ice cube in
//   order to retrieve a card containing a question. Their answer depended on
//   who they chose to kiss." Then the girls chose.
//
//   LADY LUCK (US 7, day 1): "Each girl chose two boys to kiss, and one of
//   those boys to couple up with."
//
// A kiss is a test, and it changes what comes next: how much the one kissed
// fancies the kisser decides whether it lands, and both sides' attraction
// moves in proportion. The coupling that follows reads the attraction AFTER
// the kisses. The choosing side is the side that walked in first (Villa
// options), the girls unless the author says otherwise.
import { addBond } from '../bonds.js';
import { makeEvent } from './events.js';
import { attr, nudgeAttraction } from './chemistry.js';
import { ICEBREAKER_CARDS } from './lines/kiss-games.js';

/**
 * One kiss: it lands as far as the one kissed fancies the one kissing, set
 * against how they fancy the rest of that side. Night one's attraction is
 * looks alone and runs low for everybody, so a fixed bar made 37 kisses of
 * 40 fall flat; what a kiss tells you is whether this one is better than
 * the others would be.
 */
function kiss(state, rng, a, b) {
  const back = attr(state, b, a) ?? 5;
  const g = state.profiles[a].gender;
  const rest = state.villa.filter(x => x !== a && state.profiles[x].gender === g).map(x => attr(state, b, x)).filter(v => v != null);
  const usual = rest.length ? rest.reduce((t, v) => t + v, 0) / rest.length : back;
  const lift = back - usual;
  // Proportional both ways: a kiss better than the rest raises it, a worse
  // one lowers it a little; the kisser feels the reply.
  nudgeAttraction(state, b, a, 0.3 * lift + 0.1);
  nudgeAttraction(state, a, b, 0.2 * lift + 0.1);
  addBond(a, b, 0.2);
  // The words only: whether the scene reads as a spark.
  return lift + (rng() - 0.5) >= 0 ? 'spark' : 'flat';
}

const pop = (a, b) => ({ [a]: { approval: 0.2, fame: 1 }, [b]: { approval: 0.1, fame: 0.8 } });
const best = (state, rng, a, options, noise = 1.5) => options
  .filter(b => attr(state, a, b) != null)
  .map(b => [b, attr(state, a, b) + rng() * noise]).sort((x, y) => y[1] - x[1]).map(x => x[0]);

function couple(state, pairs) {
  state.couples = pairs.map(([a, b]) => [a, b]);
  state.recouplings++;
  state.lastRecoupleEp = state.ep;
}

/** Icebreakers: everyone kisses once, on a card's question; then the choosing side picks. */
function icebreakers(state, rng, choosers, others) {
  const events = [];
  const kissed = new Map();          // 'a|b' -> how it went, both ways round
  const everyone = [...choosers, ...others].sort(() => rng() - 0.5);
  for (const a of everyone) {
    const side = choosers.includes(a) ? others : choosers;
    const b = best(state, rng, a, side, 2.5)[0];
    if (!b) continue;
    const card = Math.floor(rng() * ICEBREAKER_CARDS.length);
    const choice = kiss(state, rng, a, b);
    // Two kisses between the same pair: the better one is remembered.
    for (const k of [`${a}|${b}`, `${b}|${a}`]) if (kissed.get(k) !== 'spark') kissed.set(k, choice);
    events.push(makeEvent(state, rng, { phase: 'coupling', kind: 'icebreaker', players: [a, b], aired: true,
      extra: { card, choice, pop: pop(a, b) } }));
  }
  const free = new Set(others);
  const pairs = [];
  for (const a of [...choosers].sort(() => rng() - 0.5)) {
    const b = best(state, rng, a, [...free], 1)[0];
    if (!b) continue;
    free.delete(b);
    pairs.push([a, b]);
    events.push(makeEvent(state, rng, { phase: 'coupling', kind: 'kiss-pick', players: [a, b], aired: true,
      extra: { choice: kissed.get(`${a}|${b}`) || 'other', pop: pop(a, b) } }));
  }
  couple(state, pairs);
  return events;
}

/** Lady Luck: each chooser in turn kisses two of those still free, and couples with one. */
function ladyLuck(state, rng, choosers, others) {
  const events = [];
  const free = new Set(others);
  const pairs = [];
  for (const a of [...choosers].sort(() => rng() - 0.5)) {
    const two = best(state, rng, a, [...free], 2).slice(0, 2);
    if (!two.length) continue;
    const went = {};
    two.forEach((b, i) => {
      const choice = went[b] = kiss(state, rng, a, b);
      events.push(makeEvent(state, rng, { phase: 'coupling', kind: 'lady-luck-kiss', players: [a, b], aired: true,
        extra: { nth: i ? 'next' : 'first', choice, pop: pop(a, b) } }));
    });
    // The one she fancies more now the kisses are done, a little chance.
    const [pick, other] = two.length > 1 ? best(state, rng, a, two, 0.6) : [two[0], null];
    free.delete(pick);
    pairs.push([a, pick]);
    events.push(makeEvent(state, rng, { phase: 'coupling', kind: 'lady-luck-pick', players: other ? [a, pick, other] : [a, pick],
      aired: true, extra: { choice: !other ? 'only-one' : went[pick] === 'spark' ? 'spark' : went[other] === 'spark' ? 'passed-up' : 'flat',
        pop: pop(a, pick) } }));
  }
  couple(state, pairs);
  return events;
}

/** Night one's coupling for a kissing game; `firstIn` is the choosing side. */
export function kissFirst(state, rng, format, firstIn = 'f') {
  const g = n => state.profiles[n].gender;
  const choosers = state.villa.filter(n => g(n) === firstIn);
  const others = state.villa.filter(n => g(n) !== firstIn);
  const events = format === 'lady-luck' ? ladyLuck(state, rng, choosers, others) : icebreakers(state, rng, choosers, others);
  return { events, exits: [], ballots: [] };
}
