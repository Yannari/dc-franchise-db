// Family 4 of the scene catalogue: romance and matchmaking (docs/ridonculous-race-scenes.md §4).
// The lovers are ctx.people[0..1] (or A and C, across two teams). Never between two people of
// a family team; at most four active couples (scenes.js fx.spark / fx.couple). A confession's `interrupted` ending
// leaves its thread open.
//
// A CRUSH IS ONE PERSON'S (the user, 2026-11-03: "do we have one-sided crush?"): the crush kinds (noticed, confided,
// flirt, the attempt, the confession, the torch after it) need only x to be able to fancy y (rr/interest.js canFancy),
// and y's answer is y's own interest in x, not a roll on the bond. Anything both of them do (a couple, a kiss, a
// goodbye) still needs romanticCompat both ways (CLAUDE.md). A crush turned down stays x's to carry (fx.unrequited).
import { K, register, pairKey } from './registry.js';
import { REL } from '../state.js';
import { romanticCompat } from '../../players.js';
import { canFancy, interestOf, answerOf } from '../interest.js';

const DIRECTED = new Set(['crush-noticed', 'crush-confided', 'flirt', 'confession-attempt', 'confession', 'torch']);
const fits = (c, x, y) => (DIRECTED.has(c._kind) ? canFancy(x, y) : romanticCompat(x, y));
const torch = (c, x, y) => !!c.state.unrequited?.[`${x}>${y}`];

// The two people: those the scene names, else the pair across the two teams with the most
// between them already (sparks, then bond), among those who could be.
function lovers(c) {
  if (c.people?.length >= 2) return [c.people[0], c.people[1]];
  if (c._lovers) return c._lovers;
  const pairs = [[c.A, c.C], [c.A, c.D], [c.B, c.C], [c.B, c.D]].filter(([x, y]) => x && y && fits(c, x, y));
  if (!pairs.length) return (c._lovers = [c.A, c.C]);
  // (the torch is for the crush that was turned down; anything else after it is unlikely, not impossible)
  const score = ([x, y]) => 3 * (c.state.sparks[pairKey(x, y)] || 0) + c.bond(x, y) + (torch(c, x, y) ? (c._kind === 'torch' ? 20 : -2) : 0);
  let best = pairs[0];
  for (const p of pairs.slice(1)) if (score(p) > score(best)) best = p;
  return (c._lovers = best);
}
// someone already carrying a crush on another person
const elsewhere = c => { const [x, y] = lovers(c); return (c.state.threads || []).some(t => t.thread === 'crush' && !t.closed && t.who.includes(x) && !t.who.includes(y)); };
const teamOfName = (c, n) => Object.values(c.state.teams).find(t => t.a === n || t.b === n);
function allowed(c) {
  const [x, y] = lovers(c);
  if (!x || !y || x === y) return false;
  const tx = teamOfName(c, x), ty = teamOfName(c, y);
  if (tx && ty && tx.id === ty.id && REL[tx.rel]?.family) return false;
  return !!fits(c, x, y);
}
// what y feels for x, and the answer it gives a confession
const theirs = c => { const [x, y] = lovers(c); return interestOf(c.state, y, x); };
const answer = c => answerOf(theirs(c));
const both = c => { const [x, y] = lovers(c); return !!romanticCompat(x, y); };
const turnedDown = c => { const [x, y] = lovers(c); return torch(c, x, y); };
const couple = c => { const [x, y] = lovers(c); return c.state.couples.some(k => !k.ended && pairKey(k.a, k.b) === pairKey(x, y)); };
const sparks = c => { const [x, y] = lovers(c); return c.state.sparks[pairKey(x, y)] || 0; };
const attempts = c => { const [x, y] = lovers(c); return (c.state.confess ||= {})[pairKey(x, y)] || 0; };
const romance = (w) => c => (allowed(c) ? w(c) * (elsewhere(c) ? 0.1 : 1) : 0);

// every romance scene records its two lovers (threads.js reads them as the crush's people)
// (`_kind`: which kind is asking, so lovers() knows whether one of them fancying the other is enough)
const withLovers = kinds => kinds.map(k => {
  const when = k.when, endings = Object.fromEntries(Object.entries(k._endings).map(([e, v]) => [e, {
    ...v, w: typeof v.w === 'function' ? (c => { c._kind = k.id; return v.w(c); }) : v.w }]));
  return { ...k, when: c => { c._kind = k.id; return when(c); }, _endings: endings, facts: c => { c._kind = k.id; return { lovers: lovers(c) }; } };
});

register(withLovers([
  K({ id: 'crush-noticed', family: 4, cast: 'teams', moments: ['overlap', 'plane', 'quiet'], when: romance(c => (sparks(c) >= 1 ? 0.3 : 0.05)), endings: {
    radar: { w: c => c.S(c.B, 'intuition') / 5, fx: (fx, c) => { const [x, y] = lovers(c); fx.believe([c.B], { about: x, claim: 'likes', value: y }); fx.spark(x, y); } },
    teased: { w: 1, fx: (fx, c) => { const [x] = lovers(c); fx.mind(x, 'stress', 5); } },
  } }),
  K({ id: 'crush-confided', family: 4, cast: 'teams', moments: ['quiet', 'plane', 'overlap'], when: romance(c => (sparks(c) >= 1 ? 0.2 : 0)), endings: {
    coached: { w: 1, fx: (fx, c) => { const [x] = lovers(c); fx.mind(x, 'morale', 5); fx.note(`courage:${x}`, c.state.leg); } },
    'sworn-to-secrecy': { w: 1, fx: (fx, c) => { const [x, y] = lovers(c); fx.believe([c.B], { about: x, claim: 'likes', value: y }); } },
  } }),
  K({ id: 'matchmaking', family: 4, cast: 'teams', moments: ['overlap', 'plane'], when: romance(c => (sparks(c) >= 1 && !couple(c) ? 0.1 : 0)), endings: {
    plot: { w: 1, fx: (fx, c) => { const [x, y] = lovers(c); fx.spark(x, y); fx.note(`setup:${pairKey(x, y)}`, c.state.leg); } },
    'meddle-badly': { w: c => (10 - c.S(c.B, 'intuition')) / 6, fx: (fx, c) => { const [, y] = lovers(c); fx.mind(y, 'morale', -5); } },
  } }),
  K({ id: 'flirt', family: 4, cast: 'teams', moments: ['overlap', 'queue', 'plane'], when: romance(c => 0.06 + 0.02 * sparks(c)), endings: {
    // (returned only by somebody drawn to them; somebody who isn't rebuffs more often)
    returned: { w: c => { const [x, y] = lovers(c); return both(c) && answer(c) !== 'no' ? 1 + Math.max(0, c.bond(x, y)) / 3 : 0; }, fx: (fx, c) => { const [x, y] = lovers(c); fx.spark(x, y); fx.bond(x, y, 0.5); } },
    missed: { w: 1, fx: (fx, c) => { const [x] = lovers(c); fx.mind(x, 'morale', -1); } },
    rebuffed: { w: c => (answer(c) === 'no' ? 1.5 : 0.5), fx: (fx, c) => { const [x] = lovers(c); fx.mind(x, 'morale', -5); } },
  } }),
  K({ id: 'near-kiss', family: 4, cast: 'teams', moments: ['quiet', 'overlap', 'closed'], when: romance(c => (sparks(c) >= 2 ? 0.2 : 0)), endings: {
    interrupted: { w: 2, fx: (fx, c) => { const [x, y] = lovers(c); fx.spark(x, y); } },
    kiss: { w: 1, fx: (fx, c) => { const [x, y] = lovers(c); fx.couple(x, y); fx.bond(x, y, 1); } },
  } }),
  K({ id: 'confession-attempt', family: 4, cast: 'teams', moments: ['quiet', 'overlap', 'mat'], when: romance(c => (sparks(c) >= 2 && !couple(c) && !turnedDown(c) ? 0.25 : 0)), endings: {
    // interrupted is likeliest while the crush is young (the BFFs' many tries)
    interrupted: { w: c => (attempts(c) < 3 ? 3 : 1), fx: (fx, c) => { const [x, y] = lovers(c); (c.state.confess ||= {})[pairKey(x, y)] = attempts(c) + 1; fx.mind(x, 'stress', 4); } },
    'chickens-out': { w: c => { const [x] = lovers(c); return (10 - c.S(x, 'boldness')) / 5; }, fx: (fx, c) => { const [x, y] = lovers(c); (c.state.confess ||= {})[pairKey(x, y)] = attempts(c) + 1; fx.mind(x, 'morale', -3); } },
    misheard: { w: 0.4, fx: (fx, c) => { const [x, y] = lovers(c); (c.state.confess ||= {})[pairKey(x, y)] = attempts(c) + 1; fx.believe([y], { about: x, claim: 'said', value: 'something odd' }); } },
    said: { w: c => (attempts(c) >= 2 ? 2 : 0.3), fx: (fx, c) => { const [x, y] = lovers(c); fx.believe([y], { about: x, claim: 'likes', value: y }); fx.note(`said:${pairKey(x, y)}`, c.state.leg); } },
  }, next: { said: 'confession' } }),
  // y's answer is y's own (rr/interest.js): yes is a couple, maybe is not now, no is a crush turned down that x carries
  K({ id: 'confession', family: 4, cast: 'teams', moments: ['confession'], when: romance(() => 1), endings: {
    mutual: { w: c => { const [x, y] = lovers(c); return answer(c) === 'yes' && both(c) ? 1 + Math.max(0, c.bond(x, y)) / 2 : 0; }, fx: (fx, c) => { const [x, y] = lovers(c); fx.couple(x, y); fx.bond(x, y, 1.5); } },
    'not-now': { w: c => (answer(c) === 'maybe' || (answer(c) === 'yes' && !both(c)) ? 1 : 0), fx: (fx, c) => { const [x, y] = lovers(c); fx.bond(x, y, 0.5); fx.note(`after-race:${pairKey(x, y)}`, c.state.leg); } },
    crushed: { w: c => (answer(c) === 'no' ? 1 : 0), fx: (fx, c) => { const [x, y] = lovers(c); fx.mind(x, 'morale', -15); fx.unrequited(x, y); } },
    // (y says no, and then isn't sure it was the right answer: y was nearly there, and the crush turns round)
    reversed: { w: c => (answer(c) === 'maybe' && both(c) ? 0.4 : 0), fx: (fx, c) => { const [x, y] = lovers(c); fx.mind(x, 'morale', -8); fx.spark(y, x); } },
  } }),
  // a crush turned down: x still carries it, or lets it go (and minds when y is with somebody)
  K({ id: 'torch', family: 4, cast: 'teams', moments: ['overlap', 'quiet', 'plane'], when: c => (allowed(c) && turnedDown(c) ? 0.35 : 0), endings: {
    'still-pining': { w: 1, fx: (fx, c) => { const [x] = lovers(c); fx.mind(x, 'morale', -3); } },
    'moves-on': { w: c => { const [x] = lovers(c); return 0.3 + c.S(x, 'temperament') / 10; }, fx: (fx, c) => { const [x, y] = lovers(c); fx.unrequited(x, y, false); fx.mind(x, 'morale', 4); } },
    'watches-them': { w: c => { const [, y] = lovers(c); return c.state.couples.some(k => !k.ended && (k.a === y || k.b === y)) ? 1.5 : 0; }, fx: (fx, c) => { const [x] = lovers(c); fx.mind(x, 'stress', 5); } },
  } }),
  K({ id: 'jealousy', family: 4, cast: 'teams', moments: ['overlap', 'quiet'], when: c => { const [x] = lovers(c); return allowed(c) && c.state.couples.some(k => !k.ended && (k.a === x || k.b === x)) ? 0.1 : 0; }, endings: {
    sulk: { w: 1, fx: (fx, c) => { const [x, y] = lovers(c); fx.bond(x, y, -1); } },
    scene: { w: c => { const [x] = lovers(c); return (10 - c.S(x, 'temperament')) / 5; }, fx: (fx, c) => { const [x, y] = lovers(c); fx.bond(x, y, -1.5); fx.mind(x, 'stress', 6); } },
    'pepper-in-eyes': { w: 0.3, fx: (fx, c) => fx.time(c.tid, 15) },
  } }),
  K({ id: 'romance-costs', family: 4, cast: 'teams', moments: ['overlap', 'queue'], when: romance(c => (couple(c) || sparks(c) >= 2 ? 0.25 : 0)), endings: {
    'waits-for-them': { w: 1, fx: (fx, c) => fx.time(c.tid, 20) },
    'lets-them-pass': { w: 0.6, fx: (fx, c) => { fx.time(c.tid, 5); fx.note(`letpass:${c.tid}`, c.oid); } },
    'focus-lost': { w: 1, fx: (fx, c) => { fx.pass(c.tid, -0.05); fx.mind(c.B, 'stress', 4); } },
  } }),
  K({ id: 'goodbye-kiss', family: 4, cast: 'teams', moments: ['elim'], when: romance(c => (couple(c) ? 1 : 0)), endings: {
    promise: { w: 2, fx: (fx, c) => { const [x, y] = lovers(c); fx.bond(x, y, 1); fx.note(`promise:${pairKey(x, y)}`, c.state.leg); } },
    'no-promises': { w: 0.5, fx: (fx, c) => { const [x, y] = lovers(c); fx.uncouple(x, y); } },
  } }),
]));
