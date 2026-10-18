// ══════════════════════════════════════════════════════════════════════
// rr/money.js — the cash envelope, and what happens when it runs out
// ══════════════════════════════════════════════════════════════════════
//
// Spec §4 (the user, 2026-10-18: "add money with begging and penalties"). A
// stipend at each start; fares charged by travel.js; a broke team walks where it
// can, borrows from an ally standing there, or begs (never where it's forbidden:
// airports, the Amazing Race's own rule). Debts are remembered: paid back, or
// dodged after three legs. A non-elimination leg can take everything.
import { S } from './state.js';
import { getBond, addBond } from '../bonds.js';
import { emit } from './scenes.js';

export function payStipend(state, leg) {
  for (const id of state.order) {
    if (state.noMoney?.[id] === leg.n) continue;
    state.money[id] = (state.money[id] || 0) + (leg.money || 0);
  }
}

export function spend(state, id, amount) {
  if ((state.money[id] || 0) < amount) return false;
  state.money[id] -= amount;
  return true;
}

const people = (state, id) => [state.teams[id].a, state.teams[id].b];
const bestBond = (state, a, b) => Math.max(...people(state, a).flatMap(x => people(state, b).map(y => getBond(x, y))));

function beg(state, team, stretch, t, rng) {
  const [a, b] = people(state, team.id);
  const cost = stretch.cost;
  let minutes = 0, raised = 0, rounds = 0;
  while ((state.money[team.id] || 0) < cost && rounds < 4) {
    rounds++;
    minutes += Math.max(10, 60 * (1.4 - (S(a, 'social') + S(b, 'boldness')) / 20));
    const got = Math.round(cost * (0.6 + 0.08 * S(a, 'social')) * (0.8 + 0.4 * rng()));
    state.money[team.id] = (state.money[team.id] || 0) + got;
    raised += got;
  }
  state.rec[team.id].begged += raised;
  emit(state, 'beg', [a, b], raised >= cost * 1.5 ? 'generous' : 'scraps',
    { t, stretch: stretch.id, team: team.id, raised, rounds, effects: [['money', team.id, raised], ['time', team.id, Math.round(minutes)]] });
  return { minutes: Math.round(minutes), how: 'beg' };
}

// A team that can't pay a fare: walk (a taxi or a bus can be walked), borrow from an
// ally who is here with money to spare, beg where begging is allowed, and as a last
// resort scrape it together the slow way (the crew's emergency fund, Amazing Race
// rules) so the race never stalls.
export function afford(state, team, stretch, t, rng, api) {
  const cost = stretch.cost || 0;
  // a short ride can be walked; a long one can't (the show's broke teams beg for the taxi)
  if (['taxi', 'bus'].includes(stretch.mode) && (stretch.base || 0) <= 20) return { minutes: stretch.base * 2, how: 'walk' };
  for (const o of api?.here?.(stretch.id, t) || []) {
    if (o.id === team.id || !state.teams[o.id]) continue;
    if ((state.money[o.id] || 0) > cost * 2 && bestBond(state, team.id, o.id) >= 2) {
      state.money[o.id] -= cost;
      state.money[team.id] = (state.money[team.id] || 0) + cost;
      state.debts.push({ from: team.id, to: o.id, amount: cost, leg: state.leg, paid: false });
      const who = [...people(state, team.id), ...people(state, o.id)];
      emit(state, 'borrow', who, 'lent', { t, stretch: stretch.id, team: team.id, other: o.id, lender: o.id, amount: cost,
        effects: [['money', team.id, cost], ['money', o.id, -cost], ['debt', team.id, o.id, cost]] });
      return { minutes: 10, how: 'borrow' };
    }
  }
  if (!stretch.noBeg) {
    const r = beg(state, team, stretch, t, rng);
    if ((state.money[team.id] || 0) >= cost) return r;
  }
  state.money[team.id] = Math.max(state.money[team.id] || 0, cost);
  return { minutes: 45, how: 'stuck' };
}

export function surrender(state, id, mode) {
  state.money[id] = 0;
  state.noMoney[id] = state.leg + 1;
  if (mode === 'surrender-all') state.noBag[id] = state.leg + 1;
}

export function repayDebts(state) {
  for (const d of state.debts) {
    if (d.paid || d.dodged || !state.teams[d.from] || !state.teams[d.to]) continue;
    const who = [...people(state, d.from), ...people(state, d.to)];
    if ((state.money[d.from] || 0) >= d.amount) {
      state.money[d.from] -= d.amount;
      state.money[d.to] = (state.money[d.to] || 0) + d.amount;
      d.paid = true;
      for (const x of people(state, d.from)) for (const y of people(state, d.to)) addBond(x, y, 0.5);
      emit(state, 'repay', who, 'paid', { team: d.from, other: d.to, lender: d.to, amount: d.amount,
        effects: [['money', d.from, -d.amount], ['money', d.to, d.amount], ['teams', d.from, d.to, 0.5]] });
    } else if (state.leg - d.leg >= 3) {
      d.dodged = true;
      for (const x of people(state, d.from)) for (const y of people(state, d.to)) addBond(x, y, -1);
      emit(state, 'repay', who, 'dodged', { team: d.from, other: d.to, lender: d.to, amount: d.amount,
        effects: [['teams', d.from, d.to, -1], ['dodged', d.from, d.to, d.amount]] });
    }
  }
}
