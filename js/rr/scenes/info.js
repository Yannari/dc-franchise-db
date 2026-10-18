// Family 7 of the scene catalogue: information, deception and rumour (docs/ridonculous-race-scenes.md §7).
// Teams may lie (the Amazing Race's rules); a lie is kept as an untrue belief (knowledge.js).
import { K, register } from './registry.js';
import { reseat } from '../travel.js';

register([
  K({ id: 'lie', family: 7, cast: 'teams', scheme: true, moments: ['overlap', 'airport'], when: c => (c.allied() ? 0 : c.rivalry() >= 1 || c.friction() ? 0.15 : 0.02), endings: {
    believed: { w: c => (10 - c.S(c.state.lead[c.oid], 'intuition')) / 4, fx: (fx, c) => { fx.believe([c.C, c.D], { about: 'way', claim: 'told', value: 'wrong', truth: false, source: c.tid }); fx.time(c.oid, 20); } },
    'caught-out': { w: c => c.S(c.state.lead[c.oid], 'intuition') / 4, fx: (fx, c) => { fx.rivalry(c.tid, c.oid, 2); fx.pop(c.A, -2); } },
  } }),
  K({ id: 'share-info', family: 7, cast: 'teams', moments: ['overlap', 'airport'], when: c => (c.allied() || c.teamBond() >= 3 ? 0.4 : 0), endings: {
    shared: { w: c => 1 + c.teamBond() / 3, fx: (fx, c) => {
      fx.teams(c.tid, c.oid, 1);
      // at an airport, an ally's better flight moves the other team to it (travel.js reseat)
      const s = c.stretch;
      if (s?.flights) {
        const mine = s.flights.findIndex(f => f.taken.includes(c.tid));
        if (mine >= 0 && reseat(s, c.oid, mine)) fx.custom('reseat', c.oid, mine);
      }
      fx.believe([c.C, c.D], { about: 'way', claim: 'told', value: 'right', truth: true, source: c.tid });
    } },
    'held-back': { w: 0.5, fx: (fx, c) => fx.believe([c.C, c.D], { about: c.tid, claim: 'hiding', value: true }) },
  } }),
  K({ id: 'overheard', family: 7, cast: 'teams', moments: ['overlap', 'plane', 'queue'], when: () => 0.08, endings: {
    'learns-plan': { w: c => c.S(c.A, 'intuition') / 4, fx: (fx, c) => fx.believe([c.A, c.B], { about: c.oid, claim: 'plan', value: c.state.notes?.[`plan:${c.oid}`] ?? 'unknown' }) },
    mishears: { w: 1, fx: (fx, c) => fx.believe([c.A, c.B], { about: c.oid, claim: 'plan', value: 'misheard', truth: false }) },
  } }),
  K({ id: 'secret-used', family: 7, cast: 'teams', scheme: true, moments: ['overlap'], when: c => (c.rivalry() >= 1 ? 0.05 : 0), endings: {
    exploited: { w: c => c.S(c.A, 'strategic') / 4, fx: (fx, c) => { fx.time(c.oid, 20); fx.rivalry(c.tid, c.oid, 1); } },
    fizzles: { w: 1, fx: (fx, c) => fx.mind(c.A, 'morale', -2) },
  } }),
  K({ id: 'rumour', family: 7, cast: 'teams', moments: ['overlap', 'mat'], when: c => (Object.keys(c.state.boomeranged || {}).length ? 0.2 : 0), endings: {
    'guess-right': { w: c => c.S(c.A, 'intuition') / 4, fx: (fx, c) => fx.believe([c.A, c.B], { about: 'boomerang', claim: 'by', value: c.state.boomeranged[c.tid] ?? null }) },
    'guess-wrong': { w: 1, fx: (fx, c) => { fx.believe([c.A, c.B], { about: 'boomerang', claim: 'by', value: c.oid, truth: false }); fx.rivalry(c.tid, c.oid, 1); } },
  } }),
  K({ id: 'spy', family: 7, cast: 'teams', moments: ['overlap'], when: c => (c.stretch?.kind && c.stretch.kind !== 'travel' ? 0.1 : 0), endings: {
    copies: { w: c => c.S(c.A, 'intuition') / 4, fx: (fx, c) => fx.pass(c.tid, 0.08) },
    'caught-spying': { w: 0.6, fx: (fx, c) => fx.rivalry(c.tid, c.oid, 1) },
  } }),
  K({ id: 'bluff', family: 7, cast: 'teams', moments: ['overlap'], when: c => (c.rivalry() >= 1 ? 0.1 : 0.02), endings: {
    bluffed: { w: c => c.S(c.A, 'strategic') / 4, fx: (fx, c) => fx.believe([c.C, c.D], { about: c.tid, claim: 'ahead', value: true, truth: false }) },
    honest: { w: 1, fx: (fx, c) => fx.teams(c.tid, c.oid, 0.3) },
  } }),
]);
