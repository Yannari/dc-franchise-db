// Family 11 of the scene catalogue: Don (docs/ridonculous-race-scenes.md §11). Most are emitted by
// the systems that decide them (the mat, a twist, a ruling); what Don says lands on the people he
// says it to, so each ending moves their mood or what they know.
import { K, register } from './registry.js';

const everyone = c => (c.present || []).flatMap(id => (c.state.teams[id] ? [c.state.teams[id].a, c.state.teams[id].b] : []));

register([
  K({ id: 'don-opener', family: 11, cast: 'don', moments: ['opener'], endings: {
    annoyed: { w: 2, fx: (fx, c) => fx.note(`opener:${c.state.leg}`, 'annoyed') },
    bored: { w: 1, fx: (fx, c) => fx.note(`opener:${c.state.leg}`, 'bored') },
  } }),
  K({ id: 'don-demo', family: 11, cast: 'don', moments: ['demo'], endings: {
    gag: { w: 2, fx: (fx, c) => fx.believe(everyone(c).length ? everyone(c) : [c.A, c.B], { about: 'task', claim: 'shown', value: c.stretch?.id }) },
    dry: { w: 1, fx: (fx, c) => fx.believe(everyone(c).length ? everyone(c) : [c.A, c.B], { about: 'task', claim: 'shown', value: c.stretch?.id }) },
  } }),
  K({ id: 'don-rule', family: 11, cast: 'don', moments: ['rule'], endings: {
    explained: { w: 2, fx: (fx, c) => fx.believe(everyone(c).length ? everyone(c) : [c.A, c.B], { about: 'rule', claim: 'heard', value: c.event?.rule || null }) },
    'grudging-repeat': { w: 0.5, fx: (fx, c) => fx.believe(everyone(c).length ? everyone(c) : [c.A, c.B], { about: 'rule', claim: 'heard', value: c.event?.rule || null }) },
  } }),
  K({ id: 'don-place', family: 11, cast: 'don', moments: ['mat'], endings: {
    plain: { w: 2, fx: (fx, c) => fx.mind(c.A, 'morale', 1) },
    bored: { w: 1, fx: (fx, c) => fx.mind(c.A, 'morale', -1) },
    'scared-of-them': { w: 0.3, fx: (fx, c) => fx.mind(c.A, 'morale', 2) },
    'penalty-reveal': { w: 0.5, fx: (fx, c) => { fx.mind(c.A, 'morale', -6); fx.mind(c.B, 'morale', -6); } },
    // the penalty served: the check-in, in the place it cost them (chill.js)
    'penalty-served': { w: 0, fx: (fx, c) => fx.mind(c.A, 'morale', -2) },
  } }),
  // the finale's finish line: Don crowns the winners, then tells the runners-up (chill.js, a final leg only)
  K({ id: 'don-crown', family: 11, cast: 'don', moments: ['mat'], endings: {
    winner: { w: 1, fx: (fx, c) => { fx.mind(c.A, 'morale', 20); fx.mind(c.B, 'morale', 20); fx.pop(c.A, 2); fx.pop(c.B, 2); } },
    'runner-up': { w: 1, fx: (fx, c) => { fx.mind(c.A, 'morale', -5); fx.mind(c.B, 'morale', -5); } },
  } }),
  K({ id: 'don-fakeout', family: 11, cast: 'don', moments: ['mat'], endings: {
    relief: { w: 3, fx: (fx, c) => { fx.mind(c.A, 'morale', 10); fx.mind(c.B, 'morale', 10); } },
    fury: { w: 0.3, fx: (fx, c) => fx.mind(c.A, 'stress', 10) },
    'breakup-interrupted': { w: 0.2, fx: (fx, c) => fx.bond(c.A, c.B, -1) },
  } }),
  K({ id: 'don-elim', family: 11, cast: 'don', moments: ['elim'], endings: {
    accepts: { w: 3, fx: (fx, c) => fx.bond(c.A, c.B, 0.5) },
    argues: { w: 0.5, fx: (fx, c) => fx.pop(c.A, -1) },
    tantrum: { w: c => (10 - c.S(c.A, 'temperament')) / 10, fx: (fx, c) => fx.pop(c.A, -2) },
  } }),
  K({ id: 'don-arrives', family: 11, cast: 'don', moments: ['elim'], endings: {
    helicopter: { w: 1, fx: (fx, c) => fx.mind(c.A, 'morale', -10) },
    'on-foot': { w: 1, fx: (fx, c) => fx.mind(c.A, 'morale', -10) },
    'at-the-stage': { w: 0.3, fx: (fx, c) => fx.mind(c.A, 'morale', -10) },
  } }),
  K({ id: 'don-ruling', family: 11, cast: 'don', moments: ['ruling'], endings: {
    // a ruling on a caught sabotage is never 'allowed'; its penalty is the hour at the mat (sabotage.js), said here, not
    // twenty minutes more on the spot (2026-10-22: a team paid both, and dropped from second to eighth unexplained)
    'no-sharing': { w: 1, fx: (fx, c) => fx.mind(c.A, 'morale', -4) },
    allowed: { w: c => (c.cause ? 0 : 1), fx: (fx, c) => fx.mind(c.A, 'morale', 3) },
    threat: { w: 1, fx: (fx, c) => fx.mind(c.A, 'stress', 8) },
  } }),
]);
