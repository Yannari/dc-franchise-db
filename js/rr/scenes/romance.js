// Family 4 of the scene catalogue: romance and matchmaking (docs/ridonculous-race-scenes.md §4).
// The lovers are ctx.people[0..1] (or A and C, across two teams). Never between two people of
// a family team; always through romanticCompat (CLAUDE.md); at most four active couples
// (scenes.js fx.spark / fx.couple). A confession's `interrupted` ending leaves its thread open.
import { K, register, pairKey } from './registry.js';
import { REL } from '../state.js';
import { romanticCompat } from '../../players.js';

const lovers = c => (c.people?.length >= 2 ? [c.people[0], c.people[1]] : [c.A, c.C]);
const teamOfName = (c, n) => Object.values(c.state.teams).find(t => t.a === n || t.b === n);
function allowed(c) {
  const [x, y] = lovers(c);
  if (!x || !y || x === y) return false;
  const tx = teamOfName(c, x), ty = teamOfName(c, y);
  if (tx && ty && tx.id === ty.id && REL[tx.rel]?.family) return false;
  return !!romanticCompat(x, y);
}
const couple = c => { const [x, y] = lovers(c); return c.state.couples.some(k => !k.ended && pairKey(k.a, k.b) === pairKey(x, y)); };
const sparks = c => { const [x, y] = lovers(c); return c.state.sparks[pairKey(x, y)] || 0; };
const attempts = c => { const [x, y] = lovers(c); return (c.state.confess ||= {})[pairKey(x, y)] || 0; };
const romance = (w) => c => (allowed(c) ? w(c) : 0);

// every romance scene records its two lovers (threads.js reads them as the crush's people)
const withLovers = kinds => kinds.map(k => ({ ...k, facts: c => ({ lovers: lovers(c) }) }));

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
    returned: { w: c => { const [x, y] = lovers(c); return 1 + Math.max(0, c.bond(x, y)) / 3; }, fx: (fx, c) => { const [x, y] = lovers(c); fx.spark(x, y); fx.bond(x, y, 0.5); } },
    missed: { w: 1, fx: (fx, c) => { const [x] = lovers(c); fx.mind(x, 'morale', -1); } },
    rebuffed: { w: 0.5, fx: (fx, c) => { const [x] = lovers(c); fx.mind(x, 'morale', -5); } },
  } }),
  K({ id: 'near-kiss', family: 4, cast: 'teams', moments: ['quiet', 'overlap', 'closed'], when: romance(c => (sparks(c) >= 2 ? 0.2 : 0)), endings: {
    interrupted: { w: 2, fx: (fx, c) => { const [x, y] = lovers(c); fx.spark(x, y); } },
    kiss: { w: 1, fx: (fx, c) => { const [x, y] = lovers(c); fx.couple(x, y); fx.bond(x, y, 1); } },
  } }),
  K({ id: 'confession-attempt', family: 4, cast: 'teams', moments: ['quiet', 'overlap', 'mat'], when: romance(c => (sparks(c) >= 2 && !couple(c) ? 0.25 : 0)), endings: {
    // interrupted is likeliest while the crush is young (the BFFs' many tries)
    interrupted: { w: c => (attempts(c) < 3 ? 3 : 1), fx: (fx, c) => { const [x, y] = lovers(c); (c.state.confess ||= {})[pairKey(x, y)] = attempts(c) + 1; fx.mind(x, 'stress', 4); } },
    'chickens-out': { w: c => { const [x] = lovers(c); return (10 - c.S(x, 'boldness')) / 5; }, fx: (fx, c) => { const [x, y] = lovers(c); (c.state.confess ||= {})[pairKey(x, y)] = attempts(c) + 1; fx.mind(x, 'morale', -3); } },
    misheard: { w: 0.4, fx: (fx, c) => { const [x, y] = lovers(c); (c.state.confess ||= {})[pairKey(x, y)] = attempts(c) + 1; fx.believe([y], { about: x, claim: 'said', value: 'something odd' }); } },
    said: { w: c => (attempts(c) >= 2 ? 2 : 0.3), fx: (fx, c) => { const [x, y] = lovers(c); fx.believe([y], { about: x, claim: 'likes', value: y }); fx.note(`said:${pairKey(x, y)}`, c.state.leg); } },
  }, next: { said: 'confession' } }),
  K({ id: 'confession', family: 4, cast: 'teams', moments: ['confession'], when: romance(() => 1), endings: {
    mutual: { w: c => { const [x, y] = lovers(c); return 1 + Math.max(0, c.bond(x, y)) / 2; }, fx: (fx, c) => { const [x, y] = lovers(c); fx.couple(x, y); fx.bond(x, y, 1.5); } },
    'not-now': { w: 0.6, fx: (fx, c) => { const [x, y] = lovers(c); fx.bond(x, y, 0.5); fx.note(`after-race:${pairKey(x, y)}`, c.state.leg); } },
    crushed: { w: 0.5, fx: (fx, c) => { const [x] = lovers(c); fx.mind(x, 'morale', -15); } },
    reversed: { w: 0.2, fx: (fx, c) => { const [x, y] = lovers(c); fx.mind(x, 'morale', -8); fx.spark(y, x); } },
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
