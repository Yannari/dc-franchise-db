// Family 1 again: a secret crush on your own partner (the user, 2026-11-03: "do we have one-sided crush?"). One of
// them (team.crusher, set on the Pairs view or picked by season.js walkIn) is in love with the other, who sees a
// friend. Never a family team, never anybody under 18 (rr/interest.js canFancy). The crusher pines, nearly says it,
// does too much for them, and minds when the partner is drawn to somebody else in the race. When it finally comes out,
// the answer is the partner's own: their interest in the crusher (rr/interest.js), not a roll. Yes: they're a couple.
// Not now: they agree to wait, and the crush is out. No: the friendship is strained.
import { K, register } from './registry.js';
import { feelOf } from '../state.js';
import { interestOf, answerOf } from '../interest.js';
import { romanticCompat } from '../../players.js';

const both = (fx, c, key, d) => { fx.mind(c.A, key, d); fx.mind(c.B, key, d); };
const tm = c => c.state.teams[c.tid];
const secret = c => feelOf(tm(c)) === 'crush' && !c.state.crushOut?.[c.tid] && !!tm(c)?.crusher;
// a is the one with the crush
const isCrusher = c => secret(c) && c.A === tm(c).crusher;
// the partner is drawn to somebody else in the race: a spark with another racer, or a couple with one
const elsewhere = c => Object.entries(c.state.sparks || {}).some(([k, n]) => n >= 1 && k.split('|').includes(c.B) && !k.split('|').includes(c.A))
  || (c.state.couples || []).some(k => !k.ended && (k.a === c.B || k.b === c.B) && k.a !== c.A && k.b !== c.A);
const tries = c => c.state.crushTries?.[c.tid] || 0;
const answer = c => answerOf(interestOf(c.state, c.B, c.A));
const yes = c => answer(c) === 'yes' && romanticCompat(c.A, c.B);

register([
  // a is in love with b, and b has no idea
  K({ id: 'pining', family: 1, moments: ['quiet', 'plane', 'wait', 'mat', 'pass', 'travel'], when: c => (isCrusher(c) ? 0.9 : 0), endings: {
    stares: { w: 1, fx: (fx, c) => { fx.mind(c.A, 'stress', 2); fx.mind(c.A, 'morale', -1); } },
    'almost-says-it': { w: c => 0.3 + c.S(c.A, 'boldness') / 6, fx: (fx, c) => { fx.crushTry(c.tid); fx.mind(c.A, 'stress', 4); } },
    'helps-too-much': { w: c => c.S(c.A, 'loyalty') / 6, fx: (fx, c) => { fx.bond(c.A, c.B, 0.3); fx.mind(c.A, 'morale', 2); fx.mind(c.B, 'morale', 2); } },
  } }),
  // b is drawn to somebody else in the race, and a minds
  K({ id: 'crush-jealous', family: 1, moments: ['quiet', 'travel', 'mat', 'plane'], when: c => (isCrusher(c) && elsewhere(c) ? 1.2 : 0), endings: {
    'swallows-it': { w: c => c.S(c.A, 'temperament') / 4, fx: (fx, c) => fx.mind(c.A, 'stress', 4) },
    snipes: { w: c => (10 - c.S(c.A, 'temperament')) / 4, fx: (fx, c) => { fx.bond(c.A, c.B, -0.5); fx.mind(c.B, 'stress', 2); } },
    'tells-camera': { w: 1, fx: (fx, c) => { fx.mind(c.A, 'morale', -3); fx.pop(c.A, 0.5); } },
  } }),
  // it comes out: likelier the more often a nearly said it, the bolder a is, and when somebody else is in the picture
  K({ id: 'crush-out', family: 1, moments: ['quiet', 'mat', 'plane', 'wait'],
    when: c => (isCrusher(c) && c.state.leg >= 3 ? 0.03 + 0.06 * tries(c) + 0.03 * c.S(c.A, 'boldness') / 5 + (elsewhere(c) ? 0.15 : 0) : 0), endings: {
    together: { w: c => (yes(c) ? 1 : 0), fx: (fx, c) => {
      fx.crushOut(c.tid, 'together'); fx.feel(c.tid, 'warm'); fx.rel(c.tid, 'newly-dating'); fx.couple(c.A, c.B);
      fx.bond(c.A, c.B, 1.5); both(fx, c, 'morale', 8); fx.pop(c.A, 1); fx.pop(c.B, 1);
    } },
    'not-now': { w: c => (answer(c) === 'maybe' || (answer(c) === 'yes' && !yes(c)) ? 1 : 0), fx: (fx, c) => {
      fx.crushOut(c.tid, 'not-now'); fx.feel(c.tid, 'warm'); fx.bond(c.A, c.B, 0.3); fx.mind(c.A, 'morale', -4);
    } },
    'not-like-that': { w: c => (answer(c) === 'no' ? 1 : 0), fx: (fx, c) => {
      fx.crushOut(c.tid, 'not-like-that'); fx.feel(c.tid, 'strained'); fx.bond(c.A, c.B, -1.5); fx.mind(c.A, 'morale', -15); fx.mind(c.B, 'stress', 5);
    } },
  } }),
]);
