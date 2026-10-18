// Family 12 of the scene catalogue: the twists, as scenes (docs/ridonculous-race-scenes.md §12).
// Emitted by twists.js and chill.js with the ending they decided (scenes.js emit).
import { K, register } from './registry.js';

register([
  K({ id: 'boomerang-found', family: 12, moments: ['twist'], endings: {
    gleeful: { w: 2, fx: (fx, c) => fx.mind(c.A, 'morale', 5) },
    torn: { w: c => c.S(c.A, 'loyalty') / 5, fx: (fx, c) => fx.mind(c.A, 'stress', 5) },
  } }),
  K({ id: 'boomerang-decide', family: 12, cast: 'teams', moments: ['twist'], endings: {
    'target-rival': { w: 1, fx: (fx, c) => fx.rivalry(c.tid, c.oid, 2) },
    'target-threat': { w: 1, fx: (fx, c) => fx.rivalry(c.tid, c.oid, 1) },
    standoff: { w: 0.2, fx: (fx, c) => fx.rivalry(c.tid, c.oid, 3) },
    'self-boomerang': { w: 0.05, fx: (fx, c) => fx.bond(c.A, c.B, -2) },
    wasted: { w: 0.2, fx: (fx, c) => fx.mind(c.A, 'morale', -3) },
  } }),
  K({ id: 'boomerang-hit', family: 12, moments: ['twist'], endings: {
    fury: { w: 2, fx: (fx, c) => { fx.mind(c.A, 'stress', 10); if (c.oid) fx.rivalry(c.tid, c.oid, 2); } },
    'guess-who': { w: 1, fx: (fx, c) => fx.believe([c.A, c.B], { about: 'boomerang', claim: 'by', value: c.oid || null, truth: !!c.oid }) },
  } }),
  K({ id: 'boomerang-vote', family: 12, cast: 'group', moments: ['twist'], endings: {
    decided: { w: 2, fx: (fx, c) => fx.note(`vote:${c.state.leg}`, c.event?.target || null) },
    split: { w: 1, fx: (fx, c) => fx.note(`vote:${c.state.leg}`, c.event?.target || null) },
  } }),
  K({ id: 'yield', family: 12, moments: ['twist'], endings: {
    waits: { w: 2, fx: (fx, c) => fx.time(c.tid, 30) },
    'courtesy-of': { w: 1, fx: (fx, c) => { fx.time(c.tid, 30); if (c.oid) fx.rivalry(c.tid, c.oid, 1); } },
  } }),
  K({ id: 'express-give', family: 12, cast: 'teams', moments: ['twist'], endings: {
    'to-an-ally': { w: c => 1 + Math.max(0, c.teamBond()) / 3, fx: (fx, c) => { fx.teams(c.tid, c.oid, 1.5); fx.ally(c.tid, c.oid); } },
    'to-the-weakest': { w: 0.5, fx: (fx, c) => fx.teams(c.tid, c.oid, 1) },
  } }),
  K({ id: 'zip-it', family: 12, moments: ['twist'], endings: {
    'takes-it': { w: 1, fx: (fx, c) => fx.mind(c.A, 'morale', 10) },
    'beaten-to-it': { w: 1, fx: (fx, c) => fx.mind(c.A, 'morale', -8) },
  } }),
  K({ id: 'speed-bump', family: 12, moments: ['twist'], endings: {
    humiliating: { w: 1, fx: (fx, c) => fx.mind(c.A, 'morale', -5) },
    quick: { w: 1, fx: (fx, c) => fx.mind(c.A, 'morale', 2) },
  } }),
  K({ id: 'save-used', family: 12, moments: ['twist'], endings: {
    saved: { w: 3, fx: (fx, c) => { fx.mind(c.A, 'morale', 15); fx.mind(c.B, 'morale', 15); } },
    'saved-in-shame': { w: 0.5, fx: (fx, c) => fx.pop(c.A, -1) },
  } }),
  K({ id: 'medevac-choice', family: 12, cast: 'teams', moments: ['twist'], endings: {
    'repays-kindness': { w: 2, fx: (fx, c) => fx.teams(c.tid, c.oid, 2) },
    'picks-friend': { w: 1, fx: (fx, c) => fx.teams(c.tid, c.oid, 1) },
  } }),
]);
