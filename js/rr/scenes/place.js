// Family 10 of the scene catalogue: the place itself (docs/ridonculous-race-scenes.md §10).
import { K, register } from './registry.js';
import { identityOf } from '../identities.js';
import { teamLevel } from '../skill.js';

const types = c => c.stretch?.types || (c.stretch?.sides || []).flatMap(s => s.types) || [];
const good = c => { const id = identityOf(c.state.teams[c.tid]); return !!id && types(c).some(t => id.good.includes(t)); };
const bad = c => { const id = identityOf(c.state.teams[c.tid]); return !!id && types(c).some(t => id.bad.includes(t)); };

register([
  K({ id: 'arrival-awe', family: 10, moments: ['arrive'], endings: {
    wonder: { w: 2, fx: (fx, c) => { fx.mind(c.A, 'morale', 5); fx.mind(c.B, 'morale', 5); } },
    dread: { w: c => (10 - c.S(c.A, 'boldness')) / 5, fx: (fx, c) => fx.mind(c.A, 'stress', 5) },
    homecoming: { w: 0.2, fx: (fx, c) => fx.mind(c.A, 'morale', 10) },
  } }),
  K({ id: 'identity-moment', family: 10, moments: ['tip'], when: c => (good(c) || bad(c) ? 0.6 : 0), endings: {
    'in-their-element': { w: c => (good(c) ? 2 : 0), fx: (fx, c) => { fx.mind(c.A, 'morale', 6); fx.pass(c.tid, 0.03); } },
    'out-of-element': { w: c => (bad(c) ? 2 : 0), fx: (fx, c) => fx.mind(c.A, 'morale', -5) },
  } }),
  K({ id: 'cultural-task', family: 10, moments: ['pass'], when: c => (types(c).some(t => ['perform', 'people'].includes(t)) ? 0.2 : 0), endings: {
    moved: { w: c => c.S(c.A, 'social') / 4, fx: (fx, c) => { fx.mind(c.A, 'morale', 10); fx.bond(c.A, c.B, 1); } },
    disrespectful: { w: c => (10 - c.S(c.A, 'social')) / 10, fx: (fx, c) => { fx.time(c.tid, 10); fx.pop(c.A, -2); } },
  } }),
  K({ id: 'souvenir', family: 10, moments: ['quiet', 'pass'], when: () => 0.02, endings: {
    kept: { w: 1, fx: (fx, c) => fx.note(`souvenir:${c.tid}`, c.state.leg) },
    left: { w: c => c.S(c.A, 'loyalty') / 5, fx: (fx, c) => fx.mind(c.A, 'morale', 1) },
  } }),
  K({ id: 'identity-crisis', family: 10, moments: ['fail'], when: c => (bad(c) && c.fails >= 3 ? 0.2 : 0), endings: {
    hide: { w: 1, fx: (fx, c) => fx.mind(c.A, 'morale', -8) },
    'quit-and-unquit': { w: 0.5, fx: (fx, c) => { fx.time(c.tid, 30); fx.bond(c.A, c.B, 1); } },
    accept: { w: c => c.S(c.A, 'temperament') / 5, fx: (fx, c) => fx.bond(c.A, c.B, 2) },
  } }),
  K({ id: 'weather', family: 10, moments: ['travel', 'tip'], when: () => 0.03, endings: {
    'wait-it-out': { w: 1, fx: (fx, c) => fx.time(c.tid, 30) },
    'push-on': { w: c => teamLevel(c.state, c.tid, ['nerve']) / 5, fx: (fx, c) => { fx.time(c.tid, 10); fx.mind(c.A, 'stress', 6); } },
  } }),
]);
