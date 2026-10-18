// Family 6 of the scene catalogue: money (docs/ridonculous-race-scenes.md §6). The mechanics
// (stipends, fares, the afford fallbacks, debts) live in ../money.js; these are the moments,
// played at 'fare' when a team is short, and emitted ('money') by the mechanics.
import { K, register } from './registry.js';
import { S } from '../state.js';

const short = c => (c.stretch?.cost || 0) > c.money(c.tid);

register([
  K({ id: 'beg', family: 6, moments: ['fare'], when: c => (short(c) && !c.stretch?.noBeg ? 1 : 0), endings: {
    generous: { w: c => S(c.A, 'social') / 4, fx: (fx, c) => { fx.money(c.tid, Math.round((c.stretch?.cost || 30) * 1.5)); fx.time(c.tid, 20); c.state.rec[c.tid].begged += (c.stretch?.cost || 30); } },
    scraps: { w: 1, fx: (fx, c) => { fx.money(c.tid, c.stretch?.cost || 30); fx.time(c.tid, 40); c.state.rec[c.tid].begged += (c.stretch?.cost || 30); } },
    'chased-off': { w: c => (10 - S(c.A, 'social')) / 5, fx: (fx, c) => { fx.time(c.tid, 25); fx.mind(c.A, 'morale', -5); } },
    shamed: { w: c => S(c.A, 'boldness') / 8, fx: (fx, c) => { fx.money(c.tid, c.stretch?.cost || 30); fx.time(c.tid, 30); fx.pop(c.A, -1); } },
  } }),
  K({ id: 'sell', family: 6, moments: ['fare'], when: c => (short(c) && !c.state.noBag?.[c.tid] ? 0.4 : 0), endings: {
    sold: { w: 1, fx: (fx, c) => { fx.money(c.tid, 30); fx.time(c.tid, 20); } },
    'no-buyer': { w: 1, fx: (fx, c) => fx.time(c.tid, 15) },
  } }),
  K({ id: 'borrow', family: 6, cast: 'teams', moments: ['money'], endings: {
    lent: { w: 2, fx: (fx, c) => { fx.money(c.tid, 40); fx.money(c.oid, -40); c.state.debts.push({ from: c.tid, to: c.oid, amount: 40, leg: c.state.leg, paid: false }); } },
    refused: { w: 1, fx: (fx, c) => fx.teams(c.tid, c.oid, -1) },
    gift: { w: c => c.S(c.C, 'loyalty') / 6, fx: (fx, c) => { fx.money(c.tid, 40); fx.money(c.oid, -40); fx.teams(c.tid, c.oid, 2); fx.pop(c.C, 1); } },
  } }),
  K({ id: 'repay', family: 6, cast: 'teams', moments: ['money'], endings: {
    paid: { w: 2, fx: (fx, c) => fx.teams(c.tid, c.oid, 1) },
    dodged: { w: 1, fx: (fx, c) => fx.teams(c.tid, c.oid, -2) },
  } }),
  K({ id: 'surrender', family: 6, moments: ['money'], endings: {
    stripped: { w: 2, fx: (fx, c) => { fx.mind(c.A, 'morale', -15); fx.mind(c.B, 'morale', -15); } },
    defiant: { w: c => c.S(c.lead, 'boldness') / 5, fx: (fx, c) => fx.mind(c.lead, 'morale', -5) },
  } }),
  K({ id: 'spending-fight', family: 6, moments: ['fare'], when: c => (c.money(c.tid) < 60 && c.money(c.tid) >= (c.stretch?.cost || 0) ? 0.3 : 0), endings: {
    'saver-wins': { w: 1, fx: (fx, c) => { fx.time(c.tid, 10); fx.bond(c.A, c.B, -0.3); } },
    'spender-wins': { w: 1, fx: (fx, c) => { fx.money(c.tid, -10); fx.bond(c.A, c.B, -0.3); } },
  } }),
  K({ id: 'reward', family: 6, moments: ['reward'], endings: {
    'prize-joy': { w: 2, fx: (fx, c) => { fx.mind(c.A, 'morale', 10); fx.mind(c.B, 'morale', 10); } },
    meh: { w: 1, fx: (fx, c) => fx.mind(c.A, 'morale', 2) },
  } }),
]);
