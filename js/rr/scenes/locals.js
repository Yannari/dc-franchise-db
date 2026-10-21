// Family 5 of the scene catalogue: locals, drivers, judges and agents (docs/ridonculous-race-scenes.md §5).
// Endings scale with Travel and People skill (proportional); the local is a role, never a named person.
import { K, register } from './registry.js';
import { teamLevel } from '../skill.js';

const tr = c => teamLevel(c.state, c.tid, ['travel']);
const pe = c => teamLevel(c.state, c.tid, ['people']);
// a task somebody judges (places: `judge: true`, on the task or on one side of it): the artist, the surfer boy, the
// coach. Nobody else hands down a verdict (the user, 2026-10-21: "in the home city leg they talking about a judge but
// they were no judge").
const judged = c => { const st = c.stretch; const side = st?.sides?.find(x => x.id === c.state.attempts?.[c.tid]?.[st.id]?.side);
  return !!(side?.judge ?? st?.judge); };

register([
  K({ id: 'driver', family: 5, cast: 'local', moments: ['travel'], when: c => (['taxi'].includes(c.stretch?.mode) ? 0.5 : 0), endings: {
    fast: { w: 1, fx: (fx, c) => fx.time(c.tid, -5) },
    lost: { w: c => (10 - tr(c)) / 5, fx: (fx, c) => fx.time(c.tid, 30) },
    pressured: { w: c => c.S(c.lead, 'boldness') / 6, fx: (fx, c) => { fx.time(c.tid, -3); fx.mind(c.lead, 'stress', 4); } },
    'scenic-detour': { w: 0.5, fx: (fx, c) => fx.time(c.tid, 12) },
    helpful: { w: c => pe(c) / 5, fx: (fx, c) => fx.time(c.tid, -10) },
  } }),
  K({ id: 'ask-directions', family: 5, cast: 'local', moments: ['travel'], when: c => (['foot', 'drive'].includes(c.stretch?.mode) ? 0.3 : 0), endings: {
    right: { w: c => pe(c) / 4, fx: (fx, c) => fx.time(c.tid, -5) },
    wrong: { w: 0.8, fx: (fx, c) => fx.time(c.tid, 20) },
    'language-gap': { w: c => (10 - pe(c)) / 6, fx: (fx, c) => fx.time(c.tid, 10) },
  } }),
  K({ id: 'agent', family: 5, cast: 'local', moments: ['airport'], endings: {
    'sweet-talked': { w: c => pe(c) / 4, fx: (fx, c) => { fx.note(`seat:${c.tid}`, c.state.leg); fx.mind(c.lead, 'morale', 3); } },
    strict: { w: 1, fx: (fx, c) => fx.mind(c.lead, 'stress', 3) },
    intimidated: { w: c => (c.S(c.lead, 'boldness') > 7 ? 0.5 : 0.1), fx: (fx, c) => { fx.time(c.tid, 10); fx.pop(c.lead, -1); } },
  } }),
  K({ id: 'judge-no', family: 5, cast: 'local', moments: ['fail'], when: c => (c.fails >= 1 && judged(c) ? 0.5 : 0), endings: {
    explains: { w: 1, fx: (fx, c) => fx.pass(c.tid, 0.05) },
    'stone-faced': { w: 1, fx: (fx, c) => fx.mind(c.lead, 'stress', 5) },
    slaps: { w: 0.1, fx: (fx, c) => fx.mind(c.A, 'morale', -4) },
  } }),
  K({ id: 'judge-yes', family: 5, cast: 'local', moments: ['pass'], when: c => (judged(c) ? 1 : 0), endings: {
    approved: { w: 2, fx: (fx, c) => fx.mind(c.lead, 'morale', 3) },
    grudging: { w: 1, fx: (fx, c) => fx.mind(c.lead, 'morale', 1) },
  } }),
  K({ id: 'local-rule', family: 5, cast: 'local', moments: ['tip', 'quiet'], when: () => 0.03, endings: {
    respected: { w: c => c.S(c.lead, 'loyalty') / 4, fx: (fx, c) => fx.mind(c.lead, 'morale', 2) },
    broken: { w: c => (10 - c.S(c.A, 'loyalty')) / 8, fx: (fx, c) => { fx.note(`curse:${c.tid}`, c.state.leg); fx.pop(c.A, -1); } },
  } }),
  K({ id: 'local-help', family: 5, cast: 'local', moments: ['travel', 'fail'], when: () => 0.05, endings: {
    accepted: { w: 2, fx: (fx, c) => fx.time(c.tid, -8) },
    refused: { w: 0.5, fx: (fx, c) => fx.mind(c.lead, 'stress', 2) },
  } }),
  K({ id: 'vendor', family: 5, cast: 'local', moments: ['fare', 'tip'], when: c => (c.money(c.tid) > 20 ? 0.05 : 0), endings: {
    'haggle-win': { w: c => pe(c) / 4, fx: (fx, c) => fx.money(c.tid, 5) },
    'ripped-off': { w: 1, fx: (fx, c) => fx.money(c.tid, -10) },
  } }),
  K({ id: 'crowd-performance', family: 5, cast: 'local', moments: ['fail', 'pass'], when: c => ((c.stretch?.types || []).includes('perform') ? 1 : 0), endings: {
    bomb: { w: c => (10 - teamLevel(c.state, c.tid, ['perform'])) / 4, fx: (fx, c) => fx.mind(c.A, 'morale', -5) },
    'wins-them': { w: c => teamLevel(c.state, c.tid, ['perform']) / 4, fx: (fx, c) => fx.mind(c.A, 'morale', 10) },
  } }),
]);
