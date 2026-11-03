// Family 1 again: the partners, for the two teams that are not what they look like (state.js REL).
//
// FRENEMIES are best friends in public who keep score. Digs and credit-grabs pull the bond down, shared credit and
// the usual good moments (celebrate, bond-moment) push it up, so their teamwork (skill.js) swings leg to leg. When it
// goes far enough either way they turn into something real: best friends, or enemies.
//
// ONE-SIDED: one of them (team.resents) can't stand the other, who thinks they're best friends. The fooled one's
// choices follow what they think the bond is (state.view, scenes.js viewOf); the teamwork follows the real one, so the
// team quietly underperforms. The resenter is cold, and, if they may scheme (CLAUDE.md: never a nice archetype),
// takes the credit and hands out the blame. Every cold moment the fooled one is sharp enough to catch lowers what they
// think, and the lower it is the likelier they find out: then the team becomes enemies, or they have it out.
import { K, register } from './registry.js';

const both = (fx, c, key, d) => { fx.mind(c.A, key, d); fx.mind(c.B, key, d); };
const fren = c => c.rel === 'frenemies';
const blind = c => c.state.teams[c.tid]?.rel === 'one-sided' && !c.state.found?.[c.tid];
const resenter = c => c.state.teams[c.tid]?.resents;
// a is the one who resents, or the one who has no idea
const isRes = c => blind(c) && c.A === resenter(c);
const isFooled = c => blind(c) && c.B === resenter(c);
// how sharp somebody is about people, 0..1
const sharp = (c, n) => (c.S(n, 'intuition') + c.S(n, 'social')) / 20;
// the fooled one catches a cold moment, if they're sharp enough to: what they think of the friendship drops
const caught = (fx, c, fooled, d) => { if (sharp(c, fooled) >= 0.55) fx.view(c.tid, -d); };
const realBond = c => c.bond(resenter(c), isRes(c) ? c.B : c.A);

register([
  // ── frenemies ──
  // a says something nice with an edge in it; b lets it go, gives it back, or laughs
  K({ id: 'dig', family: 1, moments: ['pass', 'fail', 'mat', 'quiet', 'travel', 'tip'], when: c => (fren(c) ? 1.2 : 0), endings: {
    'lets-it-go': { w: c => c.S(c.B, 'temperament') / 4, fx: (fx, c) => { fx.bond(c.A, c.B, -0.3); fx.mind(c.B, 'stress', 2); } },
    'digs-back': { w: c => (10 - c.S(c.B, 'temperament')) / 4 + c.S(c.B, 'boldness') / 8, fx: (fx, c) => { fx.bond(c.A, c.B, -0.8); both(fx, c, 'stress', 3); } },
    'laughs-it-off': { w: c => 1 + Math.max(0, c.bond(c.A, c.B)) / 3, fx: (fx, c) => fx.bond(c.A, c.B, 0.4) },
  } }),
  // a challenge is done: who did it
  K({ id: 'keep-score', family: 1, moments: ['pass', 'mat'], when: c => (fren(c) && (c.event?.passed || c.moment === 'mat') ? 1 : 0), endings: {
    'takes-credit': { w: c => c.S(c.A, 'boldness') / 4, fx: (fx, c) => { fx.bond(c.A, c.B, -0.7); fx.mind(c.B, 'morale', -3); fx.pop(c.A, -1); } },
    'shares-credit': { w: c => c.S(c.A, 'loyalty') / 4, fx: (fx, c) => { fx.bond(c.A, c.B, 0.8); both(fx, c, 'morale', 3); } },
    tally: { w: 1, fx: (fx, c) => { fx.bond(c.A, c.B, -0.2); fx.mind(c.A, 'morale', 2); } },
  } }),
  // far enough either way, the act stops: they're real friends now, or they never were
  K({ id: 'frenemy-turn', family: 1, moments: ['quiet', 'mat', 'plane'],
    when: c => (fren(c) && (c.bond(c.A, c.B) >= 5 || c.bond(c.A, c.B) <= -4) ? 1.5 : 0), endings: {
    'real-friends': { w: c => (c.bond(c.A, c.B) >= 5 ? 1 : 0), fx: (fx, c) => { fx.rel(c.tid, 'bffs'); fx.bond(c.A, c.B, 1); both(fx, c, 'morale', 5); } },
    'mask-off': { w: c => (c.bond(c.A, c.B) <= -4 ? 1 : 0), fx: (fx, c) => { fx.rel(c.tid, 'enemies'); fx.bond(c.A, c.B, -1); both(fx, c, 'stress', 5); } },
  } }),

  // ── one-sided ──
  // a has no idea, and says how much this means; b has to smile through it
  K({ id: 'gush', family: 1, moments: ['quiet', 'plane', 'wait', 'mat', 'pass'], when: c => (isFooled(c) ? 0.9 : 0), endings: {
    sweet: { w: 1, fx: (fx, c) => { fx.mind(c.A, 'morale', 3); fx.mind(c.B, 'stress', 3); fx.bond(c.A, c.B, -0.2); } },
    'big-plans': { w: 0.6, fx: (fx, c) => { fx.mind(c.A, 'morale', 4); fx.mind(c.B, 'stress', 4); fx.bond(c.A, c.B, -0.3); } },
    noticed: { w: c => sharp(c, c.A) * 0.8, fx: (fx, c) => { fx.view(c.tid, -1); fx.mind(c.A, 'morale', -2); } },
  } }),
  // a resents b and lets a little of it out: never a scheme, so anybody can be cold
  K({ id: 'cold-shoulder', family: 1, moments: ['quiet', 'travel', 'tip', 'fail', 'mat'], when: c => (isRes(c) ? 1 : 0), endings: {
    'bites-tongue': { w: 1, fx: (fx, c) => fx.mind(c.A, 'stress', 3) },
    'cold-reply': { w: c => (10 - c.S(c.A, 'temperament')) / 5, fx: (fx, c) => { fx.bond(c.A, c.B, -0.3); caught(fx, c, c.B, 0.5); } },
    'eye-roll': { w: 0.8, fx: (fx, c) => { fx.mind(c.A, 'morale', 2); fx.pop(c.A, -0.5); caught(fx, c, c.B, 0.5); } },
  } }),
  // a resents b and does something about it: a scheme (scenes.js playScene refuses a doer who may not scheme)
  K({ id: 'quiet-sabotage', family: 1, scheme: true, moments: ['botch-pick', 'pass', 'fail', 'mat'], when: c => (isRes(c) ? 0.8 : 0), endings: {
    'takes-credit': { w: c => (['pass', 'mat'].includes(c.moment) ? 1.2 : 0), fx: (fx, c) => { fx.mind(c.A, 'morale', 3); fx.mind(c.B, 'morale', -3); fx.bond(c.A, c.B, -0.3); fx.pop(c.A, -1); } },
    'blames-partner': { w: c => (c.fails >= 1 ? 1.2 : 0), fx: (fx, c) => { fx.mind(c.B, 'stress', 5); fx.mind(c.B, 'morale', -4); fx.pop(c.A, -1); } },
    'pushes-the-botch': { w: c => (c.moment === 'botch-pick' ? 1.5 : 0), fx: (fx, c) => { fx.mind(c.B, 'stress', 6); fx.time(c.tid, 4); fx.pop(c.A, -0.5); } },
  } }),
  // a (who had no idea) finds out. The colder b really is, the likelier it ends the friendship.
  K({ id: 'finds-out', family: 1, moments: ['quiet', 'mat', 'plane', 'wait', 'fail'],
    // (not before the third leg, so the act has time to play: rare while a still thinks the world of b, likelier with
    // every cold moment a was sharp enough to notice; measured 2026-11-02, found on leg 2 and leg 4 at the old rate)
    when: c => (isFooled(c) && c.state.leg >= 3 ? 0.02 + 0.08 * sharp(c, c.A) + 0.1 * Math.max(0, 6 - c.bond(c.A, c.B)) : 0), endings: {
    'mask-off': { w: c => (10 - c.S(c.B, 'loyalty')) / 4 + (realBond(c) <= -3 ? 1 : 0), fx: (fx, c) => {
      fx.found(c.tid); fx.rel(c.tid, 'enemies'); fx.bond(c.A, c.B, -1.5);
      fx.mind(c.A, 'morale', -15); fx.mind(c.A, 'stress', 10); fx.pop(c.B, -2); fx.pop(c.A, 1);
    } },
    'have-it-out': { w: c => (c.S(c.B, 'loyalty') + c.S(c.A, 'social')) / 8 + (realBond(c) >= 0 ? 1 : 0), fx: (fx, c) => {
      fx.found(c.tid); fx.rel(c.tid, 'bffs'); fx.bond(c.A, c.B, 4); both(fx, c, 'morale', 5); fx.pop(c.B, 1);
    } },
  } }),
]);
