// Family 9 of the scene catalogue: body, fear and limits (docs/ridonculous-race-scenes.md §9).
// An injury's weight follows time on physical tasks (×1.5 for an identity with `mishap`, the
// Adversity Twins); `serious` marks the team for the season's medevac (state.injured).
import { K, register } from './registry.js';
import { identityOf } from '../identities.js';

const physical = c => (c.stretch?.types || (c.stretch?.sides || []).flatMap(s => s.types) || []).some(t => ['strength', 'heights', 'water', 'nerve'].includes(t));
const mishap = c => identityOf(c.state.teams[c.tid])?.mishap || 1;

register([
  K({ id: 'injury', family: 9, moments: ['fail', 'pass'], when: c => (physical(c) ? 0.01 * ((c.stretch?.base || 20) / 60) * 6 * mishap(c) : 0), endings: {
    minor: { w: 4, fx: (fx, c) => fx.time(c.tid, 10) },
    carried: { w: 2, fx: (fx, c) => { fx.mind(c.B, 'energy', -20); fx.bond(c.A, c.B, 1); fx.time(c.tid, 15); } },
    serious: { w: 0.4, fx: (fx, c) => { c.state.injured ||= {}; c.state.injured[c.tid] = c.state.leg; fx.time(c.tid, 60); fx.custom('injured', c.tid); } },
  } }),
  K({ id: 'illness', family: 9, moments: ['fail', 'pass'], when: c => ((c.stretch?.types || []).includes('stomach') ? 0.1 : 0.01), endings: {
    'pushes-through': { w: c => c.S(c.A, 'endurance') / 4, fx: (fx, c) => fx.mind(c.A, 'energy', -15) },
    // only a food task has a pepper in it
    'blind-from-spice': { w: c => ((c.stretch?.types || []).includes('stomach') ? 0.4 : 0), fx: (fx, c) => { fx.time(c.tid, 15); fx.bond(c.A, c.B, 0.5); } },
  } }),
  K({ id: 'exhaustion', family: 9, moments: ['travel', 'fail'], when: c => { const e = Math.min(c.energy(c.A), c.energy(c.B)); return e < 75 ? (80 - e) / 40 : 0; }, endings: {
    collapse: { w: c => (10 - c.S(c.A, 'endurance')) / 4, fx: (fx, c) => fx.time(c.tid, 20) },
    'second-wind': { w: c => c.S(c.A, 'boldness') / 4, fx: (fx, c) => fx.mind(c.A, 'energy', 15) },
  } }),
  K({ id: 'gross-out', family: 9, moments: ['fail', 'pass'], when: c => ((c.stretch?.types || []).includes('stomach') ? 0.5 : 0), endings: {
    'keeps-it-down': { w: c => c.S(c.A, 'endurance') / 4, fx: (fx, c) => fx.mind(c.A, 'morale', 3) },
    vomits: { w: 1, fx: (fx, c) => fx.time(c.tid, 8) },
    'chain-reaction': { w: c => ((c.present || []).length > 1 ? 0.6 : 0.1), fx: (fx, c) => { for (const id of c.present || []) if (c.state.teams[id]) fx.mind(c.state.teams[id].a, 'stress', 3); } },
  } }),
  K({ id: 'phobia', family: 9, moments: ['fear'], endings: {
    'panic-break': { w: 0.4, fx: (fx, c) => { fx.time(c.tid, -5); fx.mind(c.A, 'stress', 10); } },
    freezes: { w: c => (10 - c.S(c.A, 'boldness')) / 4, fx: (fx, c) => { fx.time(c.tid, 20); fx.mind(c.A, 'stress', 8); } },
    overcomes: { w: c => c.S(c.A, 'boldness') / 4, fx: (fx, c) => fx.mind(c.A, 'morale', 10) },
  } }),
  K({ id: 'quit-talk', family: 9, moments: ['fail'], when: c => (c.fails >= 3 && Math.max(c.stress(c.A), c.stress(c.B)) > 70 ? 0.5 : 0), endings: {
    'talked-back': { w: c => 1 + Math.max(0, c.bond(c.A, c.B)) / 3, fx: (fx, c) => fx.bond(c.A, c.B, 1) },
    'quits-task': { w: c => (10 - c.S(c.A, 'boldness')) / 10, fx: (fx, c) => { fx.pending(c.tid, 240); fx.pop(c.A, -2); } },
    'quits-race': { w: 0.02, fx: (fx, c) => { c.state.quitting ||= {}; c.state.quitting[c.tid] = c.state.leg; fx.custom('quit-race', c.tid); fx.pop(c.A, -3); } },
  } }),
  K({ id: 'delayed-reaction', family: 9, moments: ['pass', 'travel'], when: () => 0.01, endings: {
    'kicks-in-late': { w: 1, fx: (fx, c) => fx.time(c.tid, 10) },
    'kicks-in-helpfully': { w: 0.5, fx: (fx, c) => fx.time(c.tid, -5) },
  } }),
]);
