// ══════════════════════════════════════════════════════════════════════
// rr/final.js — the last leg: three teams, the midpoint mat, the stage
// ══════════════════════════════════════════════════════════════════════
//
// Spec §3. The finale is a leg like the others with three differences: the midpoint
// Chill Zone cuts the last team there (third place); the memory task asks for every
// leg in order, so it grows with the season; and the footrace to the stage is run on
// what is left in the legs (energy counts twice). The eliminated teams watch from the
// bleachers and root for the finalist they're closer to.
import { playLeg } from './leg.js';
import { emit } from './scenes.js';
import { getBond } from '../bonds.js';

const people = (st, id) => [st.teams[id].a, st.teams[id].b];
const closeness = (st, a, b) => people(st, a).reduce((s, x) => s + people(st, b).reduce((u, y) => u + getBond(x, y), 0), 0);

export function playFinal(state, leg, from, to, rng) {
  const place = { ...to, stretches: to.stretches.map(s => ({ ...s })) };

  // the footrace: tired legs cost twice what they cost anywhere else
  const adjust = (team, s, t, res) => {
    if (s.id !== 'footrace') return res;
    const e = people(state, team.id).reduce((a, n) => a + state.mind[n].energy, 0) / 200;
    return { ...res, end: res.end + (res.end - t) * 2 * (1 - e) };
  };

  const r = playLeg(state, { ...leg, kind: 'final' }, from, place, rng, { adjust });
  const midOut = state.midmatOut?.[leg.n] ?? r.eliminated[0] ?? null;
  const order = r.order.filter(id => id !== midOut);
  const winner = order[0] ?? null;

  // the bleachers: every eliminated team, rooting for the finalist it's closer to
  const bleachers = [];
  // they watch the finalists come in: the minute before the winners reach the stage
  const endT = Math.min(...r.log.filter(l => l.stretch === 'mat' && order.includes(l.id)).map(l => l.to), Infinity) - 1;
  for (const id of state.order.filter(x => state.gone.includes(x) && x !== midOut)) {
    if (order.length < 2) break;
    const roots = closeness(state, id, order[0]) >= closeness(state, id, order[1]) ? order[0] : order[1];
    bleachers.push({ id, roots });
    const cares = Math.max(closeness(state, id, order[0]), closeness(state, id, order[1])) > 0;
    emit(state, 'int-bleachers', people(state, id), cares ? 'roots-for' : 'unimpressed', { team: id, other: roots, t: endT });
  }
  if (midOut && order.length >= 2) {
    const roots = closeness(state, midOut, order[0]) >= closeness(state, midOut, order[1]) ? order[0] : order[1];
    bleachers.push({ id: midOut, roots });
    emit(state, 'int-bleachers', people(state, midOut), 'roots-for', { team: midOut, other: roots, t: endT });
  }
  return { ...r, midOut, order, winner, bleachers };
}
