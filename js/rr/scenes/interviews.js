// Family 13 of the scene catalogue: interviews (docs/ridonculous-race-scenes.md §13). Both partners
// in front of the map, unless the subject is private. An interview says the feeling and its reason;
// saying it out loud moves their morale a little and records the feeling as a belief about themselves.
import { K, register } from './registry.js';

const feel = (value, d) => (fx, c) => { fx.believe([c.A], { about: c.A, claim: 'feels', value }); fx.mind(c.A, 'morale', d); };

register([
  K({ id: 'int-feeling', family: 13, moments: ['interview'], endings: {
    glad: { w: 1, fx: feel('glad', 2) }, hurt: { w: 1, fx: feel('hurt', -2) },
    angry: { w: 1, fx: feel('angry', -1) }, scared: { w: 1, fx: feel('scared', -1) },
  } }),
  K({ id: 'int-contradict', family: 13, moments: ['interview'], endings: {
    'yes-you-are': { w: 2, fx: (fx, c) => { fx.bond(c.A, c.B, -0.2); fx.believe([c.A, c.B], { about: c.tid, claim: 'contradicted', value: true }); } },
    'agree-to-disagree': { w: 1, fx: (fx, c) => fx.bond(c.A, c.B, 0.2) },
  } }),
  K({ id: 'int-about-team', family: 13, moments: ['interview'], endings: {
    respect: { w: 1, fx: (fx, c) => fx.believe([c.A, c.B], { about: c.oid, claim: 'respect', value: true }) },
    fear: { w: 1, fx: (fx, c) => fx.believe([c.A, c.B], { about: c.oid, claim: 'threat', value: true }) },
    grudge: { w: 1, fx: (fx, c) => fx.believe([c.A, c.B], { about: c.oid, claim: 'grudge', value: true }) },
    crush: { w: 0.3, fx: (fx, c) => fx.believe([c.A], { about: c.oid, claim: 'crush', value: true }) },
  } }),
  K({ id: 'int-secret', family: 13, cast: 'solo', moments: ['interview'], endings: {
    confides: { w: 2, fx: feel('secret', 1) },
    'nearly-says-it': { w: 1, fx: feel('secret', -1) },
  } }),
  K({ id: 'int-strategy', family: 13, moments: ['interview'], endings: {
    proud: { w: 1, fx: feel('proud', 2) },
    justifies: { w: 1, fx: feel('defensive', 0) },
  } }),
  K({ id: 'int-backstory', family: 13, moments: ['interview'], endings: {
    'how-we-met': { w: 1, fx: (fx, c) => fx.bond(c.A, c.B, 0.3) },
    'why-we-race': { w: 1, fx: feel('driven', 2) },
  } }),
  K({ id: 'int-exit', family: 13, moments: ['interview'], endings: {
    grateful: { w: 2, fx: (fx, c) => fx.bond(c.A, c.B, 0.5) },
    bitter: { w: 0.5, fx: feel('bitter', -3) },
  } }),
  K({ id: 'int-bleachers', family: 13, moments: ['interview'], endings: {
    'roots-for': { w: 2, fx: (fx, c) => fx.believe([c.A, c.B], { about: c.oid, claim: 'rooting', value: true }) },
    'unimpressed': { w: 1, fx: feel('unimpressed', 0) },
  } }),
]);
